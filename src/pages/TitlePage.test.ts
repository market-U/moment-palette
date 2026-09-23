import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('./TitlePage.vue', import.meta.url), 'utf8')

describe('TitlePage', () => {
  it('共通shellの右header slotにだけ言語切替を配置する', () => {
    expect(source).toContain(
      '<ScreenShell class="title-page" :scrollable="false">',
    )
    expect(source).toContain('<template #header-right>')
    expect(source).toContain('<LanguageSwitcher class="language-switcher" />')
  })
})
