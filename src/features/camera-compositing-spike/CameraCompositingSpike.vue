<script setup lang="ts">
import {
  clientPointToLogical,
  createCenteredCoverTransform,
} from '@/shared/lib/mediaTransform'
import { PointerGestureTracker } from '@/shared/lib/pointerGesture'

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowReactive,
} from 'vue'

import type { CameraFailure, CameraStreamFactory } from './cameraPort'
import type { CameraCompositorFactory, CapturedFrames } from './compositorPort'
import { cameraAreas, cameraSpikeTemplate } from './template'
import {
  ARTWORK_SIZE,
  type CameraAreaId,
  type CameraFacing,
  type MediaTransform,
  type Size,
} from './types'

type SpikeStatus =
  | 'loading-assets'
  | 'idle'
  | 'requesting-camera'
  | 'live'
  | 'capturing'
  | 'generating-png'
  | 'error'

const props = defineProps<{
  cameraFactory: CameraStreamFactory
  compositorFactory: CameraCompositorFactory
  failureMapper: (error: unknown) => CameraFailure
}>()

const camera = props.cameraFactory()
const compositor = props.compositorFactory(cameraSpikeTemplate)
const pointerTracker = new PointerGestureTracker()
const video = ref<HTMLVideoElement>()
const preview = ref<HTMLCanvasElement>()
const status = ref<SpikeStatus>('loading-assets')
const selectedAreaId = ref<CameraAreaId>('background')
const blendPercent = ref(100)
const transform = ref<MediaTransform>({ scale: 1, offsetX: 0, offsetY: 0 })
const sourceSize = ref<Size>({ width: ARTWORK_SIZE, height: ARTWORK_SIZE })
const captures = shallowReactive<CapturedFrames>({})
const canSwitch = ref(false)
const facing = ref<CameraFacing>('environment')
const cameraFailure = ref<CameraFailure>()
const operationError = ref<string>()
const outputUrl = ref<string>()
const outputBlobType = ref<string>()
const outputDimensions = ref<string>()
const diagnosticNote = ref('カメラは開始操作まで取得しません。')
const diagnostics = reactive({
  video: '未取得',
  facing: '未取得',
  canvas: '未計測',
  fps: '停止中',
  captureMs: '未実施',
  pngMs: '未実施',
  captureCount: 0,
})

let animationFrame: number | undefined
let resizeObserver: ResizeObserver | undefined
let frameSamples: number[] = []
let lastFpsUpdate = 0
let cameraOperationId = 0
let disposed = false

const busy = computed(() =>
  [
    'loading-assets',
    'requesting-camera',
    'capturing',
    'generating-png',
  ].includes(status.value),
)
const cameraActive = computed(() => status.value === 'live')
const captureCount = computed(
  () => cameraAreas.filter((area) => captures[area.id]).length,
)
const selectedArea = computed(
  () =>
    cameraAreas.find((area) => area.id === selectedAreaId.value) ??
    cameraAreas[0],
)
const statusLabel = computed(() => {
  const labels: Record<SpikeStatus, string> = {
    'loading-assets': 'アセット読込中',
    idle: 'カメラ停止中',
    'requesting-camera': 'カメラ取得中',
    live: 'スルー映像表示中',
    capturing: '撮影処理中',
    'generating-png': 'PNG生成中',
    error: 'エラー',
  }

  return labels[status.value]
})

const cameraFailureMessage = computed(() => {
  if (!cameraFailure.value) {
    return undefined
  }

  const messages: Record<CameraFailure['code'], string> = {
    'permission-denied':
      'カメラが拒否されています。ブラウザまたは端末のサイト設定を確認してから再試行してください。',
    'not-found':
      '利用できるカメラが見つかりませんでした。カメラが搭載または接続され、OSとブラウザで認識されているか確認してください。',
    'not-readable':
      'カメラを読み取れませんでした。他のアプリが使用していないか確認してください。',
    'constraint-failed':
      '要求したカメラ条件を満たせませんでした。端末のカメラ構成を確認してください。',
    unsupported:
      'このブラウザではカメラAPIを利用できません。HTTPSで開いているか確認してください。',
    unknown: 'カメラの取得中に予期しないエラーが発生しました。',
  }

  return `${messages[cameraFailure.value.code]} (${cameraFailure.value.name})`
})

const clearOutput = () => {
  if (outputUrl.value) {
    URL.revokeObjectURL(outputUrl.value)
  }

  outputUrl.value = undefined
  outputBlobType.value = undefined
  outputDimensions.value = undefined
}

