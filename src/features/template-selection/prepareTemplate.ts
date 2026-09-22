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

/** ArtworkのAreaへ適用した描画resourceと、その解放手段を表す。 */
export type ArtworkAreaResource = Readonly<{
  source: CanvasImageSource
  release: () => void
}>

/** 次の作品状態とArea resourceから、置換候補の表示resourceを生成する。 */
export type ArtworkPreviewGenerator = (
  artwork: Artwork,
  areaResources: ReadonlyMap<string, ArtworkAreaResource>,
) => Promise<ArtworkPreview>

/** 制作中の作品と外部resourceを原子的に更新し、tab内で一括所有するsessionを表す。 */
export type ActiveCreationSession = Readonly<{
  catalogRevision: string
  template: Template
  readonly artwork: Artwork
  assets: LoadedTemplateAssets
  readonly preview: ArtworkPreview
  readonly areaResources: ReadonlyMap<string, ArtworkAreaResource>
  startedAt: string
  replaceAreaResource: (
    areaId: string,
    artwork: Artwork,
    resource: ArtworkAreaResource,
    generatePreview: ArtworkPreviewGenerator,
  ) => Promise<void>
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
    let currentArtwork = artwork
    let currentPreview = preview
    const areaResources = new Map<string, ArtworkAreaResource>()
    return Object.freeze({
      catalogRevision: snapshot.catalogRevision,
      template: entry.template,
      get artwork() {
        return currentArtwork
      },
      assets,
      get preview() {
        return currentPreview
      },
      get areaResources() {
        return areaResources as ReadonlyMap<string, ArtworkAreaResource>
      },
      startedAt: dependencies.now().toISOString(),
      async replaceAreaResource(
        areaId,
        nextArtwork,
        nextResource,
        generatePreview,
      ) {
        if (released) {
          nextResource.release()
          throw new Error('解放済みの制作sessionは更新できません。')
        }
        if (!entry.template.areas.some((area) => area.id === areaId)) {
          nextResource.release()
          throw new Error(`templateに存在しないareaです: ${areaId}`)
        }

        const pendingResources = new Map(areaResources)
        pendingResources.set(areaId, nextResource)
        let nextPreview: ArtworkPreview
        try {
          nextPreview = await generatePreview(nextArtwork, pendingResources)
        } catch (error) {
          nextResource.release()
          throw error
        }

        const previousResource = areaResources.get(areaId)
        const previousPreview = currentPreview
        currentArtwork = nextArtwork
        currentPreview = nextPreview
        areaResources.set(areaId, nextResource)
        previousResource?.release()
        previousPreview.release()
      },
      release() {
        // route離脱など複数の終了経路が重なってもresourceは一度だけ解放する。
        if (released) return
        released = true
        currentPreview.release()
        areaResources.forEach((resource) => resource.release())
        areaResources.clear()
        assets.release()
      },
    })
  } catch (error) {
    // session成立前の失敗では、呼び出し側へ所有権を渡せないためここでassetを解放する。
    assets.release()
    throw error
  }
}
