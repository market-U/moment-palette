<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useCreationSession } from '@/features/creation-session/sessionFacade'
import LanguageSwitcher from '@/shared/ui/LanguageSwitcher.vue'

const { locale, t } = useI18n()
const router = useRouter()
const session = useCreationSession()
const creation = computed(() => session.activeCreation.value)
const selectedAreaId = ref('')

// Sessionが切り替わった場合も、存在しない領域を選択状態に残さない。
watchEffect(() => {
  const areas = creation.value?.areas ?? []
  if (!areas.some((area) => area.id === selectedAreaId.value)) {
    selectedAreaId.value = areas[0]?.id ?? ''
  }
})

const localized = (value: { ja: string; en: string }) =>
  locale.value === 'ja' ? value.ja : value.en

const backToTemplates = async () => {
  session.returnToTemplates()
  await router.push({ name: 'template-selection' })
}

const startOver = async () => {
  session.resetToStart()
  await router.push({ name: 'title' })
}
</script>

<template>
  <main v-if="creation" class="creation-page">
    <header class="creation-page__header">
      <button class="text-button" type="button" @click="backToTemplates">
        {{ t('actions.templates') }}
      </button>
      <LanguageSwitcher />
    </header>

    <section class="creation-page__content" aria-labelledby="creation-heading">
      <div class="creation-page__copy">
        <p class="eyebrow">{{ t('creation.eyebrow') }}</p>
        <h1 id="creation-heading">{{ localized(creation.templateName) }}</h1>
      </div>

      <img
        class="artwork-preview"
        :src="creation.previewUrl"
        :alt="
          t('creation.previewAlt', { name: localized(creation.templateName) })
        "
      />

      <section class="area-panel" :aria-label="t('creation.areas')">
        <p>{{ t('creation.chooseArea') }}</p>
        <div class="area-list">
          <button
            v-for="area in creation.areas"
            :key="area.id"
            type="button"
            :aria-pressed="selectedAreaId === area.id"
            @click="selectedAreaId = area.id"
          >
            <span
              class="area-swatch"
              :style="{ backgroundColor: area.initialColor }"
            />
            {{ localized(area.label) }}
          </button>
        </div>
      </section>

      <p class="creation-page__next">{{ t('creation.nextChanges') }}</p>
      <button class="start-over" type="button" @click="startOver">
        {{ t('actions.startOver') }}
      </button>
    </section>
  </main>
</template>

<style scoped>
.creation-page {
  width: 100%;
  height: 100%;
  padding: calc(env(safe-area-inset-top) + 0.75rem)
    calc(env(safe-area-inset-right) + 1rem)
    calc(env(safe-area-inset-bottom) + 1.25rem)
    calc(env(safe-area-inset-left) + 1rem);
  overflow-y: auto;
  background: var(--surface-gradient);
}

.creation-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 36rem;
  margin: 0 auto;
}

.creation-page__content {
  display: grid;
  max-width: 36rem;
  margin: 1.5rem auto 0;
}

.creation-page__copy {
  text-align: center;
}

.eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-weight: 700;
}

h1 {
  margin: 0.25rem 0 1rem;
  font-size: clamp(1.75rem, 8vw, 2.75rem);
}

.artwork-preview {
  width: min(100%, 30rem);
  aspect-ratio: 1;
  margin: 0 auto;
  object-fit: contain;
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgb(65 54 76 / 14%);
}

.area-panel {
  margin-top: 1.25rem;
}

.area-panel > p {
  margin: 0 0 0.75rem;
  color: var(--color-muted);
  text-align: center;
}

.area-list {
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0.35rem;
  overflow-x: auto;
}

.area-list button {
  display: flex;
  flex: 0 0 auto;
  gap: 0.45rem;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.5rem 0.8rem;
  color: var(--color-ink);
  cursor: pointer;
  background: rgb(255 255 255 / 70%);
  border: 1px solid rgb(65 54 76 / 14%);
  border-radius: 999px;
}

.area-list button[aria-pressed='true'] {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 2px rgb(114 92 164 / 18%);
}

.area-swatch {
  width: 1.25rem;
  aspect-ratio: 1;
  border: 1px solid rgb(65 54 76 / 16%);
  border-radius: 50%;
}

.creation-page__next {
  margin: 1.25rem 0 0;
  color: var(--color-muted);
  text-align: center;
}

.text-button,
.start-over {
  min-height: 2.75rem;
  padding: 0.55rem 1rem;
  color: var(--color-muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
}

.start-over {
  justify-self: center;
  margin-top: 0.5rem;
}
</style>
