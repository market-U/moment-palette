import { describe, expect, it } from 'vitest'

import {
  applyPan,
  applyPinch,
  clientPointToLogical,
  constrainTransform,
  createCenteredCoverTransform,
  getCoverScale,
  getScaleBounds,
} from './mediaTransform'

const artwork = { width: 1080, height: 1080 }

describe('mediaTransform', () => {
  it.each([
    [{ width: 1920, height: 1080 }, 1],
    [{ width: 1080, height: 1920 }, 1],
    [{ width: 640, height: 480 }, 2.25],
  ])('入力 %o で出力全体を覆う', (source, expectedScale) => {
    expect(getCoverScale(source, artwork)).toBe(expectedScale)

    const transform = createCenteredCoverTransform(source, artwork)
    expect(transform.scale).toBe(expectedScale)
    expect(transform.offsetX).toBeLessThanOrEqual(0)
    expect(transform.offsetY).toBeLessThanOrEqual(0)
    expect(
      transform.offsetX + source.width * transform.scale,
    ).toBeGreaterThanOrEqual(artwork.width)
    expect(
      transform.offsetY + source.height * transform.scale,
    ).toBeGreaterThanOrEqual(artwork.height)
  })

  it('空の入力寸法を拒否する', () => {
    expect(() => getCoverScale({ width: 0, height: 1080 }, artwork)).toThrow(
      RangeError,
    )
  })

  it('出力に余白が出ないよう倍率と位置を制限する', () => {
    const source = { width: 1920, height: 1080 }
    const constrained = constrainTransform(
      { scale: 20, offsetX: 4000, offsetY: -99999 },
      source,
      artwork,
    )

    expect(constrained.scale).toBe(getScaleBounds(source, artwork).maximum)
    expect(constrained.offsetX).toBe(0)
    expect(constrained.offsetY).toBe(
      artwork.height - source.height * constrained.scale,
    )
  })

  it('パンしても空の画素を露出しない', () => {
    const source = { width: 1920, height: 1080 }
    const initial = createCenteredCoverTransform(source, artwork)

    expect(applyPan(initial, { x: 9999, y: 9999 }, source, artwork)).toEqual({
      ...initial,
      offsetX: 0,
    })
    expect(applyPan(initial, { x: -9999, y: -9999 }, source, artwork)).toEqual({
      ...initial,
      offsetX: artwork.width - source.width * initial.scale,
    })
  })

  it('ピンチの中心を指の移動先へ保つ', () => {
    expect(
      applyPinch(
        createCenteredCoverTransform(artwork, artwork),
        2,
        { x: 540, y: 540 },
        { x: 600, y: 500 },
        artwork,
        artwork,
      ),
    ).toEqual({ scale: 2, offsetX: -480, offsetY: -580 })
  })

  it('表示座標を1080論理座標へ変換する', () => {
    expect(
      clientPointToLogical(
        { x: 210, y: 420 },
        { left: 10, top: 20, width: 400, height: 800 },
        artwork,
      ),
    ).toEqual({ x: 540, y: 540 })
  })
})
