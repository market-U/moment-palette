<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  areaId: string
  render: (canvas: HTMLCanvasElement, areaId: string) => void
}>()

const canvas = ref<HTMLCanvasElement>()

const renderThumbnail = () => {
  if (!canvas.value) return
  try {
    props.render(canvas.value, props.areaId)
  } catch {
    // サムネイルは選択の補助であり、描画不能でもbutton操作は維持する。
  }
}

watch(() => [props.areaId, props.render], renderThumbnail)
onMounted(renderThumbnail)
</script>

<template>
  <canvas
    ref="canvas"
    class="area-mask-thumbnail"
    width="128"
    height="112"
    aria-hidden="true"
  />
</template>

<style scoped>
.area-mask-thumbnail {
  width: 5.25rem;
  height: 4.5rem;
}
</style>
