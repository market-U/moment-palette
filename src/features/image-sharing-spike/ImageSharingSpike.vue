<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, shallowRef } from 'vue'

import type { ClipboardPort } from './clipboardPort'
import type {
  CompletedImageGeneratorPort,
  CompletedImageResource,
} from './completedImagePort'
import { CompletedImageOwner } from './completedImageOwner'
import type { ImageSharePort, ShareCapability } from './sharePort'
import {
  createShareText,
  prepareImageShare,
  shareFixtureCopy,
  type ShareMode,
} from './sharePayload'
import type { ShareOutcome } from './shareOutcome'

const props = defineProps<{
  generator: CompletedImageGeneratorPort
  sharePort: ImageSharePort
  clipboardPort: ClipboardPort
}>()

type Phase = 'empty' | 'generating' | 'ready' | 'sharing' | 'error'

const shareModes: Array<{
  mode: ShareMode
  title: string
  type: string
  description: string
}> = [
  {
    mode: 'compatibility',
    title: '基準方式で共有',
    type: 'text/plain',
    description:
      'PNG bytesと.png名を保ち、複数アプリで運用中のMIME typeを使います。',
  },
  {
    mode: 'standard',
    title: '標準PNG方式で共有',
    type: 'image/png',
    description: '同じBlobを標準のPNG MIME typeで比較します。',
  },
  {
    mode: 'image-only',
    title: '画像だけ共有',
    type: 'image/png',
    description: '文とURLを除き、同時共有による差を切り分けます。',
  },
]

const owner = new CompletedImageOwner()
const phase = ref<Phase>('empty')
const image = shallowRef<CompletedImageResource>()
const generationCount = ref(0)
const statusMessage = ref('完成PNGを生成すると保存・共有を確認できます。')
const operationError = ref<string>()
const copyMessage = ref('未実施')
const capabilities = reactive<Partial<Record<ShareMode, ShareCapability>>>({})
const diagnostics = reactive({
  lastMode: '未実施',
  file: '未生成',
  canShare: '未確認',
  result: '未実施',
  errorName: 'なし',
})

const shareText = createShareText(shareFixtureCopy)
const busy = computed(
  () => phase.value === 'generating' || phase.value === 'sharing',
)

const capabilityLabel = (mode: ShareMode) => {
  const capability = capabilities[mode]
  if (!capability) {
    return '未確認'
  }
  if (capability.available) {
    return '共有可能'
  }
  return capability.reason === 'web-share'
    ? 'Web Share非対応'
    : 'このFileは共有不可'
}

const refreshCapabilities = () => {
  const current = owner.current
  if (!current) {
    return
  }

  for (const { mode } of shareModes) {
    capabilities[mode] = props.sharePort.canShare(
      prepareImageShare(current.blob, mode),
    )
  }
}

const generateImage = async () => {
  if (busy.value) {
    return
  }

  phase.value = 'generating'
  operationError.value = undefined
  statusMessage.value = '1080×1080 PNGをブラウザ内で生成しています。'

  try {
    const nextGeneration = generationCount.value + 1
    const next = await props.generator.generate(nextGeneration)
    owner.replace(next)
    image.value = owner.current
    generationCount.value = nextGeneration
    refreshCapabilities()
    phase.value = 'ready'
    statusMessage.value = `VERSION ${String(nextGeneration)}を表示・共有へ再利用します。`
  } catch (error) {
    phase.value = 'error'
    operationError.value =
      error instanceof Error ? error.message : String(error)
    statusMessage.value = '完成PNGを生成できませんでした。再試行できます。'
  }
}

const describeOutcome = (outcome: ShareOutcome) => {
  diagnostics.errorName = 'errorName' in outcome ? outcome.errorName : 'なし'

  switch (outcome.kind) {
    case 'handed-off':
      diagnostics.result = 'OSまたは共有先へ引き渡しました'
      statusMessage.value =
        'OSまたは共有先へ引き渡しました。投稿・保存の完了を保証する表示ではありません。'
      break
    case 'cancelled':
      diagnostics.result = 'キャンセル'
      statusMessage.value =
        '共有をキャンセルしました。同じ完成画像で再試行できます。'
      break
    case 'unsupported':
      diagnostics.result = '非対応'
      statusMessage.value =
        outcome.reason === 'web-share'
          ? 'この環境ではWeb Shareを利用できません。長押し保存または共有文コピーを利用してください。'
          : 'このFileを共有できません。別の方式、長押し保存、共有文コピーを利用してください。'
      break
    case 'failed':
      diagnostics.result = '失敗'
      statusMessage.value = outcome.guidance
      break
  }
}

