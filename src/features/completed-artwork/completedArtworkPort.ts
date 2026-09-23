import type { Artwork, Template } from '@/domain/template'

/** 完成PNGを描画するために制作sessionから渡す、decode済みtemplate assetを表す。 */
export type CompletedArtworkAssets = Readonly<{
  lineArt: CanvasImageSource
  masks: readonly Readonly<{ id: string; source: CanvasImageSource }>[]
}>

/** Areaへ適用済みの画像sourceを完成画像へ渡す境界を表す。 */
export type CompletedArtworkAreaResource = Readonly<{
  source: CanvasImageSource
}>

/** 完成PNGの生成に必要な、制作session内だけで完結する入力を表す。 */
export type CompletedArtworkInput = Readonly<{
  template: Template
  artwork: Artwork
  assets: CompletedArtworkAssets
  areaResources: ReadonlyMap<string, CompletedArtworkAreaResource>
}>

/** 表示と共有で再利用する完成PNG、およびそのobject URLの解放手段を表す。 */
export type CompletedArtworkResource = Readonly<{
  blob: Blob
  objectUrl: string
  width: number
  height: number
  dispose: () => void
}>

/** 制作sessionのresourceから完成PNGを生成する外部入出力境界を定義する。 */
export type CompletedArtworkGeneratorPort = {
  generate: (input: CompletedArtworkInput) => Promise<CompletedArtworkResource>
}