const resizePreview = () => {
  if (!preview.value) {
    return
  }

  const cssPixels = preview.value.getBoundingClientRect().width

  if (cssPixels <= 0) {
    return
  }

  const size = compositor.resizePreview(
    preview.value,
    cssPixels,
    window.devicePixelRatio || 1,
  )
  diagnostics.canvas = `${String(size.width)}×${String(size.height)}`
}

const renderOnce = () => {
  if (!preview.value || status.value === 'loading-assets') {
    return
  }

  compositor.renderPreview(
    preview.value,
    cameraActive.value ? video.value : undefined,
    {
      selectedAreaId: selectedAreaId.value,
      blend: blendPercent.value / 100,
      transform: transform.value,
      mirrorSource: facing.value === 'user',
      captures,
    },
  )
}

const stopRenderLoop = () => {
  if (animationFrame !== undefined) {
    cancelAnimationFrame(animationFrame)
    animationFrame = undefined
  }

  frameSamples = []
  diagnostics.fps = '停止中'
}

const renderFrame = (timestamp: number) => {
  animationFrame = undefined

  if (!cameraActive.value) {
    return
  }

  renderOnce()
  frameSamples.push(timestamp)

  while (frameSamples.length > 0 && timestamp - (frameSamples[0] ?? 0) > 1000) {
    frameSamples.shift()
  }

  if (timestamp - lastFpsUpdate >= 500) {
    diagnostics.fps = `${String(Math.max(0, frameSamples.length - 1))} fps（概算）`
    lastFpsUpdate = timestamp
  }

  animationFrame = requestAnimationFrame(renderFrame)
}

const startRenderLoop = () => {
  if (animationFrame === undefined) {
    animationFrame = requestAnimationFrame(renderFrame)
  }
}

const stopCamera = (note = 'カメラを停止しました。') => {
  cameraOperationId += 1
  stopRenderLoop()
  pointerTracker.clear()
  camera.stop()
  canSwitch.value = false
  status.value = 'idle'
  diagnosticNote.value = note
  renderOnce()
}

const waitForVideoMetadata = async (target: HTMLVideoElement) => {
  if (target.videoWidth > 0 && target.videoHeight > 0) {
    return
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('video metadataの取得がタイムアウトしました。'))
    }, 5000)
    const cleanup = () => {
      window.clearTimeout(timeout)
      target.removeEventListener('loadedmetadata', handleLoaded)
      target.removeEventListener('error', handleError)
    }
    const handleLoaded = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('video metadataを取得できませんでした。'))
    }

    target.addEventListener('loadedmetadata', handleLoaded, { once: true })
    target.addEventListener('error', handleError, { once: true })
  })
}

const applySession = async (
  sessionPromise: ReturnType<typeof camera.start>,
  target: HTMLVideoElement,
  operationId: number,
) => {
  const session = await sessionPromise
  await waitForVideoMetadata(target)

  if (
    disposed ||
    operationId !== cameraOperationId ||
    document.visibilityState === 'hidden'
  ) {
    camera.stop()
    return false
  }

  sourceSize.value = {
    width: target.videoWidth,
    height: target.videoHeight,
  }
  transform.value = createCenteredCoverTransform(
    sourceSize.value,
    cameraSpikeTemplate.size,
  )
  canSwitch.value = session.canSwitch
  facing.value = session.facing
  diagnostics.video = `${String(target.videoWidth)}×${String(target.videoHeight)}`
  diagnostics.facing = `${session.settings.facingMode ?? session.facing}${
    session.facing === 'user' ? '（鏡像）' : ''
  }`
  status.value = 'live'
  diagnosticNote.value = `${selectedArea.value?.label ?? ''}を調整して撮影できます。`
  startRenderLoop()
  return true
}

const handleCameraOperation = async (
  operation: (target: HTMLVideoElement) => ReturnType<typeof camera.start>,
) => {
  if (!video.value) {
    return
  }

  cameraFailure.value = undefined
  operationError.value = undefined
  status.value = 'requesting-camera'
  stopRenderLoop()
  const operationId = ++cameraOperationId

  try {
    await applySession(operation(video.value), video.value, operationId)
  } catch (error) {
    camera.stop()

    if (disposed || operationId !== cameraOperationId) {
      return
    }

    cameraFailure.value = props.failureMapper(error)
    status.value = 'error'
    diagnosticNote.value = 'カメラ取得に失敗しました。'
    renderOnce()
  }
}

