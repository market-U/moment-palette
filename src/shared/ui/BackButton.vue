<script setup lang="ts">
defineProps<{
  label: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    class="back-button"
    type="button"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <svg
      class="back-button__icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      focusable="false"
    >
      <path d="m14.5 5-7 7 7 7" />
    </svg>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.back-button {
  display: inline-flex;
  gap: 0.3rem;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.55rem 1rem 0.55rem 0.75rem;
  color: var(--color-muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
  touch-action: manipulation;
}

.back-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.back-button:focus-visible {
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
