import { describe, expect, it, vi } from 'vitest'

import { LatestSelection } from './latestSelection'

describe('LatestSelection', () => {
  it('新しい選択があると、遅れて完了した古いresourceを解放する', () => {
    const selection = new LatestSelection<{ dispose: () => void }>()
    const first = selection.begin()
    selection.begin()
    const result = { dispose: vi.fn() }

    expect(selection.accept(first, result)).toBe(false)
    expect(result.dispose).toHaveBeenCalledOnce()
  })

  it('現在の選択だけを採用する', () => {
    const selection = new LatestSelection<{ dispose: () => void }>()
    const generation = selection.begin()
    const result = { dispose: vi.fn() }

    expect(selection.accept(generation, result)).toBe(true)
    expect(result.dispose).not.toHaveBeenCalled()
  })
})
