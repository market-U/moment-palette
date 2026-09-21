import type {
  CompletedImageGeneratorPort,
  CompletedImageResource,
} from '@/features/image-sharing-spike/completedImagePort'

const IMAGE_SIZE = 1080

interface Size {
  width: number
  height: number
}

interface GeneratorDependencies {
  createCanvas(): HTMLCanvasElement
  canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob>
  readDimensions(blob: Blob): Promise<Size>
  createObjectUrl(blob: Blob): string
  revokeObjectUrl(url: string): void
  now(): number
}

const defaultCanvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('CanvasからPNG Blobを生成できませんでした。'))
      }
    }, 'image/png')
  })

export const readBlobDimensions = async (blob: Blob): Promise<Size> => {
  if ('createImageBitmap' in globalThis) {
    const bitmap = await createImageBitmap(blob)
    try {
      return { width: bitmap.width, height: bitmap.height }
    } finally {
      bitmap.close()
    }
  }

  const url = URL.createObjectURL(blob)
  const image = new Image()
  try {
    image.src = url
    await image.decode()
    return { width: image.naturalWidth, height: image.naturalHeight }
  } finally {
    // fallbackの診断用URLは完成画像URLとは別に、decode直後に必ず破棄する。
    URL.revokeObjectURL(url)
    image.removeAttribute('src')
  }
}

const defaultDependencies: GeneratorDependencies = {
  createCanvas: () => document.createElement('canvas'),
  canvasToBlob: defaultCanvasToBlob,
  readDimensions: readBlobDimensions,
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  now: () => performance.now(),
}

export const drawImageSharingFixture = (
  context: CanvasRenderingContext2D,
  generationId: number,
) => {
  const gradient = context.createLinearGradient(0, 0, IMAGE_SIZE, IMAGE_SIZE)
  gradient.addColorStop(0, '#f5c7d7')
  gradient.addColorStop(0.5, '#f7e7a7')
  gradient.addColorStop(1, '#b9dfd4')
  context.fillStyle = gradient
  context.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE)

  context.fillStyle = 'rgba(255, 255, 255, 0.92)'
  context.fillRect(90, 90, 900, 900)

  context.strokeStyle = '#362d3b'
  context.lineWidth = 4
  for (let offset = 150; offset <= 930; offset += 60) {
    context.beginPath()
    context.moveTo(120, offset)
    context.lineTo(offset, 120)
    context.stroke()
  }

  context.fillStyle = '#362d3b'
  context.textAlign = 'center'
  context.font = '700 74px sans-serif'
  context.fillText('Moment Palette', IMAGE_SIZE / 2, 500)
  context.font = '500 44px sans-serif'
  context.fillText('IMAGE SHARING F/S', IMAGE_SIZE / 2, 580)
  context.font = '700 92px monospace'
  context.fillText(`VERSION ${String(generationId)}`, IMAGE_SIZE / 2, 730)

  context.strokeStyle = '#b45773'
  context.lineWidth = 10
  context.strokeRect(90, 90, 900, 900)
}

export const createCanvasCompletedImageGenerator = (
  overrides: Partial<GeneratorDependencies> = {},
): CompletedImageGeneratorPort => {
  const dependencies = { ...defaultDependencies, ...overrides }

  return {
    async generate(generationId): Promise<CompletedImageResource> {
      const startedAt = dependencies.now()
      const canvas = dependencies.createCanvas()
      canvas.width = IMAGE_SIZE
      canvas.height = IMAGE_SIZE
      let objectUrl: string | undefined

      try {
        const context = canvas.getContext('2d')
        if (!context) {
          throw new Error('Canvas 2D contextを取得できませんでした。')
        }

        drawImageSharingFixture(context, generationId)
        const blob = await dependencies.canvasToBlob(canvas)
        if (blob.type !== 'image/png') {
          throw new Error(`PNGではないBlobが生成されました: ${blob.type}`)
        }

        objectUrl = dependencies.createObjectUrl(blob)
        const dimensions = await dependencies.readDimensions(blob)
        if (
          dimensions.width !== IMAGE_SIZE ||
          dimensions.height !== IMAGE_SIZE
        ) {
          throw new Error(
            `完成PNGの寸法が不正です: ${String(dimensions.width)}×${String(dimensions.height)}`,
          )
        }

        let disposed = false
        const stableObjectUrl = objectUrl
        return {
          blob,
          objectUrl: stableObjectUrl,
          ...dimensions,
          bytes: blob.size,
          generationId,
          generationMs: dependencies.now() - startedAt,
          dispose() {
            if (disposed) {
              return
            }
            disposed = true
            dependencies.revokeObjectUrl(stableObjectUrl)
          },
        }
      } catch (error) {
        if (objectUrl) {
          dependencies.revokeObjectUrl(objectUrl)
        }
        throw error
      } finally {
        // 出力はBlobへ移ったため、一時CanvasのRGBA backing storeを保持しない。
        canvas.width = 0
        canvas.height = 0
      }
    },
  }
}
