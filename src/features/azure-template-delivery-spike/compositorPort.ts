import type { LoadedTemplateAssets } from './assetLoaderPort'

export type CompletedTemplateImage = {
  blob: Blob
  objectUrl: string
  width: number
  height: number
  generationMs: number
  release: () => void
}

export type TemplateCompositorPort = {
  generate: (assets: LoadedTemplateAssets) => Promise<CompletedTemplateImage>
}
