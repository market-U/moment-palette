<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  clientPointToLogical,
  type MediaTransform,
  type Size,
} from '@/shared/lib/mediaTransform'
import { PointerGestureTracker } from '@/shared/lib/pointerGesture'

type ActiveCameraPanelState = Readonly<{
  areaId: string
  facing: 'environment' | 'user'
  canSwitch: boolean
  sourceSize: Size
  transform: MediaTransform
  blend: number
}>

type CameraPanelState =
  | Readonly<{ phase: 'closed' }>
  | Readonly<{ phase: 'rationale'; areaId: string }>
  | Readonly<{ phase: 'requesting'; areaId: string }>
  | (ActiveCameraPanelState & Readonly<{ phase: 'live' | 'capturing' }>)
  | Readonly<{ phase: 'denied'; areaId: string }>
  | Readonly<{
      phase: 'unavailable'
      areaId: string
      reason:
        | 'not-found'
        | 'not-readable'
        | 'constraint-failed'
        | 'unsupported'
        | 'unknown'
    }>

const props = defineProps<{
  state: CameraPanelState
  attachTarget: (target: HTMLVideoElement) => void
  detachTarget: () => void
  confirmRationale: () => Promise<void>
  retry: () => Promise<void>
  switchFacing: () => Promise<void>
  setBlend: (blend: number) => void
  setTransform: (transform: MediaTransform) => void
  resizePreview: (
    canvas: HTMLCanvasElement,
    cssPixels: number,
    pixelRatio: number,
  ) => Size
  renderPreview: (canvas: HTMLCanvasElement) => void
  capture: () => Promise<boolean>
  cancel: () => void
  handleVisibilityChange: () => void
}>()

const { t } = useI18n()
const state = computed(() => props.state)
const video = ref<HTMLVideoElement>()
const preview = ref<HTMLCanvasElement>()
const pointerTracker = new PointerGestureTracker()
const artworkSize = { width: 1080, height: 1080 }
let animationFrame: number | undefined
let resizeObserver: ResizeObserver | undefined

const liveState = computed(() => {
  const current = state.value
  return current.phase === 'live' || current.phase === 'capturing'
    ? current
    : null
})
const isLive = computed(() => liveState.value !== null)
const isCapturing = computed(() => state.value.phase === 'capturing')

const stopRenderLoop = () => {
  if (animationFrame !== undefined) {
    cancelAnimationFrame(animationFrame)
    animationFrame = undefined
  }
}

const renderFrame = () => {
  animationFrame = undefined
  if (!isLive.value || !preview.value) return
  props.renderPreview(preview.value)
  animationFrame = requestAnimationFrame(renderFrame)
}

const startRenderLoop = () => {
  if (animationFrame === undefined && isLive.value) {
    animationFrame = requestAnimationFrame(renderFrame)
  }
}

const resizePreview = () => {
  const canvas = preview.value
  if (!canvas) return
  const width = canvas.getBoundingClientRect().width
  if (width <= 0) return
  props.resizePreview(canvas, width, window.devicePixelRatio || 1)
  props.renderPreview(canvas)
}

watch(
  () => state.value.phase,
  async (phase) => {
    pointerTracker.clear()
    stopRenderLoop()
    if (phase === 'live' || phase === 'capturing') {
      await nextTick()
      resizePreview()
      startRenderLoop()
    }
  },
)

watch(preview, (canvas) => {
  resizeObserver?.disconnect()
  resizeObserver = undefined
  if (canvas) {
    resizeObserver = new ResizeObserver(resizePreview)
    resizeObserver.observe(canvas)
  }
})

const logicalPointer = (event: PointerEvent) => {
  const canvas = preview.value
  if (!canvas) return undefined
  return clientPointToLogical(
    { x: event.clientX, y: event.clientY },
    canvas.getBoundingClientRect(),
    artworkSize,
  )
}

