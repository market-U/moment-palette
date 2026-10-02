<script setup lang="ts">
const props = defineProps<{
  type: 'hide' | 'show'
  disabled?: boolean
  ariaLabel?: string
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

import icon_frame_hide from '@/app/assets/icon_frame_hide.svg'
import icon_frame_show from '@/app/assets/icon_frame_show.svg'
import { computed } from 'vue'

const icon_frame = computed(() => {
  switch (props.type) {
    case 'hide':
      return icon_frame_hide
    case 'show':
      return icon_frame_show
    default:
      return icon_frame_hide
  }
})
</script>

<template>
  <section class="frame-button">
    <button
      type="button"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="emit('click', $event)"
    >
      <img :src="icon_frame" width="48" height="48" alt="" aria-hidden="true" />
    </button>
  </section>
</template>

<style scoped>
.frame-button button {
  min-height: 2.75rem;
  padding: 0.55rem 0.9rem;
  font: inherit;
  cursor: pointer;
  border: none;
  background: transparent;
}

.frame-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.frame-button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.back-button__icon {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}
</style>
