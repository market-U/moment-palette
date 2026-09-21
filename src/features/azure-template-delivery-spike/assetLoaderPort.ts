import type { AvailableTemplate } from './types'

export type DecodedTemplateAsset = {
  path: string
  mimeType: string
  byteLength: number
  width: number
  height: number
  source: CanvasImageSource
  release: () => void
}

export type LoadedTemplateAssets = {
  lineArt: DecodedTemplateAsset
  masks: Array<DecodedTemplateAsset & { id: string }>
  release: () => void
}

export type TemplateAssetLoaderPort = {
  load: (template: AvailableTemplate) => Promise<LoadedTemplateAssets>
}
