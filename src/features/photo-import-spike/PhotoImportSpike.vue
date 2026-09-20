<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowReactive,
  shallowRef,
} from 'vue'

import {
  clientPointToLogical,
  createCenteredCoverTransform,
  type MediaTransform,
} from '@/shared/lib/mediaTransform'
import { PointerGestureTracker } from '@/shared/lib/pointerGesture'

import { LatestSelection } from './latestSelection'
import type {
  ConfirmedPhotoFrames,
  PhotoCompositorFactory,
} from './photoCompositorPort'
import type {
  DecodedPhoto,
  PhotoDecoderFactory,
  PhotoNormalizationPreset,
} from './photoDecoderPort'
import { classifyPhotoFailure, type PhotoFailure } from './photoFailure'
import { photoAreas, photoSpikeTemplate } from './template'
import type { PhotoAreaId } from './types'

type SpikeStatus =
  'loading-assets' | 'idle' | 'decoding' | 'adjusting' | 'confirmed' | 'error'

const props = defineProps<{
  decoderFactory: PhotoDecoderFactory
  compositorFactory: PhotoCompositorFactory
}>()

const decoder = props.decoderFactory()
const compositor = props.compositorFactory(photoSpikeTemplate)
const latestSelection = new LatestSelection<DecodedPhoto>()
const pointerTracker = new PointerGestureTracker()
const preview = ref<HTMLCanvasElement>()
const status = ref<SpikeStatus>('loading-assets')
const selectedAreaId = ref<PhotoAreaId>('background')
const blendPercent = ref(100)
const preset = ref<PhotoNormalizationPreset>('quality')
const transform = ref<MediaTransform>({ scale: 1, offsetX: 0, offsetY: 0 })
const activePhoto = shallowRef<DecodedPhoto>()
const confirmed = shallowReactive<ConfirmedPhotoFrames>({})
const failure = ref<PhotoFailure>()
const note = ref('写真は選択操作を行うまで読み込みません。')
const previewResolution = ref('未計測')
const diagnostics = reactive({
  extension: '未選択',
  mimeType: '未選択',
  bytes: '未選択',
  path: '未実施',
  originalSize: '未実施',
  normalizedSize: '未実施',
  decodeMs: '未実施',
  normalizeMs: '未実施',
  error: 'なし',
})

let resizeObserver: ResizeObserver | undefined
let disposed = false

const selectedArea = computed(() =>
  photoAreas.find((area) => area.id === selectedAreaId.value),
)
const confirmedCount = computed(
  () => photoAreas.filter((area) => confirmed[area.id]).length,
)
const statusLabel = computed(() => {
  const labels: Record<SpikeStatus, string> = {
    'loading-assets': 'アセット読込中',
    idle: '写真未選択',
    decoding: 'decode・正規化中',
    adjusting: '写真を調整中',
    confirmed: '選択エリアへ確定済み',
    error: '読み込み失敗・再選択可能',
  }
  return labels[status.value]
})

const resizePreview = () => {
  if (!preview.value) {
    return
  }

  const cssPixels = preview.value.getBoundingClientRect().width
  const size = compositor.resizePreview(
    preview.value,
    cssPixels,
    window.devicePixelRatio || 1,
  )
  previewResolution.value = `${String(size.width)}×${String(size.height)}`
}

const render = () => {
  if (!preview.value || status.value === 'loading-assets') {
    return
  }

  compositor.renderPreview(preview.value, activePhoto.value?.source, {
    selectedAreaId: selectedAreaId.value,
    blend: blendPercent.value / 100,
    transform: transform.value,
    confirmed,
  })
}

const updateDiagnostics = (photo: DecodedPhoto) => {
  const value = photo.diagnostics
  diagnostics.extension = value.file.extension
  diagnostics.mimeType = value.file.mimeType
  diagnostics.bytes = `${value.file.bytes.toLocaleString('ja-JP')} bytes`
  diagnostics.path = value.path
  diagnostics.originalSize = `${String(value.originalSize.width)}×${String(value.originalSize.height)}`
  diagnostics.normalizedSize = `${String(value.normalizedSize.width)}×${String(value.normalizedSize.height)} (${value.preset})`
  diagnostics.decodeMs = `${value.decodeMs.toFixed(1)} ms`
  diagnostics.normalizeMs = `${value.normalizeMs.toFixed(1)} ms`
  diagnostics.error = 'なし'
}

