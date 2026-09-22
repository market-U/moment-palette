<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

type SupportedLocale = 'ja' | 'en'

const setLocale = (nextLocale: SupportedLocale) => {
  locale.value = nextLocale
}
</script>

<template>
  <div
    class="language-switcher"
    role="group"
    :aria-label="t('title.language.label')"
  >
    <button
      type="button"
      lang="ja"
      :aria-pressed="locale === 'ja'"
      @click="setLocale('ja')"
    >
      {{ t('title.language.ja') }}
    </button>
    <button
      type="button"
      lang="en"
      :aria-pressed="locale === 'en'"
      @click="setLocale('en')"
    >
      {{ t('title.language.en') }}
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  display: flex;
  padding: 0.25rem;
  background: rgb(255 255 255 / 76%);
  border: 1px solid rgb(65 54 76 / 12%);
  border-radius: 999px;
  box-shadow: 0 0.5rem 1.5rem rgb(65 54 76 / 8%);
  backdrop-filter: blur(0.75rem);
}

button {
  min-height: 2.5rem;
  padding: 0.5rem 0.85rem;
  color: var(--color-muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
  touch-action: manipulation;
}

button[aria-pressed='true'] {
  color: var(--color-ink);
  background: #fff;
  box-shadow: 0 0.2rem 0.8rem rgb(65 54 76 / 12%);
}

button:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
</style>
