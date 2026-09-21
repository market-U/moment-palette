import { describe, expect, it, vi } from 'vitest'

import { createCanvasCompletedImageGenerator } from './canvasCompletedImageGenerator'

const createFakeCanvas = () => {
  const gradient = { addColorStop: vi.fn() }
  const context = {
    beginPath: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
  }
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement
  return { canvas, context }
}

const createDependencies = () => {
  const { canvas, context } = createFakeCanvas()
  let time = 0
  return {
    canvas,
    context,
    dependencies: {
      createCanvas: vi.fn(() => canvas),
      canvasToBlob: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
      readDimensions: vi.fn(async () => ({ width: 1080, height: 1080 })),
      createObjectUrl: vi.fn(() => 'blob:completed'),
      revokeObjectUrl: vi.fn(),
      now: vi.fn(() => {
        time += 5
        return time
      }),
    },
  }
}

describe('createCanvasCompletedImageGenerator', () => {
  it('識別可能な1080px PNG resourceを返し、一時Canvasを解放する', async () => {
    const fake = createDependencies()
    const resource = await createCanvasCompletedImageGenerator(
      fake.dependencies,
    ).generate(3)

    expect(fake.context.fillText).toHaveBeenCalledWith('VERSION 3', 540, 730)
    expect(resource).toMatchObject({
      objectUrl: 'blob:completed',
      width: 1080,
      height: 1080,
      generationId: 3,
      generationMs: 5,
    })
    expect(resource.blob.type).toBe('image/png')
    expect(fake.canvas.width).toBe(0)
    expect(fake.canvas.height).toBe(0)
  })

  it('resourceのdisposeを複数回呼んでもURLを一度だけ解放する', async () => {
    const fake = createDependencies()
    const resource = await createCanvasCompletedImageGenerator(
      fake.dependencies,
    ).generate(1)

    resource.dispose()
    resource.dispose()
    expect(fake.dependencies.revokeObjectUrl).toHaveBeenCalledOnce()
    expect(fake.dependencies.revokeObjectUrl).toHaveBeenCalledWith(
      'blob:completed',
    )
  })

  it('寸法検証失敗では作成済みURLとCanvasを解放する', async () => {
    const fake = createDependencies()
    fake.dependencies.readDimensions.mockResolvedValue({
      width: 540,
      height: 540,
    })

    await expect(
      createCanvasCompletedImageGenerator(fake.dependencies).generate(1),
    ).rejects.toThrow('完成PNGの寸法が不正です')
    expect(fake.dependencies.revokeObjectUrl).toHaveBeenCalledWith(
      'blob:completed',
    )
    expect(fake.canvas.width).toBe(0)
    expect(fake.canvas.height).toBe(0)
  })

  it('Blob生成失敗でもCanvasを解放する', async () => {
    const fake = createDependencies()
    fake.dependencies.canvasToBlob.mockRejectedValue(new Error('failed'))

    await expect(
      createCanvasCompletedImageGenerator(fake.dependencies).generate(1),
    ).rejects.toThrow('failed')
    expect(fake.canvas.width).toBe(0)
    expect(fake.canvas.height).toBe(0)
  })
})
