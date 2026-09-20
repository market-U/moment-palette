import type { MediaTransform, Size } from '@/shared/lib/mediaTransform'

import type { PhotoAreaId, PhotoSpikeTemplate } from './types'

export interface ConfirmedPhotoFrame {
  readonly canvas: HTMLCanvasElement
}

export type ConfirmedPhotoFrames = Partial<
  Record<PhotoAreaId, ConfirmedPhotoFrame>
>

export interface PhotoPreviewState {
  selectedAreaId: PhotoAreaId
  blend: number
  transform: MediaTransform
}

export interface PhotoCompositorPort {
  load(): Promise<void>
  resizePreview(
    canvas: HTMLCanvasElement,
    cssPixels: number,
    pixelRatio: number,
  ): Size
  prepareArtwork(
    confirmed: ConfirmedPhotoFrames,
    editingAreaId?: PhotoAreaId,
  ): void
  renderPreview(
    canvas: HTMLCanvasElement,
    source: HTMLCanvasElement | undefined,
    state: PhotoPreviewState,
  ): void
  confirmSource(
    source: HTMLCanvasElement,
    transform: MediaTransform,
  ): ConfirmedPhotoFrame
  releaseFrame(frame: ConfirmedPhotoFrame): void
  dispose(): void
}

export type PhotoCompositorFactory = (
  template: PhotoSpikeTemplate,
) => PhotoCompositorPort
