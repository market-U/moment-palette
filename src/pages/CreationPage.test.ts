import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./CreationPage.vue', import.meta.url),
  'utf8',
)

describe('CreationPage', () => {
  it('pageが制作sessionをテンプレート選択へ戻してから遷移し、言語切替を置かない', () => {
    expect(source).toContain(
      '<BackButton :label="t(\'actions.templates\')" @click="backToTemplates" />',
    )
    expect(source).toContain('session.returnToTemplates()\n  await router.push')
    expect(source).not.toContain('LanguageSwitcher')
  })
})