const startCamera = () =>
  handleCameraOperation((target) => camera.start(target, facing.value))
const switchCamera = () =>
  handleCameraOperation((target) => camera.switchFacing(target))

const selectArea = (areaId: CameraAreaId) => {
  if (cameraActive.value) {
    stopCamera('エリア変更のためカメラを停止しました。')
  }

  selectedAreaId.value = areaId
  renderOnce()
}

const capture = () => {
  if (!video.value || !cameraActive.value) {
    return
  }

  status.value = 'capturing'
  operationError.value = undefined

  try {
    const result = compositor.captureFrame(
      video.value,
      transform.value,
      facing.value === 'user',
    )
    const previous = captures[selectedAreaId.value]

    if (previous) {
      compositor.releaseFrame(previous)
    }

    captures[selectedAreaId.value] = result.frame
    diagnostics.captureMs = `${result.durationMs.toFixed(1)} ms`
    diagnostics.captureCount += 1
    clearOutput()
    stopCamera(`${selectedArea.value?.label ?? ''}へ撮影結果を反映しました。`)
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : String(error)
    stopCamera('撮影に失敗したためカメラを停止しました。')
    status.value = 'error'
  }
}

const generatePng = async () => {
  operationError.value = undefined
  cameraFailure.value = undefined

  if (cameraActive.value) {
    stopCamera('PNG生成のためカメラを停止しました。')
  }

  status.value = 'generating-png'

  try {
    const result = await compositor.generatePng(captures)
    clearOutput()
    outputUrl.value = URL.createObjectURL(result.blob)
    outputBlobType.value = result.blob.type
    outputDimensions.value = `${String(result.width)}×${String(result.height)}`
    diagnostics.pngMs = `${result.durationMs.toFixed(1)} ms`
    status.value = 'idle'
    diagnosticNote.value = '完成PNGを生成しました。'
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : String(error)
    status.value = 'error'
    diagnosticNote.value = 'PNG生成に失敗しました。'
  }
}

const logicalPointer = (event: PointerEvent) => {
  const target = preview.value

  if (!target) {
    return undefined
  }

  return clientPointToLogical(
    { x: event.clientX, y: event.clientY },
    target.getBoundingClientRect(),
    cameraSpikeTemplate.size,
  )
}

const handlePointerDown = (event: PointerEvent) => {
  if (!cameraActive.value || !preview.value) {
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
  if (!cameraActive.value) {
    return
  }

  const point = logicalPointer(event)

  if (!point) {
    return
  }

  const nextTransform = pointerTracker.move(
    event.pointerId,
    point,
    sourceSize.value,
    cameraSpikeTemplate.size,
  )

  if (nextTransform) {
    transform.value = nextTransform
  }
}

const handlePointerEnd = (event: PointerEvent) => {
  if (preview.value?.hasPointerCapture(event.pointerId)) {
    preview.value.releasePointerCapture(event.pointerId)
  }

  pointerTracker.end(event.pointerId, transform.value)
}

const handleVisibilityChange = () => {
  if (
    document.visibilityState === 'hidden' &&
    (cameraActive.value || status.value === 'requesting-camera')
  ) {
    stopCamera('バックグラウンド移行を検出してカメラを停止しました。')
  }
}

const cleanup = () => {
  disposed = true
  cameraOperationId += 1
  stopRenderLoop()
  camera.stop()
  pointerTracker.clear()
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  clearOutput()

  for (const area of cameraAreas) {
    const frame = captures[area.id]

    if (frame) {
      compositor.releaseFrame(frame)
      delete captures[area.id]
    }
  }
}

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange)

  try {
    await compositor.load()
    status.value = 'idle'
    await nextTick()
    resizePreview()
    renderOnce()

    if (preview.value) {
      resizeObserver = new ResizeObserver(() => {
        resizePreview()
        renderOnce()
      })
      resizeObserver.observe(preview.value)
    }
  } catch (error) {
    operationError.value =
      error instanceof Error ? error.message : String(error)
    status.value = 'error'
  }
})

onBeforeUnmount(cleanup)
</script>

