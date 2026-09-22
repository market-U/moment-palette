import type { Artwork, Template } from '@/domain/template'

import type { LoadedTemplateAssets } from './assetLoaderPort'

/** 制作画面に表示する初期作品画像と、その解放手段を表す。 */
export type ArtworkPreview = Readonly<{
  url: string
  width: number
  height: number
  release: () => void
}>

/** 作品状態とdecode済みassetから表示用画像を生成する境界を定義する。 */
export type ArtworkPreviewPort = {
  generate: (
    template: Template,
    artwork: Artwork,
    assets: LoadedTemplateAssets,
  ) => Promise<ArtworkPreview>
}
