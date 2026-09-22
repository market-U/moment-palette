import { describe, expect, it, vi } from 'vitest'

import { parseTemplateCatalog } from '@/features/template-selection/catalog'

import { createBrowserTemplateAssetLoader } from './browserTemplateAssetLoader'

const entry = parseTemplateCatalog({
  schemaVersion: 1,
  apiVersion: '0.0.0',
  buildId: 'build-a',
  serverTime: '2026-09-21T00:00:00.000Z',
  catalogRevision: 'r1',
  sasExpiresAt: '2026-09-21T01:00:00.000Z',
  templates: [
    {
      id: 'buncho-01',
      assetRevision: 'r1',
      name: { ja: '文鳥', en: 'Java sparrow' },
      tags: ['bird'],
      thumbnail: { mimeType: 'image/png', url: '/thumb.png' },
      lineArt: { mimeType: 'image/png', url: '/line.png' },
      masks: [
        {
          id: 'body',
          label: { ja: '体', en: 'Body' },
          initialColor: '#E8DED2',
          mimeType: 'image/png',
          url: '/body.png',
        },
      ],
    },
  ],
}).templates[0]!

const bitmap = () =>
  ({ width: 1080, height: 1080, close: vi.fn() }) as unknown as ImageBitmap

describe('product browser template asset loader', () => {
  it('線画と全maskを取得し、一度だけ解放する', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      async () =>
        new Response(new Blob(['png'], { type: 'image/png' }), {
          status: 200,
        }),
    )
    const first = bitmap()
    const second = bitmap()
    const assets = await createBrowserTemplateAssetLoader(
      fetcher,
      vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second),
    ).load(entry)

    expect(assets.masks[0]?.id).toBe('body')
    assets.release()
    assets.release()
    expect(first.close).toHaveBeenCalledOnce()
    expect(second.close).toHaveBeenCalledOnce()
  })

  it('部分失敗時はdecode済みresourceを解放する', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(new Blob(['png']), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 500 }))
    const first = bitmap()
    await expect(
      createBrowserTemplateAssetLoader(
        fetcher,
        vi.fn().mockResolvedValue(first),
      ).load(entry),
    ).rejects.toThrow(/loading failed/)
    expect(first.close).toHaveBeenCalledOnce()
  })
})
