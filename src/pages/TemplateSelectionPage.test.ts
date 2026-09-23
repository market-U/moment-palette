import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./TemplateSelectionPage.vue', import.meta.url),
  'utf8',
)

describe('TemplateSelectionPage', () => {
  it('pageが開始状態をリセットしてから戻り、言語切替を置かない', () => {
    expect(source).toContain(
      '<BackButton :label="t(\'actions.back\')" @click="restart" />',
    )
    expect(source).toContain('session.resetToStart()\n  await router.push')
    expect(source).not.toContain('LanguageSwitcher')
  })
})
