import { describe, expect, it } from 'vitest'

import { getSceneAlphas } from './scene'

describe('getSceneAlphas', () => {
  it('shows only the source plane at zero', () => {
    expect(getSceneAlphas(0, true)).toEqual({
      source: 1,
      artwork: 0,
      lineArt: 1,
    })
  })

  it('covers the source plane with the artwork plane at one', () => {
    expect(getSceneAlphas(1, true)).toEqual({
      source: 1,
      artwork: 1,
      lineArt: 1,
    })
  })

  it('keeps the source opaque and overlays artwork by the blend ratio', () => {
    expect(getSceneAlphas(0.35, true)).toEqual({
      source: 1,
      artwork: 0.35,
      lineArt: 1,
    })
  })

  it('shows artwork when the camera is inactive', () => {
    expect(getSceneAlphas(0, false)).toEqual({
      source: 0,
      artwork: 1,
      lineArt: 1,
    })
  })
})
