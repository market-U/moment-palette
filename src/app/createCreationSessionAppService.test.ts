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
  const releaseCameraPreview = vi.fn()
  const releaseFrame = vi.fn()
  const releasePhoto = vi.fn()
  const disposePhoto = vi.fn()
  const cameraPort = {
    start: vi.fn().mockResolvedValue({
      facing: 'environment' as const,
      canSwitch: true,
      settings: { width: 1920, height: 1080, facingMode: 'environment' },
    }),
    switchFacing: vi.fn().mockResolvedValue({
      facing: 'user' as const,
      canSwitch: true,
      settings: { width: 1920, height: 1080, facingMode: 'user' },
    }),
    stop: vi.fn(),
    getSession: vi.fn(),
  }
  const cameraCompositor = {
    resizePreview: vi.fn().mockReturnValue({ width: 540, height: 540 }),
    renderPreview: vi.fn(),
    captureFrame: vi.fn().mockReturnValue({
      source: {} as CanvasImageSource,
      release: releaseFrame,
    }),
    renderPhotoPreview: vi.fn(),
    capturePhotoFrame: vi.fn().mockReturnValue({
      source: {} as CanvasImageSource,
      release: releasePhoto,
    }),
    generatePreview: vi.fn().mockResolvedValue({
      url: 'blob:camera-preview',
      width: 1080,
      height: 1080,
      release: releaseCameraPreview,
    }),
  }
  const completedArtworkGenerator = {
    generate: vi.fn().mockResolvedValue({
      blob: new Blob(['png'], { type: 'image/png' }),
      objectUrl: 'blob:completed',
      width: 1080,
      height: 1080,
      dispose: vi.fn(),
    }),
  }
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
      cameraPort,
      cameraPermission: { query: vi.fn().mockResolvedValue('prompt' as const) },
      cameraCompositor,
      completedArtworkGenerator,
      completedArtworkShare: {
        canShare: vi.fn(() => ({ available: true as const })),
        share: vi.fn().mockResolvedValue({ kind: 'handed-off' }),
      },
      clipboard: { copy: vi.fn().mockResolvedValue({ kind: 'copied' }) },
      photoDecoder: {
        decode: vi.fn().mockResolvedValue({
          source: {} as HTMLCanvasElement,
          size: { width: 1600, height: 900 },
          dispose: disposePhoto,
        }),
      },
      mapCameraFailure: (error: unknown) => ({
        code: 'unknown' as const,
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
      }),
      isDocumentHidden: () => false,
      now: () => new Date('2026-09-21T00:10:00.000Z'),
      reloadPage: vi.fn(),
    },
    loadCurrent,
    loadAvailable,
    loadAssets,
    releasePreview,
    releaseCameraPreview,
    releaseFrame,
    releasePhoto,
    disposePhoto,
    cameraPort,
    cameraCompositor,
    completedArtworkGenerator,
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

  it('camera撮影を作品へcommitし、resetでframeを一度だけ解放する', async () => {
    const deps = dependencies()
    const service = createCreationSessionAppService(deps.values)
    await service.start()
    await service.selectTemplate('buncho-01')
    service.attachCameraTarget({
      srcObject: null,
      videoWidth: 1920,
      videoHeight: 1080,
      play: vi.fn(async () => undefined),
    } as unknown as HTMLVideoElement)

    await service.openCamera('body')
    await service.confirmCameraRationale()
    await expect(service.captureCamera()).resolves.toBe(true)

    expect(service.activeCreation.value).toMatchObject({
      previewUrl: 'blob:camera-preview',
      areas: [{ id: 'body', fillKind: 'camera' }],
    })
    expect(deps.releasePreview).toHaveBeenCalledOnce()
    service.resetToStart()
    service.dispose()
    expect(deps.releaseFrame).toHaveBeenCalledOnce()
    expect(deps.releaseCameraPreview).toHaveBeenCalledOnce()
  })

  it('完成PNGを同じsessionで再利用し、作品更新とresetで一度だけ解放する', async () => {
    const deps = dependencies()
    const releaseCompleted = vi.fn()
    deps.completedArtworkGenerator.generate.mockResolvedValue({
      blob: new Blob(['png'], { type: 'image/png' }),
      objectUrl: 'blob:completed',
      width: 1080,
      height: 1080,
      dispose: releaseCompleted,
    })
    const service = createCreationSessionAppService(deps.values)
    await service.start()
    await service.selectTemplate('buncho-01')

    await expect(service.completeArtwork()).resolves.toBe(true)
    await expect(service.completeArtwork()).resolves.toBe(true)
    expect(deps.completedArtworkGenerator.generate).toHaveBeenCalledOnce()
    expect(service.completedArtwork.value).toMatchObject({
      phase: 'ready',
      objectUrl: 'blob:completed',
    })

    service.attachCameraTarget({
      srcObject: null,
      videoWidth: 1920,
      videoHeight: 1080,
      play: vi.fn(async () => undefined),
    } as unknown as HTMLVideoElement)
    await service.openCamera('body')
    await service.confirmCameraRationale()
    await service.captureCamera()

    expect(releaseCompleted).toHaveBeenCalledOnce()
    expect(service.completedArtwork.value).toEqual({ phase: 'idle' })
    service.resetToStart()
    expect(releaseCompleted).toHaveBeenCalledOnce()
  })

  it('写真を正規化resourceから原子的に反映し、resetで一度だけ解放する', async () => {
    const deps = dependencies()
    const service = createCreationSessionAppService(deps.values)
    await service.start()
    await service.selectTemplate('buncho-01')

    service.openPhoto('body')
    expect(service.photoState.value).toEqual({
      phase: 'selecting',
      areaId: 'body',
    })
    await service.selectPhoto(
      new File(['photo'], 'private.jpg', { type: 'image/jpeg' }),
    )
    expect(service.photoState.value).toMatchObject({
      phase: 'editing',
      areaId: 'body',
    })
    await expect(service.applyPhoto()).resolves.toBe(true)
    expect(service.activeCreation.value?.areas).toMatchObject([
      { id: 'body', fillKind: 'photo' },
    ])
    expect(deps.disposePhoto).toHaveBeenCalledOnce()

    service.resetToStart()
    expect(deps.releasePhoto).toHaveBeenCalledOnce()
  })
})
