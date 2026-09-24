import type { Artwork, Template } from '@/domain/template'
import type { MediaTransform, Rect, Size } from '@/shared/lib/mediaTransform'

/** Camera compositorが参照するdecode済みtemplate画像を表す。 */
export type CameraTemplateAssets = Readonly<{
  lineArt: Readonly<{ source: CanvasImageSource }>
  masks: readonly Readonly<{ id: string; source: CanvasImageSource }>[]
}>

/** Areaへ反映できる1080×1080の撮影frameと解放手段を表す。 */
export type CapturedCameraFrame = Readonly<{
  source: CanvasImageSource
  release: () => void
}>

/** 現在の作品を描画するためにsessionから渡す状態を表す。 */
export type CameraArtworkContext = Readonly<{
  template: Template
  artwork: Artwork
  assets: CameraTemplateAssets
  areaResources: ReadonlyMap<string, CapturedCameraFrame>
}>

/** Live previewへ追加するcamera sourceと比較状態を表す。 */
export type CameraPreviewState = CameraArtworkContext &
  Readonly<{
    selectedAreaId: string
    blend: number
    transform: MediaTransform
    mirrorSource: boolean
  }>

/** 制作画面へ表示する生成済み作品previewと解放手段を表す。 */
export type CameraArtworkPreview = Readonly<{
  url: string
  width: number
  height: number
  release: () => void
}>

/** Cameraのlive表示、撮影、静的作品preview生成をCanvas実装へ要求するport。 */
export interface CameraCompositorPort {
  resizePreview(
    canvas: HTMLCanvasElement,
    cssPixels: number,
    pixelRatio: number,
  ): Size
  renderPreview(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement | undefined,
    state: CameraPreviewState,
  ): void
  renderArtworkPreview(
    canvas: HTMLCanvasElement,
    context: CameraArtworkContext,
  ): void
  renderPhotoPreview?(
    canvas: HTMLCanvasElement,
    source: CanvasImageSource,
    sourceSize: Size,
    state: Omit<CameraPreviewState, 'mirrorSource'>,
  ): void
  getPhotoAreaBounds(context: CameraArtworkContext, areaId: string): Rect
  captureFrame(
    video: HTMLVideoElement,
    transform: MediaTransform,
    mirrorSource: boolean,
  ): CapturedCameraFrame
  capturePhotoFrame?(
    source: CanvasImageSource,
    sourceSize: Size,
    transform: MediaTransform,
  ): CapturedCameraFrame
  generatePreview(context: CameraArtworkContext): Promise<CameraArtworkPreview>
}
