import {
  createInitialArtwork,
  type Artwork,
  type Template,
} from '@/domain/template'

import type {
  LoadedTemplateAssets,
  TemplateAssetLoaderPort,
} from './assetLoaderPort'
import type { ArtworkPreview, ArtworkPreviewPort } from './artworkPreviewPort'
import type { CatalogSnapshot } from './catalog'

const artworkSize = 1080

/** 制作中に必要なdomain状態と解放対象resourceをまとめて所有するsessionを表す。 */
export type ActiveCreationSession = Readonly<{
  catalogRevision: string
  template: Template
  artwork: Artwork
  assets: LoadedTemplateAssets
  preview: ArtworkPreview
  startedAt: string
  release: () => void
}>

type PrepareTemplateDependencies = {
  assetLoader: TemplateAssetLoaderPort
  previewPort: ArtworkPreviewPort
  now: () => Date
}

/** Catalogと作品で保証した順序・座標系を、decode済みassetにも要求する。 */
const assertAssets = (
  template: Template,
  assets: LoadedTemplateAssets,
): void => {
  const values = [assets.lineArt, ...assets.masks]
  if (
    values.some(
      (asset) => asset.width !== artworkSize || asset.height !== artworkSize,
    )
  ) {
    throw new Error('template assetは1080×1080である必要があります。')
  }
  if (
    assets.masks.length !== template.areas.length ||
    assets.masks.some((mask, index) => mask.id !== template.areas[index]?.id)
  ) {
    throw new Error('template assetのmask順がcatalogと一致しません。')
  }
}

/** 選択したtemplateの全assetと初期previewを準備し、成功時だけ制作sessionを生成する。 */
export const prepareTemplate = async (
  snapshot: CatalogSnapshot,
  templateId: string,
  dependencies: PrepareTemplateDependencies,
): Promise<ActiveCreationSession> => {
  const entry = snapshot.templates.find(
    ({ template }) => template.id === templateId,
  )
  if (!entry) throw new Error('選択したtemplateがcatalogにありません。')

  const assets = await dependencies.assetLoader.load(entry)
  try {
    assertAssets(entry.template, assets)
    const artwork = createInitialArtwork(entry.template)
    const preview = await dependencies.previewPort.generate(
      entry.template,
      artwork,
      assets,
    )
    let released = false
    return Object.freeze({
      catalogRevision: snapshot.catalogRevision,
      template: entry.template,
      artwork,
      assets,
      preview,
      startedAt: dependencies.now().toISOString(),
      release() {
        // route離脱など複数の終了経路が重なってもresourceは一度だけ解放する。
        if (released) return
        released = true
        preview.release()
        assets.release()
      },
    })
  } catch (error) {
    // session成立前の失敗では、呼び出し側へ所有権を渡せないためここでassetを解放する。
    assets.release()
    throw error
  }
}
