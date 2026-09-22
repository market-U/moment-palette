import { createTemplate, type Template } from '@/domain/template'

/** Catalog内の画像assetを取得するための公開参照を表す。 */
export type TemplateAssetReference = Readonly<{
  mimeType: 'image/png'
  url: string
}>

/** 製品domainと、そのtemplateに対応する外部asset参照を関連付ける。 */
export type TemplateCatalogEntry = Readonly<{
  template: Template
  thumbnail: TemplateAssetReference
  lineArt: TemplateAssetReference
  masks: readonly (TemplateAssetReference & Readonly<{ id: string }>)[]
}>

/** Start時点の配信identityとテンプレート一覧を固定したcatalog snapshotを表す。 */
export type CatalogSnapshot = Readonly<{
  schemaVersion: 1
  apiVersion: string
  buildId: string
  serverTime: string
  catalogRevision: string
  sasExpiresAt: string
  templates: readonly TemplateCatalogEntry[]
}>

/** 外部のcatalog responseが製品schemaを満たさないことを表す。 */
export class TemplateCatalogValidationError extends Error {
  constructor() {
    super('テンプレートカタログの形式が不正です。')
    this.name = 'TemplateCatalogValidationError'
  }
}

const invalid = (): never => {
  throw new TemplateCatalogValidationError()
}

const objectOf = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return invalid()
  }
  return value as Record<string, unknown>
}

const textOf = (value: unknown): string => {
  if (typeof value !== 'string' || value.trim() === '') return invalid()
  return value.trim()
}

const dateOf = (value: unknown): string => {
  const text = textOf(value)
  if (Number.isNaN(Date.parse(text))) invalid()
  return text
}

const localizedOf = (value: unknown) => {
  const object = objectOf(value)
  return { ja: textOf(object.ja), en: textOf(object.en) }
}

const urlOf = (value: unknown): string => {
  const text = textOf(value)
  if (text.startsWith('/')) {
    if (text.startsWith('//')) invalid()
    return text
  }
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return invalid()
  }
  if (url.protocol !== 'https:' || url.username || url.password) invalid()
  return text
}

const assetOf = (value: unknown): TemplateAssetReference => {
  const object = objectOf(value)
  if (object.mimeType !== 'image/png') invalid()
  return Object.freeze({
    mimeType: 'image/png' as const,
    url: urlOf(object.url),
  })
}

const tagsOf = (value: unknown): readonly string[] => {
  if (!Array.isArray(value)) return invalid()
  const tags = value.map(textOf)
  if (new Set(tags).size !== tags.length) invalid()
  return Object.freeze(tags)
}

const entryOf = (value: unknown): TemplateCatalogEntry => {
  const object = objectOf(value)
  const maskValues = object.masks
  if (!Array.isArray(maskValues) || maskValues.length === 0) return invalid()
  const masks = maskValues.map((value) => {
    const mask = objectOf(value)
    return {
      ...assetOf(mask),
      id: textOf(mask.id),
      label: localizedOf(mask.label),
      initialColor: textOf(mask.initialColor),
    }
  })
  // 外部responseをそのまま作品状態へ渡さず、domain側の不変条件でも検証する。
  const template = createTemplate({
    id: textOf(object.id),
    assetRevision: textOf(object.assetRevision),
    name: localizedOf(object.name),
    tags: tagsOf(object.tags),
    areas: masks.map(({ id, label, initialColor }) => ({
      id,
      label,
      initialColor,
    })),
  })

  return Object.freeze({
    template,
    thumbnail: assetOf(object.thumbnail),
    lineArt: assetOf(object.lineArt),
    masks: Object.freeze(
      masks.map(({ id, mimeType, url }) =>
        Object.freeze({ id, mimeType, url }),
      ),
    ),
  })
}

/** 未知の値を製品schema version 1として検証し、不変のsnapshotへ変換する。 */
export const parseTemplateCatalog = (value: unknown): CatalogSnapshot => {
  try {
    const object = objectOf(value)
    const templateValues = object.templates
    if (object.schemaVersion !== 1 || !Array.isArray(templateValues)) {
      return invalid()
    }
    const templates = templateValues.map(entryOf)
    const ids = templates.map(({ template }) => template.id)
    if (new Set(ids).size !== ids.length) invalid()

    return Object.freeze({
      schemaVersion: 1 as const,
      apiVersion: textOf(object.apiVersion),
      buildId: textOf(object.buildId),
      serverTime: dateOf(object.serverTime),
      catalogRevision: textOf(object.catalogRevision),
      sasExpiresAt: dateOf(object.sasExpiresAt),
      templates: Object.freeze(templates),
    })
  } catch (error) {
    if (error instanceof TemplateCatalogValidationError) throw error
    throw new TemplateCatalogValidationError()
  }
}
