<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { SolidColorFillState } from './solidColorState'
import { FrameRenderScheduler } from '@/features/photo-fill/frameRenderScheduler'

const props = defineProps<{
  state: SolidColorFillState
  setColor: (color: string) => void
  resizePreview: (
    canvas: HTMLCanvasElement,
    cssPixels: number,
    pixelRatio: number,
  ) => void
  renderPreview: (canvas: HTMLCanvasElement) => void
  apply: () => Promise<boolean>
  cancel: () => void
}>()

const { t } = useI18n()
const preview = ref<HTMLCanvasElement>()
const editing = computed(() =>
  props.state.phase === 'editing' ? props.state : undefined,
)
let resizeObserver: ResizeObserver | undefined
let renderScheduler: FrameRenderScheduler | undefined

const render = () => {
  if (preview.value) props.renderPreview(preview.value)
}

const renderImmediately = () => {
  renderScheduler?.cancel()
  render()
}

const resize = () => {
  const canvas = preview.value
  if (!canvas) return
  const width = canvas.getBoundingClientRect().width
  if (width <= 0) return
  props.resizePreview(canvas, width, window.devicePixelRatio || 1)
  renderImmediately()
}

watch(preview, (canvas) => {
  resizeObserver?.disconnect()
  if (!canvas) return
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  void nextTick(resize)
})

watch(
  () => editing.value?.color,
  () => renderScheduler?.request(),
)

const changeColor = (event: Event) =>
  props.setColor((event.target as HTMLInputElement).value)

onMounted(() => {
  renderScheduler = new FrameRenderScheduler(
    render,
    (callback) => window.requestAnimationFrame(callback),
    (frameId) => window.cancelAnimationFrame(frameId),
  )
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  renderScheduler?.dispose()
})
</script>

<template>
  <section
    v-if="editing"
    class="solid-color-fill-panel"
    role="dialog"
    aria-modal="true"
    :aria-label="t('solidColor.heading')"
  >
    <div class="solid-color-fill-panel__workspace">
      <header>
        <p>{{ t('solidColor.eyebrow') }}</p>
        <h2>{{ t('solidColor.heading') }}</h2>
      </header>
      <canvas
        ref="preview"
        class="solid-color-fill-panel__preview"
        :aria-label="t('solidColor.previewLabel')"
      />
      <label class="solid-color-fill-panel__input">
        <span>{{ t('solidColor.choose') }}</span>
        <input type="color" :value="editing.color" @input="changeColor" />
      </label>
      <div class="solid-color-fill-panel__actions">
        <button type="button" @click="cancel">
          {{ t('solidColor.cancel') }}
        </button>
        <button class="primary" type="button" @click="apply">
          {{ t('solidColor.apply') }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.solid-color-fill-panel {
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

.solid-color-fill-panel__workspace {
  display: grid;
  align-content: start;
  width: min(100%, 36rem);
  margin: auto;
}

.solid-color-fill-panel__workspace header {
  margin-bottom: 0.75rem;
  text-align: center;
}

.solid-color-fill-panel__workspace header p {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.78rem;
  font-weight: 700;
}

.solid-color-fill-panel__workspace h2 {
  margin: 0.25rem 0 0;
  font-size: 1rem;
}

.solid-color-fill-panel__preview {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  background: #fff;
  border-radius: 1.25rem;
}

.solid-color-fill-panel__input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3.5rem;
  margin-top: 1rem;
  padding: 0.55rem 0.9rem 0.55rem 1.1rem;
  color: inherit;
  font-weight: 700;
  background: rgb(255 255 255 / 12%);
  border: 1px solid rgb(255 255 255 / 32%);
  border-radius: 999px;
}

.solid-color-fill-panel__input input {
  width: 3rem;
  height: 2.25rem;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.solid-color-fill-panel__actions {
  display: flex;
  justify-content: center;
  gap: 0.65rem;
  margin-top: 1rem;
}

.solid-color-fill-panel button {
  min-height: 2.75rem;
  padding: 0.55rem 0.9rem;
  color: inherit;
  font: inherit;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 32%);
  border-radius: 999px;
}

.solid-color-fill-panel .primary {
  color: #fff;
  background: var(--color-accent);
}
</style>
