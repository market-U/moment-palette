export type LocalizedText = {
  ja: string
  en: string
}

export type CatalogAsset = {
  path: string
  mimeType: string
}

export type CatalogMask = CatalogAsset & {
  id: string
  label: LocalizedText
  initialColor: string
}

export type CatalogTemplate = {
  id: string
  assetRevision: string
  name: LocalizedText
  tags: string[]
  published: boolean
  publishFrom: string | null
  publishUntil: string | null
  thumbnail: CatalogAsset
  lineArt: CatalogAsset
  masks: CatalogMask[]
}

export type TemplateCatalog = {
  schemaVersion: 1
  catalogRevision: string
  templates: CatalogTemplate[]
}

export type PublicationCounts = {
  published: number
  unpublished: number
  scheduled: number
  expired: number
}

/** APIがbrowserへ公開する、内部Blob pathを含まないasset参照を表す。 */
export type SignedAsset = {
  mimeType: string
  url: string
}

/** APIがbrowserへ公開するmask参照と制作に必要な表示情報を表す。 */
export type SignedMask = SignedAsset & {
  id: string
  label: LocalizedText
  initialColor: string
}

export type PublishedTemplate = {
  id: string
  assetRevision: string
  name: LocalizedText
  tags: string[]
  thumbnail: SignedAsset
  lineArt: SignedAsset
  masks: SignedMask[]
}

export type TemplatesResponse = {
  schemaVersion: 1
  apiVersion: string
  buildId: string
  serverTime: string
  catalogRevision: string
  sasExpiresAt: string
  templates: PublishedTemplate[]
}

export type ApiConfig = {
  storageConnectionString: string
  containerName: string
  catalogFileName: string
}

export type PublicErrorCode =
  | 'configuration-invalid'
  | 'catalog-invalid'
  | 'storage-unavailable'
  | 'unexpected-error'

export class PublicApiError extends Error {
  constructor(
    readonly code: PublicErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'PublicApiError'
  }
}
