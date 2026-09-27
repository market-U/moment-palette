import type { AreaHitTesterPort } from '@/features/template-selection/areaHitTesterPort'

const artworkSize = 1080
const alphaThreshold = 128

type Dependencies = Readonly<{ createCanvas: () => HTMLCanvasElement }>

const browserDependencies: Dependencies = {
  createCanvas: () => document.createElement('canvas'),
}

const encodeArea = (index: number) => `rgb(${index + 1} 0 0)`

/** decode済みmaskを非表示の色付きCanvasへ合成するArea hit testerを生成する。 */
export const createCanvasAreaHitTester = (
  dependencies: Dependencies = browserDependencies,
): AreaHitTesterPort => ({
  create(template, assets) {
    const hitMap = dependencies.createCanvas()
    const layer = dependencies.createCanvas()
    hitMap.width = artworkSize
    hitMap.height = artworkSize
    layer.width = artworkSize
    layer.height = artworkSize
    const hitContext = hitMap.getContext('2d')
    const layerContext = layer.getContext('2d')
    if (!hitContext || !layerContext)
      throw new Error('Area hit mapのCanvas 2Dを利用できません。')
    const areaIds = new Map<number, string>()
    for (const [index, area] of template.areas.entries()) {
      const mask = assets.masks[index]
      if (!mask || mask.id !== area.id)
        throw new Error('Areaとmaskの順序が一致しません。')
      areaIds.set(index + 1, area.id)
      layerContext.clearRect(0, 0, artworkSize, artworkSize)
      layerContext.drawImage(mask.source, 0, 0, artworkSize, artworkSize)
      layerContext.globalCompositeOperation = 'source-in'
      layerContext.fillStyle = encodeArea(index)
      layerContext.fillRect(0, 0, artworkSize, artworkSize)
      layerContext.globalCompositeOperation = 'source-over'
      hitContext.drawImage(layer, 0, 0, artworkSize, artworkSize)
    }
    let released = false
    return Object.freeze({
      findAreaAt(x, y) {
        if (released || x < 0 || y < 0 || x >= artworkSize || y >= artworkSize)
          return undefined
        const pixel = hitContext.getImageData(
          Math.floor(x),
          Math.floor(y),
          1,
          1,
        ).data
        return pixel[3] >= alphaThreshold
          ? areaIds.get(pixel[0] ?? 0)
          : undefined
      },
      release() {
        if (released) return
        released = true
        hitMap.width = 0
        hitMap.height = 0
        layer.width = 0
        layer.height = 0
      },
    })
  },
})