const processFile = async (file: File) => {
  const generation = latestSelection.begin()
  status.value = 'decoding'
  failure.value = undefined
  diagnostics.error = 'なし'
  note.value = '標準APIでdecodeし、保持用Canvasへ正規化しています。'

  try {
    const decoded = await decoder.decode(file, preset.value)

    // acceptを先に呼ぶことで、route離脱後に完了した結果も確実にdisposeする。
    if (!latestSelection.accept(generation, decoded)) {
      return
    }

    if (disposed) {
      decoded.dispose()
      return
    }

    // 新しい結果を採用する瞬間まで旧写真を残し、失敗時に編集状態を失わない。
    activePhoto.value?.dispose()
    activePhoto.value = decoded
    transform.value = createCenteredCoverTransform(
      decoded.diagnostics.normalizedSize,
      photoSpikeTemplate.size,
    )
    updateDiagnostics(decoded)
    status.value = 'adjusting'
    note.value = '正方形内を1本指で移動、2本指でピンチできます。'
    await nextTick()
    render()
  } catch (error) {
    if (!latestSelection.isCurrent(generation) || disposed) {
      return
    }

    failure.value = classifyPhotoFailure(error)
    diagnostics.error = failure.value.kind
    status.value = 'error'
    note.value = '現在の作品は保持されています。別の画像で再試行できます。'
  }
}

const handleFileChange = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  // 同じFileを続けて選んでもchangeが発火するよう、参照取得後すぐ空に戻す。
  input.value = ''

  if (file) {
    void processFile(file)
  }
}

const loadFixture = async (name: string, mimeType: string) => {
  try {
    const response = await fetch(`/spikes/photo-import/fixtures/${name}`)

    if (!response.ok) {
      throw new Error('fixture unavailable')
    }

    const blob = await response.blob()
    await processFile(new File([blob], name, { type: mimeType }))
  } catch (error) {
    failure.value = classifyPhotoFailure(error)
    diagnostics.error = 'fixture-load'
    status.value = 'error'
  }
}

const selectArea = (areaId: PhotoAreaId) => {
  selectedAreaId.value = areaId
  render()
}

const confirmPhoto = () => {
  const photo = activePhoto.value

  if (!photo) {
    return
  }

  const previous = confirmed[selectedAreaId.value]

  if (previous) {
    compositor.releaseFrame(previous)
  }

  confirmed[selectedAreaId.value] = compositor.confirmSource(
    photo.source,
    transform.value,
  )
  status.value = 'confirmed'
  note.value = `${selectedArea.value?.label ?? '選択エリア'}へ写真を確定しました。選び直すと置換できます。`
  render()
}

const cancelSelection = () => {
  latestSelection.invalidate()
  pointerTracker.clear()
  activePhoto.value?.dispose()
  activePhoto.value = undefined
  failure.value = undefined
  status.value = confirmedCount.value > 0 ? 'confirmed' : 'idle'
  note.value =
    '編集中の写真だけを破棄しました。確定済みエリアは保持しています。'
  render()
}

const logicalPointer = (event: PointerEvent) => {
  if (!preview.value) {
    return undefined
  }

  return clientPointToLogical(
    { x: event.clientX, y: event.clientY },
    preview.value.getBoundingClientRect(),
    photoSpikeTemplate.size,
  )
}

const handlePointerDown = (event: PointerEvent) => {
  if (!activePhoto.value || !preview.value) {
    return
  }

  const point = logicalPointer(event)

  if (!point) {
    return
  }

  preview.value.setPointerCapture(event.pointerId)
  pointerTracker.begin(event.pointerId, point, transform.value)
}

const handlePointerMove = (event: PointerEvent) => {
  const photo = activePhoto.value
  const point = logicalPointer(event)

  if (!photo || !point) {
    return
  }

  const next = pointerTracker.move(
    event.pointerId,
    point,
    photo.diagnostics.normalizedSize,
    photoSpikeTemplate.size,
  )

  if (next) {
    transform.value = next
    render()
  }
}

const handlePointerEnd = (event: PointerEvent) => {
  if (preview.value?.hasPointerCapture(event.pointerId)) {
    preview.value.releasePointerCapture(event.pointerId)
  }

  pointerTracker.end(event.pointerId, transform.value)
}

const cleanup = () => {
  disposed = true
  latestSelection.invalidate()
  resizeObserver?.disconnect()
  pointerTracker.clear()
  activePhoto.value?.dispose()
  activePhoto.value = undefined

  for (const area of photoAreas) {
    const frame = confirmed[area.id]
    if (frame) {
      compositor.releaseFrame(frame)
      delete confirmed[area.id]
    }
  }

  compositor.dispose()
}

onMounted(async () => {
  try {
    await compositor.load()

    if (disposed) {
      compositor.dispose()
      return
    }

    status.value = 'idle'
    await nextTick()
    resizePreview()
    render()

    if (preview.value) {
      resizeObserver = new ResizeObserver(() => {
        resizePreview()
        render()
      })
      resizeObserver.observe(preview.value)
    }
  } catch {
    failure.value = classifyPhotoFailure(new Error('asset load failed'))
    diagnostics.error = 'template-assets'
    status.value = 'error'
  }
})

