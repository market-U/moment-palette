import { describe, expect, it } from 'vitest'

import { applyPan, applyPinch } from '@/shared/lib/mediaTransform'

import { createLooseTransformPolicy } from './photoPlacement'

const source = { width: 480, height: 320 }
const artwork = { width: 1080, height: 1080 }
const mouth = { x: 424, y: 365, width: 267, height: 421 }

describe('photoPlacement', () => {
  it('種類を問わずcover倍率より小さく縮小できる', () => {
    const policy = createLooseTransformPolicy(mouth)
    const cover = { scale: 3.375, offsetX: -270, offsetY: 0 }
    const shrunken = applyPinch(
      cover,
      0.1,
      { x: 540, y: 540 },
      { x: 540, y: 540 },
      source,
      artwork,
      policy,
    )

    expect(shrunken.scale).toBe(0.3375)
    expect(shrunken.scale).toBeLessThan(1080 / source.height)
  })

  it('移動後も選択エリア内へ画像の一部を残す', () => {
    const policy = createLooseTransformPolicy(mouth)
    const contained = { scale: 0.55625, offsetX: 424, offsetY: 486.5 }
    const moved = applyPan(
      contained,
      { x: 9999, y: -9999 },
      source,
      artwork,
      policy,
    )

    expect(moved.offsetX).toBe(667)
    expect(moved.offsetY).toBe(211)
  })

  it('最小倍率まで縮小でき、下限を超えるpinchを制限する', () => {
    const policy = createLooseTransformPolicy(mouth)
    const initial = { scale: 0.55625, offsetX: 424, offsetY: 486.5 }
    const pinched = applyPinch(
      initial,
      0.01,
      { x: 557.5, y: 575.5 },
      { x: 557.5, y: 575.5 },
      source,
      artwork,
      policy,
    )

    expect(pinched.scale).toBe(initial.scale / 4)
  })
})
