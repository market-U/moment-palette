import { describe, expect, it, vi } from 'vitest'

import {
  drawPhotoAreaContent,
  drawPhotoPreviewPlanes,
  drawPhotoSource,
} from './canvasPhotoCompositor'

describe('drawPhotoSource', () => {
  it('正規化済み写真を1080論理座標の変換どおりに描く', () => {
    const context = {
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D
    const source = {} as CanvasImageSource

    drawPhotoSource(context, source, 2000, 1000, {
      scale: 1.2,
      offsetX: -100,
      offsetY: -50,
    })

    expect(context.drawImage).toHaveBeenCalledWith(
      source,
      -100,
      -50,
      2400,
      1200,
    )
  })
})

describe('drawPhotoAreaContent', () => {
  it('透過画像の下へ選択エリアの初期色を先に描く', () => {
    const calls: string[] = []
    const context = {
      fillStyle: '',
      fillRect: vi.fn(() => calls.push('base')),
    } as unknown as CanvasRenderingContext2D

    drawPhotoAreaContent(
      context,
      {
        id: 'mouth',
        label: '口の中',
        maskUrl: '/mouth-mask.png',
        initialColor: '#c9787f',
        alphaBounds: { x: 424, y: 365, width: 267, height: 421 },
      },
      { width: 1080, height: 1080 },
      () => calls.push('transparent-photo'),
    )

    expect(context.fillStyle).toBe('#c9787f')
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 1080, 1080)
    expect(calls).toEqual(['base', 'transparent-photo'])
  })
})

describe('drawPhotoPreviewPlanes', () => {
  it('中間比率でも写真全体を不透明に置いてから作品と線画を重ねる', () => {
    const calls: string[] = []
    const sourcePlane = { id: 'source' } as unknown as HTMLCanvasElement
    const artworkPlane = { id: 'artwork' } as unknown as HTMLCanvasElement
    let globalAlpha = 1
    const context = {
      get globalAlpha() {
        return globalAlpha
      },
      set globalAlpha(value: number) {
        globalAlpha = value
      },
      drawImage: vi.fn((source: HTMLCanvasElement) => {
        calls.push(
          `${(source as unknown as { id: string }).id}:${String(globalAlpha)}`,
        )
      }),
    } as unknown as CanvasRenderingContext2D

    drawPhotoPreviewPlanes(
      context,
      sourcePlane,
      artworkPlane,
      { source: 1, artwork: 0.5, lineArt: 1 },
      () => calls.push(`line-art:${String(globalAlpha)}`),
    )

    expect(calls).toEqual(['source:1', 'artwork:0.5', 'line-art:1'])
  })
})
