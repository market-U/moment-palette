import { describe, expect, it } from 'vitest'

import { cameraAreas } from './template'
import {
  applyPan,
  applyPinch,
  clientPointToLogical,
  constrainTransform,
  createCenteredCoverTransform,
  getCoverScale,
  getScaleBounds,
} from './geometry'

const artwork = { width: 1080, height: 1080 }

describe('camera compositing geometry', () => {
  it.each([
    [{ width: 1920, height: 1080 }, 1],
    [{ width: 1080, height: 1920 }, 1],
    [{ width: 640, height: 480 }, 2.25],
  ])('covers the artwork for source %o', (source, expectedScale) => {
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

  it('rejects empty source dimensions', () => {
    expect(() => getCoverScale({ width: 0, height: 1080 }, artwork)).toThrow(
      RangeError,
    )
  })

  it('clamps scale and pan to keep the whole artwork covered', () => {
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

  it('applies pan without exposing empty pixels', () => {
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

  it('keeps the pinch anchor under the moving midpoint', () => {
    const source = { width: 1080, height: 1080 }
    const initial = createCenteredCoverTransform(source, artwork)
    const result = applyPinch(
      initial,
      2,
      { x: 540, y: 540 },
      { x: 600, y: 500 },
      source,
      artwork,
    )

    expect(result).toEqual({ scale: 2, offsetX: -480, offsetY: -580 })
  })

  it('maps preview coordinates to 1080 logical coordinates', () => {
    expect(
      clientPointToLogical(
        { x: 210, y: 420 },
        { left: 10, top: 20, width: 400, height: 800 },
        artwork,
      ),
    ).toEqual({ x: 540, y: 540 })
  })

  it('keeps every production mask inside the covered artwork', () => {
    for (const area of cameraAreas) {
      expect(area.alphaBounds.x).toBeGreaterThanOrEqual(0)
      expect(area.alphaBounds.y).toBeGreaterThanOrEqual(0)
      expect(area.alphaBounds.x + area.alphaBounds.width).toBeLessThanOrEqual(
        artwork.width,
      )
      expect(area.alphaBounds.y + area.alphaBounds.height).toBeLessThanOrEqual(
        artwork.height,
      )
    }
  })
})
