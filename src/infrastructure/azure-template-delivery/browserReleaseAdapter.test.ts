import { describe, expect, it, vi } from 'vitest'

import { ReleaseLoadError } from '@/features/azure-template-delivery-spike/releasePort'

import { createBrowserReleaseAdapter } from './browserReleaseAdapter'

describe('browser release adapter', () => {
  it('no-storeでrelease情報を取得する', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ appVersion: '1.0.0', buildId: 'build-a' }),
          { status: 200 },
        ),
      )
    await expect(
      createBrowserReleaseAdapter(fetcher).loadCurrent(),
    ).resolves.toEqual({
      appVersion: '1.0.0',
      buildId: 'build-a',
    })
    expect(fetcher).toHaveBeenCalledWith('/release.json', { cache: 'no-store' })
  })

  it('通信・HTTP・形式errorを区別する', async () => {
    const network = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError('offline'))
    await expect(
      createBrowserReleaseAdapter(network).loadCurrent(),
    ).rejects.toMatchObject({
      kind: 'network',
    } satisfies Partial<ReleaseLoadError>)

    const http = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('', { status: 503 }))
    await expect(
      createBrowserReleaseAdapter(http).loadCurrent(),
    ).rejects.toMatchObject({ kind: 'http' })

    const invalid = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{}', { status: 200 }))
    await expect(
      createBrowserReleaseAdapter(invalid).loadCurrent(),
    ).rejects.toMatchObject({
      kind: 'invalid-response',
    })
  })
})
