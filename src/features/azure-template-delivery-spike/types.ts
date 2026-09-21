export type BuildIdentity = {
  appVersion: string
  buildId: string
}

export type ReleaseMetadata = BuildIdentity

export type LocalizedText = {
  ja: string
  en: string
}

export type TemplateAssetReference = {
  path: string
  mimeType: string
  url: string
}

export type TemplateMaskReference = TemplateAssetReference & {
  id: string
  label: LocalizedText
}

export type AvailableTemplate = {
  id: string
  assetRevision: string
  name: LocalizedText
  thumbnail: TemplateAssetReference
  lineArt: TemplateAssetReference
  masks: TemplateMaskReference[]
}

export type PublicationCounts = {
  published: number
  unpublished: number
  scheduled: number
  expired: number
}

export type TemplateCatalogResponse = {
  apiVersion: string
  buildId: string
  serverTime: string
  catalogRevision: string
  sasExpiresAt: string
  publicationCounts: PublicationCounts
  templates: AvailableTemplate[]
}

export type SessionSnapshot = BuildIdentity & {
  catalogRevision: string
  templateRevision: string
  startedAt: string
}
