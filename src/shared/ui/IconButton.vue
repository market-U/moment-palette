<script setup lang="ts">
const props = defineProps<{
  type: 'hide' | 'show' | 'switch' | 'cancel' | 'check'
  size?: 'md' | 'lg' | 'sm'
  disabled?: boolean
  ariaLabel?: string
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

import icon_frame_hide from '@/app/assets/icon_frame_hide.svg'
import icon_frame_show from '@/app/assets/icon_frame_show.svg'
import icon_flip_camera from '@/app/assets/icon_flip_camera.svg'
import icon_close from '@/app/assets/icon_close.svg'
import icon_check from '@/app/assets/icon_check_circle.svg'

import { computed } from 'vue'

const iconUrl = computed(() => {
  switch (props.type) {
    case 'hide':
      return icon_frame_hide
    case 'show':
      return icon_frame_show
    case 'cancel':
      return icon_close
    case 'switch':
      return icon_flip_camera
    case 'check':
      return icon_check
    default:
      return icon_frame_hide
  }
})

const buttonImgSize = computed(() => {
  switch (props.size) {
    case 'md':
      return 48
    case 'lg':
      return 72
    case 'sm':
      return 36
    default:
      return 48
  }
})
</script>

<template>
  <section class="icon-button">
    <button
      type="button"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="emit('click', $event)"
    >
      <img
        :src="iconUrl"
        :width="buttonImgSize"
        :height="buttonImgSize"
        alt=""
        aria-hidden="true"
      />
    </button>
  </section>
</template>

<style scoped>
.icon-button button {
  min-height: 2.75rem;
  padding: 0.55rem 0.9rem;
  font: inherit;
  cursor: pointer;
  border: none;
  background: transparent;
}

.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.icon-button:focus-visible {
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
