import { describe, expect, it } from 'vitest'

import {
  classifyPublication,
  parseCatalog,
  selectPublishedTemplates,
} from './catalog'
import type { CatalogTemplate } from './types'

const asset = {
  path: 'templates/buncho-01/r1/image.png',
  mimeType: 'image/png',
}
const baseTemplate: CatalogTemplate = {
  id: 'buncho-01',
  assetRevision: 'r1',
  name: { ja: '文鳥', en: 'Java sparrow' },
  tags: ['bird'],
  published: true,
  publishFrom: null,
  publishUntil: null,
  thumbnail: asset,
  lineArt: asset,
  masks: [
    {
      ...asset,
      id: 'background',
      label: { ja: '背景', en: 'Background' },
      initialColor: '#F3E8DC',
    },
  ],
}

const catalogValue = (templates: unknown[]) => ({
  schemaVersion: 1,
  catalogRevision: 'test-r1',
  templates,
})

describe('parseCatalog', () => {
  it('validなcatalogを型へ変換する', () => {
    expect(parseCatalog(catalogValue([baseTemplate])).templates).toHaveLength(1)
  })

  it.each([
    '../secret.png',
    '/absolute.png',
    'templates/%2e%2e/secret.png',
    'templates\\secret.png',
    'https://example.com/image.png',
  ])('危険なBlob pathを拒否する: %s', (path) => {
    expect(() =>
      parseCatalog(
        catalogValue([{ ...baseTemplate, thumbnail: { ...asset, path } }]),
      ),
    ).toThrow(/thumbnail\.path/)
  })

  it('重複template idをcatalog全体のerrorにする', () => {
    expect(() =>
      parseCatalog(catalogValue([baseTemplate, baseTemplate])),
    ).toThrow(/templates\.id/)
  })

  it('不正日時を拒否する', () => {
    expect(() =>
      parseCatalog(
        catalogValue([{ ...baseTemplate, publishFrom: '2026-01-01' }]),
      ),
    ).toThrow(/publishFrom/)
  })

  it.each([
    ['tags', ['bird', 'bird']],
    ['masks[0].initialColor', '#12345G'],
  ])('%s が不正なcatalogを拒否する', (field, value) => {
    const template =
      field === 'tags'
        ? { ...baseTemplate, tags: value }
        : {
            ...baseTemplate,
            masks: [{ ...baseTemplate.masks[0], initialColor: value }],
          }
    expect(() => parseCatalog(catalogValue([template]))).toThrow()
  })
})

describe('公開判定', () => {
  const now = new Date('2026-09-21T00:00:00.000Z')

  it('公開中・非公開・公開前・公開終了済みを分類する', () => {
    expect(classifyPublication(baseTemplate, now)).toBe('published')
    expect(
      classifyPublication({ ...baseTemplate, published: false }, now),
    ).toBe('unpublished')
    expect(
      classifyPublication(
        { ...baseTemplate, publishFrom: '2026-09-22T00:00:00.000Z' },
        now,
      ),
    ).toBe('scheduled')
    expect(
      classifyPublication(
        { ...baseTemplate, publishUntil: '2026-09-20T00:00:00.000Z' },
        now,
      ),
    ).toBe('expired')
  })

  it('終了日時ちょうどを公開対象から外す', () => {
    expect(
      classifyPublication(
        { ...baseTemplate, publishUntil: now.toISOString() },
        now,
      ),
    ).toBe('expired')
  })

  it('公開中templateだけを返して分類件数を集計する', () => {
    const templates = [
      baseTemplate,
      { ...baseTemplate, id: 'hidden', published: false },
      {
        ...baseTemplate,
        id: 'future',
        publishFrom: '2026-09-22T00:00:00.000Z',
      },
      {
        ...baseTemplate,
        id: 'expired',
        publishUntil: '2026-09-20T00:00:00.000Z',
      },
    ]
    expect(
      selectPublishedTemplates(
        { schemaVersion: 1, catalogRevision: 'r1', templates },
        now,
      ),
    ).toEqual({
      templates: [baseTemplate],
      counts: { published: 1, unpublished: 1, scheduled: 1, expired: 1 },
    })
  })
})
