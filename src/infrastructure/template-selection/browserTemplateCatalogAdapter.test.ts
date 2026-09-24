import { describe, expect, it, vi } from 'vitest'

import { createBrowserTemplateCatalogAdapter } from './browserTemplateCatalogAdapter'

const response = {
  schemaVersion: 1,
  apiVersion: '0.0.0',
  buildId: 'build-a',
  serverTime: '2026-09-24T00:00:00.000Z',
  catalogRevision: 'catalog-r1',
  sasExpiresAt: '2026-09-24T01:00:00.000Z',
  templates: [],
}

describe('browser template catalog adapter', () => {
  it('same-origin APIをno-storeで取得し製品schemaへ変換する', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(response)))

    await expect(
      createBrowserTemplateCatalogAdapter(fetcher).loadAvailable(),
    ).resolves.toMatchObject({ catalogRevision: 'catalog-r1' })
    expect(fetcher).toHaveBeenCalledWith('/api/templates', {
      cache: 'no-store',
    })
  })

  it('network、HTTP、不正responseを公開可能なfailureへ分類する', async () => {
    await expect(
      createBrowserTemplateCatalogAdapter(
        vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')),
      ).loadAvailable(),
    ).rejects.toMatchObject({ kind: 'network' })
    await expect(
      createBrowserTemplateCatalogAdapter(
        vi
          .fn<typeof fetch>()
          .mockResolvedValue(new Response('', { status: 500 })),
      ).loadAvailable(),
    ).rejects.toMatchObject({ kind: 'http' })
    await expect(
      createBrowserTemplateCatalogAdapter(
        vi
          .fn<typeof fetch>()
          .mockResolvedValue(
            new Response(JSON.stringify({ schemaVersion: 2 })),
          ),
      ).loadAvailable(),
    ).rejects.toMatchObject({ kind: 'invalid-response' })
  })
})
