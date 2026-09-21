import type { LoadedTemplateAssets } from '@/features/azure-template-delivery-spike/assetLoaderPort'
import type {
  CompletedTemplateImage,
  TemplateCompositorPort,
} from '@/features/azure-template-delivery-spike/compositorPort'

const size = 1080
const maskColors = [
  '#f2c6d4',
  '#cadfca',
  '#f4d7a5',
  '#b9d7e8',
  '#d8c7e8',
  '#f0baa7',
]

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('CanvasからPNGを生成できません。'))
    }, 'image/png')
  })

export const drawTemplate = (
  context: CanvasRenderingContext2D,
  assets: LoadedTemplateAssets,
): void => {
  context.clearRect(0, 0, size, size)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)

  for (const [index, mask] of assets.masks.entries()) {
    context.save()
    context.drawImage(mask.source, 0, 0, size, size)
    context.globalCompositeOperation = 'source-in'
    context.fillStyle = maskColors[index % maskColors.length] ?? '#cccccc'
    context.fillRect(0, 0, size, size)
    context.restore()
  }
  context.drawImage(assets.lineArt.source, 0, 0, size, size)
}

export const createCanvasTemplateCompositor = (): TemplateCompositorPort => ({
  async generate(assets): Promise<CompletedTemplateImage> {
    const startedAt = performance.now()
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2Dを利用できません。')

    // DOMやserver上のCSSを参照せず、Start時にdecode済みの画像だけを描画する。
    drawTemplate(context, assets)
    const blob = await canvasToBlob(canvas)
    const objectUrl = URL.createObjectURL(blob)
    let released = false
    return {
      blob,
      objectUrl,
      width: size,
      height: size,
      generationMs: performance.now() - startedAt,
      release() {
        if (released) return
        released = true
        URL.revokeObjectURL(objectUrl)
      },
    }
  },
})
