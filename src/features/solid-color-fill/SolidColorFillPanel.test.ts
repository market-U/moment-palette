import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./SolidColorFillPanel.vue', import.meta.url),
  'utf8',
)

describe('SolidColorFillPanel', () => {
  it('標準color input、全体preview、反映とキャンセルを提供する', () => {
    expect(source).toContain('type="color"')
    expect(source).toContain(':value="editing.color"')
    expect(source).toContain('@input="changeColor"')
    expect(source).toContain('class="solid-color-fill-panel__preview"')
    expect(source).toContain('@click="cancel"')
    expect(source).toContain('@click="apply"')
    expect(source).not.toContain('type="range"')
  })
})
