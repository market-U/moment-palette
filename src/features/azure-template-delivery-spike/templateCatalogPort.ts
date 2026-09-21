import type { TemplateCatalogResponse } from './types'

export type TemplateCatalogFailure = 'network' | 'http' | 'invalid-response'

export class TemplateCatalogError extends Error {
  constructor(readonly kind: TemplateCatalogFailure) {
    super('テンプレート一覧を取得できません。')
    this.name = 'TemplateCatalogError'
  }
}

export type TemplateCatalogPort = {
  loadAvailable: () => Promise<TemplateCatalogResponse>
}
