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
}

export type CatalogTemplate = {
  id: string
  assetRevision: string
  name: LocalizedText
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

export type SignedAsset = CatalogAsset & {
  url: string
}

export type SignedMask = SignedAsset & {
  id: string
  label: LocalizedText
}

export type PublishedTemplate = {
  id: string
  assetRevision: string
  name: LocalizedText
  thumbnail: SignedAsset
  lineArt: SignedAsset
  masks: SignedMask[]
}

export type TemplatesResponse = {
  apiVersion: string
  buildId: string
  serverTime: string
  catalogRevision: string
  sasExpiresAt: string
  publicationCounts: PublicationCounts
  templates: PublishedTemplate[]
}

export type ApiConfig = {
  storageConnectionString: string
  containerName: string
  catalogBlobName: string
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
