import type { TemplateCatalogEntry } from './catalog'

/** Browserで描画可能なdecode済み画像と、その解放手段を表す。 */
export type DecodedTemplateAsset = Readonly<{
  mimeType: string
  byteLength: number
  width: number
  height: number
  source: CanvasImageSource
  release: () => void
}>

/** Catalog順を維持して読み込んだ線画と全maskを一括所有する。 */
export type LoadedTemplateAssets = Readonly<{
  lineArt: DecodedTemplateAsset
  masks: readonly (DecodedTemplateAsset & Readonly<{ id: string }>)[]
  release: () => void
}>

/** 選択したテンプレートの全画像を取得してdecodeする境界を定義する。 */
export type TemplateAssetLoaderPort = {
  load: (entry: TemplateCatalogEntry) => Promise<LoadedTemplateAssets>
}
