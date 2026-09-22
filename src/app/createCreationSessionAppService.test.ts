import { describe, expect, it, vi } from 'vitest'

import type { LoadedTemplateAssets } from '@/features/template-selection/assetLoaderPort'
import { parseTemplateCatalog } from '@/features/template-selection/catalog'

import { createCreationSessionAppService } from './createCreationSessionAppService'

const catalog = () =>
  parseTemplateCatalog({
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
  })

const loadedAssets = (release = vi.fn()): LoadedTemplateAssets => ({
  lineArt: {
    mimeType: 'image/png',
    byteLength: 1,
    width: 1080,
    height: 1080,
    source: {} as CanvasImageSource,
    release: vi.fn(),
  },
  masks: [
    {
      id: 'body',
      mimeType: 'image/png',
      byteLength: 1,
      width: 1080,
      height: 1080,
      source: {} as CanvasImageSource,
      release: vi.fn(),
    },
  ],
  release,
})

const dependencies = () => {
  const loadCurrent = vi
    .fn()
    .mockResolvedValue({ appVersion: '0.0.0', buildId: 'build-a' })
  const loadAvailable = vi.fn().mockResolvedValue(catalog())
  const loadAssets = vi.fn().mockResolvedValue(loadedAssets())
  const releasePreview = vi.fn()
  return {
    values: {
      frontend: { appVersion: '0.0.0', buildId: 'build-a' },
      releasePort: { loadCurrent },
      catalogPort: { loadAvailable },
      assetLoader: { load: loadAssets },
      previewPort: {
        generate: vi.fn().mockResolvedValue({
          url: 'blob:preview',
          width: 1080,
          height: 1080,
          release: releasePreview,
        }),
      },
      now: () => new Date('2026-09-21T00:10:00.000Z'),
      reloadPage: vi.fn(),
    },
    loadCurrent,
    loadAvailable,
    loadAssets,
    releasePreview,
  }
}

describe('creation session app service', () => {
  it('重複Startを実行せず、成功snapshotをtab内に保持する', async () => {
    let resolveRelease!: (value: {
      appVersion: string
      buildId: string
    }) => void
    const release = new Promise<{ appVersion: string; buildId: string }>(
      (resolve) => {
        resolveRelease = resolve
      },
    )
    const deps = dependencies()
    deps.values.releasePort.loadCurrent = vi.fn().mockReturnValue(release)
    const service = createCreationSessionAppService(deps.values)

    const first = service.start()
    await expect(service.start()).resolves.toBe(false)
    expect(deps.values.releasePort.loadCurrent).toHaveBeenCalledOnce()
    resolveRelease({ appVersion: '0.0.0', buildId: 'build-a' })
    await expect(first).resolves.toBe(true)
    expect(service.hasCatalog()).toBe(true)
    expect(service.templateSelection.value.phase).toBe('ready')
  })

  it('制作session開始後は外部portを再度呼ばず、保持中viewを使う', async () => {
    const deps = dependencies()
    const service = createCreationSessionAppService(deps.values)
    await service.start()
    await service.selectTemplate('buncho-01')

    expect(service.activeCreation.value?.previewUrl).toBe('blob:preview')
    expect(service.activeCreation.value?.areas[0]?.id).toBe('body')
    expect(deps.loadCurrent).toHaveBeenCalledOnce()
    expect(deps.loadAvailable).toHaveBeenCalledOnce()
    expect(deps.loadAssets).toHaveBeenCalledOnce()
  })

  it('resetとdisposeを重ねてもactive resourceを一度だけ解放する', async () => {
    const deps = dependencies()
    const releaseAssets = vi.fn()
    deps.values.assetLoader.load = vi
      .fn()
      .mockResolvedValue(loadedAssets(releaseAssets))
    const service = createCreationSessionAppService(deps.values)
    await service.start()
    await service.selectTemplate('buncho-01')

    service.resetToStart()
    service.dispose()
    expect(releaseAssets).toHaveBeenCalledOnce()
    expect(deps.releasePreview).toHaveBeenCalledOnce()
    expect(service.hasCatalog()).toBe(false)
  })

  it('asset準備失敗を再試行可能な状態にする', async () => {
    const deps = dependencies()
    deps.values.assetLoader.load = vi.fn().mockRejectedValue(new Error('asset'))
    const service = createCreationSessionAppService(deps.values)
    await service.start()

    await expect(service.selectTemplate('buncho-01')).resolves.toBe(false)
    expect(service.templateSelection.value).toMatchObject({
      phase: 'error',
      templateId: 'buncho-01',
    })
  })
})
