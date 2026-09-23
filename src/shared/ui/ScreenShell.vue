<script setup lang="ts">
withDefaults(
  defineProps<{
    scrollable?: boolean
  }>(),
  {
    scrollable: true,
  },
)
</script>

<template>
  <main class="screen-shell">
    <header class="screen-shell__header">
      <div class="screen-shell__header-side screen-shell__header-side--left">
        <slot name="header-left" />
      </div>
      <div class="screen-shell__header-center">
        <slot name="header-center" />
      </div>
      <div class="screen-shell__header-side screen-shell__header-side--right">
        <slot name="header-right" />
      </div>
    </header>

    <div
      class="screen-shell__body"
      :class="{ 'screen-shell__body--scrollable': scrollable }"
    >
      <slot />
    </div>
  </main>
</template>

<style scoped>
.screen-shell {
  display: grid;
  grid-template-rows:
    calc(
      var(--screen-header-min-height) + var(--screen-padding-block-start) +
        env(safe-area-inset-top)
    )
    minmax(0, 1fr);
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.screen-shell__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  width: min(100%, var(--screen-header-max-width));
  min-height: var(--screen-header-min-height);
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top) + var(--screen-padding-block-start))
    calc(env(safe-area-inset-right) + var(--screen-padding-inline)) 0
    calc(env(safe-area-inset-left) + var(--screen-padding-inline));
}

.screen-shell__header-side,
.screen-shell__header-center {
  display: flex;
  align-items: center;
  min-width: 0;
}

.screen-shell__header-side--left {
  justify-content: flex-start;
}

.screen-shell__header-center {
  justify-content: center;
}

.screen-shell__header-side--right {
  justify-content: flex-end;
}

.screen-shell__body {
  width: min(100%, var(--screen-content-max-width));
  min-height: 0;
  margin: 0 auto;
  padding: 0 calc(env(safe-area-inset-right) + var(--screen-padding-inline))
    calc(env(safe-area-inset-bottom) + var(--screen-padding-block-end))
    calc(env(safe-area-inset-left) + var(--screen-padding-inline));
}

.screen-shell__body--scrollable {
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
</style>