<template>
  <section class="spike" aria-labelledby="camera-spike-heading">
    <header class="spike__header">
      <p class="spike__eyebrow">TECHNICAL F/S</p>
      <h1 id="camera-spike-heading">カメラ・マスク合成検証</h1>
      <p>
        本番候補「文鳥01」で、カメラ取得から1080px
        PNG生成までを検証します。映像と画像は端末内のメモリだけで処理し、サーバーへ送信・保存しません。
      </p>
      <p class="spike__scope">
        対象外: 写真ライブラリ、Web
        Share、単色塗り、Azureテンプレート配信、Android実機確認
      </p>
    </header>

    <div class="spike__layout">
      <section class="spike__workspace" aria-label="カメラ合成ワークスペース">
        <video
          ref="video"
          class="spike__source-video"
          autoplay
          muted
          playsinline
          aria-hidden="true"
        />

        <canvas
          ref="preview"
          class="spike__preview"
          aria-label="文鳥テンプレートとカメラ映像の合成プレビュー"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerEnd"
          @pointercancel="handlePointerEnd"
          @lostpointercapture="handlePointerEnd"
        />

        <div v-if="cameraActive" class="spike__shutter-dock">
          <button
            class="spike__primary spike__shutter"
            type="button"
            aria-label="現在の映像を選択中エリアへ撮影"
            @click="capture"
          >
            シャッター
          </button>
        </div>

        <fieldset class="spike__areas" :disabled="busy">
          <legend>編集するエリア（{{ captureCount }}/4 撮影済み）</legend>
          <button
            v-for="area in cameraAreas"
            :key="area.id"
            type="button"
            :class="{ 'is-selected': selectedAreaId === area.id }"
            :aria-pressed="selectedAreaId === area.id"
            @click="selectArea(area.id)"
          >
            <span>{{ area.label }}</span>
            <small>{{
              captures[area.id] ? '撮影済み・再撮影可' : '未撮影'
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
            :disabled="busy"
            @input="renderOnce"
          />
        </label>

        <div class="spike__controls">
          <button
            type="button"
            :disabled="busy || cameraActive"
            @click="startCamera"
          >
            {{ cameraFailure ? 'カメラを再試行' : 'カメラを開始' }}
          </button>
          <button
            type="button"
            :disabled="!cameraActive || !canSwitch || busy"
            @click="switchCamera"
          >
            前面・背面を切替
          </button>
          <button
            type="button"
            :disabled="
              (!cameraActive && status !== 'requesting-camera') ||
              status === 'capturing' ||
              status === 'generating-png'
            "
            @click="stopCamera('キャンセル操作でカメラを停止しました。')"
          >
            キャンセル
          </button>
          <button type="button" :disabled="busy" @click="generatePng">
            1080px PNGを生成
          </button>
        </div>

        <p class="spike__gesture-help">
          カメラ表示中は、正方形の中を1本指で移動、2本指でピンチできます。撮影後はカメラを停止します。
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
            <dt>選択</dt>
            <dd>{{ selectedArea?.label }}</dd>
          </div>
          <div>
            <dt>video</dt>
            <dd>{{ diagnostics.video }}</dd>
          </div>
          <div>
            <dt>向き</dt>
            <dd>{{ diagnostics.facing }}</dd>
          </div>
          <div>
            <dt>preview</dt>
            <dd>{{ diagnostics.canvas }}</dd>
          </div>
          <div>
            <dt>render</dt>
            <dd>{{ diagnostics.fps }}</dd>
          </div>
          <div>
            <dt>直近の撮影</dt>
            <dd>{{ diagnostics.captureMs }}</dd>
          </div>
          <div>
            <dt>撮影回数</dt>
            <dd>{{ diagnostics.captureCount }}</dd>
          </div>
          <div>
            <dt>PNG生成</dt>
            <dd>{{ diagnostics.pngMs }}</dd>
          </div>
        </dl>
        <p>{{ diagnosticNote }}</p>
        <p v-if="cameraFailureMessage" class="spike__error" role="alert">
          {{ cameraFailureMessage }}
        </p>
        <p v-if="operationError" class="spike__error" role="alert">
          {{ operationError }}
        </p>
      </aside>
    </div>

    <section
      v-if="outputUrl"
      class="spike__output"
      aria-labelledby="output-heading"
    >
      <div>
        <p class="spike__eyebrow">GENERATED IN BROWSER</p>
        <h2 id="output-heading">完成PNG</h2>
        <p>
          {{ outputBlobType }} / {{ outputDimensions }} /
          {{ diagnostics.pngMs }}
        </p>
      </div>
      <img :src="outputUrl" alt="文鳥01の4エリアを合成した完成PNG" />
    </section>
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
  color: #2f2935;
  background: linear-gradient(160deg, #fff9ee, #f6edf3 48%, #e8f4f1);
}

.spike__header,
.spike__layout,
.spike__output {
  width: min(100%, 68rem);
  margin-inline: auto;
}

.spike__header h1,
.spike__diagnostics h2,
.spike__output h2 {
  margin: 0;
}

.spike__header > p:not(.spike__eyebrow) {
  max-width: 60rem;
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

.spike__scope {
  color: #675c6c;
  font-size: 0.88rem;
}

.spike__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(15rem, 0.4fr);
  gap: 1rem;
  margin-top: 1rem;
}

.spike__workspace,
.spike__diagnostics,
.spike__output {
  padding: 1rem;
  background: rgb(255 255 255 / 82%);
  border: 1px solid rgb(74 57 82 / 14%);
  border-radius: 1rem;
  box-shadow: 0 0.8rem 2rem rgb(61 44 67 / 9%);
}

.spike__source-video {
  position: fixed;
  width: 1px;
  height: 1px;
  pointer-events: none;
  opacity: 0;
}

.spike__preview {
  display: block;
  width: min(100%, 38rem);
  height: auto;
  aspect-ratio: 1;
  margin-inline: auto;
  background: #fff;
  border: 1px solid rgb(55 44 61 / 18%);
  border-radius: 0.75rem;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 70%);
  touch-action: none;
}

.spike__areas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 1rem 0 0;
  padding: 0;
  border: 0;
}

