<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  areaId: string
  render: (canvas: HTMLCanvasElement, areaId: string) => void
  renderLineArt: (canvas: HTMLCanvasElement) => void
}>()

const canvas = ref<HTMLCanvasElement>()
const lineArtCanvas = ref<HTMLCanvasElement>()

const renderThumbnail = () => {
  if (!canvas.value || !lineArtCanvas.value) return
  try {
    props.render(canvas.value, props.areaId)
    props.renderLineArt(lineArtCanvas.value)
  } catch {
    // サムネイルは選択の補助であり、描画不能でもbutton操作は維持する。
  }
}

watch(() => [props.areaId, props.render], renderThumbnail)
onMounted(renderThumbnail)
</script>

<template>
  <section class="section-mask-thumbnail">
    <canvas
      ref="canvas"
      class="area-mask-thumbnail"
      width="112"
      height="112"
      aria-hidden="true"
    />
    <canvas
      ref="lineArtCanvas"
      class="area-mask-thumbnail"
      width="112"
      height="112"
      aria-hidden="true"
    />
  </section>
</template>

<style scoped>
.section-mask-thumbnail {
  position: relative;
  width: 4.5rem;
  height: 4.5rem;
}
.area-mask-thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
