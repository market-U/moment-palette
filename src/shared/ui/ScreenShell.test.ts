import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./ScreenShell.vue', import.meta.url),
  'utf8',
)

describe('ScreenShell', () => {
  it('左右と中央のheader slot、および本文slotを提供する', () => {
    expect(source).toContain('name="header-left"')
    expect(source).toContain('name="header-center"')
    expect(source).toContain('name="header-right"')
    expect(source).toContain('<slot />')
  })

  it('空のslotでも三列headerと任意の本文スクロールを維持する', () => {
    expect(source).toContain(
      'grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)',
    )
    expect(source).toContain("'screen-shell__body--scrollable': scrollable")
    expect(source).toContain('.screen-shell__body--scrollable')
    expect(source).toContain('overflow-y: auto')
  })
})
