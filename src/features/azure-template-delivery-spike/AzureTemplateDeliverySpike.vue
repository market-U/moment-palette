<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

import { APP_VERSION, BUILD_ID } from '@/app/config/generatedBuildMetadata'

import type { TemplateAssetLoaderPort } from './assetLoaderPort'
import type {
  CompletedTemplateImage,
  TemplateCompositorPort,
} from './compositorPort'
import type { TemplateImageSharePort } from './imageSharePort'
import type { ReleasePort } from './releasePort'
import {
  RequestDiagnostics,
  type SanitizedRequestRecord,
} from './requestDiagnostics'
import type { TemplateCatalogPort } from './templateCatalogPort'
import {
  ReloadRequiredError,
  startTemplateSession,
  TemplateSessionOwner,
} from './templateSession'
import type { TemplateCatalogResponse } from './types'

const props = defineProps<{
  catalogPort: TemplateCatalogPort
  releasePort: ReleasePort
  assetLoader: TemplateAssetLoaderPort
  compositor: TemplateCompositorPort
  sharePort: TemplateImageSharePort
  diagnostics: RequestDiagnostics
}>()

type Phase =
  | 'loading-list'
  | 'selecting'
  | 'starting'
  | 'active'
  | 'reload-required'
  | 'error'

const sessionOwner = new TemplateSessionOwner()
const phase = ref<Phase>('loading-list')
const catalog = shallowRef<TemplateCatalogResponse>()
const selectedId = ref('')
const completedImage = shallowRef<CompletedTemplateImage>()
const message = ref('公開中テンプレートを取得しています。')
const errorMessage = ref('')
const shareResult = ref('未実施')
const records = ref<readonly SanitizedRequestRecord[]>([])

const selectedTemplate = computed(() =>
  catalog.value?.templates.find((template) => template.id === selectedId.value),
)
const busy = computed(
  () => phase.value === 'loading-list' || phase.value === 'starting',
)
const afterStartCounts = computed(() => {
  const result = { api: 0, release: 0, blob: 0, script: 0, style: 0 }
  for (const record of records.value) {
    if (record.phase === 'after-start' && record.kind in result) {
      result[record.kind as keyof typeof result] += 1
    }
  }
  return result
})

const refreshDiagnostics = () => {
  props.diagnostics.addResourceEntries(
    performance.getEntriesByType('resource') as PerformanceResourceTiming[],
  )
  records.value = props.diagnostics.snapshot()
}

const disposeCompletedImage = () => {
  completedImage.value?.release()
  completedImage.value = undefined
}

const loadCatalog = async () => {
  phase.value = 'loading-list'
  errorMessage.value = ''
  try {
    const loaded = await props.catalogPort.loadAvailable()
    catalog.value = loaded
    selectedId.value = loaded.templates[0]?.id ?? ''
    phase.value = 'selecting'
    refreshDiagnostics()
    message.value = loaded.templates.length
      ? 'テンプレートを選び、Startでversion照合と全asset読込を行います。'
      : '現在公開中のテンプレートはありません。'
  } catch (error) {
    phase.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : String(error)
    message.value = 'テンプレート一覧を取得できません。再試行できます。'
  }
}

const startSession = async () => {
  if (!selectedId.value || busy.value) return
  phase.value = 'starting'
  errorMessage.value = ''
  message.value = '現在のbuildを照合し、線画と全maskを取得・decodeしています。'
  try {
    // Start直前にAPIも再取得し、一覧表示から時間が経った場合の公開条件とSASを更新する。
    const currentCatalog = await props.catalogPort.loadAvailable()
    const template = currentCatalog.templates.find(
      (candidate) => candidate.id === selectedId.value,
    )
    if (!template)
      throw new Error('選択したテンプレートは現在公開されていません。')
    const session = await startTemplateSession(currentCatalog, template, {
      frontend: { appVersion: APP_VERSION, buildId: BUILD_ID },
      releasePort: props.releasePort,
      assetLoader: props.assetLoader,
      now: () => new Date(),
    })
    sessionOwner.replace(session)
    catalog.value = currentCatalog
    props.diagnostics.markSessionStarted()
    refreshDiagnostics()
    phase.value = 'active'
    message.value = 'Start完了。以降は取得済み資源だけでPNGを生成します。'
  } catch (error) {
    sessionOwner.clear()
    if (error instanceof ReloadRequiredError) {
      phase.value = 'reload-required'
      message.value =
        '配信buildが切り替わっています。制作開始前に再読み込みしてください。'
      return
    }
    phase.value = 'error'
    errorMessage.value = error instanceof Error ? error.message : String(error)
    message.value =
      'Startできませんでした。一時resourceは解放済みです。再試行できます。'
  }
}

