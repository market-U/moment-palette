import { describe, expect, it, vi } from 'vitest'

import { drawTemplate } from './canvasTemplateCompositor'

describe('template compositor', () => {
  it('取得済みmaskを色面に変換してから線画を最前面へ描く', () => {
    const calls: string[] = []
    const context = {
      clearRect: vi.fn(() => calls.push('clear')),
      fillRect: vi.fn(() => calls.push('fill')),
      drawImage: vi.fn((source: { name: string }) =>
        calls.push(`draw:${source.name}`),
      ),
      save: vi.fn(() => calls.push('save')),
      restore: vi.fn(() => calls.push('restore')),
      fillStyle: '',
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D

    drawTemplate(context, {
      lineArt: { source: { name: 'line' } as never } as never,
      masks: [{ id: 'body', source: { name: 'mask' } as never } as never],
      release: vi.fn(),
    })

    expect(calls).toEqual([
      'clear',
      'fill',
      'save',
      'draw:mask',
      'fill',
      'restore',
      'draw:line',
    ])
  })
})
