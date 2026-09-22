import { describe, expect, it, vi } from 'vitest'

import { parseTemplateCatalog } from './catalog'
import { prepareTemplate } from './prepareTemplate'

const snapshot = parseTemplateCatalog({
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
})

const decoded = (id?: string) => ({
  ...(id ? { id } : {}),
  mimeType: 'image/png',
  byteLength: 1,
  width: 1080,
  height: 1080,
  source: {} as CanvasImageSource,
  release: vi.fn(),
})

const assets = (release = vi.fn()) => ({
  lineArt: decoded(),
  masks: [decoded('body')],
  release,
})

describe('prepare template', () => {
  it('全assetとpreview成功後だけsessionを返して一度だけ解放する', async () => {
    const releaseAssets = vi.fn()
    const releasePreview = vi.fn()
    const load = vi.fn().mockResolvedValue(assets(releaseAssets))
    const generate = vi.fn().mockResolvedValue({
      url: 'blob:preview',
      width: 1080,
      height: 1080,
      release: releasePreview,
    })
    const session = await prepareTemplate(snapshot, 'buncho-01', {
      assetLoader: { load },
      previewPort: { generate },
      now: () => new Date('2026-09-21T00:10:00.000Z'),
    })

    expect(session.artwork.areas[0]).toMatchObject({
      areaId: 'body',
      fill: { kind: 'initial', color: '#E8DED2' },
    })
    session.release()
    session.release()
    expect(releasePreview).toHaveBeenCalledOnce()
    expect(releaseAssets).toHaveBeenCalledOnce()
  })

  it('寸法不正では準備済みassetを解放する', async () => {
    const release = vi.fn()
    const value = assets(release)
    value.lineArt.width = 100
    await expect(
      prepareTemplate(snapshot, 'buncho-01', {
        assetLoader: { load: vi.fn().mockResolvedValue(value) },
        previewPort: { generate: vi.fn() },
        now: () => new Date(),
      }),
    ).rejects.toThrow(/1080/)
    expect(release).toHaveBeenCalledOnce()
  })

  it('preview生成失敗ではassetを解放する', async () => {
    const release = vi.fn()
    await expect(
      prepareTemplate(snapshot, 'buncho-01', {
        assetLoader: { load: vi.fn().mockResolvedValue(assets(release)) },
        previewPort: {
          generate: vi.fn().mockRejectedValue(new Error('canvas')),
        },
        now: () => new Date(),
      }),
    ).rejects.toThrow(/canvas/)
    expect(release).toHaveBeenCalledOnce()
  })
})
