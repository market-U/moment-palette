import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./ArtworkAreaHighlight.vue', import.meta.url),
  'utf8',
)

describe('ArtworkAreaHighlight', () => {
  it('mask済みCanvasをCSSで点滅させる', () => {
    expect(source).toContain('animation: selected-area-blink')
    expect(source).toContain('@keyframes selected-area-blink')
  })
})
