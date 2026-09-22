import type { CatalogSnapshot } from './catalog'

export type TemplateCatalogFailure = 'network' | 'http' | 'invalid-response'

/** Catalog取得失敗を公開可能な原因区分とともに表す。 */
export class TemplateCatalogError extends Error {
  constructor(readonly kind: TemplateCatalogFailure) {
    super('テンプレート一覧を取得できません。')
    this.name = 'TemplateCatalogError'
  }
}

/** Start時に利用可能なテンプレートのsnapshotを取得する境界を定義する。 */
export type TemplateCatalogPort = {
  loadAvailable: () => Promise<CatalogSnapshot>
}
