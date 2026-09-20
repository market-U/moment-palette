import type { PhotoSpikeTemplate } from '@/features/photo-import-spike/types'

export interface LoadedPhotoSpikeAssets {
  lineArt: HTMLImageElement
  masks: Map<string, HTMLImageElement>
}

const loadImage = async (url: string) => {
  const image = new Image()
  image.decoding = 'async'
  image.src = url
  await image.decode()
  return image
}

const assertSize = (
  image: HTMLImageElement,
  width: number,
  height: number,
  url: string,
) => {
  if (image.naturalWidth !== width || image.naturalHeight !== height) {
    throw new Error(
      `${url}の寸法が${String(width)}×${String(height)}ではありません。`,
    )
  }
}

export const loadPhotoSpikeAssets = async (
  template: PhotoSpikeTemplate,
): Promise<LoadedPhotoSpikeAssets> => {
  const lineArt = await loadImage(template.lineArtUrl)
  assertSize(
    lineArt,
    template.size.width,
    template.size.height,
    template.lineArtUrl,
  )
  const masks = new Map<string, HTMLImageElement>()

  for (const area of template.areas) {
    const mask = await loadImage(area.maskUrl)
    assertSize(mask, template.size.width, template.size.height, area.maskUrl)
    masks.set(area.id, mask)
  }

  return { lineArt, masks }
}
