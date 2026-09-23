import { calculateNormalizedSize } from '@/features/photo-fill/normalization'
import { PhotoImportError } from '@/features/photo-fill/photoFailure'

type PhotoNormalizationPreset = 'quality' | 'memory'
type PhotoDecodePath = 'image-bitmap' | 'html-image'
type PhotoFileSummary = Readonly<{
  extension: string
  mimeType: string
  bytes: number
}>
type DecodedPhoto = Readonly<{
  source: HTMLCanvasElement
  diagnostics: Readonly<{
    file: PhotoFileSummary
    path: PhotoDecodePath
    originalSize: Readonly<{ width: number; height: number }>
    normalizedSize: Readonly<{ width: number; height: number }>
    decodeMs: number
    normalizeMs: number
    preset: PhotoNormalizationPreset
  }>
  dispose: () => void
}>
type BrowserPhotoDecoderPort = Readonly<{
  decode: (
    file: File,
    preset: PhotoNormalizationPreset,
  ) => Promise<DecodedPhoto>
}>

interface BrowserPhotoDecoderDependencies {
  createBitmap?: (
    file: File,
    options: ImageBitmapOptions,
  ) => Promise<ImageBitmap>
  createImage: () => HTMLImageElement
  createCanvas: () => HTMLCanvasElement
  createObjectUrl: (file: File) => string
  revokeObjectUrl: (url: string) => void
  now: () => number
}

const defaultDependencies = (): BrowserPhotoDecoderDependencies => ({
  createBitmap:
    'createImageBitmap' in globalThis
      ? (file, options) => createImageBitmap(file, options)
      : undefined,
  createImage: () => new Image(),
  createCanvas: () => document.createElement('canvas'),
  createObjectUrl: (file) => URL.createObjectURL(file),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  now: () => performance.now(),
})

const summarizeFile = (file: File): PhotoFileSummary => {
  const finalDot = file.name.lastIndexOf('.')
  const extension =
    finalDot >= 0 && finalDot < file.name.length - 1
      ? file.name.slice(finalDot + 1).toLowerCase()
      : 'なし'
  return { extension, mimeType: file.type || '未提供', bytes: file.size }
}

const normalizationError = (error: unknown) => {
  const resourcePressure =
    error instanceof DOMException &&
    ['QuotaExceededError', 'NS_ERROR_OUT_OF_MEMORY'].includes(error.name)

  return new PhotoImportError(
    resourcePressure ? 'resource-pressure' : 'normalization-failed',
    'Canvasによる正規化に失敗しました。',
    { cause: error },
  )
}

export const createBrowserPhotoDecoder = (
  dependencies: BrowserPhotoDecoderDependencies = defaultDependencies(),
): BrowserPhotoDecoderPort => ({
  async decode(
    file: File,
    preset: PhotoNormalizationPreset,
  ): Promise<DecodedPhoto> {
    let bitmap: ImageBitmap | undefined
    let image: HTMLImageElement | undefined
    let objectUrl: string | undefined
    let path: PhotoDecodePath | undefined
    let source: CanvasImageSource | undefined
    let width = 0
    let height = 0
    const decodeStartedAt = dependencies.now()

    try {
      if (dependencies.createBitmap) {
        try {
          // metadata由来の向きを明示する。resize optionはWebKit差を避けるため使わない。
          bitmap = await dependencies.createBitmap(file, {
            imageOrientation: 'from-image',
          })
          source = bitmap
          width = bitmap.width
          height = bitmap.height
          path = 'image-bitmap'
        } catch {
          // File.typeや拡張子はヒントに過ぎないため、第一経路の失敗後も実デコードを試す。
        }
      }

      if (!source) {
        objectUrl = dependencies.createObjectUrl(file)
        image = dependencies.createImage()
        image.src = objectUrl

        try {
          await image.decode()
        } catch (error) {
          throw new PhotoImportError(
            'decode-failed',
            '標準の両経路で画像をデコードできませんでした。',
            { cause: error },
          )
        }

        source = image
        width = image.naturalWidth
        height = image.naturalHeight
        path = 'html-image'
      }

      const decodeMs = dependencies.now() - decodeStartedAt

      if (width <= 0 || height <= 0) {
        throw new PhotoImportError(
          'invalid-dimensions',
          'デコード結果の寸法が不正です。',
        )
      }

      if (!path)
        throw new PhotoImportError(
          'decode-failed',
          '画像のデコード経路を確定できませんでした。',
        )

      const normalizedSize = calculateNormalizedSize(
        { width, height },
        preset === 'quality'
          ? { maxEdge: 4096, maxPixels: 12_000_000 }
          : { maxEdge: 2160 },
      )
      const normalizationStartedAt = dependencies.now()
      const canvas = dependencies.createCanvas()

      try {
        canvas.width = normalizedSize.width
        canvas.height = normalizedSize.height
        const context = canvas.getContext('2d')

        if (!context) {
          throw new Error('Canvas 2D context is unavailable')
        }

        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'
        // 一度のCanvas描画で保持用sourceを作り、元画像の大きな資源を直後に解放する。
        context.drawImage(
          source,
          0,
          0,
          normalizedSize.width,
          normalizedSize.height,
        )
      } catch (error) {
        canvas.width = 0
        canvas.height = 0
        throw normalizationError(error)
      }

      let disposed = false
      const normalizeMs = dependencies.now() - normalizationStartedAt

      return {
        source: canvas,
        diagnostics: {
          file: summarizeFile(file),
          path,
          originalSize: { width, height },
          normalizedSize,
          decodeMs,
          normalizeMs,
          preset,
        },
        dispose() {
          if (disposed) {
            return
          }

          disposed = true
          // 幅・高さを0にするとCanvasのbacking storeをブラウザが解放できる。
          canvas.width = 0
          canvas.height = 0
        },
      }
    } finally {
      bitmap?.close()

      if (objectUrl) {
        dependencies.revokeObjectUrl(objectUrl)
      }

      if (image) {
        image.removeAttribute('src')
      }
    }
  },
})
