import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./CompletedArtworkPage.vue', import.meta.url),
  'utf8',
)

describe('CompletedArtworkPage', () => {
  it('通常の完成画像、共有文fallback、制作へ戻る操作を提供する', () => {
    expect(source).toContain('<img\n        class="completed-image"')
    expect(source).toContain('<textarea')
    expect(source).toContain('readonly')
    expect(source).toContain("router.push({ name: 'creation' })")
    expect(source).toContain('session.shareCompletedArtwork(shareCopy.value)')
  })
})
