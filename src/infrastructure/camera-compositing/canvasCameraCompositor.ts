import type {
  CameraCompositorPort,
  CapturedFrame,
  CapturedFrames,
  GeneratedPng,
  PreviewRenderState,
} from '@/features/camera-compositing-spike/compositorPort'
import { getSceneAlphas } from '@/features/camera-compositing-spike/scene'
import type {
  CameraAreaDefinition,
  CameraSpikeTemplate,
  MediaTransform,
} from '@/features/camera-compositing-spike/types'

import {
  loadCameraSpikeAssets,
  type LoadedCameraSpikeAssets,
} from './browserAssetLoader'

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

const getContext = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D contextを取得できませんでした。')
  }

  return context
}

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('CanvasからPNG Blobを生成できませんでした。'))
      }
    }, 'image/png')
  })

const decodeBlobDimensions = async (blob: Blob) => {
  if ('createImageBitmap' in globalThis) {
    const bitmap = await createImageBitmap(blob)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  }

  const url = URL.createObjectURL(blob)

  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return { width: image.naturalWidth, height: image.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const createCanvasCameraCompositor = (
  template: CameraSpikeTemplate,
): CameraCompositorPort => {
  const sourcePlane = createCanvas(template.size.width, template.size.height)
  const artworkPlane = createCanvas(template.size.width, template.size.height)
  const areaPlane = createCanvas(template.size.width, template.size.height)
  let assets: LoadedCameraSpikeAssets | undefined

  const requireAssets = () => {
    if (!assets) {
      throw new Error('テンプレートアセットが読み込まれていません。')
    }

    return assets
  }

  const drawTransformedSource = (
    context: CanvasRenderingContext2D,
    source: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
    transform: MediaTransform,
  ) => {
    context.drawImage(
      source,
      transform.offsetX,
      transform.offsetY,
      sourceWidth * transform.scale,
      sourceHeight * transform.scale,
    )
  }

  const drawMaskedArea = (
    destination: CanvasRenderingContext2D,
    area: CameraAreaDefinition,
    drawSource: (context: CanvasRenderingContext2D) => void,
  ) => {
    const loadedAssets = requireAssets()
    const mask = loadedAssets.masks.get(area.id)

    if (!mask) {
      throw new Error(`${area.label}のmaskが読み込まれていません。`)
    }

    const context = getContext(areaPlane)
    context.save()
    context.clearRect(0, 0, template.size.width, template.size.height)
    context.globalCompositeOperation = 'source-over'
    context.globalAlpha = 1
    drawSource(context)
    context.globalCompositeOperation = 'destination-in'
    context.drawImage(mask, 0, 0, template.size.width, template.size.height)
    context.restore()
    destination.drawImage(areaPlane, 0, 0)
  }

  const drawArtwork = (
    context: CanvasRenderingContext2D,
    captures: CapturedFrames,
    selectedAreaId?: string,
    liveSource?: HTMLVideoElement,
    transform?: MediaTransform,
  ) => {
    context.clearRect(0, 0, template.size.width, template.size.height)

    for (const area of template.areas) {
      const captured = captures[area.id]

      drawMaskedArea(context, area, (areaContext) => {
        if (
          selectedAreaId === area.id &&
          liveSource &&
          transform &&
          liveSource.videoWidth > 0 &&
          liveSource.videoHeight > 0
        ) {
          drawTransformedSource(
            areaContext,
            liveSource,
            liveSource.videoWidth,
            liveSource.videoHeight,
            transform,
          )
        } else if (captured) {
          areaContext.drawImage(
            captured.canvas,
            0,
            0,
            template.size.width,
            template.size.height,
          )
        } else {
          areaContext.fillStyle = area.initialColor
          areaContext.fillRect(0, 0, template.size.width, template.size.height)
        }
      })
    }
  }

  const drawLineArt = (context: CanvasRenderingContext2D) => {
    context.drawImage(
      requireAssets().lineArt,
      0,
      0,
      template.size.width,
      template.size.height,
    )
  }

  return {
    async load() {
      assets = await loadCameraSpikeAssets(template)
    },

    resizePreview(canvas, cssPixels, pixelRatio) {
      const resolution = Math.max(
        1,
        Math.min(template.size.width, Math.round(cssPixels * pixelRatio)),
      )

      if (canvas.width !== resolution || canvas.height !== resolution) {
        canvas.width = resolution
        canvas.height = resolution
      }

      return { width: resolution, height: resolution }
    },

    renderPreview(canvas, video, state: PreviewRenderState) {
      const hasLiveSource = Boolean(
        video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
      )
      const alphas = getSceneAlphas(state.blend, hasLiveSource)
      const sourceContext = getContext(sourcePlane)
      const artworkContext = getContext(artworkPlane)

      sourceContext.clearRect(0, 0, template.size.width, template.size.height)

      if (hasLiveSource && video) {
        drawTransformedSource(
          sourceContext,
          video,
          video.videoWidth,
          video.videoHeight,
          state.transform,
        )
      }

      drawArtwork(
        artworkContext,
        state.captures,
        hasLiveSource ? state.selectedAreaId : undefined,
        hasLiveSource ? video : undefined,
        hasLiveSource ? state.transform : undefined,
      )

      const context = getContext(canvas)
      context.save()
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#fffaf5'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.scale(
        canvas.width / template.size.width,
        canvas.height / template.size.height,
      )
      context.globalAlpha = alphas.source
      context.drawImage(sourcePlane, 0, 0)
      context.globalAlpha = alphas.artwork
      context.drawImage(artworkPlane, 0, 0)
      context.globalAlpha = alphas.lineArt
      drawLineArt(context)
      context.restore()
    },

    captureFrame(video, transform) {
      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        throw new Error('撮影可能なvideo frameがありません。')
      }

      const startedAt = performance.now()
      const canvas = createCanvas(template.size.width, template.size.height)
      const context = getContext(canvas)
      drawTransformedSource(
        context,
        video,
        video.videoWidth,
        video.videoHeight,
        transform,
      )

      return {
        frame: { canvas },
        durationMs: performance.now() - startedAt,
      }
    },

    releaseFrame(frame: CapturedFrame) {
      frame.canvas.width = 0
      frame.canvas.height = 0
    },

    async generatePng(captures): Promise<GeneratedPng> {
      const startedAt = performance.now()
      const canvas = createCanvas(template.size.width, template.size.height)
      try {
        const context = getContext(canvas)
        drawArtwork(context, captures)
        drawLineArt(context)
        const blob = await canvasToBlob(canvas)
        const dimensions = await decodeBlobDimensions(blob)
        const durationMs = performance.now() - startedAt

        return {
          blob,
          ...dimensions,
          durationMs,
        }
      } finally {
        canvas.width = 0
        canvas.height = 0
      }
    },
  }
}
