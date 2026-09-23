import type { ArtworkFill } from '@/domain/template'
import type {
  CameraArtworkContext,
  CameraArtworkPreview,
  CameraCompositorPort,
  CameraPreviewState,
  CapturedCameraFrame,
} from '@/features/camera-fill/compositorPort'
import { getCameraSceneAlphas } from '@/features/camera-fill/scene'
import type { MediaTransform, Rect } from '@/shared/lib/mediaTransform'

const artworkSize = 1080
const haveCurrentData = 2

type CanvasCameraCompositorDependencies = Readonly<{
  createCanvas: () => HTMLCanvasElement
  createObjectUrl: (blob: Blob) => string
  revokeObjectUrl: (url: string) => void
}>

const browserDependencies = (): CanvasCameraCompositorDependencies => ({
  createCanvas: () => document.createElement('canvas'),
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
})

const sizeCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = artworkSize
  canvas.height = artworkSize
  return canvas
}

const requireContext = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D contextを取得できません。')
  return context
}

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvasから作品previewを生成できません。'))
    }, 'image/png')
  })

/** Camera sourceを作品座標へ描画し、前面cameraでは同じ矩形内で鏡像化する。 */
export const drawCameraSource = (
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  transform: MediaTransform,
  mirrorSource = false,
): void => {
  const width = sourceWidth * transform.scale
  const height = sourceHeight * transform.scale
  context.save()
  try {
    if (mirrorSource) {
      context.translate(transform.offsetX + width, transform.offsetY)
      context.scale(-1, 1)
      context.drawImage(source, 0, 0, width, height)
    } else {
      context.drawImage(
        source,
        transform.offsetX,
        transform.offsetY,
        width,
        height,
      )
    }
  } finally {
    context.restore()
  }
}

const drawFill = (
  context: CanvasRenderingContext2D,
  fill: ArtworkFill,
  areaId: string,
  initialColor: string,
  areaResources: ReadonlyMap<string, CapturedCameraFrame>,
) => {
  if (fill.kind === 'initial') {
    context.fillStyle = fill.color
    context.fillRect(0, 0, artworkSize, artworkSize)
    return
  }

  const resource = areaResources.get(areaId)
  if (!resource) throw new Error(`camera fillのresourceがありません: ${areaId}`)
  if (fill.kind === 'photo') {
    context.fillStyle = initialColor
    context.fillRect(0, 0, artworkSize, artworkSize)
  }
  context.drawImage(resource.source, 0, 0, artworkSize, artworkSize)
}

