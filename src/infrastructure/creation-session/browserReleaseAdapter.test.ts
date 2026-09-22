import { describe, expect, it, vi } from 'vitest'

import { createBrowserReleaseAdapter } from './browserReleaseAdapter'

describe('product browser release adapter', () => {
  it('no-storeでrelease情報を取得する', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ appVersion: '0.0.0', buildId: 'build-a' }),
          { status: 200 },
        ),
      )
    await expect(
      createBrowserReleaseAdapter(fetcher).loadCurrent(),
    ).resolves.toEqual({
      appVersion: '0.0.0',
      buildId: 'build-a',
    })
    expect(fetcher).toHaveBeenCalledWith('/release.json', { cache: 'no-store' })
  })

  it('通信、HTTP、形式errorを区別する', async () => {
    await expect(
      createBrowserReleaseAdapter(
        vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')),
      ).loadCurrent(),
    ).rejects.toMatchObject({ kind: 'network' })
    await expect(
      createBrowserReleaseAdapter(
        vi
          .fn<typeof fetch>()
          .mockResolvedValue(new Response('', { status: 503 })),
      ).loadCurrent(),
    ).rejects.toMatchObject({ kind: 'http' })
    await expect(
      createBrowserReleaseAdapter(
        vi.fn<typeof fetch>().mockResolvedValue(new Response('{}')),
      ).loadCurrent(),
    ).rejects.toMatchObject({ kind: 'invalid-response' })
  })
})
