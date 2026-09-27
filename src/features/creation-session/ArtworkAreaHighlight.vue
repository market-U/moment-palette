<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
}>()

const container = ref<HTMLElement>()
const canvas = ref<HTMLCanvasElement>()
let resizeObserver: ResizeObserver | undefined

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

watch(
  () => [props.src, props.selectedAreaId],
  async () => {
    await nextTick()
    renderHighlight()
  },
)

onMounted(() => {
  renderHighlight()
  if (!container.value) return
  resizeObserver = new ResizeObserver(renderHighlight)
  resizeObserver.observe(container.value)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <div ref="container" class="artwork-area-highlight">
    <img class="artwork-area-highlight__image" :src="src" :alt="alt" />
    <canvas
      ref="canvas"
      class="artwork-area-highlight__overlay"
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
.artwork-area-highlight__overlay {
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
  pointer-events: none;
  mix-blend-mode: normal;
  animation: selected-area-blink 12s linear infinite;
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
