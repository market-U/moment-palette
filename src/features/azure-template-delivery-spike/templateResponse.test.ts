import { describe, expect, it } from 'vitest'

import { parseTemplateCatalogResponse } from './templateResponse'

const response = {
  apiVersion: '0.0.0',
  buildId: 'build-a',
  serverTime: '2026-09-21T00:00:00.000Z',
  catalogRevision: 'r1',
  sasExpiresAt: '2026-09-21T01:00:00.000Z',
  publicationCounts: { published: 1, unpublished: 1, scheduled: 1, expired: 1 },
  templates: [
    {
      id: 'buncho-01',
      assetRevision: 'r1',
      name: { ja: '文鳥', en: 'Java sparrow' },
      thumbnail: {
        path: 'thumbnail.png',
        mimeType: 'image/png',
        url: 'https://blob.test/t.png?sas',
      },
      lineArt: {
        path: 'line.png',
        mimeType: 'image/png',
        url: 'https://blob.test/l.png?sas',
      },
      masks: [],
    },
  ],
}

describe('template API response', () => {
  it('必要なmetadataを検証して受け取る', () => {
    expect(parseTemplateCatalogResponse(response)).toEqual(response)
  })

  it('欠損や不正な件数をresponse全体のerrorにする', () => {
    expect(() =>
      parseTemplateCatalogResponse({ ...response, buildId: undefined }),
    ).toThrow()
    expect(() =>
      parseTemplateCatalogResponse({
        ...response,
        publicationCounts: { ...response.publicationCounts, published: -1 },
      }),
    ).toThrow()
  })
})
