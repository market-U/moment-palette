import { describe, expect, it, vi } from 'vitest'

import { PhotoImportError } from '@/features/photo-import-spike/photoFailure'

import { createBrowserPhotoDecoder } from './browserPhotoDecoder'

const file = new File(['image'], 'private-photo.JPEG', { type: 'image/jpeg' })

const createFakeCanvas = () => {
  const context = {
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
    drawImage: vi.fn(),
  }

  return {
    canvas: {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
    } as unknown as HTMLCanvasElement,
    context,
  }
}

const createDependencies = () => {
  const { canvas, context } = createFakeCanvas()
  const bitmap = {
    width: 5000,
    height: 4000,
    close: vi.fn(),
  } as unknown as ImageBitmap
  const image = {
    src: '',
    naturalWidth: 1200,
    naturalHeight: 800,
    decode: vi.fn().mockResolvedValue(undefined),
    removeAttribute: vi.fn(),
  } as unknown as HTMLImageElement
  let time = 0

  return {
    bitmap,
    canvas,
    context,
    image,
    dependencies: {
      createBitmap: vi.fn().mockResolvedValue(bitmap),
      createImage: vi.fn(() => image),
      createCanvas: vi.fn(() => canvas),
      createObjectUrl: vi.fn(() => 'blob:test'),
      revokeObjectUrl: vi.fn(),
      now: vi.fn(() => {
        time += 5
        return time
      }),
    },
  }
}

describe('createBrowserPhotoDecoder', () => {
  it('ImageBitmapを向き補正指定で読み、正規化後に閉じる', async () => {
    const fake = createDependencies()
    const result = await createBrowserPhotoDecoder(fake.dependencies).decode(
      file,
      'quality',
    )

    expect(fake.dependencies.createBitmap).toHaveBeenCalledWith(file, {
      imageOrientation: 'from-image',
    })
    expect(result.diagnostics).toMatchObject({
      file: { extension: 'jpeg', mimeType: 'image/jpeg', bytes: 5 },
      path: 'image-bitmap',
      originalSize: { width: 5000, height: 4000 },
      normalizedSize: { width: 3872, height: 3098 },
    })
    expect(fake.context.imageSmoothingEnabled).toBe(true)
    expect(fake.context.imageSmoothingQuality).toBe('high')
    expect(fake.bitmap.close).toHaveBeenCalledOnce()
    expect(fake.dependencies.createObjectUrl).not.toHaveBeenCalled()
  })

  it('第一経路の失敗時はobject URL経路へ切り替えて必ずrevokeする', async () => {
    const fake = createDependencies()
    fake.dependencies.createBitmap.mockRejectedValue(new Error('unsupported'))

    const result = await createBrowserPhotoDecoder(fake.dependencies).decode(
      file,
      'memory',
    )

    expect(result.diagnostics.path).toBe('html-image')
    expect(fake.image.decode).toHaveBeenCalledOnce()
    expect(fake.dependencies.revokeObjectUrl).toHaveBeenCalledWith('blob:test')
    expect(fake.image.removeAttribute).toHaveBeenCalledWith('src')
  })

  it('fallback失敗でもobject URLとimage参照を片付ける', async () => {
    const fake = createDependencies()
    fake.dependencies.createBitmap.mockRejectedValue(new Error('unsupported'))
    vi.mocked(fake.image.decode).mockRejectedValue(new Error('broken'))

    await expect(
      createBrowserPhotoDecoder(fake.dependencies).decode(file, 'quality'),
    ).rejects.toMatchObject<Partial<PhotoImportError>>({
      kind: 'decode-failed',
    })
    expect(fake.dependencies.revokeObjectUrl).toHaveBeenCalledOnce()
    expect(fake.image.removeAttribute).toHaveBeenCalledWith('src')
  })

  it('Canvas例外では確保済みbacking storeと元ImageBitmapを解放する', async () => {
    const fake = createDependencies()
    fake.context.drawImage.mockImplementation(() => {
      throw new Error('canvas failed')
    })

    await expect(
      createBrowserPhotoDecoder(fake.dependencies).decode(file, 'quality'),
    ).rejects.toMatchObject<Partial<PhotoImportError>>({
      kind: 'normalization-failed',
    })
    expect(fake.canvas.width).toBe(0)
    expect(fake.canvas.height).toBe(0)
    expect(fake.bitmap.close).toHaveBeenCalledOnce()
  })

  it('採用したCanvasのdisposeを複数回呼んでも安全に解放する', async () => {
    const fake = createDependencies()
    const result = await createBrowserPhotoDecoder(fake.dependencies).decode(
      file,
      'quality',
    )

    result.dispose()
    result.dispose()
    expect(fake.canvas.width).toBe(0)
    expect(fake.canvas.height).toBe(0)
  })
})
