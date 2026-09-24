import type { ArtworkFill } from '@/domain/template'
import type {
  CompletedArtworkGeneratorPort,
  CompletedArtworkInput,
} from '@/features/completed-artwork/completedArtworkPort'

const artworkSize = 1080

type CanvasDependencies = Readonly<{
  createCanvas: () => HTMLCanvasElement
  createObjectUrl: (blob: Blob) => string
  revokeObjectUrl: (url: string) => void
}>

const browserDependencies = (): CanvasDependencies => ({
  createCanvas: () => document.createElement('canvas'),
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
})

const requireContext = (
  canvas: HTMLCanvasElement,
): CanvasRenderingContext2D => {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2Dを利用できません。')
  return context
}

const toPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob?.type === 'image/png') resolve(blob)
      else reject(new Error('完成PNGを生成できませんでした。'))
    }, 'image/png')
  })

const drawFill = (
  context: CanvasRenderingContext2D,
  fill: ArtworkFill,
  areaId: string,
  initialColor: string,
  areaResources: CompletedArtworkInput['areaResources'],
): void => {
  if (fill.kind === 'initial') {
    context.fillStyle = fill.color
    context.fillRect(0, 0, artworkSize, artworkSize)
    return
  }
  if (fill.kind === 'solid') {
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

/** 制作sessionが保持する画像だけから完成PNGを合成するCanvas adapterを生成する。 */
export const createCanvasCompletedArtworkGenerator = (
  dependencies: CanvasDependencies = browserDependencies(),
): CompletedArtworkGeneratorPort => ({
  async generate(input) {
    const canvas = dependencies.createCanvas()
    const layerCanvas = dependencies.createCanvas()
    canvas.width = artworkSize
    canvas.height = artworkSize
    layerCanvas.width = artworkSize
    layerCanvas.height = artworkSize
    let objectUrl: string | undefined

    try {
      const context = requireContext(canvas)
      const layer = requireContext(layerCanvas)
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, artworkSize, artworkSize)

      for (const [index, area] of input.artwork.areas.entries()) {
        const definition = input.template.areas[index]
        const mask = input.assets.masks[index]
        if (
          !definition ||
          !mask ||
          definition.id !== area.areaId ||
          mask.id !== area.areaId
        ) {
          throw new Error('Artworkとmaskの順序が一致しません。')
        }
        layer.save()
        layer.clearRect(0, 0, artworkSize, artworkSize)
        layer.globalCompositeOperation = 'source-over'
        drawFill(
          layer,
          area.fill,
          area.areaId,
          definition.initialColor,
          input.areaResources,
        )
        layer.globalCompositeOperation = 'destination-in'
        layer.drawImage(mask.source, 0, 0, artworkSize, artworkSize)
        layer.restore()
        context.drawImage(layerCanvas, 0, 0, artworkSize, artworkSize)
      }
      context.drawImage(input.assets.lineArt, 0, 0, artworkSize, artworkSize)
      const blob = await toPngBlob(canvas)
      objectUrl = dependencies.createObjectUrl(blob)
      const stableUrl = objectUrl
      let disposed = false
      return {
        blob,
        objectUrl: stableUrl,
        width: artworkSize,
        height: artworkSize,
        dispose() {
          if (disposed) return
          disposed = true
          dependencies.revokeObjectUrl(stableUrl)
        },
      }
    } catch (error) {
      if (objectUrl) dependencies.revokeObjectUrl(objectUrl)
      throw error
    } finally {
      // Blobへ出力後は一時CanvasのRGBA backing storeを保持しない。
      canvas.width = 0
      canvas.height = 0
      layerCanvas.width = 0
      layerCanvas.height = 0
    }
  },
})
