import { describe, expect, it } from 'vitest'

import { getCameraSceneAlphas } from './scene'

describe('getCameraSceneAlphas', () => {
  it.each([
    [0, { source: 1, artwork: 0, lineArt: 1 }],
    [0.35, { source: 1, artwork: 0.35, lineArt: 1 }],
    [1, { source: 1, artwork: 1, lineArt: 1 }],
  ] as const)('live表示の比率%sを各描画面へ反映する', (blend, expected) => {
    expect(getCameraSceneAlphas(blend, true)).toEqual(expected)
  })

  it('camera停止中は現在作品だけを表示する', () => {
    expect(getCameraSceneAlphas(0, false)).toEqual({
      source: 0,
      artwork: 1,
      lineArt: 1,
    })
  })
})