const handlePointerDown = (event: PointerEvent) => {
  const current = state.value
  const canvas = preview.value
  const point = logicalPointer(event)
  if (current.phase !== 'live' || !canvas || !point) return
  canvas.setPointerCapture(event.pointerId)
  pointerTracker.begin(event.pointerId, point, current.transform)
}

const handlePointerMove = (event: PointerEvent) => {
  const current = state.value
  const point = logicalPointer(event)
  if (current.phase !== 'live' || !point) return
  const transform = pointerTracker.move(
    event.pointerId,
    point,
    current.sourceSize,
    artworkSize,
  )
  if (transform) props.setTransform(transform)
}

const handlePointerEnd = (event: PointerEvent) => {
  const current = state.value
  const canvas = preview.value
  if (canvas?.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId)
  }
  if (current.phase === 'live') {
    pointerTracker.end(event.pointerId, current.transform)
  } else {
    pointerTracker.clear()
  }
}

const handleBlend = (event: Event) => {
  props.setBlend(Number((event.target as HTMLInputElement).value) / 100)
}

const failureMessage = computed(() => {
  const current = state.value
  if (current.phase === 'denied') return t('camera.errors.denied')
  if (current.phase !== 'unavailable') return ''
  return t(`camera.errors.${current.reason}`)
})

const handleVisibility = () => props.handleVisibilityChange()

onMounted(() => {
  if (video.value) props.attachTarget(video.value)
  document.addEventListener('visibilitychange', handleVisibility)
})

onBeforeUnmount(() => {
  stopRenderLoop()
  pointerTracker.clear()
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', handleVisibility)
  props.cancel()
  props.detachTarget()
})
</script>

