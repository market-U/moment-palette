import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./AreaSelectorItem.vue', import.meta.url),
  'utf8',
)

describe('AreaSelectorItem', () => {
  it('選択状態とAreaの表示情報をbuttonへ反映する', () => {
    expect(source).toContain(':class="{ \'is-selected\': selected }"')
    expect(source).toContain(':aria-pressed="selected"')
    expect(source).toContain('backgroundColor: area.initialColor')
    expect(source).toContain('{{ area.label }}')
  })

  it('単色を含む設定済み表示と選択通知を提供する', () => {
    expect(source).toContain('v-if="area.fillKind !== \'initial\'"')
    expect(source).toContain('{{ capturedLabel }}')
    expect(source).toContain('select: [areaId: string]')
    expect(source).toContain('@click="emit(\'select\', area.id)"')
  })
})
