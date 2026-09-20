import { describe, expect, it } from 'vitest'

import { calculateNormalizedSize, normalizationLimits } from './normalization'

describe('calculateNormalizedSize', () => {
  it.each([
    [
      { width: 1600, height: 900 },
      { width: 1600, height: 900 },
    ],
    [
      { width: 900, height: 1600 },
      { width: 900, height: 1600 },
    ],
    [
      { width: 2000, height: 2000 },
      { width: 2000, height: 2000 },
    ],
    [
      { width: 8192, height: 2048 },
      { width: 4096, height: 1024 },
    ],
    [
      { width: 4000, height: 4000 },
      { width: 3464, height: 3464 },
    ],
    [
      { width: 8000, height: 6000 },
      { width: 4000, height: 3000 },
    ],
  ])('4096px・12MP候補: %o → %o', (source, expected) => {
    expect(
      calculateNormalizedSize(source, normalizationLimits.quality),
    ).toEqual(expected)
  })

  it.each([
    [
      { width: 4320, height: 2160 },
      { width: 2160, height: 1080 },
    ],
    [
      { width: 1080, height: 2160 },
      { width: 1080, height: 2160 },
    ],
  ])('2160px候補: %o → %o', (source, expected) => {
    expect(calculateNormalizedSize(source, normalizationLimits.memory)).toEqual(
      expected,
    )
  })

  it('0寸法を拒否する', () => {
    expect(() =>
      calculateNormalizedSize(
        { width: 0, height: 100 },
        normalizationLimits.quality,
      ),
    ).toThrow(RangeError)
  })
})
