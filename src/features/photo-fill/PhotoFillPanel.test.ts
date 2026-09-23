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

  it('OS picker表示中はdialogを出さず、写真調整のキャンセル操作を一つにする', () => {
    expect(source).toContain('@cancel="cancel"')
    expect(source).toContain(
      "v-if=\"state.phase !== 'closed' && state.phase !== 'selecting'\"",
    )
    expect(source).toContain('v-if="state.phase === \'decoding\'"')
    expect(source).not.toContain(
      "state.phase === 'selecting' || state.phase === 'decoding'",
    )
    const editingMarkup = source.slice(
      source.indexOf('<div v-else-if="editing"'),
      source.indexOf('</section>'),
    )
    expect(editingMarkup.match(/@click="cancel"/g)).toHaveLength(1)
  })
})
