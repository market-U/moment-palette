import { describe, expect, it } from 'vitest'

import { createTemplatesService } from './templatesService'
import type { TemplateCatalog } from './types'

const catalog: TemplateCatalog = {
  schemaVersion: 1,
  catalogRevision: 'catalog-r1',
  templates: [
    {
      id: 'buncho-01',
      assetRevision: 'r1',
      name: { ja: '文鳥', en: 'Java sparrow' },
      published: true,
      publishFrom: null,
      publishUntil: null,
      thumbnail: {
        path: 'templates/buncho-01/r1/thumbnail.png',
        mimeType: 'image/png',
      },
      lineArt: {
        path: 'templates/buncho-01/r1/line-art.png',
        mimeType: 'image/png',
      },
      masks: [],
    },
    {
      id: 'hidden',
      assetRevision: 'r1',
      name: { ja: '非公開', en: 'Hidden' },
      published: false,
      publishFrom: null,
      publishUntil: null,
      thumbnail: { path: 'secret/thumbnail.png', mimeType: 'image/png' },
      lineArt: { path: 'secret/line-art.png', mimeType: 'image/png' },
      masks: [],
    },
  ],
}

describe('templates service', () => {
  it('公開中templateだけを60分の署名URLへ変換する', async () => {
    const now = new Date('2026-09-21T00:00:00.000Z')
    const result = await createTemplatesService({
      catalogReader: { read: async () => catalog },
      sasSigner: {
        signReadUrl: (path, expiry) =>
          `https://blob.example/${path}?se=${expiry.toISOString()}`,
      },
      now: () => now,
      apiVersion: '0.0.0',
      buildId: 'build-a',
    }).execute()

    expect(result.templates.map((template) => template.id)).toEqual([
      'buncho-01',
    ])
    expect(JSON.stringify(result)).not.toContain('secret/')
    expect(result.sasExpiresAt).toBe('2026-09-21T01:00:00.000Z')
    expect(result.publicationCounts).toEqual({
      published: 1,
      unpublished: 1,
      scheduled: 0,
      expired: 0,
    })
  })
})
