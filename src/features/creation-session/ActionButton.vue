<script setup lang="ts">
import iconPhotoUrl from '@/app/assets/icon_menu_photo.svg'
import iconCameraUrl from '@/app/assets/icon_menu_camera.svg'
import iconPaletteUrl from '@/app/assets/icon_menu_palette.svg'
import { computed } from 'vue'
const props = defineProps<{
  label: string
  hideLabel?: boolean
  disabled?: boolean
  type?: 'photo' | 'camera' | 'palette'
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const iconUrl = computed(() => {
  switch (props.type) {
    case 'photo':
      return iconPhotoUrl
    case 'camera':
      return iconCameraUrl
    case 'palette':
      return iconPaletteUrl
    default:
      return iconPhotoUrl
  }
})

const buttonColorClass = computed(() => {
  switch (props.type) {
    case 'photo':
      return 'action-main-1'
    case 'camera':
      return 'action-main-2'
    case 'palette':
      return 'action-main-3'
    default:
      return 'action-main-1'
  }
})
</script>

<template>
  <button
    class="action-button iosevka-charon-mono-medium"
    :class="buttonColorClass"
    type="button"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <img
      class="action-button__icon"
      aria-hidden="true"
      :src="iconUrl"
      width="48"
      height="48"
    />
    <div v-show="!hideLabel">{{ label }}</div>
  </button>
</template>

<style scoped>
.action-button {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  align-items: center;
  height: 108px;
  aspect-ratio: 1;
  color: var(--color-white);
  cursor: pointer;
  border: 0;
  border-radius: 999px;
  touch-action: manipulation;
  font-size: 18px;
}

.action-main-1 {
  background: var(--gradient-main-1);
}

.action-main-2 {
  background: var(--gradient-main-2);
}

.action-main-3 {
  background: var(--gradient-main-3);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.action-button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
</style>
