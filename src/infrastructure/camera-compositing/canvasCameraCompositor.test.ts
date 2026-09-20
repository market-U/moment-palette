import { describe, expect, it, vi } from 'vitest'

import { drawTransformedSource } from './canvasCameraCompositor'

const createContext = () =>
  ({
    drawImage: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
  }) as unknown as CanvasRenderingContext2D

describe('drawTransformedSource', () => {
  const source = {} as CanvasImageSource
  const transform = { scale: 2, offsetX: 10, offsetY: 20 }

  it('draws an environment-facing source without reflection', () => {
    const context = createContext()

    drawTransformedSource(context, source, 100, 50, transform)

    expect(context.drawImage).toHaveBeenCalledWith(source, 10, 20, 200, 100)
    expect(context.translate).not.toHaveBeenCalled()
    expect(context.scale).not.toHaveBeenCalled()
  })

  it('reflects a user-facing source inside the same destination rectangle', () => {
    const context = createContext()

    drawTransformedSource(context, source, 100, 50, transform, true)

    expect(context.translate).toHaveBeenCalledWith(210, 20)
    expect(context.scale).toHaveBeenCalledWith(-1, 1)
    expect(context.drawImage).toHaveBeenCalledWith(source, 0, 0, 200, 100)
    expect(context.save).toHaveBeenCalledOnce()
    expect(context.restore).toHaveBeenCalledOnce()
  })
})