const shareImage = async (mode: ShareMode) => {
  const current = owner.current
  if (!current || !owner.beginShare()) {
    return
  }

  phase.value = 'sharing'
  operationError.value = undefined
  const prepared = prepareImageShare(current.blob, mode)
  const capability = props.sharePort.canShare(prepared)
  capabilities[mode] = capability
  diagnostics.lastMode = mode
  diagnostics.file = `${prepared.file.name} / ${prepared.file.type} / ${String(prepared.file.size)} bytes`
  diagnostics.canShare = capability.available
    ? 'true'
    : `false (${capability.reason ?? 'unknown'})`
  diagnostics.result = '共有シート待機中'
  diagnostics.errorName = 'なし'

  try {
    // Blobは既に生成済みなので、クリックから追加のawaitを挟まずshare adapterへ渡す。
    const outcome = await props.sharePort.share(prepared)
    describeOutcome(outcome)
  } finally {
    owner.finishShare()
    phase.value = owner.current ? 'ready' : 'empty'
  }
}

const copyShareText = async () => {
  const outcome = await props.clipboardPort.copy(shareText)
  if (outcome.kind === 'copied') {
    copyMessage.value = '共有文をコピーしました。'
  } else if (outcome.kind === 'unsupported') {
    copyMessage.value =
      'Clipboard非対応です。下の共有文を手動選択してください。'
  } else {
    copyMessage.value = `コピーに失敗しました (${outcome.errorName})。下の共有文を手動選択できます。`
  }
}

onBeforeUnmount(() => {
  // route離脱後にBlob URLから完成画像へアクセスできないよう、所有resourceを解放する。
  owner.dispose()
  image.value = undefined
})
</script>

