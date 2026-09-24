import {
  PublicApiError,
  type CatalogAsset,
  type CatalogMask,
  type CatalogTemplate,
  type LocalizedText,
  type PublicationCounts,
  type TemplateCatalog,
} from './types'

const isoUtcPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const safePathPattern = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/
const idPattern = /^[a-z0-9][a-z0-9-]*$/
const opaqueHexColorPattern = /^#[0-9A-F]{6}$/

const invalid = (field: string): never => {
  throw new PublicApiError(
    'catalog-invalid',
    `カタログの ${field} が不正です。`,
    502,
  )
}

const asObject = (value: unknown, field: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid(field)
  return value as Record<string, unknown>
}

const asNonEmptyString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim() === '') invalid(field)
  return value as string
}

const parseId = (value: unknown, field: string): string => {
  const result = asNonEmptyString(value, field)
  if (!idPattern.test(result)) invalid(field)
  return result
}

const parseLocalizedText = (value: unknown, field: string): LocalizedText => {
  const object = asObject(value, field)
  return {
    ja: asNonEmptyString(object.ja, `${field}.ja`),
    en: asNonEmptyString(object.en, `${field}.en`),
  }
}

const parseTags = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value)) invalid(field)
  const tagValues = value as unknown[]
  const tags = tagValues.map((tag, index) =>
    asNonEmptyString(tag, `${field}[${index}]`),
  )
  if (new Set(tags).size !== tags.length) invalid(field)
  return tags
}

const parseNullableDate = (value: unknown, field: string): string | null => {
  if (value === null) return null
  const dateText = asNonEmptyString(value, field)
  if (!isoUtcPattern.test(dateText) || Number.isNaN(Date.parse(dateText)))
    invalid(field)
  return dateText
}

/** catalogが参照してよいcontainer内相対Blob pathだけを判定する。 */
export const isSafeBlobPath = (path: string): boolean => {
  if (
    !safePathPattern.test(path) ||
    path.startsWith('/') ||
    path.includes('\\')
  )
    return false
  if (path.includes('?') || path.includes('#') || path.includes('%'))
    return false
  return path
    .split('/')
    .every((segment) => segment !== '' && segment !== '.' && segment !== '..')
}

const parseAsset = (value: unknown, field: string): CatalogAsset => {
  const object = asObject(value, field)
  const path = asNonEmptyString(object.path, `${field}.path`)
  if (!isSafeBlobPath(path)) invalid(`${field}.path`)

  const mimeType = asNonEmptyString(object.mimeType, `${field}.mimeType`)
  if (mimeType !== 'image/png') invalid(`${field}.mimeType`)
  return { path, mimeType }
}

const parseMask = (value: unknown, field: string): CatalogMask => {
  const object = asObject(value, field)
  const initialColor = asNonEmptyString(
    object.initialColor,
    `${field}.initialColor`,
  )
  if (!opaqueHexColorPattern.test(initialColor))
    invalid(`${field}.initialColor`)
  return {
    ...parseAsset(object, field),
    id: parseId(object.id, `${field}.id`),
    label: parseLocalizedText(object.label, `${field}.label`),
    initialColor,
  }
}

const parseTemplate = (value: unknown, index: number): CatalogTemplate => {
  const field = `templates[${index}]`
  const object = asObject(value, field)
  if (typeof object.published !== 'boolean') invalid(`${field}.published`)
  if (!Array.isArray(object.masks)) invalid(`${field}.masks`)
  const published = object.published as boolean
  const maskValues = object.masks as unknown[]

  const publishFrom = parseNullableDate(
    object.publishFrom,
    `${field}.publishFrom`,
  )
  const publishUntil = parseNullableDate(
    object.publishUntil,
    `${field}.publishUntil`,
  )
  if (
    publishFrom &&
    publishUntil &&
    Date.parse(publishFrom) >= Date.parse(publishUntil)
  ) {
    invalid(`${field}.publishUntil`)
  }

  const masks = maskValues.map((mask, maskIndex) =>
    parseMask(mask, `${field}.masks[${maskIndex}]`),
  )
  if (published && masks.length === 0) invalid(`${field}.masks`)
  const maskIds = new Set(masks.map((mask) => mask.id))
  if (maskIds.size !== masks.length) invalid(`${field}.masks.id`)

  return {
    id: parseId(object.id, `${field}.id`),
    assetRevision: parseId(object.assetRevision, `${field}.assetRevision`),
    name: parseLocalizedText(object.name, `${field}.name`),
    tags: parseTags(object.tags, `${field}.tags`),
    published,
    publishFrom,
    publishUntil,
    thumbnail: parseAsset(object.thumbnail, `${field}.thumbnail`),
    lineArt: parseAsset(object.lineArt, `${field}.lineArt`),
    masks,
  }
}

/** 未知のJSON値を製品template catalogとして検証し、API内部の型へ変換する。 */
export const parseCatalog = (value: unknown): TemplateCatalog => {
  const object = asObject(value, 'root')
  if (object.schemaVersion !== 1) invalid('schemaVersion')
  if (!Array.isArray(object.templates)) invalid('templates')
  const templateValues = object.templates as unknown[]

  const templates = templateValues.map(parseTemplate)
  const templateIds = new Set(templates.map((template) => template.id))
  if (templateIds.size !== templates.length) invalid('templates.id')

  return {
    schemaVersion: 1,
    catalogRevision: asNonEmptyString(
      object.catalogRevision,
      'catalogRevision',
    ),
    templates,
  }
}

/** APIのUTC時刻を基準にtemplateの公開状態を一意に分類する。 */
export const classifyPublication = (
  template: CatalogTemplate,
  now: Date,
): keyof PublicationCounts => {
  if (!template.published) return 'unpublished'
  if (template.publishFrom && now.getTime() < Date.parse(template.publishFrom))
    return 'scheduled'
  // 終了日時ちょうどを非公開にし、利用端末の時計ではなくAPIのUTC時刻で判定する。
  if (
    template.publishUntil &&
    now.getTime() >= Date.parse(template.publishUntil)
  )
    return 'expired'
  return 'published'
}

/** catalogから公開中templateだけを選び、非公開理由別の件数も集計する。 */
export const selectPublishedTemplates = (
  catalog: TemplateCatalog,
  now: Date,
): { templates: CatalogTemplate[]; counts: PublicationCounts } => {
  const counts: PublicationCounts = {
    published: 0,
    unpublished: 0,
    scheduled: 0,
    expired: 0,
  }
  const templates = catalog.templates.filter((template) => {
    const classification = classifyPublication(template, now)
    counts[classification] += 1
    return classification === 'published'
  })
  return { templates, counts }
}
