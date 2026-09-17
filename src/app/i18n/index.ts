import { createI18n } from 'vue-i18n'

import { en } from '@/app/i18n/messages/en'
import { ja } from '@/app/i18n/messages/ja'
import { selectInitialLocale } from '@/app/i18n/selectInitialLocale'

const messages = {
  en,
  ja,
}

export const createAppI18n = (preferredLanguage: string) =>
  createI18n({
    legacy: false,
    locale: selectInitialLocale(preferredLanguage),
    fallbackLocale: 'en',
    messages,
  })
