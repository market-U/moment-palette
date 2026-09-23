<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useCreationSession } from '@/features/creation-session/sessionFacade'
import LanguageSwitcher from '@/shared/ui/LanguageSwitcher.vue'
import ScreenShell from '@/shared/ui/ScreenShell.vue'

const { t } = useI18n()
const router = useRouter()
const session = useCreationSession()

const handleStart = async () => {
  if (await session.start()) await router.push({ name: 'template-selection' })
}
</script>

<template>
  <ScreenShell class="title-page" :scrollable="false">
    <template #header-right>
      <LanguageSwitcher class="language-switcher" />
    </template>

    <section class="title-page__hero" aria-labelledby="title-heading">
      <div class="title-page__mark" aria-hidden="true"><span /></div>
      <h1 id="title-heading">{{ t('title.name') }}</h1>
      <p class="title-page__version">v{{ session.appVersion }}</p>
      <button
        class="title-page__start"
        type="button"
        :disabled="session.startState.value.phase === 'checking'"
        @click="handleStart"
      >
        {{
          session.startState.value.phase === 'checking'
            ? t('title.checking')
            : t('title.start')
        }}
      </button>
      <div
        v-if="session.startState.value.phase === 'reload-required'"
        class="title-page__notice"
        role="alert"
      >
        <p>{{ t('title.reloadRequired') }}</p>
        <button type="button" @click="session.reload">
          {{ t('actions.reload') }}
        </button>
      </div>
      <div
        v-else-if="session.startState.value.phase === 'retryable-error'"
        class="title-page__notice"
        role="alert"
      >
        <p>{{ t('title.startFailed') }}</p>
        <button type="button" @click="handleStart">
          {{ t('actions.retry') }}
        </button>
      </div>
    </section>
  </ScreenShell>
</template>

<style scoped>
.title-page {
  position: relative;
  background:
    radial-gradient(circle at 10% 12%, rgb(250 191 104 / 38%), transparent 30%),
    radial-gradient(circle at 90% 78%, rgb(117 198 188 / 32%), transparent 34%),
    linear-gradient(155deg, #fffaf0 0%, #f8eef2 50%, #f1effa 100%);
}

.title-page::before,
.title-page::after {
  position: absolute;
  z-index: 0;
  width: min(42vw, 13rem);
  aspect-ratio: 1;
  content: '';
  border: 1px solid rgb(65 54 76 / 10%);
  border-radius: 50%;
}

.title-page::before {
  top: 18%;
  left: -24vw;
}

.title-page::after {
  right: -20vw;
  bottom: 8%;
}

.title-page :deep(.screen-shell__header),
.title-page :deep(.screen-shell__body) {
  position: relative;
  z-index: 1;
}

.title-page :deep(.screen-shell__body) {
  display: grid;
  align-items: center;
  overflow: hidden;
}

.language-switcher {
  z-index: 1;
}

.title-page__start:focus-visible {
  outline: 3px solid #725ca4;
  outline-offset: 3px;
}

.title-page__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
  width: min(100%, 24rem);
  min-height: 0;
  margin: 0 auto;
  transform: translateY(clamp(-1.5rem, -3dvh, -0.5rem));
}

.title-page__mark {
  position: relative;
  width: clamp(6.5rem, 32vmin, 10rem);
  aspect-ratio: 1;
  margin-bottom: clamp(1.25rem, 4dvh, 2rem);
  overflow: hidden;
  background: linear-gradient(
    145deg,
    #ef8aa5 0 46%,
    #f7c862 46% 70%,
    #78c8bb 70%
  );
  border-radius: 42% 58% 62% 38% / 45% 38% 62% 55%;
  box-shadow: 0 1.25rem 3rem rgb(83 63 91 / 18%);
  transform: rotate(-7deg);
}

.title-page__mark::before,
.title-page__mark::after,
.title-page__mark span {
  position: absolute;
  content: '';
  border-radius: 50%;
}

.title-page__mark::before {
  top: 15%;
  left: 12%;
  width: 42%;
  aspect-ratio: 1;
  background: rgb(255 255 255 / 72%);
}

.title-page__mark::after {
  right: 8%;
  bottom: 9%;
  width: 34%;
  aspect-ratio: 1;
  background: #9c8bd9;
}

.title-page__mark span {
  top: 42%;
  left: 36%;
  width: 22%;
  aspect-ratio: 1;
  background: #443a50;
}

h1 {
  max-width: 8ch;
  margin: 0;
  color: #352c3c;
  font-size: clamp(2.75rem, 14vw, 4.75rem);
  font-weight: 750;
  line-height: 0.92;
  letter-spacing: -0.07em;
  text-align: center;
  text-wrap: balance;
}

.title-page__start {
  width: min(100%, 18rem);
  min-height: 3.5rem;
  margin-top: clamp(2rem, 7dvh, 3.75rem);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: #443a50;
  border: 0;
  border-radius: 999px;
  box-shadow: 0 0.75rem 1.75rem rgb(68 58 80 / 20%);
}

.title-page__version {
  margin: 0.75rem 0 0;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.title-page__notice {
  width: min(100%, 18rem);
  margin-top: 1rem;
  color: var(--color-ink);
  text-align: center;
}

.title-page__notice p {
  margin: 0 0 0.75rem;
}

.title-page__notice button {
  min-height: 2.75rem;
  padding: 0.55rem 1rem;
  color: var(--color-ink);
  cursor: pointer;
  background: rgb(255 255 255 / 82%);
  border: 1px solid rgb(65 54 76 / 18%);
  border-radius: 999px;
}

.title-page__start:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

@media (max-height: 32rem) {
  .title-page__mark {
    width: 5.5rem;
    margin-bottom: 0.75rem;
  }

  h1 {
    font-size: 2.5rem;
  }

  .title-page__start {
    min-height: 3rem;
    margin-top: 1.25rem;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .title-page__start {
    transition:
      color 160ms ease,
      background-color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
  }
}
</style>
