<script setup lang="ts">
type AreaItem = Readonly<{
  id: string
  label: string
  initialColor: string
  fillKind: 'initial' | 'camera' | 'photo'
}>

defineProps<{
  area: AreaItem
  selected: boolean
  capturedLabel: string
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
    :aria-pressed="selected"
    @click="emit('select', area.id)"
  >
    <span
      class="area-selector-item__swatch"
      :style="{ backgroundColor: area.initialColor }"
    />
    <span>{{ area.label }}</span>
    <small v-if="area.fillKind === 'camera'">{{ capturedLabel }}</small>
    <small v-else-if="area.fillKind === 'photo'">{{ capturedLabel }}</small>
  </button>
</template>

<style scoped>
.area-selector-item {
  display: grid;
  flex: 0 0 7.5rem;
  grid-template-columns: auto 1fr;
  gap: 0.15rem 0.45rem;
  align-items: center;
  min-height: 4rem;
  padding: 0.55rem 0.7rem;
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  background: rgb(255 255 255 / 74%);
  border: 1px solid rgb(65 54 76 / 14%);
  border-radius: 0.9rem;
  opacity: 0.68;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.area-selector-item.is-selected {
  opacity: 1;
}

.area-selector-item small {
  grid-column: 2;
  color: var(--color-accent);
  font-size: 0.68rem;
}

.area-selector-item__swatch {
  grid-row: 1 / span 2;
  width: 1.35rem;
  aspect-ratio: 1;
  border: 1px solid rgb(65 54 76 / 16%);
  border-radius: 50%;
}
</style>
