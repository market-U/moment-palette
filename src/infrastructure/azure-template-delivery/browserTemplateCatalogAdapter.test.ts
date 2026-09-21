import { describe, expect, it, vi } from 'vitest'

import { createBrowserTemplateCatalogAdapter } from './browserTemplateCatalogAdapter'

describe('browser template catalog adapter', () => {
  it('same-origin APIをno-storeで取得する', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          apiVersion: '0.0.0',
          buildId: 'build-a',
          serverTime: '2026-09-21T00:00:00.000Z',
          catalogRevision: 'r1',
          sasExpiresAt: '2026-09-21T01:00:00.000Z',
          publicationCounts: {
            published: 0,
            unpublished: 1,
            scheduled: 1,
            expired: 1,
          },
          templates: [],
        }),
      ),
    )
    await expect(
      createBrowserTemplateCatalogAdapter(fetcher).loadAvailable(),
    ).resolves.toMatchObject({
      catalogRevision: 'r1',
    })
    expect(fetcher).toHaveBeenCalledWith('/api/templates', {
      cache: 'no-store',
    })
  })

  it('HTTP errorを分類する', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('', { status: 500 }))
    await expect(
      createBrowserTemplateCatalogAdapter(fetcher).loadAvailable(),
    ).rejects.toMatchObject({
      kind: 'http',
    })
  })
})
