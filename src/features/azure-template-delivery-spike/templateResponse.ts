import { TemplateCatalogError } from './templateCatalogPort'
import type {
  AvailableTemplate,
  LocalizedText,
  PublicationCounts,
  TemplateAssetReference,
  TemplateCatalogResponse,
  TemplateMaskReference,
} from './types'

const objectOf = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TemplateCatalogError('invalid-response')
  }
  return value as Record<string, unknown>
}

const textOf = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TemplateCatalogError('invalid-response')
  }
  return value
}

const dateOf = (value: unknown): string => {
  const text = textOf(value)
  if (Number.isNaN(Date.parse(text)))
    throw new TemplateCatalogError('invalid-response')
  return text
}

const localizedOf = (value: unknown): LocalizedText => {
  const object = objectOf(value)
  return { ja: textOf(object.ja), en: textOf(object.en) }
}

const assetOf = (value: unknown): TemplateAssetReference => {
  const object = objectOf(value)
  return {
    path: textOf(object.path),
    mimeType: textOf(object.mimeType),
    url: textOf(object.url),
  }
}

const maskOf = (value: unknown): TemplateMaskReference => {
  const object = objectOf(value)
  return {
    ...assetOf(object),
    id: textOf(object.id),
    label: localizedOf(object.label),
  }
}

const templateOf = (value: unknown): AvailableTemplate => {
  const object = objectOf(value)
  if (!Array.isArray(object.masks))
    throw new TemplateCatalogError('invalid-response')
  return {
    id: textOf(object.id),
    assetRevision: textOf(object.assetRevision),
    name: localizedOf(object.name),
    thumbnail: assetOf(object.thumbnail),
    lineArt: assetOf(object.lineArt),
    masks: object.masks.map(maskOf),
  }
}

const countsOf = (value: unknown): PublicationCounts => {
  const object = objectOf(value)
  const keys = ['published', 'unpublished', 'scheduled', 'expired'] as const
  for (const key of keys) {
    if (!Number.isInteger(object[key]) || Number(object[key]) < 0) {
      throw new TemplateCatalogError('invalid-response')
    }
  }
  return {
    published: Number(object.published),
    unpublished: Number(object.unpublished),
    scheduled: Number(object.scheduled),
    expired: Number(object.expired),
  }
}

export const parseTemplateCatalogResponse = (
  value: unknown,
): TemplateCatalogResponse => {
  const object = objectOf(value)
  if (!Array.isArray(object.templates))
    throw new TemplateCatalogError('invalid-response')
  return {
    apiVersion: textOf(object.apiVersion),
    buildId: textOf(object.buildId),
    serverTime: dateOf(object.serverTime),
    catalogRevision: textOf(object.catalogRevision),
    sasExpiresAt: dateOf(object.sasExpiresAt),
    publicationCounts: countsOf(object.publicationCounts),
    templates: object.templates.map(templateOf),
  }
}
