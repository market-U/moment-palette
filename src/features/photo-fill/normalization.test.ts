import { describe, expect, it } from 'vitest'

import {
  calculateNormalizedSize,
  photoNormalizationLimit,
} from './normalization'

describe('calculateNormalizedSize', () => {
  it('長辺4096pxと12MPの厳しい方へ縮小する', () => {
    expect(
      calculateNormalizedSize(
        { width: 4000, height: 4000 },
        photoNormalizationLimit,
      ),
    ).toEqual({ width: 3464, height: 3464 })
  })

  it('小さい画像は拡大しない', () => {
    expect(
      calculateNormalizedSize(
        { width: 1600, height: 900 },
        photoNormalizationLimit,
      ),
    ).toEqual({ width: 1600, height: 900 })
  })

  it('0寸法を拒否する', () => {
    expect(() =>
      calculateNormalizedSize({ width: 0, height: 1 }, photoNormalizationLimit),
    ).toThrow(RangeError)
  })
})
