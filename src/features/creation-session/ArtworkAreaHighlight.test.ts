import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./ArtworkAreaHighlight.vue', import.meta.url),
  'utf8',
)

describe('ArtworkAreaHighlight', () => {
  it('mask済みCanvasのopacityだけをCSSで点滅させる', () => {
    expect(source).toContain('animation: selected-area-blink')
    expect(source).toContain('@keyframes selected-area-blink')
    expect(source).toContain('opacity: 0.28')
    expect(source).toContain('opacity: 0.78')
  })

  it('動きを減らす設定ではCSS animationを停止する', () => {
    expect(source).toContain('@media (prefers-reduced-motion: reduce)')
    expect(source).toContain('animation: none')
    expect(source).not.toContain('requestAnimationFrame')
    expect(source).not.toContain('setInterval')
  })
})