<template>
  <section class="spike">
    <header class="spike__header">
      <p class="spike__eyebrow">TECHNICAL F/S · IMAGE SHARING</p>
      <h1>完成PNGの保存・共有検証</h1>
      <p>
        1080×1080 PNGをブラウザ内で生成し、長押し保存、Web
        Share、Blob再利用と破棄を確認します。
      </p>
      <p class="spike__privacy">
        生成画像と共有用Fileはサーバーへ送信・保存せず、端末のメモリ内だけで処理します。
      </p>
      <p class="spike__scope">
        対象外: 製品用UI、共有文の最終決定、Androidの新規実機確認、クラウド保存
      </p>
    </header>

    <p class="spike__status" role="status">{{ statusMessage }}</p>
    <p v-if="operationError" class="spike__error" role="alert">
      {{ operationError }}
    </p>

    <div class="spike__layout">
      <section class="spike__panel" aria-labelledby="image-heading">
        <div class="spike__panel-heading">
          <div>
            <p class="spike__eyebrow">ONE BLOB · REUSED</p>
            <h2 id="image-heading">完成PNG</h2>
          </div>
          <button type="button" :disabled="busy" @click="generateImage">
            {{ image ? 'VERSIONを更新' : '完成PNGを生成' }}
          </button>
        </div>

        <div v-if="image" class="spike__image-frame">
          <img
            :src="image.objectUrl"
            :alt="`共有検証用の完成PNG VERSION ${String(image.generationId)}`"
          />
        </div>
        <p v-if="image" class="spike__hint">
          画像を長押しし、ブラウザ標準メニューから写真へ保存してください。
        </p>
        <div v-else class="spike__empty">PNGはまだ生成されていません。</div>
      </section>

      <section class="spike__panel" aria-labelledby="share-heading">
        <div class="spike__panel-heading">
          <div>
            <p class="spike__eyebrow">WEB SHARE COMPARISON</p>
            <h2 id="share-heading">三つの共有経路</h2>
          </div>
        </div>

        <div class="spike__share-options">
          <article v-for="definition in shareModes" :key="definition.mode">
            <div>
              <h3>{{ definition.title }}</h3>
              <p>
                <code>{{ definition.type }}</code> ·
                {{ definition.description }}
              </p>
              <p>canShare: {{ capabilityLabel(definition.mode) }}</p>
            </div>
            <button
              type="button"
              :disabled="
                busy ||
                !image ||
                capabilities[definition.mode]?.available !== true
              "
              @click="shareImage(definition.mode)"
            >
              共有シートを開く
            </button>
          </article>
        </div>
      </section>

      <section class="spike__panel" aria-labelledby="copy-heading">
        <div class="spike__panel-heading">
          <div>
            <p class="spike__eyebrow">TEXT FALLBACK</p>
            <h2 id="copy-heading">共有文</h2>
          </div>
          <button type="button" @click="copyShareText">共有文をコピー</button>
        </div>
        <textarea :value="shareText" readonly rows="5" aria-label="共有文" />
        <p role="status">{{ copyMessage }}</p>
      </section>

      <section class="spike__panel" aria-labelledby="diagnostics-heading">
        <div class="spike__panel-heading">
          <div>
            <p class="spike__eyebrow">SAFE DIAGNOSTICS</p>
            <h2 id="diagnostics-heading">診断</h2>
          </div>
        </div>
        <dl>
          <div>
            <dt>PNG</dt>
            <dd v-if="image">
              {{ image.blob.type }} / {{ image.width }}×{{ image.height }} /
              {{ image.bytes }} bytes
            </dd>
            <dd v-else>未生成</dd>
          </div>
          <div>
            <dt>generation</dt>
            <dd>
              {{ image?.generationId ?? '未生成' }} / 生成回数
              {{ generationCount }}
            </dd>
          </div>
          <div>
            <dt>生成時間</dt>
            <dd>
              {{ image ? `${image.generationMs.toFixed(1)} ms` : '未実施' }}
            </dd>
          </div>
          <div>
            <dt>直近の方式</dt>
            <dd>{{ diagnostics.lastMode }}</dd>
          </div>
          <div>
            <dt>File</dt>
            <dd>{{ diagnostics.file }}</dd>
          </div>
          <div>
            <dt>canShare</dt>
            <dd>{{ diagnostics.canShare }}</dd>
          </div>
          <div>
            <dt>結果</dt>
            <dd>{{ diagnostics.result }}</dd>
          </div>
          <div>
            <dt>error</dt>
            <dd>{{ diagnostics.errorName }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </section>
</template>

<style scoped>
.spike {
  height: 100%;
  min-height: 100%;
  padding: calc(env(safe-area-inset-top) + 1rem)
    calc(env(safe-area-inset-right) + 1rem)
    calc(env(safe-area-inset-bottom) + 2rem)
    calc(env(safe-area-inset-left) + 1rem);
  overflow-y: auto;
  color: #302936;
  background: linear-gradient(155deg, #fff9ed, #f8edf4 50%, #e9f5f1);
}

.spike__header,
.spike__layout,
.spike__status,
.spike__error {
  width: min(100%, 72rem);
  margin-inline: auto;
}

.spike__header h1,
.spike__panel h2,
.spike__panel h3,
.spike__header p,
.spike__panel p {
  margin-top: 0;
}

.spike__header h1 {
  margin-bottom: 0.75rem;
  font-size: clamp(1.8rem, 7vw, 3.2rem);
}

.spike__eyebrow {
  margin-bottom: 0.3rem;
  color: #8a3f61;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.spike__privacy,
.spike__scope,
.spike__status,
.spike__error {
  padding: 0.8rem 1rem;
  border-radius: 0.8rem;
}

.spike__privacy {
  background: #e3f4ec;
}

.spike__scope {
  background: #f4e8ed;
}

.spike__status {
  margin-block: 1rem;
  background: #fff;
  box-shadow: 0 0.3rem 1rem rgb(54 45 59 / 8%);
}

.spike__error {
  margin-block: 1rem;
  color: #871f2e;
  background: #ffe5e7;
}

.spike__layout {
  display: grid;
  gap: 1rem;
}

.spike__panel {
  padding: 1rem;
  border: 1px solid rgb(48 41 54 / 10%);
  border-radius: 1rem;
  background: rgb(255 255 255 / 88%);
  box-shadow: 0 0.6rem 1.8rem rgb(54 45 59 / 8%);
}

.spike__panel-heading {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.spike__panel-heading h2 {
  margin-bottom: 0;
}

button {
  min-height: 2.8rem;
  padding: 0.65rem 1rem;
  border: 0;
  border-radius: 999px;
  color: #fff;
  font: inherit;
  font-weight: 750;
  background: #6c3553;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.spike__image-frame {
  width: min(100%, 34rem);
  margin-inline: auto;
  padding: 0.5rem;
  border-radius: 1rem;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgb(48 41 54 / 12%);
}

.spike__image-frame img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 0.65rem;
}

.spike__hint,
.spike__empty {
  margin: 0.8rem 0 0;
  text-align: center;
}

.spike__empty {
  display: grid;
  min-height: 10rem;
  place-items: center;
  border: 1px dashed rgb(48 41 54 / 25%);
  border-radius: 0.8rem;
}

.spike__share-options {
  display: grid;
  gap: 0.8rem;
}

.spike__share-options article {
  display: grid;
  gap: 0.8rem;
  padding: 0.9rem;
  border-radius: 0.8rem;
  background: #f7f3f5;
}

.spike__share-options h3 {
  margin-bottom: 0.35rem;
}

.spike__share-options p {
  margin-bottom: 0.35rem;
}

textarea {
  width: 100%;
  padding: 0.8rem;
  resize: vertical;
  border: 1px solid rgb(48 41 54 / 22%);
  border-radius: 0.7rem;
  color: inherit;
  font: inherit;
  background: #fff;
}

dl {
  display: grid;
  gap: 0.55rem;
  margin: 0;
}

dl div {
  display: grid;
  grid-template-columns: minmax(7rem, 0.35fr) 1fr;
  gap: 0.7rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid rgb(48 41 54 / 10%);
}

dt {
  font-weight: 750;
}

dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

@media (min-width: 48rem) {
  .spike__share-options article {
    grid-template-columns: 1fr auto;
    align-items: center;
  }
}
</style>
