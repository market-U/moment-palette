import { describe, expect, it, vi } from 'vitest'

import {
  applyCameraFill,
  createInitialArtwork,
  createTemplate,
} from '@/domain/template'

import { createCanvasCompletedArtworkGenerator } from './canvasCompletedArtworkGenerator'

const context = (calls: string[] = []) =>
  ({
    clearRect: vi.fn(() => calls.push('clear')),
    fillRect: vi.fn(() => calls.push('fill')),
    drawImage: vi.fn((source: { name?: string }) =>
      calls.push(`draw:${source.name ?? 'canvas'}`),
    ),
    restore: vi.fn(() => calls.push('restore')),
    save: vi.fn(() => calls.push('save')),
    fillStyle: '',
    globalCompositeOperation: 'source-over',
  }) as unknown as CanvasRenderingContext2D

const canvas = (value: CanvasRenderingContext2D, name: string) =>
  ({
    name,
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue(value),
    toBlob: vi.fn((callback: BlobCallback) =>
      callback(new Blob(['png'], { type: 'image/png' })),
    ),
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
    { id: 'body', label: { ja: '体', en: 'Body' }, initialColor: '#E8DED2' },
  ],
})

describe('createCanvasCompletedArtworkGenerator', () => {
  it('Area順に初期色とcamera frameをmaskで切り抜き、line artを最後に描く', async () => {
    const calls: string[] = []
    const canvases = [
      canvas(context(calls), 'artwork'),
      canvas(context(calls), 'layer'),
    ]
    const revokeObjectUrl = vi.fn()
    const generator = createCanvasCompletedArtworkGenerator({
      createCanvas: () => canvases.shift()!,
      createObjectUrl: () => 'blob:completed',
      revokeObjectUrl,
    })

    const resource = await generator.generate({
      template,
      artwork: applyCameraFill(createInitialArtwork(template), 'body'),
      assets: {
        lineArt: { name: 'line' } as never,
        masks: [
          { id: 'background', source: { name: 'background-mask' } as never },
          { id: 'body', source: { name: 'body-mask' } as never },
        ],
      },
      areaResources: new Map([
        ['body', { source: { name: 'body-frame' } as never }],
      ]),
    })

    expect(calls).toEqual([
      'fill',
      'save',
      'clear',
      'fill',
      'draw:background-mask',
      'restore',
      'draw:layer',
      'save',
      'clear',
      'draw:body-frame',
      'draw:body-mask',
      'restore',
      'draw:layer',
      'draw:line',
    ])
    expect(resource).toMatchObject({
      objectUrl: 'blob:completed',
      width: 1080,
      height: 1080,
    })
    resource.dispose()
    resource.dispose()
    expect(revokeObjectUrl).toHaveBeenCalledOnce()
  })
})