onBeforeUnmount(cleanup)
</script>

<template>
  <section class="spike" aria-labelledby="photo-spike-heading">
    <header class="spike__header">
      <p class="spike__eyebrow">TECHNICAL F/S</p>
      <h1 id="photo-spike-heading">端末内写真の取り込み検証</h1>
      <p>
        選択した写真、ファイル名、EXIF情報はサーバーへ送信・保存せず、ブラウザのメモリ内だけで処理します。
      </p>
      <p class="spike__scope">
        対象外: 完成画像の保存・共有、Azure配信、本番用制作画面、Android実機確認
      </p>
    </header>

    <div class="spike__layout">
      <section class="spike__workspace" aria-label="写真取り込みワークスペース">
        <canvas
          ref="preview"
          class="spike__preview"
          aria-label="文鳥テンプレートと選択写真の合成プレビュー"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerEnd"
          @pointercancel="handlePointerEnd"
          @lostpointercapture="handlePointerEnd"
        />

        <div class="spike__primary-actions">
          <label class="spike__file-button">
            写真を選択
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange"
              @cancel="
                note =
                  '選択をキャンセルしました。現在の状態は変更していません。'
              "
            />
          </label>
          <button type="button" :disabled="!activePhoto" @click="confirmPhoto">
            選択エリアへ確定
          </button>
          <button
            type="button"
            :disabled="!activePhoto"
            @click="cancelSelection"
          >
            編集中の写真をキャンセル
          </button>
        </div>

        <fieldset class="spike__areas">
          <legend>編集するエリア（{{ confirmedCount }}/4 確定済み）</legend>
          <button
            v-for="area in photoAreas"
            :key="area.id"
            type="button"
            :class="{ 'is-selected': selectedAreaId === area.id }"
            :aria-pressed="selectedAreaId === area.id"
            @click="selectArea(area.id)"
          >
            <span>{{ area.label }}</span>
            <small>{{
              confirmed[area.id] ? '確定済み・置換可' : '未確定'
            }}</small>
          </button>
        </fieldset>

        <label class="spike__blend">
          <span>現在の作品との表示比率: {{ blendPercent }}%</span>
          <input
            v-model.number="blendPercent"
            type="range"
            min="0"
            max="100"
            step="1"
            @input="render"
          />
        </label>

        <fieldset class="spike__preset">
          <legend>次回選択時の正規化候補</legend>
          <label>
            <input v-model="preset" type="radio" value="quality" />
            長辺4096px・12MP以下
          </label>
          <label>
            <input v-model="preset" type="radio" value="memory" />
            長辺2160px
          </label>
        </fieldset>

        <details class="spike__fixtures">
          <summary>固定fixtureで確認する</summary>
          <div>
            <button
              v-for="orientation in [1, 3, 6, 8]"
              :key="orientation"
              type="button"
              @click="
                loadFixture(`orientation-${orientation}.jpg`, 'image/jpeg')
              "
            >
              Orientation {{ orientation }}
            </button>
            <button
              type="button"
              @click="loadFixture('alpha.png', 'image/png')"
            >
              alpha PNG
            </button>
            <button
              type="button"
              @click="loadFixture('quality.jpg', 'image/jpeg')"
            >
              品質確認
            </button>
            <button
              type="button"
              @click="loadFixture('corrupted.jpg', 'image/jpeg')"
            >
              破損画像
            </button>
          </div>
        </details>

        <p class="spike__help">
          編集中は正方形内だけで1本指pan・2本指pinchを使用します。候補切替後は同じ画像を再選択して比較してください。
        </p>
      </section>

      <aside class="spike__diagnostics" aria-live="polite">
        <h2>診断</h2>
        <dl>
          <div>
            <dt>状態</dt>
            <dd>{{ statusLabel }}</dd>
          </div>
          <div>
            <dt>選択エリア</dt>
            <dd>{{ selectedArea?.label }}</dd>
          </div>
          <div>
            <dt>拡張子</dt>
            <dd>{{ diagnostics.extension }}</dd>
          </div>
          <div>
            <dt>MIME type</dt>
            <dd>{{ diagnostics.mimeType }}</dd>
          </div>
          <div>
            <dt>byte数</dt>
            <dd>{{ diagnostics.bytes }}</dd>
          </div>
          <div>
            <dt>decode経路</dt>
            <dd>{{ diagnostics.path }}</dd>
          </div>
          <div>
            <dt>元寸法</dt>
            <dd>{{ diagnostics.originalSize }}</dd>
          </div>
          <div>
            <dt>正規化寸法</dt>
            <dd>{{ diagnostics.normalizedSize }}</dd>
          </div>
          <div>
            <dt>decode</dt>
            <dd>{{ diagnostics.decodeMs }}</dd>
          </div>
          <div>
            <dt>正規化</dt>
            <dd>{{ diagnostics.normalizeMs }}</dd>
          </div>
          <div>
            <dt>preview</dt>
            <dd>{{ previewResolution }}</dd>
          </div>
          <div>
            <dt>直近エラー</dt>
            <dd>{{ diagnostics.error }}</dd>
          </div>
        </dl>
        <p>{{ note }}</p>
        <div v-if="failure" class="spike__error" role="alert">
          <strong>{{ failure.title }}</strong>
          <p>{{ failure.guidance }}</p>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.spike {
  /* 親pageの固定高を引き継ぎ、iOSでもこの要素自身を縦スクロール領域にする。 */
  height: 100%;
  min-height: 100%;
  padding: calc(env(safe-area-inset-top) + 1rem)
    calc(env(safe-area-inset-right) + 1rem)
    calc(env(safe-area-inset-bottom) + 2rem)
    calc(env(safe-area-inset-left) + 1rem);
  overflow-y: auto;
  color: #2f2935;
  background: linear-gradient(160deg, #fff9ee, #f6edf3 48%, #e8f4f1);
}

.spike__header,
.spike__layout {
  width: min(100%, 68rem);
  margin-inline: auto;
}

h1,
h2 {
  margin: 0;
}

.spike__header > p:not(.spike__eyebrow) {
  margin: 0.6rem 0 0;
  line-height: 1.65;
}

.spike__eyebrow {
  margin: 0 0 0.35rem;
  color: #8a4560;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.spike__scope,
.spike__help {
  color: #675c6c;
  font-size: 0.88rem;
}

.spike__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(15rem, 0.42fr);
  gap: 1rem;
  margin-top: 1rem;
}

.spike__workspace,
.spike__diagnostics {
  padding: 1rem;
  background: rgb(255 255 255 / 84%);
  border: 1px solid rgb(74 57 82 / 14%);
  border-radius: 1rem;
  box-shadow: 0 0.8rem 2rem rgb(61 44 67 / 9%);
}

.spike__preview {
  display: block;
  width: min(100%, calc(100dvh - 10rem));
  max-width: 38rem;
  aspect-ratio: 1;
  margin-inline: auto;
  border-radius: 0.8rem;
  box-shadow: inset 0 0 0 1px rgb(47 41 53 / 14%);
  touch-action: none;
}

.spike__primary-actions,
.spike__fixtures div {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.8rem;
}

button,
.spike__file-button {
  min-height: 2.75rem;
  padding: 0.62rem 0.85rem;
  color: inherit;
  font: inherit;
  font-weight: 700;
  background: #fff;
  border: 1px solid #ad9aac;
  border-radius: 0.7rem;
}

button:disabled {
  opacity: 0.45;
}

.spike__file-button {
  color: #fff;
  background: #7a405c;
  cursor: pointer;
}

.spike__file-button input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

fieldset {
  margin: 0.9rem 0 0;
  padding: 0.7rem;
  border: 1px solid #d8ccd6;
  border-radius: 0.8rem;
}

.spike__areas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.45rem;
}

