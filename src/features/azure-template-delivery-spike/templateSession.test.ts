import { describe, expect, it, vi } from 'vitest'

import type { LoadedTemplateAssets } from './assetLoaderPort'
import {
  ReloadRequiredError,
  startTemplateSession,
  TemplateSessionOwner,
} from './templateSession'
import type { AvailableTemplate, TemplateCatalogResponse } from './types'

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
  masks: [],
}
const catalog: TemplateCatalogResponse = {
  apiVersion: '0.0.0',
  buildId: 'build-a',
  serverTime: '2026-09-21T00:00:00.000Z',
  catalogRevision: 'catalog-r1',
  sasExpiresAt: '2026-09-21T01:00:00.000Z',
  publicationCounts: { published: 1, unpublished: 0, scheduled: 0, expired: 0 },
  templates: [template],
}

const loadedAssets = (release = vi.fn()): LoadedTemplateAssets => ({
  lineArt: {
    path: 'line.png',
    mimeType: 'image/png',
    byteLength: 1,
    width: 1,
    height: 1,
    source: {} as CanvasImageSource,
    release: vi.fn(),
  },
  masks: [],
  release,
})

describe('template session', () => {
  it('三者照合後にassetを一度だけ読み、snapshotへ固定する', async () => {
    const load = vi.fn().mockResolvedValue(loadedAssets())
    const session = await startTemplateSession(catalog, template, {
      frontend: { appVersion: '0.0.0', buildId: 'build-a' },
      releasePort: {
        loadCurrent: vi
          .fn()
          .mockResolvedValue({ appVersion: '0.0.0', buildId: 'build-a' }),
      },
      assetLoader: { load },
      now: () => new Date('2026-09-21T00:10:00.000Z'),
    })

    expect(load).toHaveBeenCalledOnce()
    expect(session.snapshot).toEqual({
      appVersion: '0.0.0',
      buildId: 'build-a',
      catalogRevision: 'catalog-r1',
      templateRevision: 'r1',
      startedAt: '2026-09-21T00:10:00.000Z',
    })
  })

  it('不一致ではassetを読まずreload要求にする', async () => {
    const load = vi.fn()
    await expect(
      startTemplateSession(catalog, template, {
        frontend: { appVersion: '0.0.0', buildId: 'build-a' },
        releasePort: {
          loadCurrent: vi
            .fn()
            .mockResolvedValue({ appVersion: '0.0.0', buildId: 'build-b' }),
        },
        assetLoader: { load },
        now: () => new Date(),
      }),
    ).rejects.toBeInstanceOf(ReloadRequiredError)
    expect(load).not.toHaveBeenCalled()
  })

  it('SAS期限後もAPI・release・Blobを再取得せず保持中assetsを使える', async () => {
    const loadCurrent = vi
      .fn()
      .mockResolvedValue({ appVersion: '0.0.0', buildId: 'build-a' })
    const loadAssets = vi.fn().mockResolvedValue(loadedAssets())
    const session = await startTemplateSession(catalog, template, {
      frontend: { appVersion: '0.0.0', buildId: 'build-a' },
      releasePort: { loadCurrent },
      assetLoader: { load: loadAssets },
      now: () => new Date('2026-09-21T00:10:00.000Z'),
    })
    const renderFromLoadedBytes = vi.fn().mockResolvedValue(new Blob(['png']))

    // catalogのSAS期限より後という条件でも、描画側へ渡すのは保持中のdecode済み資源だけである。
    await renderFromLoadedBytes(
      session.assets,
      new Date('2026-09-21T02:00:00.000Z'),
    )
    expect(loadCurrent).toHaveBeenCalledOnce()
    expect(loadAssets).toHaveBeenCalledOnce()
    expect(renderFromLoadedBytes).toHaveBeenCalledWith(
      session.assets,
      expect.any(Date),
    )
  })

  it('置換・完了・route離脱でresourceを一度だけ解放する', () => {
    const firstRelease = vi.fn()
    const secondRelease = vi.fn()
    const session = (release: () => void) => ({
      snapshot: {} as never,
      template,
      assets: loadedAssets(),
      release,
    })
    const owner = new TemplateSessionOwner()
    owner.replace(session(firstRelease))
    owner.replace(session(secondRelease))
    owner.clear()
    owner.clear()
    expect(firstRelease).toHaveBeenCalledOnce()
    expect(secondRelease).toHaveBeenCalledOnce()
  })
})
