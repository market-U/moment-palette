<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { PhotoFillState } from './photoState'
import {
  clientPointToLogical,
  type MediaTransform,
  type Size,
} from '@/shared/lib/mediaTransform'
import { PointerGestureTracker } from '@/shared/lib/pointerGesture'

const props = defineProps<{
  state: PhotoFillState
  select: (file: File) => Promise<void>
  retry: () => void
  setBlend: (blend: number) => void
  setTransform: (transform: MediaTransform) => void
  resizePreview: (
    canvas: HTMLCanvasElement,
    cssPixels: number,
    pixelRatio: number,
  ) => Size
  renderPreview: (canvas: HTMLCanvasElement) => void
  apply: () => Promise<boolean>
  cancel: () => void
}>()

const { t } = useI18n()
const input = ref<HTMLInputElement>()
const preview = ref<HTMLCanvasElement>()
const pointerTracker = new PointerGestureTracker()
const artworkSize = { width: 1080, height: 1080 }
let resizeObserver: ResizeObserver | undefined

const editing = computed(() =>
  props.state.phase === 'editing' ? props.state : undefined,
)

const openPicker = async () => {
  await nextTick()
  input.value?.click()
}

watch(
  () => props.state.phase,
  (phase) => {
    pointerTracker.clear()
    if (phase === 'selecting') void openPicker()
  },
  { immediate: true },
)

const resize = () => {
  const canvas = preview.value
  if (!canvas) return
  const width = canvas.getBoundingClientRect().width
  if (width <= 0) return
  props.resizePreview(canvas, width, window.devicePixelRatio || 1)
  props.renderPreview(canvas)
}

watch(preview, (canvas) => {
  resizeObserver?.disconnect()
  if (!canvas) return
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  void nextTick(resize)
})

watch(
  () => editing.value?.transform,
  () => {
    if (preview.value) props.renderPreview(preview.value)
  },
  { deep: true },
)

const choose = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (file) await props.select(file)
}

const logicalPoint = (event: PointerEvent) => {
  const canvas = preview.value
  if (!canvas) return undefined
  return clientPointToLogical(
    { x: event.clientX, y: event.clientY },
    canvas.getBoundingClientRect(),
    artworkSize,
  )
}

const pointerDown = (event: PointerEvent) => {
  const state = editing.value
  const canvas = preview.value
  const point = logicalPoint(event)
  if (!state || !canvas || !point) return
  canvas.setPointerCapture(event.pointerId)
  pointerTracker.begin(event.pointerId, point, state.transform)
}

const pointerMove = (event: PointerEvent) => {
  const state = editing.value
  const point = logicalPoint(event)
  if (!state || !point) return
  const transform = pointerTracker.move(
    event.pointerId,
    point,
    state.sourceSize,
    artworkSize,
  )
  if (transform) props.setTransform(transform)
}

const pointerEnd = (event: PointerEvent) => {
  const canvas = preview.value
  if (canvas?.hasPointerCapture(event.pointerId))
    canvas.releasePointerCapture(event.pointerId)
  if (editing.value)
    pointerTracker.end(event.pointerId, editing.value.transform)
  else pointerTracker.clear()
}

const blend = (event: Event) =>
  props.setBlend(Number((event.target as HTMLInputElement).value) / 100)

onBeforeUnmount(() => {
  pointerTracker.clear()
  resizeObserver?.disconnect()
  props.cancel()
})
</script>

<template>
  <input
    ref="input"
    class="photo-fill-panel__input"
    type="file"
    accept="image/*"
    @change="choose"
  />
  <section
    v-if="state.phase !== 'closed'"
    class="photo-fill-panel"
    role="dialog"
    aria-modal="true"
    :aria-label="t('photo.heading')"
  >
    <div
      v-if="state.phase === 'selecting' || state.phase === 'decoding'"
      class="photo-fill-panel__message"
      aria-live="polite"
    >
      <h2>
        {{
          state.phase === 'selecting'
            ? t('photo.selecting')
            : t('photo.decoding')
        }}
      </h2>
      <p>{{ t('photo.private') }}</p>
      <button type="button" @click="cancel">{{ t('photo.cancel') }}</button>
    </div>
    <div
      v-else-if="state.phase === 'error'"
      class="photo-fill-panel__message"
      role="alert"
    >
      <h2>{{ t('photo.errorHeading') }}</h2>
      <p>{{ t('photo.error') }}</p>
      <button class="primary" type="button" @click="retry">
        {{ t('photo.chooseAgain') }}
      </button>
      <button type="button" @click="cancel">{{ t('photo.cancel') }}</button>
    </div>
    <div v-else-if="editing" class="photo-fill-panel__workspace">
      <header>
        <button type="button" @click="cancel">{{ t('photo.cancel') }}</button>
        <h2>{{ t('photo.heading') }}</h2>
        <span />
      </header>
      <canvas
        ref="preview"
        class="photo-fill-panel__preview"
        :aria-label="t('photo.previewLabel')"
        @pointerdown="pointerDown"
        @pointermove="pointerMove"
        @pointerup="pointerEnd"
        @pointercancel="pointerEnd"
        @lostpointercapture="pointerEnd"
      />
      <div class="photo-fill-panel__blend">
        <button type="button" @click="setBlend(0)">☆</button
        ><input
          type="range"
          min="0"
          max="100"
          :value="Math.round(editing.blend * 100)"
          @input="blend"
        /><button type="button" @click="setBlend(1)">★</button>
      </div>
      <p>{{ t('photo.gestureHelp') }}</p>
      <div class="photo-fill-panel__actions">
        <button type="button" @click="cancel">{{ t('photo.cancel') }}</button
        ><button class="primary" type="button" @click="apply">
          {{ t('photo.apply') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.photo-fill-panel__input {
  position: fixed;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.photo-fill-panel {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  padding: calc(env(safe-area-inset-top) + 0.75rem) 1rem
    calc(env(safe-area-inset-bottom) + 1rem);
  overflow-y: auto;
  color: #fff;
  background: #18151c;
}
.photo-fill-panel__workspace {
  display: grid;
  align-content: start;
  width: min(100%, 36rem);
  margin: auto;
}
.photo-fill-panel__workspace header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-bottom: 0.75rem;
}
.photo-fill-panel__workspace header h2 {
  margin: 0;
  font-size: 1rem;
}
.photo-fill-panel button {
  min-height: 2.75rem;
  padding: 0.55rem 0.9rem;
  color: inherit;
  font: inherit;
  cursor: pointer;
  background: rgb(255 255 255 / 12%);
  border: 1px solid rgb(255 255 255 / 32%);
  border-radius: 999px;
}
.photo-fill-panel__preview {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  background: #fff;
  border-radius: 1.25rem;
  touch-action: none;
}
.photo-fill-panel__blend {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.65rem;
  align-items: center;
  margin-top: 0.8rem;
}
.photo-fill-panel__blend input {
  min-height: 2.5rem;
  touch-action: manipulation;
}
.photo-fill-panel__actions {
  display: flex;
  justify-content: center;
  gap: 0.65rem;
  margin-top: 1rem;
}
.photo-fill-panel .primary {
  color: #fff;
  background: var(--color-accent);
}
.photo-fill-panel__message {
  align-self: center;
  width: min(100%, 28rem);
  margin: auto;
  padding: 1.5rem;
  color: var(--color-ink);
  background: #fffaf5;
  border-radius: 1.5rem;
}
.photo-fill-panel__message button {
  margin: 0.5rem 0.25rem 0 0;
  color: var(--color-ink);
  background: transparent;
  border-color: rgb(65 54 76 / 24%);
}
</style>
