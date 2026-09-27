import { describe, expect, it } from 'vitest'

import { isPreviewTap, toArtworkPoint } from './previewAreaTap'

describe('preview area tap', () => {
  it('CSS表示座標をArtwork座標へ変換する', () => {
    expect(
      toArtworkPoint(150, 250, { left: 50, top: 50, width: 200, height: 400 }),
    ).toEqual({ x: 540, y: 540 })
    expect(
      toArtworkPoint(50, 50, { left: 50, top: 50, width: 200, height: 200 }),
    ).toEqual({ x: 0, y: 0 })
  })

  it('8 CSS px以下の移動だけをtapとして扱う', () => {
    expect(isPreviewTap({ x: 0, y: 0 }, { x: 8, y: 0 })).toBe(true)
    expect(isPreviewTap({ x: 0, y: 0 }, { x: 9, y: 0 })).toBe(false)
  })
})
