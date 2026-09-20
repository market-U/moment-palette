import { describe, expect, it } from 'vitest'

import { getPhotoSceneAlphas } from './photoScene'

describe('getPhotoSceneAlphas', () => {
  it.each([
    [0, { source: 1, artwork: 0, lineArt: 1 }],
    [0.5, { source: 1, artwork: 0.5, lineArt: 1 }],
    [1, { source: 1, artwork: 1, lineArt: 1 }],
  ])('写真ありの表示比率 %f', (blend, expected) => {
    expect(getPhotoSceneAlphas(blend, true)).toEqual(expected)
  })

  it('写真なしでは作品を不透明に表示する', () => {
    expect(getPhotoSceneAlphas(0, false)).toEqual({
      source: 0,
      artwork: 1,
      lineArt: 1,
    })
  })
})
