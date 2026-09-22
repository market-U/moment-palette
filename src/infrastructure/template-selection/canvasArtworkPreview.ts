import type { Artwork, Template } from '@/domain/template'
import type { LoadedTemplateAssets } from '@/features/template-selection/assetLoaderPort'
import type {
  ArtworkPreview,
  ArtworkPreviewPort,
} from '@/features/template-selection/artworkPreviewPort'

const artworkSize = 1080

/** Artworkの領域順にmaskと初期色を合成し、最後に線画を前面へ描画する。 */
export const drawInitialArtwork = (
  context: CanvasRenderingContext2D,
  layerContext: CanvasRenderingContext2D,
  template: Template,
  artwork: Artwork,
  assets: LoadedTemplateAssets,
): void => {
  context.clearRect(0, 0, artworkSize, artworkSize)
  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, artworkSize, artworkSize)

  for (const [index, area] of artwork.areas.entries()) {
    const definition = template.areas[index]
    const mask = assets.masks[index]
    if (
      !definition ||
      !mask ||
      definition.id !== area.areaId ||
      mask.id !== area.areaId
    ) {
      throw new Error('Artworkとmaskの順序が一致しません。')
    }
    // 既に本体へ描いたareaへsource-inが作用しないよう、mask単位で一時Canvasを使う。
    layerContext.clearRect(0, 0, artworkSize, artworkSize)
    layerContext.globalCompositeOperation = 'source-over'
    layerContext.drawImage(mask.source, 0, 0, artworkSize, artworkSize)
    layerContext.globalCompositeOperation = 'source-in'
    layerContext.fillStyle = area.fill.color
    layerContext.fillRect(0, 0, artworkSize, artworkSize)
    context.drawImage(layerContext.canvas, 0, 0, artworkSize, artworkSize)
  }
  context.drawImage(assets.lineArt.source, 0, 0, artworkSize, artworkSize)
}

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvasからpreviewを生成できません。'))
    }, 'image/png')
  })

type CanvasArtworkPreviewDependencies = {
  createCanvas: () => HTMLCanvasElement
  createObjectUrl: (blob: Blob) => string
  revokeObjectUrl: (url: string) => void
}

const browserDependencies = (): CanvasArtworkPreviewDependencies => ({
  createCanvas: () => document.createElement('canvas'),
  createObjectUrl: (blob) => URL.createObjectURL(blob),
  revokeObjectUrl: (url) => URL.revokeObjectURL(url),
})

/** Canvasで初期作品のPNGを生成し、object URLの所有権を管理するadapterを生成する。 */
export const createCanvasArtworkPreview = (
  dependencies: CanvasArtworkPreviewDependencies = browserDependencies(),
): ArtworkPreviewPort => ({
  async generate(template, artwork, assets): Promise<ArtworkPreview> {
    const canvas = dependencies.createCanvas()
    const layerCanvas = dependencies.createCanvas()
    canvas.width = artworkSize
    canvas.height = artworkSize
    layerCanvas.width = artworkSize
    layerCanvas.height = artworkSize
    const context = canvas.getContext('2d')
    const layerContext = layerCanvas.getContext('2d')
    if (!context || !layerContext)
      throw new Error('Canvas 2Dを利用できません。')
    drawInitialArtwork(context, layerContext, template, artwork, assets)
    const url = dependencies.createObjectUrl(await canvasToBlob(canvas))
    let released = false
    return Object.freeze({
      url,
      width: artworkSize,
      height: artworkSize,
      release() {
        // route離脱など複数の終了経路が重なってもobject URLは一度だけ破棄する。
        if (released) return
        released = true
        dependencies.revokeObjectUrl(url)
      },
    })
  },
})