.spike__areas legend {
  grid-column: 1 / -1;
  margin-bottom: 0.4rem;
  font-weight: 700;
}

.spike button {
  min-height: 2.75rem;
  padding: 0.6rem 0.75rem;
  color: #3e3443;
  cursor: pointer;
  background: #fff;
  border: 1px solid rgb(74 57 82 / 25%);
  border-radius: 0.7rem;
  touch-action: manipulation;
}

.spike button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.spike button:focus-visible,
.spike input:focus-visible {
  outline: 3px solid #775aa2;
  outline-offset: 2px;
}

.spike__areas button {
  display: grid;
  gap: 0.2rem;
  text-align: left;
}

.spike__areas button.is-selected {
  color: #fff;
  background: #5c4865;
  border-color: #5c4865;
}

.spike__areas small {
  font-size: 0.68rem;
  opacity: 0.76;
}

.spike__blend {
  display: grid;
  gap: 0.4rem;
  margin-top: 1rem;
  font-weight: 700;
}

.spike__blend input {
  width: 100%;
  min-height: 2.5rem;
  touch-action: manipulation;
}

.spike__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.spike__shutter-dock {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
}

.spike button.spike__shutter {
  min-width: 9rem;
  min-height: 3.25rem;
  font-weight: 800;
  box-shadow: 0 0.5rem 1.4rem rgb(61 44 67 / 22%);
}

.spike button.spike__primary {
  color: #fff;
  background: #8b4961;
  border-color: #8b4961;
}

.spike__gesture-help,
.spike__diagnostics p,
.spike__output p {
  margin: 0.75rem 0 0;
  color: #675c6c;
  font-size: 0.85rem;
  line-height: 1.55;
}

.spike__diagnostics dl {
  margin: 0.75rem 0 0;
}

.spike__diagnostics dl div {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-bottom: 1px solid rgb(74 57 82 / 10%);
}

.spike__diagnostics dt {
  color: #706576;
}

.spike__diagnostics dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.spike__diagnostics .spike__error {
  color: #9d2444;
  font-weight: 700;
}

.spike__output {
  display: grid;
  grid-template-columns: minmax(12rem, 0.45fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
  margin-top: 1rem;
}

.spike__output img {
  display: block;
  width: min(100%, 34rem);
  aspect-ratio: 1;
  object-fit: contain;
  background: #fff;
  border: 1px solid rgb(74 57 82 / 18%);
  border-radius: 0.75rem;
}

@media (max-width: 50rem) {
  .spike__layout,
  .spike__output {
    grid-template-columns: 1fr;
  }

  .spike__areas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .spike__shutter-dock {
    position: fixed;
    z-index: 10;
    right: 0;
    bottom: 0;
    left: 0;
    padding: 0.7rem 1rem calc(env(safe-area-inset-bottom) + 0.7rem);
    margin: 0;
    pointer-events: none;
    background: linear-gradient(transparent, rgb(255 249 238 / 88%) 35%);
  }

  .spike__shutter-dock button {
    pointer-events: auto;
  }
}
</style>
