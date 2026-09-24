import { describe, expect, it, vi } from 'vitest'

import { applyCameraFill, applySolidColorFill } from '@/domain/template'

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

  it('Area resourceとpreviewを成功時だけ置き換えて旧resourceを解放する', async () => {
    const releaseAssets = vi.fn()
    const initialPreviewRelease = vi.fn()
    const firstPreviewRelease = vi.fn()
    const firstFrameRelease = vi.fn()
    const secondFrameRelease = vi.fn()
    const session = await prepareTemplate(snapshot, 'buncho-01', {
      assetLoader: {
        load: vi.fn().mockResolvedValue(assets(releaseAssets)),
      },
      previewPort: {
        generate: vi.fn().mockResolvedValue({
          url: 'blob:initial',
          width: 1080,
          height: 1080,
          release: initialPreviewRelease,
        }),
      },
      now: () => new Date('2026-09-22T00:00:00.000Z'),
    })
    await session.replaceAreaResource(
      'body',
      applyCameraFill(session.artwork, 'body'),
      { source: {} as CanvasImageSource, release: firstFrameRelease },
      async () => ({
        url: 'blob:first',
        width: 1080,
        height: 1080,
        release: firstPreviewRelease,
      }),
    )

    const finalPreviewRelease = vi.fn()
    await session.replaceAreaResource(
      'body',
      applyCameraFill(session.artwork, 'body'),
      { source: {} as CanvasImageSource, release: secondFrameRelease },
      async () => ({
        url: 'blob:second',
        width: 1080,
        height: 1080,
        release: finalPreviewRelease,
      }),
    )

    expect(session.preview.url).toBe('blob:second')
    expect(session.artwork.areas[0]?.fill).toEqual({ kind: 'camera' })
    expect(initialPreviewRelease).toHaveBeenCalledOnce()
    expect(firstFrameRelease).toHaveBeenCalledOnce()
    expect(firstPreviewRelease).toHaveBeenCalledOnce()
    session.release()
    session.release()
    expect(secondFrameRelease).toHaveBeenCalledOnce()
    expect(finalPreviewRelease).toHaveBeenCalledOnce()
    expect(releaseAssets).toHaveBeenCalledOnce()
  })

  it('次のpreview生成失敗時は新resourceだけを解放して旧作品を維持する', async () => {
    const initialPreviewRelease = vi.fn()
    const failedFrameRelease = vi.fn()
    const session = await prepareTemplate(snapshot, 'buncho-01', {
      assetLoader: { load: vi.fn().mockResolvedValue(assets()) },
      previewPort: {
        generate: vi.fn().mockResolvedValue({
          url: 'blob:initial',
          width: 1080,
          height: 1080,
          release: initialPreviewRelease,
        }),
      },
      now: () => new Date('2026-09-22T00:00:00.000Z'),
    })
    const initialArtwork = session.artwork

    await expect(
      session.replaceAreaResource(
        'body',
        applyCameraFill(initialArtwork, 'body'),
        { source: {} as CanvasImageSource, release: failedFrameRelease },
        async () => {
          throw new Error('preview failed')
        },
      ),
    ).rejects.toThrow('preview failed')

    expect(failedFrameRelease).toHaveBeenCalledOnce()
    expect(session.artwork).toBe(initialArtwork)
    expect(session.preview.url).toBe('blob:initial')
    expect(initialPreviewRelease).not.toHaveBeenCalled()
    expect(session.areaResources.size).toBe(0)
  })

  it('単色への置換は成功時だけ画像resourceと旧previewを解放する', async () => {
    const initialPreviewRelease = vi.fn()
    const cameraPreviewRelease = vi.fn()
    const solidPreviewRelease = vi.fn()
    const frameRelease = vi.fn()
    const session = await prepareTemplate(snapshot, 'buncho-01', {
      assetLoader: { load: vi.fn().mockResolvedValue(assets()) },
      previewPort: {
        generate: vi.fn().mockResolvedValue({
          url: 'blob:initial',
          width: 1080,
          height: 1080,
          release: initialPreviewRelease,
        }),
      },
      now: () => new Date('2026-09-22T00:00:00.000Z'),
    })
    await session.replaceAreaResource(
      'body',
      applyCameraFill(session.artwork, 'body'),
      { source: {} as CanvasImageSource, release: frameRelease },
      async () => ({
        url: 'blob:camera',
        width: 1080,
        height: 1080,
        release: cameraPreviewRelease,
      }),
    )

    await session.replaceAreaWithoutResource(
      'body',
      applySolidColorFill(session.artwork, 'body', '#B35F91'),
      async () => ({
        url: 'blob:solid',
        width: 1080,
        height: 1080,
        release: solidPreviewRelease,
      }),
    )

    expect(session.artwork.areas[0]?.fill).toEqual({
      kind: 'solid',
      color: '#B35F91',
    })
    expect(session.areaResources.size).toBe(0)
    expect(frameRelease).toHaveBeenCalledOnce()
    expect(cameraPreviewRelease).toHaveBeenCalledOnce()
    expect(solidPreviewRelease).not.toHaveBeenCalled()
  })

  it('単色previewの生成に失敗すると既存のresourceと作品を保持する', async () => {
    const frameRelease = vi.fn()
    const session = await prepareTemplate(snapshot, 'buncho-01', {
      assetLoader: { load: vi.fn().mockResolvedValue(assets()) },
      previewPort: {
        generate: vi.fn().mockResolvedValue({
          url: 'blob:initial',
          width: 1080,
          height: 1080,
          release: vi.fn(),
        }),
      },
      now: () => new Date(),
    })
    await session.replaceAreaResource(
      'body',
      applyCameraFill(session.artwork, 'body'),
      { source: {} as CanvasImageSource, release: frameRelease },
      async () => ({
        url: 'blob:camera',
        width: 1080,
        height: 1080,
        release: vi.fn(),
      }),
    )
    const cameraArtwork = session.artwork

    await expect(
      session.replaceAreaWithoutResource(
        'body',
        applySolidColorFill(cameraArtwork, 'body', '#B35F91'),
        async () => {
          throw new Error('preview failed')
        },
      ),
    ).rejects.toThrow('preview failed')

    expect(session.artwork).toBe(cameraArtwork)
    expect(session.areaResources.size).toBe(1)
    expect(frameRelease).not.toHaveBeenCalled()
  })
})
