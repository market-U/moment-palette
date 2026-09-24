import { describe, expect, it, vi } from 'vitest'

import {
  applyCameraFill,
  applySolidColorFill,
  createInitialArtwork,
} from '@/domain/template'
import { createTemplate } from '@/domain/template'

import {
  createCanvasCameraCompositor,
  drawCameraSource,
} from './canvasCameraCompositor'

const context = (calls: string[] = []) =>
  ({
    canvas: { name: 'layer' },
    clearRect: vi.fn(() => calls.push('clear')),
    fillRect: vi.fn(() => calls.push('fill')),
    drawImage: vi.fn((source: { name?: string }) =>
      calls.push(`draw:${source.name ?? 'canvas'}`),
    ),
    restore: vi.fn(() => calls.push('restore')),
    save: vi.fn(() => calls.push('save')),
    scale: vi.fn(),
    translate: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
  }) as unknown as CanvasRenderingContext2D

const canvas = (
  value: CanvasRenderingContext2D,
  name = 'canvas',
): HTMLCanvasElement =>
  ({
    name,
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(value),
    toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png']))),
  }) as unknown as HTMLCanvasElement

const template = createTemplate({
  id: 'buncho-01',
  assetRevision: 'r1',
  name: { ja: '文鳥', en: 'Java sparrow' },
  tags: ['bird'],
  areas: [
    {
      id: 'background',
      label: { ja: '背景', en: 'Background' },
      initialColor: '#F3EBDD',
    },
    {
      id: 'body',
      label: { ja: '体', en: 'Body' },
      initialColor: '#E8DED2',
    },
  ],
})

const assets = {
  lineArt: { source: { name: 'line' } as never },
  masks: [
    { id: 'background', source: { name: 'background-mask' } as never },
    { id: 'body', source: { name: 'body-mask' } as never },
  ],
}

describe('drawCameraSource', () => {
  it('背面sourceは指定矩形へそのまま描画する', () => {
    const value = context()
    const source = {} as CanvasImageSource

    drawCameraSource(
      value,
      source,
      100,
      50,
      { scale: 2, offsetX: 10, offsetY: 20 },
      false,
    )

    expect(value.drawImage).toHaveBeenCalledWith(source, 10, 20, 200, 100)
    expect(value.translate).not.toHaveBeenCalled()
  })

  it('前面sourceは同じ描画矩形内で左右反転する', () => {
    const value = context()
    const source = {} as CanvasImageSource

    drawCameraSource(
      value,
      source,
      100,
      50,
      { scale: 2, offsetX: 10, offsetY: 20 },
      true,
    )

    expect(value.translate).toHaveBeenCalledWith(210, 20)
    expect(value.scale).toHaveBeenCalledWith(-1, 1)
    expect(value.drawImage).toHaveBeenCalledWith(source, 0, 0, 200, 100)
  })
})

