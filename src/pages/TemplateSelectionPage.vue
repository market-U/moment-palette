<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useCreationSession } from '@/features/creation-session/sessionFacade'
import LanguageSwitcher from '@/shared/ui/LanguageSwitcher.vue'

const { locale, t } = useI18n()
const router = useRouter()
const session = useCreationSession()

const state = computed(() => session.templateSelection.value)
const localized = (value: { ja: string; en: string }) =>
  locale.value === 'ja' ? value.ja : value.en

const select = async (templateId: string) => {
  if (await session.selectTemplate(templateId)) {
    await router.push({ name: 'creation' })
  }
}

const retry = async () => {
  if (await session.retryTemplate()) await router.push({ name: 'creation' })
}

const restart = async () => {
  session.resetToStart()
  await router.push({ name: 'title' })
}
</script>

<template>
  <main class="selection-page">
    <header class="selection-page__header">
      <button class="text-button" type="button" @click="restart">
        {{ t('actions.back') }}
      </button>
      <LanguageSwitcher />
    </header>

    <section class="selection-page__content" aria-labelledby="template-heading">
      <p class="eyebrow">Moment Palette</p>
      <h1 id="template-heading">{{ t('templates.heading') }}</h1>
      <p class="selection-page__lead">{{ t('templates.lead') }}</p>

      <div v-if="state.phase === 'empty'" class="state-card" role="status">
        <p>{{ t('templates.empty') }}</p>
        <button class="primary-button" type="button" @click="restart">
          {{ t('actions.checkAgain') }}
        </button>
      </div>

      <div v-else-if="state.phase === 'error'" class="state-card" role="alert">
        <p>{{ t('templates.loadFailed') }}</p>
        <div class="state-card__actions">
          <button class="primary-button" type="button" @click="retry">
            {{ t('actions.retry') }}
          </button>
          <button
            class="secondary-button"
            type="button"
            @click="session.backToTemplateList"
          >
            {{ t('actions.backToList') }}
          </button>
          <button class="text-button" type="button" @click="restart">
            {{ t('actions.startOver') }}
          </button>
        </div>
      </div>

      <ul
        v-else-if="state.phase === 'ready' || state.phase === 'preparing'"
        class="template-grid"
      >
        <li v-for="template in state.templates" :key="template.id">
          <button
            class="template-card"
            type="button"
            :disabled="state.phase === 'preparing'"
            :aria-busy="
              state.phase === 'preparing' && state.templateId === template.id
            "
            @click="select(template.id)"
          >
            <img :src="template.thumbnailUrl" :alt="localized(template.name)" />
            <span>{{ localized(template.name) }}</span>
            <small
              v-if="
                state.phase === 'preparing' && state.templateId === template.id
              "
            >
              {{ t('templates.preparing') }}
            </small>
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.selection-page {
  width: 100%;
  height: 100%;
  padding: calc(env(safe-area-inset-top) + 1rem)
    calc(env(safe-area-inset-right) + 1rem)
    calc(env(safe-area-inset-bottom) + 1.5rem)
    calc(env(safe-area-inset-left) + 1rem);
  overflow-y: auto;
  background: var(--surface-gradient);
}

.selection-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 46rem;
  margin: 0 auto;
}

.selection-page__content {
  max-width: 46rem;
  margin: clamp(2rem, 7vh, 4.5rem) auto 0;
}

.eyebrow {
  margin: 0 0 0.4rem;
  color: var(--color-accent);
  font-weight: 700;
  letter-spacing: 0.08em;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 9vw, 3.25rem);
  letter-spacing: -0.045em;
}

.selection-page__lead {
  margin: 0.75rem 0 2rem;
  color: var(--color-muted);
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 1rem;
  padding: 0;
  list-style: none;
}

.template-card {
  display: grid;
  width: 100%;
  padding: 0.75rem;
  color: var(--color-ink);
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  background: rgb(255 255 255 / 82%);
  border: 1px solid rgb(65 54 76 / 12%);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 2.5rem rgb(65 54 76 / 10%);
}

.template-card img {
  width: 100%;
  aspect-ratio: 1;
  margin-bottom: 0.75rem;
  object-fit: contain;
  background: #fff;
  border-radius: 1rem;
}

.template-card small {
  margin-top: 0.35rem;
  color: var(--color-muted);
  font-weight: 500;
}

.template-card:disabled {
  cursor: wait;
  opacity: 0.68;
}

.state-card {
  padding: 1.5rem;
  text-align: center;
  background: rgb(255 255 255 / 82%);
  border-radius: 1.5rem;
}

.state-card__actions {
  display: grid;
  gap: 0.75rem;
}

.primary-button,
.secondary-button,
.text-button {
  min-height: 2.75rem;
  padding: 0.55rem 1rem;
  cursor: pointer;
  border-radius: 999px;
}

.primary-button {
  color: white;
  background: var(--color-ink);
  border: 0;
}

.secondary-button {
  color: var(--color-ink);
  background: white;
  border: 1px solid rgb(65 54 76 / 18%);
}

.text-button {
  color: var(--color-muted);
  background: transparent;
  border: 0;
}
</style>