const generatePng = async () => {
  const session = sessionOwner.current
  if (!session || busy.value) return
  errorMessage.value = ''
  try {
    disposeCompletedImage()
    completedImage.value = await props.compositor.generate(session.assets)
    refreshDiagnostics()
    message.value = '取得済み画像だけから1080×1080 PNGを生成しました。'
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
}

const sharePng = async () => {
  const image = completedImage.value
  if (!image) return
  shareResult.value = await props.sharePort.share(image.blob)
  refreshDiagnostics()
}

const reloadPage = () => location.reload()

onMounted(loadCatalog)
onBeforeUnmount(() => {
  disposeCompletedImage()
  sessionOwner.clear()
})
</script>

<template>
  <section class="azure-spike">
    <header class="azure-spike__header">
      <p class="azure-spike__eyebrow">
        TECHNICAL F/S · AZURE TEMPLATE DELIVERY
      </p>
      <h1>private Blobテンプレート配信検証</h1>
      <p>
        SWA FreeのManaged APIが発行するread-only Service
        SASで画像を取得し、Canvasで完成PNGを作ります。
      </p>
      <p class="azure-spike__privacy">
        ユーザー作品、制作状態、完成PNGはAzureへ送信・保存しません。
      </p>
      <p>
        対象: iPhone 15 / iOS 26 / Safari・Chrome。Androidはリリース後確認です。
      </p>
      <p>
        <code>app {{ APP_VERSION }}</code> / <code>build {{ BUILD_ID }}</code>
      </p>
    </header>

    <p class="azure-spike__status" role="status">{{ message }}</p>
    <p v-if="errorMessage" class="azure-spike__error" role="alert">
      {{ errorMessage }}
    </p>

    <section v-if="phase === 'reload-required'" class="azure-spike__panel">
      <h2>新しい配信内容があります</h2>
      <p>
        まだ制作状態は作られていません。ページを再読み込みしてからStartしてください。
      </p>
      <button type="button" @click="reloadPage">再読み込み</button>
    </section>

    <section v-else-if="phase !== 'active'" class="azure-spike__panel">
      <div class="azure-spike__heading">
        <h2>公開中テンプレート</h2>
        <button type="button" :disabled="busy" @click="loadCatalog">
          一覧を再取得
        </button>
      </div>
      <div v-if="catalog?.templates.length" class="azure-spike__templates">
        <label v-for="template in catalog.templates" :key="template.id">
          <input
            v-model="selectedId"
            type="radio"
            name="template"
            :value="template.id"
          />
          <img
            :src="template.thumbnail.url"
            :alt="`${template.name.ja}のサムネイル`"
          />
          <span>{{ template.name.ja }} / {{ template.assetRevision }}</span>
        </label>
      </div>
      <button
        type="button"
        :disabled="busy || !selectedTemplate"
        @click="startSession"
      >
        {{ phase === 'starting' ? 'Start処理中…' : '選択テンプレートでStart' }}
      </button>
    </section>

    <section v-else class="azure-spike__panel">
      <h2>取得済み資源によるCanvas生成</h2>
      <p>Start後はAPI、release、Blobを再取得しません。</p>
      <button type="button" @click="generatePng">1080×1080 PNGを生成</button>
      <div v-if="completedImage" class="azure-spike__result">
        <img
          :src="completedImage.objectUrl"
          alt="Azure配信F/Sで生成した文鳥テンプレートの完成PNG"
        />
        <p>画像を長押ししてブラウザ標準メニューから保存できます。</p>
        <button
          type="button"
          :disabled="!sharePort.canShare(completedImage.blob)"
          @click="sharePng"
        >
          共有シートを開く
        </button>
        <p>共有結果: {{ shareResult }}</p>
      </div>
    </section>

    <section class="azure-spike__panel">
      <h2>安全な診断</h2>
      <dl>
        <div>
          <dt>Frontend</dt>
          <dd>{{ APP_VERSION }} / {{ BUILD_ID }}</dd>
        </div>
        <div>
          <dt>API</dt>
          <dd>
            {{ catalog?.apiVersion ?? '未取得' }} /
            {{ catalog?.buildId ?? '未取得' }}
          </dd>
        </div>
        <div>
          <dt>server time</dt>
          <dd>{{ catalog?.serverTime ?? '未取得' }}</dd>
        </div>
        <div>
          <dt>catalog revision</dt>
          <dd>{{ catalog?.catalogRevision ?? '未取得' }}</dd>
        </div>
        <div>
          <dt>SAS expiry</dt>
          <dd>{{ catalog?.sasExpiresAt ?? '未取得' }}</dd>
        </div>
        <div>
          <dt>公開分類</dt>
          <dd v-if="catalog">
            公開中 {{ catalog.publicationCounts.published }} / 非公開
            {{ catalog.publicationCounts.unpublished }} / 公開前
            {{ catalog.publicationCounts.scheduled }} / 終了
            {{ catalog.publicationCounts.expired }}
          </dd>
          <dd v-else>未取得</dd>
        </div>
        <div>
          <dt>session snapshot</dt>
          <dd>{{ sessionOwner.current?.snapshot ?? '未開始' }}</dd>
        </div>
        <div>
          <dt>Start後request</dt>
          <dd>
            API {{ afterStartCounts.api }} / release
            {{ afterStartCounts.release }} / Blob {{ afterStartCounts.blob }} /
            JS {{ afterStartCounts.script }} / CSS {{ afterStartCounts.style }}
          </dd>
        </div>
        <div v-if="completedImage">
          <dt>完成PNG</dt>
          <dd>
            {{ completedImage.blob.type }} / {{ completedImage.width }}×{{
              completedImage.height
            }}
            / {{ completedImage.generationMs.toFixed(1) }} ms
          </dd>
        </div>
      </dl>
      <details>
        <summary>query除去済みrequest一覧</summary>
        <ul>
          <li
            v-for="(record, index) in records"
            :key="`${record.url}-${String(index)}`"
          >
            {{ record.phase }} / {{ record.kind }} / {{ record.url }}
          </li>
        </ul>
      </details>
    </section>
  </section>
</template>

<style scoped>
.azure-spike {
  /* 固定高のpage内でこの要素自体をscroll containerにする。 */
  height: 100%;
  min-height: 100%;
  padding: calc(env(safe-area-inset-top) + 1rem)
    calc(env(safe-area-inset-right) + 1rem)
    calc(env(safe-area-inset-bottom) + 2rem)
    calc(env(safe-area-inset-left) + 1rem);
  overflow-y: auto;
  color: #27303d;
  background: linear-gradient(150deg, #eef7ff, #fff8ea 55%, #f6eefb);
}

.azure-spike__header,
.azure-spike__panel,
.azure-spike__status {
  width: min(100%, 52rem);
  margin: 0 auto 1rem;
}

.azure-spike__eyebrow {
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #0067a8;
}

.azure-spike__privacy,
.azure-spike__status {
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: #e5f5ed;
}

.azure-spike__error {
  color: #8b1e2d;
}

.azure-spike__panel {
  padding: 1rem;
  border: 1px solid #ccd8e3;
  border-radius: 1rem;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 0.5rem 1.5rem rgb(47 67 88 / 10%);
}

.azure-spike__heading {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.azure-spike__templates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.azure-spike__templates label {
  display: grid;
  gap: 0.4rem;
  padding: 0.5rem;
  border: 1px solid #ccd8e3;
  border-radius: 0.75rem;
}

.azure-spike__templates img,
.azure-spike__result img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 0.5rem;
  background: #fff;
}

.azure-spike__result {
  margin-top: 1rem;
}

.azure-spike button {
  min-height: 2.75rem;
  padding: 0.65rem 1rem;
}

.azure-spike dl > div {
  display: grid;
  grid-template-columns: minmax(7rem, 0.35fr) 1fr;
  gap: 0.75rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid #e5e9ee;
}

.azure-spike dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 32rem) {
  .azure-spike dl > div,
  .azure-spike__heading {
    display: block;
  }
}
</style>
