import type { CameraSpikeTemplate } from '@/features/camera-compositing-spike/types'

export interface LoadedCameraSpikeAssets {
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

const assertArtworkSize = (
  image: HTMLImageElement,
  expectedWidth: number,
  expectedHeight: number,
  url: string,
) => {
  if (
    image.naturalWidth !== expectedWidth ||
    image.naturalHeight !== expectedHeight
  ) {
    throw new Error(
      `${url} must be ${String(expectedWidth)}x${String(expectedHeight)}, received ${String(image.naturalWidth)}x${String(image.naturalHeight)}`,
    )
  }
}

export const loadCameraSpikeAssets = async (
  template: CameraSpikeTemplate,
): Promise<LoadedCameraSpikeAssets> => {
  const lineArt = await loadImage(template.lineArtUrl)
  assertArtworkSize(
    lineArt,
    template.size.width,
    template.size.height,
    template.lineArtUrl,
  )

  const masks = new Map<string, HTMLImageElement>()

  for (const area of template.areas) {
    const mask = await loadImage(area.maskUrl)
    assertArtworkSize(
      mask,
      template.size.width,
      template.size.height,
      area.maskUrl,
    )
    masks.set(area.id, mask)
  }

  return { lineArt, masks }
}
