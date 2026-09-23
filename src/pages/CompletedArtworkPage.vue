<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { createCompletedArtworkShareText } from '@/features/completed-artwork/sharePayload'
import { useCreationSession } from '@/features/creation-session/sessionFacade'
import BackButton from '@/shared/ui/BackButton.vue'
import ScreenShell from '@/shared/ui/ScreenShell.vue'

const { locale, t } = useI18n()
const router = useRouter()
const session = useCreationSession()
const completed = computed(() => session.completedArtwork.value)

const shareCopy = computed(() => ({
  message:
    locale.value === 'ja'
      ? 'Moment Paletteでつくった作品です。'
      : 'I made this with Moment Palette.',
  hashtag: '#MomentPalette',
  url: new URL(import.meta.env.BASE_URL, window.location.origin).toString(),
}))
const shareText = computed(() =>
  createCompletedArtworkShareText(shareCopy.value),
)

const returnToCreation = async () => {
  await router.push({ name: 'creation' })
}

const startOver = async () => {
  session.resetToStart()
  await router.push({ name: 'title' })
}

const share = async () => {
  await session.shareCompletedArtwork(shareCopy.value)
}

const copyShareText = async () => {
  await session.copyCompletedArtworkShareText(shareCopy.value)
}

const shareMessage = computed(() => {
  if (completed.value.phase !== 'ready') return ''
  if (completed.value.sharing) return t('completed.sharing')
  switch (completed.value.shareOutcome?.kind) {
    case 'handed-off':
      return t('completed.shared')
    case 'cancelled':
      return t('completed.cancelled')
    case 'unsupported':
      return t('completed.unsupported')
    case 'failed':
      return t('completed.failed')
    default:
      return ''
  }
})

const copyMessage = computed(() => {
  if (completed.value.phase !== 'ready') return ''
  return completed.value.copyOutcome?.kind === 'copied'
    ? t('completed.copied')
    : completed.value.copyOutcome
      ? t('completed.copyFallback')
      : ''
})
</script>

<template>
  <ScreenShell v-if="completed.phase === 'ready'" class="completed-page">
    <template #header-left>
      <BackButton
        :label="t('completed.backToCreation')"
        @click="returnToCreation"
      />
    </template>

    <section
      class="completed-page__content"
      aria-labelledby="completed-heading"
    >
      <p class="eyebrow">{{ t('completed.eyebrow') }}</p>
      <h1 id="completed-heading">{{ t('completed.heading') }}</h1>
      <img
        class="completed-image"
        :src="completed.objectUrl"
        :width="completed.width"
        :height="completed.height"
        :alt="t('completed.imageAlt')"
      />
      <p class="completed-page__hint">{{ t('completed.longPress') }}</p>
      <button
        class="share-action"
        type="button"
        :disabled="completed.sharing"
        @click="share"
      >
        {{ t('completed.share') }}
      </button>
      <p v-if="shareMessage" class="completed-page__status" role="status">
        {{ shareMessage }}
      </p>

      <section class="share-copy" :aria-label="t('completed.shareText')">
        <div class="share-copy__heading">
          <h2>{{ t('completed.shareText') }}</h2>
          <button type="button" @click="copyShareText">
            {{ t('completed.copyText') }}
          </button>
        </div>
        <textarea
          :value="shareText"
          readonly
          rows="4"
          :aria-label="t('completed.shareText')"
        />
        <p v-if="copyMessage" role="status">{{ copyMessage }}</p>
      </section>
      <button class="start-over" type="button" @click="startOver">
        {{ t('completed.startOver') }}
      </button>
    </section>
  </ScreenShell>
</template>

<style scoped>
.completed-page {
  --screen-content-max-width: 36rem;
}

.completed-page__content {
  display: grid;
  margin: 1.5rem auto 0;
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

.completed-image {
  width: min(100%, 30rem);
  height: auto;
  margin: 0 auto;
  background: #fff;
  border-radius: 1.5rem;
}

.completed-page__hint,
.completed-page__status,
.share-copy p {
  color: var(--color-muted);
}

.share-action {
  justify-self: center;
  min-width: min(100%, 18rem);
  min-height: 3.5rem;
  padding: 0.7rem 1.25rem;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  background: var(--color-accent);
  border: 0;
  border-radius: 999px;
}

.share-action:disabled {
  cursor: wait;
  opacity: 0.65;
}

.share-copy {
  display: grid;
  gap: 0.5rem;
  margin-top: 1.5rem;
  text-align: left;
}

.share-copy__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.share-copy h2 {
  margin: 0;
  font-size: 1rem;
}

.share-copy button,
.start-over {
  min-height: 2.75rem;
  padding: 0.55rem 1rem;
  color: var(--color-muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
}

.share-copy textarea {
  width: 100%;
  padding: 0.75rem;
  font: inherit;
  color: var(--color-ink);
  resize: vertical;
  background: #fff;
  border: 1px solid rgb(54 45 59 / 18%);
  border-radius: 0.75rem;
}

.start-over {
  justify-self: center;
  margin-top: 1rem;
}
</style>
