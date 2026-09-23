<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import AreaSelectorItem from './AreaSelectorItem.vue'
import { findNearestAreaId, getAreaEdgePadding } from './areaSelector'

type AreaItem = Readonly<{
  id: string
  label: string
  initialColor: string
  fillKind: 'initial' | 'camera'
}>

const props = defineProps<{
  areas: readonly AreaItem[]
  selectedAreaId: string
  label: string
  capturedLabel: string
}>()

const emit = defineEmits<{
  select: [areaId: string]
}>()

const container = ref<HTMLElement>()
let resizeObserver: ResizeObserver | undefined
let scrollTimer: number | undefined

const buttons = () =>
  Array.from(
    container.value?.querySelectorAll<HTMLElement>('[data-area-id]') ?? [],
  )

const updateEdgePadding = () => {
  const target = container.value
  const items = buttons()
  const first = items[0]
  const last = items.at(-1)
  if (!target || !first || !last) return
  target.style.setProperty(
    '--area-padding-start',
    `${String(getAreaEdgePadding(target.clientWidth, first.offsetWidth))}px`,
  )
  target.style.setProperty(
    '--area-padding-end',
    `${String(getAreaEdgePadding(target.clientWidth, last.offsetWidth))}px`,
  )
}

const selectNearest = () => {
  const target = container.value
  if (!target) return
  const bounds = target.getBoundingClientRect()
  const id = findNearestAreaId(
    bounds.left + bounds.width / 2,
    buttons().map((button) => {
      const itemBounds = button.getBoundingClientRect()
      return {
        id: button.dataset.areaId ?? '',
        center: itemBounds.left + itemBounds.width / 2,
      }
    }),
  )
  if (id && id !== props.selectedAreaId) emit('select', id)
}

const handleScroll = () => {
  if (scrollTimer !== undefined) window.clearTimeout(scrollTimer)
  scrollTimer = window.setTimeout(selectNearest, 120)
}

const centerArea = (areaId: string, behavior: ScrollBehavior = 'smooth') => {
  const target = container.value
  const item = buttons().find((button) => button.dataset.areaId === areaId)
  if (!target || !item) return
  target.scrollTo({
    left: item.offsetLeft - (target.clientWidth - item.offsetWidth) / 2,
    behavior,
  })
}

const handleItemClick = (areaId: string) => {
  centerArea(areaId)
  handleScroll()
}

watch(
  () => props.areas,
  async () => {
    await nextTick()
    updateEdgePadding()
    centerArea(props.selectedAreaId, 'auto')
  },
)

onMounted(async () => {
  await nextTick()
  updateEdgePadding()
  centerArea(props.selectedAreaId, 'auto')
  if (container.value) {
    resizeObserver = new ResizeObserver(() => {
      updateEdgePadding()
      centerArea(props.selectedAreaId, 'auto')
    })
    resizeObserver.observe(container.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (scrollTimer !== undefined) window.clearTimeout(scrollTimer)
})
</script>

<template>
  <section class="area-selector" :aria-label="label">
    <div class="area-selector__frame" aria-hidden="true" />
    <div
      ref="container"
      class="area-selector__scroller"
      @scroll.passive="handleScroll"
      @scrollend="selectNearest"
    >
      <AreaSelectorItem
        v-for="area in areas"
        :key="area.id"
        :area="area"
        :selected="selectedAreaId === area.id"
        :captured-label="capturedLabel"
        @select="handleItemClick"
      />
    </div>
  </section>
</template>

<style scoped>
.area-selector {
  position: relative;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.area-selector__frame {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 50%;
  width: 7.5rem;
  height: 100%;
  pointer-events: none;
  border: 2px solid var(--color-focus);
  border-radius: 1rem;
  box-shadow: 0 0 0 3px rgb(114 92 164 / 14%);
  transform: translateX(-50%);
}

.area-selector__scroller {
  display: flex;
  gap: 0.65rem;
  width: 100%;
  min-width: 0;
  padding: 0.35rem var(--area-padding-end, 50%);
  padding-left: var(--area-padding-start, 50%);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  scroll-snap-type: x mandatory;
}

.area-selector__scroller::-webkit-scrollbar {
  display: none;
}
</style>
