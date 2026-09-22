import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./BackButton.vue', import.meta.url),
  'utf8',
)

describe('BackButton', () => {
  it('labelとdisabledをnative buttonへ渡す', () => {
    expect(source).toContain('label: string')
    expect(source).toContain('disabled?: boolean')
    expect(source).toContain(':disabled="disabled"')
    expect(source).toContain('{{ label }}')
  })

  it('遷移を持たずclickだけを通知する', () => {
    expect(source).toContain('click: [event: MouseEvent]')
    expect(source).toContain('@click="emit(\'click\', $event)"')
    expect(source).not.toContain('useRouter')
    expect(source).not.toContain('useCreationSession')
  })
})
