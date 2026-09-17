<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

type SupportedLocale = 'ja' | 'en'

const setLocale = (nextLocale: SupportedLocale) => {
  locale.value = nextLocale
}
</script>

<template>
  <main class="title-page">
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

    <section class="title-page__hero" aria-labelledby="title-heading">
      <div class="title-page__mark" aria-hidden="true"><span /></div>
      <h1 id="title-heading">{{ t('title.name') }}</h1>
      <button class="title-page__start" type="button" disabled>
        {{ t('title.start') }}
      </button>
    </section>
  </main>
</template>

<style scoped>
.title-page {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: 100%;
  height: 100%;
  padding: calc(env(safe-area-inset-top) + clamp(1rem, 4vw, 1.5rem))
    calc(env(safe-area-inset-right) + clamp(1rem, 6vw, 2rem))
    calc(env(safe-area-inset-bottom) + clamp(1.25rem, 5vw, 2rem))
    calc(env(safe-area-inset-left) + clamp(1rem, 6vw, 2rem));
  overflow: hidden;
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

.language-switcher {
  z-index: 1;
  display: flex;
  justify-self: end;
  padding: 0.25rem;
  background: rgb(255 255 255 / 68%);
  border: 1px solid rgb(65 54 76 / 12%);
  border-radius: 999px;
  box-shadow: 0 0.5rem 1.5rem rgb(65 54 76 / 8%);
  backdrop-filter: blur(0.75rem);
}

.language-switcher button {
  min-height: 2.5rem;
  padding: 0.5rem 0.85rem;
  color: #6e6575;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
  touch-action: manipulation;
}

.language-switcher button[aria-pressed='true'] {
  color: #352c3c;
  background: #fff;
  box-shadow: 0 0.2rem 0.8rem rgb(65 54 76 / 12%);
}

.language-switcher button:focus-visible,
.title-page__start:focus-visible {
  outline: 3px solid #725ca4;
  outline-offset: 3px;
}

.title-page__hero {
  z-index: 1;
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
  .language-switcher button,
  .title-page__start {
    transition:
      color 160ms ease,
      background-color 160ms ease,
      box-shadow 160ms ease,
      transform 160ms ease;
  }

  .language-switcher button:active:not([aria-pressed='true']) {
    transform: scale(0.96);
  }
}
</style>
