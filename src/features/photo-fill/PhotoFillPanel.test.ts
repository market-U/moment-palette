import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./PhotoFillPanel.vue', import.meta.url),
  'utf8',
)

describe('PhotoFillPanel', () => {
  it('写真操作でF/S由来のArea制約と描画集約を利用する', () => {
    expect(source).toContain('createLooseTransformPolicy(state.areaBounds)')
    expect(source).toContain('new FrameRenderScheduler(')
    expect(source).toContain('requestRender')
  })
})
