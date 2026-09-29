<script setup lang="ts">
import AreaMaskThumbnail from './AreaMaskThumbnail.vue'

type AreaItem = Readonly<{
  id: string
  label: string
}>

defineProps<{
  area: AreaItem
  selected: boolean
  renderThumbnail: (canvas: HTMLCanvasElement, areaId: string) => void
  renderLineArt: (canvas: HTMLCanvasElement) => void
}>()

const emit = defineEmits<{
  select: [areaId: string]
}>()
</script>

<template>
  <button
    class="area-selector-item"
    :class="{ 'is-selected': selected }"
    type="button"
    :data-area-id="area.id"
    :aria-label="area.label"
    :aria-pressed="selected"
    @click="emit('select', area.id)"
  >
    <AreaMaskThumbnail
      :area-id="area.id"
      :render="renderThumbnail"
      :render-line-art="renderLineArt"
    />
  </button>
</template>

<style scoped>
.area-selector-item {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  /* min-height: 5.25rem; */
  padding: 0.35rem;
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: none;
  /* border-radius: 0.9rem; */
  opacity: 0.68;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.area-selector-item.is-selected {
  opacity: 1;
}
</style>