<template>
  <video
    ref="video"
    class="camera-panel__source"
    autoplay
    muted
    playsinline
    aria-hidden="true"
  />

  <section
    v-if="state.phase !== 'closed'"
    class="camera-panel"
    role="dialog"
    aria-modal="true"
    :aria-label="t('camera.heading')"
  >
    <div v-if="state.phase === 'rationale'" class="camera-panel__message">
      <p class="eyebrow">{{ t('camera.eyebrow') }}</p>
      <h2>{{ t('camera.rationaleHeading') }}</h2>
      <p>{{ t('camera.rationale') }}</p>
      <div class="camera-panel__message-actions">
        <button class="primary-button" type="button" @click="confirmRationale">
          {{ t('camera.continue') }}
        </button>
        <button type="button" @click="cancel">
          {{ t('camera.cancel') }}
        </button>
      </div>
    </div>

    <div
      v-else-if="state.phase === 'requesting'"
      class="camera-panel__message"
      aria-live="polite"
    >
      <p class="eyebrow">{{ t('camera.eyebrow') }}</p>
      <h2>{{ t('camera.starting') }}</h2>
      <p>{{ t('camera.startingHint') }}</p>
      <button type="button" @click="cancel">
        {{ t('camera.cancel') }}
      </button>
    </div>

    <div v-else-if="liveState" class="camera-panel__workspace">
      <header class="camera-panel__header">
        <button type="button" :disabled="isCapturing" @click="cancel">
          {{ t('camera.cancel') }}
        </button>
        <h2>{{ t('camera.heading') }}</h2>
        <button
          v-if="liveState.canSwitch"
          type="button"
          :disabled="isCapturing"
          @click="switchFacing"
        >
          {{ t('camera.switch') }}
        </button>
        <span v-else aria-hidden="true" />
      </header>

      <canvas
        ref="preview"
        class="camera-panel__preview"
        :aria-label="t('camera.previewLabel')"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerEnd"
        @pointercancel="handlePointerEnd"
        @lostpointercapture="handlePointerEnd"
      />

      <div class="camera-panel__blend">
        <button
          type="button"
          :aria-label="t('camera.showSource')"
          :disabled="isCapturing"
          @click="setBlend(0)"
        >
          ☆
        </button>
        <label>
          <span>{{ t('camera.blend') }}</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="Math.round(liveState.blend * 100)"
            :disabled="isCapturing"
            @input="handleBlend"
          />
        </label>
        <button
          type="button"
          :aria-label="t('camera.showArtwork')"
          :disabled="isCapturing"
          @click="setBlend(1)"
        >
          ★
        </button>
      </div>

      <p class="camera-panel__gesture-help">{{ t('camera.gestureHelp') }}</p>
      <button
        class="camera-panel__shutter"
        type="button"
        :disabled="isCapturing"
        :aria-label="t('camera.shutterLabel')"
        @click="capture"
      >
        <span aria-hidden="true" />
      </button>
    </div>

    <div v-else class="camera-panel__message" role="alert">
      <p class="eyebrow">{{ t('camera.eyebrow') }}</p>
      <h2>{{ t('camera.unavailableHeading') }}</h2>
      <p>{{ failureMessage }}</p>
      <p>{{ t('camera.alternativesLater') }}</p>
      <div class="camera-panel__message-actions">
        <button class="primary-button" type="button" @click="retry">
          {{ t('actions.retry') }}
        </button>
        <button type="button" @click="cancel">
          {{ t('camera.backToCreation') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.camera-panel__source {
  position: fixed;
  width: 1px;
  height: 1px;
  pointer-events: none;
  opacity: 0;
}

.camera-panel {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  min-width: 20rem;
  padding: calc(env(safe-area-inset-top) + 0.75rem)
    calc(env(safe-area-inset-right) + 1rem)
    calc(env(safe-area-inset-bottom) + 1rem)
    calc(env(safe-area-inset-left) + 1rem);
  overflow-y: auto;
  color: var(--color-ink);
  background: #18151c;
}

.camera-panel__workspace {
  display: grid;
  align-content: start;
  width: min(100%, 36rem);
  margin: auto;
  color: #fff;
}

.camera-panel__header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.camera-panel__header h2 {
  margin: 0;
  font-size: 1rem;
}

.camera-panel__header button:last-of-type,
.camera-panel__header span {
  justify-self: end;
}

.camera-panel button {
  min-height: 2.75rem;
  padding: 0.55rem 0.9rem;
  font: inherit;
  cursor: pointer;
  border: 1px solid rgb(255 255 255 / 32%);
  border-radius: 999px;
}

.camera-panel button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.camera-panel__header button,
.camera-panel__blend button {
  color: #fff;
  background: rgb(255 255 255 / 12%);
}

.camera-panel__preview {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  background: #fff;
  border-radius: 1.25rem;
  touch-action: none;
}

.camera-panel__blend {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: center;
  margin-top: 0.8rem;
}

.camera-panel__blend label {
  display: grid;
  gap: 0.2rem;
  font-size: 0.75rem;
  text-align: center;
}

.camera-panel__blend input {
  width: 100%;
  min-height: 2.5rem;
  touch-action: manipulation;
}

.camera-panel__gesture-help {
  margin: 0.5rem 0 0;
  color: rgb(255 255 255 / 72%);
  font-size: 0.78rem;
  text-align: center;
}

.camera-panel__shutter {
  justify-self: center;
  width: 4.5rem;
  height: 4.5rem;
  margin-top: 0.75rem;
  padding: 0.35rem;
  background: transparent;
  border: 3px solid #fff !important;
}

.camera-panel__shutter span {
  display: block;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 50%;
}

.camera-panel__message {
  align-self: center;
  width: min(100%, 28rem);
  margin: auto;
  padding: 1.5rem;
  background: #fffaf5;
  border-radius: 1.5rem;
  box-shadow: 0 1.25rem 4rem rgb(0 0 0 / 28%);
}

.camera-panel__message h2 {
  margin: 0.25rem 0 0.75rem;
}

.camera-panel__message p:not(.eyebrow) {
  color: var(--color-muted);
  line-height: 1.65;
}

.camera-panel__message-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.camera-panel .primary-button {
  color: #fff;
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-weight: 700;
}
</style>
