import { describe, expect, it, vi } from 'vitest'

import type { AvailableTemplate } from '@/features/azure-template-delivery-spike/types'

import { createBrowserTemplateAssetLoader } from './browserTemplateAssetLoader'

const template: AvailableTemplate = {
  id: 'buncho-01',
  assetRevision: 'r1',
  name: { ja: '文鳥', en: 'Java sparrow' },
  thumbnail: {
    path: 'thumb.png',
    mimeType: 'image/png',
    url: 'https://blob/thumb.png?sas',
  },
  lineArt: {
    path: 'line.png',
    mimeType: 'image/png',
    url: 'https://blob/line.png?sas',
  },
  masks: [
    {
      id: 'body',
      label: { ja: 'ボディ', en: 'Body' },
      path: 'body.png',
      mimeType: 'image/png',
      url: 'https://blob/body.png?sas',
    },
  ],
}

const bitmap = () =>
  ({ width: 1080, height: 1080, close: vi.fn() }) as unknown as ImageBitmap

describe('browser template asset loader', () => {
  it('線画と全maskを並列取得して一度だけ解放する', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(new Blob(['line'], { type: 'image/png' }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(new Blob(['mask'], { type: 'image/png' }), {
          status: 200,
        }),
      )
    const first = bitmap()
    const second = bitmap()
    const decode = vi
      .fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)
    const assets = await createBrowserTemplateAssetLoader(fetcher, decode).load(
      template,
    )

    expect(fetcher).toHaveBeenCalledTimes(2)
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
      ).load(template),
    ).rejects.toThrow(/loading failed/)
    expect(first.close).toHaveBeenCalledOnce()
  })
})
