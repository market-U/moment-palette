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
      tags: ['bird'],
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
      masks: [
        {
          id: 'background',
          label: { ja: '背景', en: 'Background' },
          initialColor: '#F3E8DC',
          path: 'templates/buncho-01/r1/masks/background.png',
          mimeType: 'image/png',
        },
      ],
    },
    {
      id: 'hidden',
      assetRevision: 'r1',
      name: { ja: '非公開', en: 'Hidden' },
      tags: ['fixture'],
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
    expect(result.schemaVersion).toBe(1)
    expect(result.templates[0]).toMatchObject({
      tags: ['bird'],
      masks: [{ id: 'background', initialColor: '#F3E8DC' }],
    })
    expect(result.templates[0]?.thumbnail).not.toHaveProperty('path')
    expect(result.templates[0]?.lineArt).not.toHaveProperty('path')
    expect(result.templates[0]?.masks[0]).not.toHaveProperty('path')
    expect(result).not.toHaveProperty('publicationCounts')
  })
})
