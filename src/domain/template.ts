export type LocalizedText = Readonly<{
  ja: string
  en: string
}>

/** 制作対象の一領域と、その初期表示に必要な情報を表す。 */
export type Area = Readonly<{
  id: string
  label: LocalizedText
  initialColor: string
}>

/** 配信方法に依存しないテンプレートの製品情報を表す。 */
export type Template = Readonly<{
  id: string
  assetRevision: string
  name: LocalizedText
  tags: readonly string[]
  areas: readonly Area[]
}>

/** 作品内の一領域に適用されている塗りの種類を、外部resourceから分離して表す。 */
export type ArtworkFill =
  | Readonly<{
      kind: 'initial'
      color: string
    }>
  | Readonly<{
      kind: 'camera'
    }>
  | Readonly<{
      kind: 'photo'
    }>

/** 作品内の一領域に適用されている塗りの状態を表す。 */
export type ArtworkArea = Readonly<{
  areaId: string
  fill: ArtworkFill
}>

/** 選択したテンプレートから制作中の作品状態を表す。 */
export type Artwork = Readonly<{
  templateId: string
  templateRevision: string
  areas: readonly ArtworkArea[]
}>

const stableIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const colorPattern = /^#[0-9A-F]{6}$/

const requireText = (value: string, field: string): string => {
  const normalized = value.trim()
  if (!normalized) throw new Error(`${field}は空にできません。`)
  return normalized
}

const requireStableId = (value: string, field: string): string => {
  if (!stableIdPattern.test(value)) {
    throw new Error(`${field}が安定IDの形式ではありません。`)
  }
  return value
}

const requireColor = (value: string): string => {
  if (!colorPattern.test(value)) {
    throw new Error('initialColorは不透明な#RRGGBB形式で指定してください。')
  }
  return value
}

const localizedText = (value: LocalizedText, field: string): LocalizedText =>
  Object.freeze({
    ja: requireText(value.ja, `${field}.ja`),
    en: requireText(value.en, `${field}.en`),
  })

/** 入力値を検証し、順序を維持した不変のテンプレートを生成する。 */
export const createTemplate = (input: Template): Template => {
  if (input.areas.length === 0) {
    throw new Error('templateには1件以上のareaが必要です。')
  }

  const areaIds = new Set<string>()
  const areas = input.areas.map((area) => {
    const id = requireStableId(area.id, 'area.id')
    if (areaIds.has(id)) throw new Error(`area.idが重複しています: ${id}`)
    areaIds.add(id)
    return Object.freeze({
      id,
      label: localizedText(area.label, `areas.${id}.label`),
      initialColor: requireColor(area.initialColor),
    })
  })

  const tags = input.tags.map((tag) => requireStableId(tag, 'tag'))
  if (new Set(tags).size !== tags.length) {
    throw new Error('tagが重複しています。')
  }

  return Object.freeze({
    id: requireStableId(input.id, 'template.id'),
    assetRevision: requireStableId(
      input.assetRevision,
      'template.assetRevision',
    ),
    name: localizedText(input.name, 'template.name'),
    tags: Object.freeze(tags),
    areas: Object.freeze(areas),
  })
}

/** テンプレートの全領域を初期色で満たした未編集の作品を生成する。 */
export const createInitialArtwork = (template: Template): Artwork =>
  Object.freeze({
    templateId: template.id,
    templateRevision: template.assetRevision,
    areas: Object.freeze(
      template.areas.map((area) =>
        Object.freeze({
          areaId: area.id,
          fill: Object.freeze({
            kind: 'initial' as const,
            color: area.initialColor,
          }),
        }),
      ),
    ),
  })

/** 指定した領域だけをカメラ撮影済みにした新しい作品状態を生成する。 */
export const applyCameraFill = (artwork: Artwork, areaId: string): Artwork => {
  if (!artwork.areas.some((area) => area.areaId === areaId)) {
    throw new Error(`Artworkに存在しないareaです: ${areaId}`)
  }

  return Object.freeze({
    ...artwork,
    areas: Object.freeze(
      artwork.areas.map((area) =>
        area.areaId === areaId
          ? Object.freeze({
              areaId: area.areaId,
              fill: Object.freeze({ kind: 'camera' as const }),
            })
          : area,
      ),
    ),
  })
}

/** 指定した領域だけを端末内写真で満たした新しい作品状態を生成する。 */
export const applyPhotoFill = (artwork: Artwork, areaId: string): Artwork => {
  if (!artwork.areas.some((area) => area.areaId === areaId)) {
    throw new Error(`Artworkに存在しないareaです: ${areaId}`)
  }

  return Object.freeze({
    ...artwork,
    areas: Object.freeze(
      artwork.areas.map((area) =>
        area.areaId === areaId
          ? Object.freeze({
              areaId: area.areaId,
              fill: Object.freeze({ kind: 'photo' as const }),
            })
          : area,
      ),
    ),
  })
}
