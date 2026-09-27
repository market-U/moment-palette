import { describe, expect, it, vi } from 'vitest'

import { createTemplate } from '@/domain/template'

import { createCanvasAreaHitTester } from './canvasAreaHitTester'

const template = createTemplate({
  id: 't',
  assetRevision: 'r',
  name: { ja: 't', en: 't' },
  tags: [],
  areas: [
    { id: 'back', label: { ja: '背', en: 'Back' }, initialColor: '#FFFFFF' },
    { id: 'front', label: { ja: '前', en: 'Front' }, initialColor: '#000000' },
  ],
})

const makeCanvas = (pixel: Uint8ClampedArray) => {
  const context = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: pixel })),
    globalCompositeOperation: 'source-over',
    fillStyle: '',
  }
  return {
    width: 0,
    height: 0,
    getContext: vi.fn(() => context),
  } as unknown as HTMLCanvasElement
}

describe('canvas area hit tester', () => {
  it('最前面Areaの識別色だけをArea IDへ復元し、解放後は判定しない', () => {
    const hitMap = makeCanvas(new Uint8ClampedArray([2, 0, 0, 255]))
    const layer = makeCanvas(new Uint8ClampedArray())
    const tester = createCanvasAreaHitTester({
      createCanvas: vi
        .fn()
        .mockReturnValueOnce(hitMap)
        .mockReturnValueOnce(layer),
    }).create(template, {
      lineArt: {} as never,
      masks: [
        { id: 'back', source: {} as never },
        { id: 'front', source: {} as never },
      ] as never,
      release: vi.fn(),
    })
    expect(tester.findAreaAt(10, 10)).toBe('front')
    tester.release()
    expect(tester.findAreaAt(10, 10)).toBeUndefined()
    expect(hitMap.width).toBe(0)
  })
})
