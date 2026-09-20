import type {
  CameraAreaId,
  CameraSpikeTemplate,
  MediaTransform,
  Size,
} from './types'

export interface CapturedFrame {
  readonly canvas: HTMLCanvasElement
}

export type CapturedFrames = Partial<Record<CameraAreaId, CapturedFrame>>

export interface PreviewRenderState {
  selectedAreaId: CameraAreaId
  blend: number
  transform: MediaTransform
  captures: CapturedFrames
}

export interface CaptureResult {
  frame: CapturedFrame
  durationMs: number
}

export interface GeneratedPng {
  blob: Blob
  width: number
  height: number
  durationMs: number
}

export interface CameraCompositorPort {
  load(): Promise<void>
  resizePreview(
    canvas: HTMLCanvasElement,
    cssPixels: number,
    pixelRatio: number,
  ): Size
  renderPreview(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement | undefined,
    state: PreviewRenderState,
  ): void
  captureFrame(
    video: HTMLVideoElement,
    transform: MediaTransform,
  ): CaptureResult
  releaseFrame(frame: CapturedFrame): void
  generatePng(captures: CapturedFrames): Promise<GeneratedPng>
}

export type CameraCompositorFactory = (
  template: CameraSpikeTemplate,
) => CameraCompositorPort
