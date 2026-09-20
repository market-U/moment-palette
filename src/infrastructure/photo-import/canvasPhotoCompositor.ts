import type {
  ConfirmedPhotoFrame,
  ConfirmedPhotoFrames,
  PhotoCompositorPort,
  PhotoPreviewState,
} from '@/features/photo-import-spike/photoCompositorPort'
import { getPhotoSceneAlphas } from '@/features/photo-import-spike/photoScene'
import type {
  PhotoAreaDefinition,
  PhotoSpikeTemplate,
} from '@/features/photo-import-spike/types'
import type { MediaTransform } from '@/shared/lib/mediaTransform'

import {
  loadPhotoSpikeAssets,
  type LoadedPhotoSpikeAssets,
} from './browserPhotoAssetLoader'

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

export const drawPhotoSource = (
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

export const drawPhotoPreviewPlanes = (
  context: CanvasRenderingContext2D,
  sourcePlane: HTMLCanvasElement,
  artworkPlane: HTMLCanvasElement,
  alphas: { source: number; artwork: number; lineArt: number },
  drawLineArt: (context: CanvasRenderingContext2D) => void,
) => {
  // 選択中写真と同じsourceを先に不透明で置き、作品を上から比較比率で重ねる。
  context.globalAlpha = alphas.source
  context.drawImage(sourcePlane, 0, 0)
  context.globalAlpha = alphas.artwork
  context.drawImage(artworkPlane, 0, 0)
  context.globalAlpha = alphas.lineArt
  drawLineArt(context)
}

export const createCanvasPhotoCompositor = (
  template: PhotoSpikeTemplate,
): PhotoCompositorPort => {
  const sourcePlane = createCanvas(template.size.width, template.size.height)
  const artworkPlane = createCanvas(template.size.width, template.size.height)
  const areaPlane = createCanvas(template.size.width, template.size.height)
  let assets: LoadedPhotoSpikeAssets | undefined

  const requireAssets = () => {
    if (!assets) {
      throw new Error('テンプレートアセットが読み込まれていません。')
    }

    return assets
  }

  const drawMaskedArea = (
    destination: CanvasRenderingContext2D,
    area: PhotoAreaDefinition,
    drawContent: (context: CanvasRenderingContext2D) => void,
  ) => {
    const mask = requireAssets().masks.get(area.id)

    if (!mask) {
      throw new Error(`${area.label}のmaskが読み込まれていません。`)
    }

    const context = getContext(areaPlane)
    context.save()
    context.clearRect(0, 0, template.size.width, template.size.height)
    context.globalCompositeOperation = 'source-over'
    context.globalAlpha = 1
    drawContent(context)
    // 写真や単色のalphaとPNG maskのalphaを掛け合わせ、形状だけを残す。
    context.globalCompositeOperation = 'destination-in'
    context.drawImage(mask, 0, 0, template.size.width, template.size.height)
    context.restore()
    destination.drawImage(areaPlane, 0, 0)
  }

  const drawArtwork = (
    context: CanvasRenderingContext2D,
    confirmed: ConfirmedPhotoFrames,
    selectedAreaId?: string,
    source?: HTMLCanvasElement,
    transform?: MediaTransform,
  ) => {
    context.clearRect(0, 0, template.size.width, template.size.height)

    for (const area of template.areas) {
      const frame = confirmed[area.id]

      drawMaskedArea(context, area, (areaContext) => {
        if (selectedAreaId === area.id && source && transform) {
          drawPhotoSource(
            areaContext,
            source,
            source.width,
            source.height,
            transform,
          )
        } else if (frame) {
          areaContext.drawImage(frame.canvas, 0, 0)
        } else {
          areaContext.fillStyle = area.initialColor
          areaContext.fillRect(0, 0, template.size.width, template.size.height)
        }
      })
    }
  }

  const drawLineArt = (context: CanvasRenderingContext2D) => {
    // 線画は全平面の合成後に一度だけ描き、半透明化やmask適用を受けない。
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
      assets = await loadPhotoSpikeAssets(template)
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

    renderPreview(canvas, source, state: PhotoPreviewState) {
      const hasSource = Boolean(source && source.width > 0 && source.height > 0)
      const alphas = getPhotoSceneAlphas(state.blend, hasSource)
      const sourceContext = getContext(sourcePlane)
      const artworkContext = getContext(artworkPlane)

      sourceContext.clearRect(0, 0, template.size.width, template.size.height)

      if (source) {
        drawPhotoSource(
          sourceContext,
          source,
          source.width,
          source.height,
          state.transform,
        )
      }

      drawArtwork(
        artworkContext,
        state.confirmed,
        hasSource ? state.selectedAreaId : undefined,
        hasSource ? source : undefined,
        hasSource ? state.transform : undefined,
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
      drawPhotoPreviewPlanes(
        context,
        sourcePlane,
        artworkPlane,
        alphas,
        drawLineArt,
      )
      context.restore()
    },

    confirmSource(source, transform) {
      const canvas = createCanvas(template.size.width, template.size.height)
      drawPhotoSource(
        getContext(canvas),
        source,
        source.width,
        source.height,
        transform,
      )
      return { canvas }
    },

    releaseFrame(frame: ConfirmedPhotoFrame) {
      // detached canvasは参照を外すだけでは即時解放されないため、backing storeも0へ戻す。
      frame.canvas.width = 0
      frame.canvas.height = 0
    },

    dispose() {
      sourcePlane.width = 0
      sourcePlane.height = 0
      artworkPlane.width = 0
      artworkPlane.height = 0
      areaPlane.width = 0
      areaPlane.height = 0
      assets = undefined
    },
  }
}