.spike__areas legend,
.spike__preset legend {
  padding-inline: 0.3rem;
  font-weight: 700;
}

.spike__areas button {
  display: grid;
  gap: 0.2rem;
}

.spike__areas button.is-selected {
  color: #fff;
  background: #7a405c;
}

.spike__areas small {
  font-size: 0.7rem;
  font-weight: 500;
}

.spike__blend {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.9rem;
  font-weight: 700;
}

.spike__blend input {
  width: 100%;
}

.spike__preset {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.spike__fixtures {
  margin-top: 0.9rem;
}

.spike__fixtures summary {
  font-weight: 700;
  cursor: pointer;
}

.spike__diagnostics dl {
  display: grid;
  gap: 0.45rem;
}

.spike__diagnostics dl div {
  display: grid;
  grid-template-columns: minmax(6.5rem, 0.8fr) minmax(0, 1.2fr);
  gap: 0.5rem;
}

.spike__diagnostics dt {
  color: #675c6c;
}

.spike__diagnostics dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-weight: 700;
}

.spike__error {
  padding: 0.75rem;
  color: #7d2035;
  background: #fff0f2;
  border-radius: 0.65rem;
}

.spike__error p {
  margin: 0.35rem 0 0;
}

@media (max-width: 760px) {
  .spike__layout {
    grid-template-columns: 1fr;
  }

  .spike__areas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
