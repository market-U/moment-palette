import { describe, expect, it } from 'vitest'

import { selectInitialLocale } from './selectInitialLocale'

describe('selectInitialLocale', () => {
  it('CI失敗時にデプロイしないことを検証する', () => {
    expect(true).toBe(false)
  })

  it.each([
    ['ja', 'ja'],
    ['ja-JP', 'ja'],
    ['JA-jp', 'ja'],
  ] as const)('%sなら日本語を選択する', (preferredLanguage, expected) => {
    expect(selectInitialLocale(preferredLanguage)).toBe(expected)
  })

  it.each([
    ['en', 'en'],
    ['en-US', 'en'],
    ['fr-FR', 'en'],
  ] as const)('%sなら英語を選択する', (preferredLanguage, expected) => {
    expect(selectInitialLocale(preferredLanguage)).toBe(expected)
  })
})
