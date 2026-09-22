import { describe, expect, it } from 'vitest'

import { parseTemplateCatalog } from './catalog'

const response = () => ({
  schemaVersion: 1,
  apiVersion: '0.0.0',
  buildId: 'build-a',
  serverTime: '2026-09-21T00:00:00.000Z',
  catalogRevision: 'catalog-r1',
  sasExpiresAt: '2026-09-21T01:00:00.000Z',
  templates: [
    {
      id: 'buncho-01',
      assetRevision: 'r1',
      name: { ja: '文鳥', en: 'Java sparrow' },
      tags: ['bird'],
      thumbnail: { mimeType: 'image/png', url: '/thumbnail.png' },
      lineArt: { mimeType: 'image/png', url: 'https://blob/line.png?sas' },
      masks: [
        {
          id: 'body',
          label: { ja: '体', en: 'Body' },
          initialColor: '#E8DED2',
          mimeType: 'image/png',
          url: 'https://blob/body.png?sas',
        },
      ],
    },
  ],
})

describe('product template catalog', () => {
  it('製品schemaをdomainとasset参照へ分離する', () => {
    const catalog = parseTemplateCatalog(response())
    expect(catalog.templates[0]?.template).toMatchObject({
      id: 'buncho-01',
      tags: ['bird'],
      areas: [{ id: 'body', initialColor: '#E8DED2' }],
    })
    expect(catalog.templates[0]?.template).not.toHaveProperty('lineArt')
    expect(catalog.templates[0]?.lineArt.url).toContain('https://')
    expect(Object.isFrozen(catalog)).toBe(true)
  })

  it('未対応schemaと必須field欠損を拒否する', () => {
    expect(() =>
      parseTemplateCatalog({ ...response(), schemaVersion: 2 }),
    ).toThrow()
    expect(() =>
      parseTemplateCatalog({ ...response(), buildId: undefined }),
    ).toThrow()
  })

  it('重複template IDとmask IDを拒否する', () => {
    const value = response()
    expect(() =>
      parseTemplateCatalog({
        ...value,
        templates: [...value.templates, value.templates[0]],
      }),
    ).toThrow()
    expect(() =>
      parseTemplateCatalog({
        ...value,
        templates: [
          {
            ...value.templates[0],
            masks: [value.templates[0]!.masks[0], value.templates[0]!.masks[0]],
          },
        ],
      }),
    ).toThrow()
  })

  it('日時、URL、tag、initialColorの不正値を拒否する', () => {
    const value = response()
    expect(() =>
      parseTemplateCatalog({ ...value, serverTime: 'today' }),
    ).toThrow()
    expect(() =>
      parseTemplateCatalog({
        ...value,
        templates: [
          {
            ...value.templates[0],
            thumbnail: { mimeType: 'image/png', url: 'ftp://bad' },
          },
        ],
      }),
    ).toThrow()
    expect(() =>
      parseTemplateCatalog({
        ...value,
        templates: [{ ...value.templates[0], tags: ['bird', 'bird'] }],
      }),
    ).toThrow()
    expect(() =>
      parseTemplateCatalog({
        ...value,
        templates: [
          {
            ...value.templates[0],
            masks: [{ ...value.templates[0]!.masks[0], initialColor: '#fff' }],
          },
        ],
      }),
    ).toThrow()
  })
})