describe('createCanvasCameraCompositor', () => {
  it('Area順に初期色と撮影frameへmaskを適用し、line artを最後に描く', async () => {
    const calls: string[] = []
    const contexts = [
      context(),
      context(),
      context(calls),
      context(),
      context(),
      context(calls),
    ]
    const canvases = contexts.map((value, index) =>
      canvas(value, `canvas-${String(index)}`),
    )
    const compositor = createCanvasCameraCompositor({
      createCanvas: () => canvases.shift()!,
      createObjectUrl: () => 'blob:preview',
      revokeObjectUrl: vi.fn(),
    })
    const artwork = applyCameraFill(createInitialArtwork(template), 'body')
    const frame = { name: 'body-frame' } as never

    const preview = await compositor.generatePreview({
      template,
      artwork,
      assets,
      areaResources: new Map([['body', { source: frame, release: vi.fn() }]]),
    })

    expect(calls).toEqual([
      'clear',
      'fill',
      'save',
      'clear',
      'fill',
      'draw:background-mask',
      'restore',
      'draw:canvas-2',
      'save',
      'clear',
      'draw:body-frame',
      'draw:body-mask',
      'restore',
      'draw:canvas-2',
      'draw:line',
    ])
    expect(preview).toMatchObject({
      url: 'blob:preview',
      width: 1080,
      height: 1080,
    })
  })

  it('単色をArea mask内へ描き、Canvasだけで作品previewを更新する', () => {
    const calls: string[] = []
    const internalCanvases = [
      canvas(context(calls), 'source-plane'),
      canvas(context(calls), 'artwork-plane'),
      canvas(context(calls), 'area-plane'),
      canvas(context(calls), 'before-plane'),
      canvas(context(calls), 'after-plane'),
    ]
    const compositor = createCanvasCameraCompositor({
      createCanvas: () => internalCanvases.shift()!,
      createObjectUrl: vi.fn(),
      revokeObjectUrl: vi.fn(),
    })
    const preview = canvas(context(calls), 'preview')
    preview.width = 540
    preview.height = 540

    compositor.renderArtworkPreview(preview, {
      template,
      artwork: applySolidColorFill(
        createInitialArtwork(template),
        'body',
        '#B35F91',
      ),
      assets,
      areaResources: new Map(),
    })

    expect(calls).toContain('draw:body-mask')
    expect(calls).toContain('draw:line')
  })

  it('表示比率の中間値でsourceを不透明、artworkを比率alphaで重ねる', () => {
    const internalContexts = [
      context(),
      context(),
      context(),
      context(),
      context(),
    ]
    const internalCanvases = internalContexts.map((value, index) =>
      canvas(value, `internal-${String(index)}`),
    )
    const compositor = createCanvasCameraCompositor({
      createCanvas: () => internalCanvases.shift()!,
      createObjectUrl: vi.fn(),
      revokeObjectUrl: vi.fn(),
    })
    const drawnAlphas: number[] = []
    const previewContext = context()
    previewContext.drawImage = vi.fn(() =>
      drawnAlphas.push(previewContext.globalAlpha),
    )
    const previewCanvas = canvas(previewContext)
    previewCanvas.width = 540
    previewCanvas.height = 540
    const video = {
      readyState: 2,
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement

    compositor.renderPreview(previewCanvas, video, {
      template,
      artwork: createInitialArtwork(template),
      assets,
      areaResources: new Map(),
      selectedAreaId: 'body',
      blend: 0.35,
      transform: { scale: 1, offsetX: 0, offsetY: 0 },
      mirrorSource: false,
    })

    expect(drawnAlphas).toEqual([1, 0.35, 1])
  })

  it('撮影frameを1080角で生成し、複数回releaseしても一度だけ解放する', () => {
    const contexts = [
      context(),
      context(),
      context(),
      context(),
      context(),
      context(),
    ]
    const canvases = contexts.map((value) => canvas(value))
    const compositor = createCanvasCameraCompositor({
      createCanvas: () => canvases.shift()!,
      createObjectUrl: vi.fn(),
      revokeObjectUrl: vi.fn(),
    })
    const video = {
      videoWidth: 1920,
      videoHeight: 1080,
    } as HTMLVideoElement
    const frame = compositor.captureFrame(
      video,
      { scale: 1, offsetX: 0, offsetY: 0 },
      false,
    )
    const frameCanvas = frame.source as HTMLCanvasElement

    expect(frameCanvas.width).toBe(1080)
    expect(frameCanvas.height).toBe(1080)
    frame.release()
    frame.release()
    expect(frameCanvas.width).toBe(0)
    expect(frameCanvas.height).toBe(0)
  })

  it('写真の連続調整では選択Areaの前後を静的cacheから再利用する', () => {
    const calls: string[] = []
    const internalCanvases = [
      canvas(context(calls), 'source-plane'),
      canvas(context(calls), 'artwork-plane'),
      canvas(context(calls), 'area-plane'),
      canvas(context(calls), 'before-plane'),
      canvas(context(calls), 'after-plane'),
    ]
    const compositor = createCanvasCameraCompositor({
      createCanvas: () => internalCanvases.shift()!,
      createObjectUrl: vi.fn(),
      revokeObjectUrl: vi.fn(),
    })
    const preview = canvas(context(calls), 'preview')
    preview.width = 540
    preview.height = 540
    const state = {
      template,
      artwork: createInitialArtwork(template),
      assets,
      areaResources: new Map(),
      selectedAreaId: 'body',
      blend: 1,
      transform: { scale: 1, offsetX: 0, offsetY: 0 },
    }

    compositor.renderPhotoPreview!(
      preview,
      { name: 'photo' } as never,
      { width: 100, height: 100 },
      state,
    )
    compositor.renderPhotoPreview!(
      preview,
      { name: 'photo' } as never,
      { width: 100, height: 100 },
      { ...state, transform: { scale: 1.1, offsetX: 2, offsetY: 3 } },
    )

    expect(
      calls.filter((call) => call === 'draw:background-mask'),
    ).toHaveLength(1)
    expect(calls.filter((call) => call === 'draw:body-mask')).toHaveLength(2)
  })
})
