<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isPreviewTap, toArtworkPoint } from './previewAreaTap'

const props = defineProps<{
  src: string
  alt: string
  selectedAreaId: string
  resize: (
    canvas: HTMLCanvasElement,
    cssPixels: number,
    pixelRatio: number,
  ) => void
  render: (canvas: HTMLCanvasElement, areaId: string) => void
  renderLineArt: (canvas: HTMLCanvasElement) => void
  findAreaAt: (x: number, y: number) => string | undefined
}>()
const emit = defineEmits<{ select: [areaId: string] }>()

const container = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
const lineArtCanvas = ref<HTMLCanvasElement>()
let resizeObserver: ResizeObserver | undefined
let pointerStart: { id: number; x: number; y: number } | undefined

const beginPointer = (event: PointerEvent) => {
  pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY }
}
const completePointer = (event: PointerEvent) => {
  const start = pointerStart
  pointerStart = undefined
  if (!start || start.id !== event.pointerId || !isPreviewTap(start, event))
    return
  const target = container.value
  if (!target) return
  const point = toArtworkPoint(
    event.clientX,
    event.clientY,
    target.getBoundingClientRect(),
  )
  const areaId = props.findAreaAt(point.x, point.y)
  if (areaId) emit('select', areaId)
}

const renderHighlight = () => {
  const target = container.value
  const overlay = canvas.value
  if (!target || !overlay || !props.selectedAreaId) return
  try {
    props.resize(overlay, target.clientWidth, window.devicePixelRatio || 1)
    props.render(overlay, props.selectedAreaId)
  } catch {
    // 表示補助の失敗は作品previewやArea選択を妨げない。
  }
}

const renderLineArt = () => {
  const target = container.value
  const overlay = lineArtCanvas.value
  if (!target || !overlay) return
  try {
    props.resize(overlay, target.clientWidth, window.devicePixelRatio || 1)
    props.renderLineArt(overlay)
  } catch {
    // 表示補助の失敗は作品previewやArea選択を妨げない。
  }
}

const renderOverlays = () => {
  renderHighlight()
  renderLineArt()
}

watch(
  () => props.src,
  async () => {
    await nextTick()
    renderOverlays()
  },
)

watch(
  () => props.selectedAreaId,
  async () => {
    await nextTick()
    renderHighlight()
  },
)

onMounted(() => {
  renderOverlays()
  if (!container.value) return
  resizeObserver = new ResizeObserver(renderOverlays)
  resizeObserver.observe(container.value)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div
    ref="container"
    class="artwork-area-highlight"
    @pointerdown="beginPointer"
    @pointerup="completePointer"
    @pointercancel="pointerStart = undefined"
  >
    <img class="artwork-area-highlight__image" :src="src" :alt="alt" />
    <canvas
      ref="canvas"
      class="artwork-area-highlight__overlay"
      aria-hidden="true"
    />
    <canvas
      ref="lineArtCanvas"
      class="artwork-area-highlight__line-art"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.artwork-area-highlight {
  position: relative;
  width: min(100%, 30rem);
  aspect-ratio: 1;
  margin: 0 auto;
  overflow: hidden;
  background: #fff;
  border-radius: 1.5rem;
}

.artwork-area-highlight__image,
.artwork-area-highlight__overlay,
.artwork-area-highlight__line-art {
  display: block;
  width: 100%;
  height: 100%;
}

.artwork-area-highlight__image {
  object-fit: contain;
}

.artwork-area-highlight__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: normal;
  animation: selected-area-blink 3s linear infinite;
}

.artwork-area-highlight__line-art {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

@keyframes selected-area-blink {
  0% {
    filter: hue-rotate(0deg) brightness(1.6);
  }
  17% {
    filter: hue-rotate(120deg) brightness(0.4);
  }
  34% {
    filter: hue-rotate(240deg) brightness(1.6);
  }
  51% {
    filter: hue-rotate(360deg) brightness(0.4);
  }
  68% {
    filter: hue-rotate(480deg) brightness(1.6);
  }
  85% {
    filter: hue-rotate(600deg) brightness(0.4);
  }
  100% {
    filter: hue-rotate(720deg) brightness(1.6);
  }
}
</style>