/** 取得済みtemplate assetだけを使う製品用Canvas camera compositorを生成する。 */
export const createCanvasCameraCompositor = (
  dependencies: CanvasCameraCompositorDependencies = browserDependencies(),
): CameraCompositorPort => {
  const sourcePlane = sizeCanvas(dependencies.createCanvas())
  const artworkPlane = sizeCanvas(dependencies.createCanvas())
  const areaPlane = sizeCanvas(dependencies.createCanvas())
  // 写真の連続操作中は、選択Areaより前後を描き直さない。F/Sで確認した
  // 固定三段合成を製品のtemplate asset境界でも維持する。
  const beforeEditingPlane = sizeCanvas(dependencies.createCanvas())
  const afterEditingPlane = sizeCanvas(dependencies.createCanvas())
  let preparedPhoto:
    | Readonly<{
        artwork: CameraArtworkContext['artwork']
        areaResources: CameraArtworkContext['areaResources']
        template: CameraArtworkContext['template']
        assets: CameraArtworkContext['assets']
        areaId: string
        index: number
      }>
    | undefined

  const drawStoredArea = (
    destination: CanvasRenderingContext2D,
    state: CameraArtworkContext,
    index: number,
  ) => {
    const area = state.artwork.areas[index]
    const definition = state.template.areas[index]
    const mask = state.assets.masks[index]
    if (
      !area ||
      !definition ||
      !mask ||
      definition.id !== area.areaId ||
      mask.id !== area.areaId
    ) {
      throw new Error('Artworkとmaskの順序が一致しません。')
    }

    const layer = requireContext(areaPlane)
    layer.save()
    layer.clearRect(0, 0, artworkSize, artworkSize)
    layer.globalAlpha = 1
    layer.globalCompositeOperation = 'source-over'
    drawFill(
      layer,
      area.fill,
      area.areaId,
      definition.initialColor,
      state.areaResources,
    )
    layer.globalCompositeOperation = 'destination-in'
    layer.drawImage(mask.source, 0, 0, artworkSize, artworkSize)
    layer.restore()
    destination.drawImage(areaPlane, 0, 0, artworkSize, artworkSize)
  }

  const preparePhotoArtwork = (
    state: Omit<CameraPreviewState, 'mirrorSource'>,
  ) => {
    const index = state.artwork.areas.findIndex(
      (area) => area.areaId === state.selectedAreaId,
    )
    if (index < 0) throw new Error('選択中のAreaがArtworkに存在しません。')

    const before = requireContext(beforeEditingPlane)
    const after = requireContext(afterEditingPlane)
    before.clearRect(0, 0, artworkSize, artworkSize)
    after.clearRect(0, 0, artworkSize, artworkSize)
    for (const [areaIndex] of state.artwork.areas.entries()) {
      if (areaIndex < index) drawStoredArea(before, state, areaIndex)
      else if (areaIndex > index) drawStoredArea(after, state, areaIndex)
    }
    preparedPhoto = {
      artwork: state.artwork,
      areaResources: state.areaResources,
      template: state.template,
      assets: state.assets,
      areaId: state.selectedAreaId,
      index,
    }
  }

  const requiresPhotoPreparation = (
    state: Omit<CameraPreviewState, 'mirrorSource'>,
  ) =>
    !preparedPhoto ||
    preparedPhoto.artwork !== state.artwork ||
    preparedPhoto.areaResources !== state.areaResources ||
    preparedPhoto.template !== state.template ||
    preparedPhoto.assets !== state.assets ||
    preparedPhoto.areaId !== state.selectedAreaId

  const drawArtwork = (
    context: CanvasRenderingContext2D,
    state: CameraArtworkContext,
    live?: Readonly<{
      selectedAreaId: string
      source: CanvasImageSource
      sourceSize: { width: number; height: number }
      transform: MediaTransform
      mirrorSource: boolean
      fillBackground: boolean
    }>,
  ) => {
    context.clearRect(0, 0, artworkSize, artworkSize)
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, artworkSize, artworkSize)

    for (const [index, area] of state.artwork.areas.entries()) {
      const definition = state.template.areas[index]
      const mask = state.assets.masks[index]
      if (
        !definition ||
        !mask ||
        definition.id !== area.areaId ||
        mask.id !== area.areaId
      )
        throw new Error('Artworkとmaskの順序が一致しません。')

      const layer = requireContext(areaPlane)
      layer.save()
      layer.clearRect(0, 0, artworkSize, artworkSize)
      layer.globalAlpha = 1
      layer.globalCompositeOperation = 'source-over'
      if (
        live?.selectedAreaId === area.areaId &&
        live.sourceSize.width > 0 &&
        live.sourceSize.height > 0
      ) {
        if (live.fillBackground) {
          layer.fillStyle = definition.initialColor
          layer.fillRect(0, 0, artworkSize, artworkSize)
        }
        drawCameraSource(
          layer,
          live.source,
          live.sourceSize.width,
          live.sourceSize.height,
          live.transform,
          live.mirrorSource,
        )
      } else {
        drawFill(
          layer,
          area.fill,
          area.areaId,
          definition.initialColor,
          state.areaResources,
        )
      }
      layer.globalCompositeOperation = 'destination-in'
      layer.drawImage(mask.source, 0, 0, artworkSize, artworkSize)
      layer.restore()
      context.drawImage(areaPlane, 0, 0, artworkSize, artworkSize)
    }
  }

  const drawLineArt = (
    context: CanvasRenderingContext2D,
    state: CameraArtworkContext,
  ) => {
    context.drawImage(
      state.assets.lineArt.source,
      0,
      0,
      artworkSize,
      artworkSize,
    )
  }

  return {
    resizePreview(canvas, cssPixels, pixelRatio) {
      const resolution = Math.max(
        1,
        Math.min(artworkSize, Math.round(cssPixels * pixelRatio)),
      )
      if (canvas.width !== resolution || canvas.height !== resolution) {
        canvas.width = resolution
        canvas.height = resolution
      }
      return { width: resolution, height: resolution }
    },
    renderPreview(canvas, video, state: CameraPreviewState) {
      const hasLiveSource = Boolean(
        video && video.readyState >= haveCurrentData,
      )
      const sourceContext = requireContext(sourcePlane)
      const artworkContext = requireContext(artworkPlane)
      sourceContext.clearRect(0, 0, artworkSize, artworkSize)
      if (hasLiveSource && video) {
        drawCameraSource(
          sourceContext,
          video,
          video.videoWidth,
          video.videoHeight,
          state.transform,
          state.mirrorSource,
        )
      }
      drawArtwork(
        artworkContext,
        state,
        hasLiveSource && video
          ? {
              selectedAreaId: state.selectedAreaId,
              source: video,
              sourceSize: {
                width: video.videoWidth,
                height: video.videoHeight,
              },
              transform: state.transform,
              mirrorSource: state.mirrorSource,
              fillBackground: false,
            }
          : undefined,
      )

      const alphas = getCameraSceneAlphas(state.blend, hasLiveSource)
      const context = requireContext(canvas)
      context.save()
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.scale(canvas.width / artworkSize, canvas.height / artworkSize)
      context.globalAlpha = alphas.source
      context.drawImage(sourcePlane, 0, 0)
      context.globalAlpha = alphas.artwork
      context.drawImage(artworkPlane, 0, 0)
      context.globalAlpha = alphas.lineArt
      drawLineArt(context, state)
      context.restore()
    },
    renderPhotoPreview(canvas, source, sourceSize, state) {
      if (requiresPhotoPreparation(state)) preparePhotoArtwork(state)
      const prepared = preparedPhoto
      if (!prepared) throw new Error('写真previewの静的cacheを準備できません。')
      const sourceContext = requireContext(sourcePlane)
      const artworkContext = requireContext(artworkPlane)
      sourceContext.clearRect(0, 0, artworkSize, artworkSize)
      drawCameraSource(
        sourceContext,
        source,
        sourceSize.width,
        sourceSize.height,
        state.transform,
      )
      artworkContext.clearRect(0, 0, artworkSize, artworkSize)
      artworkContext.drawImage(
        beforeEditingPlane,
        0,
        0,
        artworkSize,
        artworkSize,
      )
      const area = state.artwork.areas[prepared.index]
      const definition = state.template.areas[prepared.index]
      const mask = state.assets.masks[prepared.index]
      if (
        !area ||
        !definition ||
        !mask ||
        area.areaId !== state.selectedAreaId ||
        definition.id !== area.areaId ||
        mask.id !== area.areaId
      ) {
        throw new Error('選択中のAreaとmaskの順序が一致しません。')
      }
      const layer = requireContext(areaPlane)
      layer.save()
      layer.clearRect(0, 0, artworkSize, artworkSize)
      layer.globalAlpha = 1
      layer.globalCompositeOperation = 'source-over'
      // 写真の透明画素と画像外の余白では、他Areaを見せず選択Areaの初期色を使う。
      layer.fillStyle = definition.initialColor
      layer.fillRect(0, 0, artworkSize, artworkSize)
      drawCameraSource(
        layer,
        source,
        sourceSize.width,
        sourceSize.height,
        state.transform,
      )
      layer.globalCompositeOperation = 'destination-in'
      layer.drawImage(mask.source, 0, 0, artworkSize, artworkSize)
      layer.restore()
      artworkContext.drawImage(areaPlane, 0, 0, artworkSize, artworkSize)
      artworkContext.drawImage(
        afterEditingPlane,
        0,
        0,
        artworkSize,
        artworkSize,
      )
      const alphas = getCameraSceneAlphas(state.blend, true)
      const context = requireContext(canvas)
      context.save()
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.scale(canvas.width / artworkSize, canvas.height / artworkSize)
      context.globalAlpha = alphas.source
      context.drawImage(sourcePlane, 0, 0)
      context.globalAlpha = alphas.artwork
      context.drawImage(artworkPlane, 0, 0)
      context.globalAlpha = alphas.lineArt
      drawLineArt(context, state)
      context.restore()
    },
    getPhotoAreaBounds(state, areaId): Rect {
      const mask = state.assets.masks.find(
        (candidate) => candidate.id === areaId,
      )
      if (!mask) throw new Error('選択中のAreaのmaskがありません。')
      const canvas = sizeCanvas(dependencies.createCanvas())
      try {
        const context = requireContext(canvas)
        context.clearRect(0, 0, artworkSize, artworkSize)
        context.drawImage(mask.source, 0, 0, artworkSize, artworkSize)
        const pixels = context.getImageData(0, 0, artworkSize, artworkSize).data
        let left = artworkSize
        let top = artworkSize
        let right = -1
        let bottom = -1
        for (let y = 0; y < artworkSize; y += 1) {
          for (let x = 0; x < artworkSize; x += 1) {
            if (pixels[(y * artworkSize + x) * 4 + 3] === 0) continue
            left = Math.min(left, x)
            top = Math.min(top, y)
            right = Math.max(right, x)
            bottom = Math.max(bottom, y)
          }
        }
        if (right < left || bottom < top) {
          throw new Error('選択中のAreaのmaskに不透明画素がありません。')
        }
        return {
          x: left,
          y: top,
          width: right - left + 1,
          height: bottom - top + 1,
        }
      } finally {
        canvas.width = 0
        canvas.height = 0
      }
    },
    captureFrame(video, transform, mirrorSource): CapturedCameraFrame {
      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        throw new Error('撮影可能なvideo frameがありません。')
      }
      const canvas = sizeCanvas(dependencies.createCanvas())
      drawCameraSource(
        requireContext(canvas),
        video,
        video.videoWidth,
        video.videoHeight,
        transform,
        mirrorSource,
      )
      let released = false
      return Object.freeze({
        source: canvas,
        release() {
          if (released) return
          released = true
          canvas.width = 0
          canvas.height = 0
        },
      })
    },
    capturePhotoFrame(source, sourceSize, transform): CapturedCameraFrame {
      const canvas = sizeCanvas(dependencies.createCanvas())
      drawCameraSource(
        requireContext(canvas),
        source,
        sourceSize.width,
        sourceSize.height,
        transform,
      )
      let released = false
      return Object.freeze({
        source: canvas,
        release() {
          if (released) return
          released = true
          canvas.width = 0
          canvas.height = 0
        },
      })
    },
    async generatePreview(
      artworkContext: CameraArtworkContext,
    ): Promise<CameraArtworkPreview> {
      const canvas = sizeCanvas(dependencies.createCanvas())
      try {
        const context = requireContext(canvas)
        drawArtwork(context, artworkContext)
        drawLineArt(context, artworkContext)
        const url = dependencies.createObjectUrl(await canvasToBlob(canvas))
        let released = false
        return Object.freeze({
          url,
          width: artworkSize,
          height: artworkSize,
          release() {
            if (released) return
            released = true
            dependencies.revokeObjectUrl(url)
          },
        })
      } finally {
        canvas.width = 0
        canvas.height = 0
      }
    },
  }
}
