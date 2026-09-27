import type { Template } from '@/domain/template'

import type { LoadedTemplateAssets } from './assetLoaderPort'

/** 制作session内の作品座標からAreaを特定する一時resourceを表す。 */
export type AreaHitTester = Readonly<{
  findAreaAt: (x: number, y: number) => string | undefined
  release: () => void
}>

/** decode済みtemplate maskからsession用のArea hit testerを生成する境界を定義する。 */
export type AreaHitTesterPort = {
  create: (template: Template, assets: LoadedTemplateAssets) => AreaHitTester
}
