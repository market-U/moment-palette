import { describe, expect, it, vi } from 'vitest'

import { createInitialArtwork, createTemplate } from '@/domain/template'

import {
  createCanvasArtworkPreview,
  drawInitialArtwork,
} from './canvasArtworkPreview'

const template = createTemplate({
  id: 'buncho-01',
  assetRevision: 'r1',
  name: { ja: '文鳥', en: 'Java sparrow' },
  tags: ['bird'],
  areas: [
    {
      id: 'body',
      label: { ja: '体', en: 'Body' },
      initialColor: '#E8DED2',
    },
  ],
})

const assets = {
  lineArt: { source: { name: 'line' } as never } as never,
  masks: [{ id: 'body', source: { name: 'mask' } as never } as never],
  release: vi.fn(),
}

describe('canvas artwork preview', () => {
  it('初期色のmaskを描画してから線画を前面へ重ねる', () => {
    const calls: string[] = []
    const context = {
      clearRect: vi.fn(() => calls.push('clear-main')),
      fillRect: vi.fn(() => calls.push('fill-main')),
      drawImage: vi.fn((source: { name: string }) =>
        calls.push(`draw-main:${source.name}`),
      ),
      fillStyle: '',
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D
    const layerContext = {
      canvas: { name: 'layer' },
      clearRect: vi.fn(() => calls.push('clear-layer')),
      fillRect: vi.fn(() => calls.push('fill-layer')),
      drawImage: vi.fn((source: { name: string }) =>
        calls.push(`draw-layer:${source.name}`),
      ),
      fillStyle: '',
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D

    drawInitialArtwork(
      context,
      layerContext,
      template,
      createInitialArtwork(template),
      assets,
    )
    expect(calls).toEqual([
      'clear-main',
      'fill-main',
      'clear-layer',
      'draw-layer:mask',
      'fill-layer',
      'draw-main:layer',
      'draw-main:line',
    ])
    expect(layerContext.fillStyle).toBe('#E8DED2')
  })

  it('object URLを一度だけ解放する', async () => {
    const revokeObjectUrl = vi.fn()
    const context = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: '',
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(context),
      toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png']))),
    } as unknown as HTMLCanvasElement
    const layerContext = {
      canvas: {} as HTMLCanvasElement,
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: '',
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D
    const layerCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(layerContext),
    } as unknown as HTMLCanvasElement
    const canvases = [canvas, layerCanvas]
    const preview = await createCanvasArtworkPreview({
      createCanvas: () => canvases.shift()!,
      createObjectUrl: () => 'blob:preview',
      revokeObjectUrl,
    }).generate(template, createInitialArtwork(template), assets)

    preview.release()
    preview.release()
    expect(preview).toMatchObject({
      url: 'blob:preview',
      width: 1080,
      height: 1080,
    })
    expect(revokeObjectUrl).toHaveBeenCalledOnce()
  })
})
