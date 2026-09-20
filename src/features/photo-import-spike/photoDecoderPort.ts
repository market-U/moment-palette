import type { Size } from '@/shared/lib/mediaTransform'

export type PhotoNormalizationPreset = 'quality' | 'memory'
export type PhotoDecodePath = 'image-bitmap' | 'html-image'

export interface PhotoFileSummary {
  extension: string
  mimeType: string
  bytes: number
}

export interface PhotoDecodeDiagnostics {
  file: PhotoFileSummary
  path: PhotoDecodePath
  originalSize: Size
  normalizedSize: Size
  decodeMs: number
  normalizeMs: number
  preset: PhotoNormalizationPreset
}

export interface DecodedPhoto {
  source: HTMLCanvasElement
  diagnostics: PhotoDecodeDiagnostics
  /** 保持用Canvasのbacking storeを解放する。複数回呼んでも安全でなければならない。 */
  dispose(): void
}

export interface PhotoDecoderPort {
  decode(file: File, preset: PhotoNormalizationPreset): Promise<DecodedPhoto>
}

export type PhotoDecoderFactory = () => PhotoDecoderPort
