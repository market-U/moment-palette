import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./AreaSelectorItem.vue', import.meta.url),
  'utf8',
)

describe('AreaSelectorItem', () => {
  it('選択状態とアクセシブルなArea名をbuttonへ反映する', () => {
    expect(source).toContain(':class="{ \'is-selected\': selected }"')
    expect(source).toContain(':aria-pressed="selected"')
    expect(source).toContain(':aria-label="area.label"')
    expect(source).toContain('<AreaMaskThumbnail')
  })

  it('補助テキストを表示せず、選択通知を提供する', () => {
    expect(source).not.toContain('initialColor')
    expect(source).not.toContain('fillKind')
    expect(source).toContain('select: [areaId: string]')
    expect(source).toContain('@click="emit(\'select\', area.id)"')
  })
})
