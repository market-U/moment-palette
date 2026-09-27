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

  it('斜線より前面の独立したCanvasへ線画を描画する', () => {
    expect(source).toContain('class="artwork-area-highlight__line-art"')
    expect(source).toContain('z-index: 1')
    expect(source).toContain('z-index: 2')
    expect(source.indexOf('artwork-area-highlight__overlay')).toBeLessThan(
      source.indexOf('artwork-area-highlight__line-art'),
    )
    expect(source).toContain('props.renderLineArt(overlay)')
  })

  it('pointer操作でhit testしたAreaを選択イベントとして通知する', () => {
    expect(source).toContain('@pointerdown="beginPointer"')
    expect(source).toContain('@pointerup="completePointer"')
    expect(source).toContain('@pointercancel="pointerStart = undefined"')
    expect(source).toContain('props.findAreaAt(point.x, point.y)')
    expect(source).toContain("emit('select', areaId)")
  })
})
