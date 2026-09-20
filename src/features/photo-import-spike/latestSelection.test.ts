import { describe, expect, it, vi } from 'vitest'

import { LatestSelection } from './latestSelection'

describe('LatestSelection', () => {
  it('逆順で完了した古い結果だけを解放する', () => {
    const latest = new LatestSelection<{ dispose(): void }>()
    const first = latest.begin()
    const second = latest.begin()
    const oldResult = { dispose: vi.fn() }
    const newResult = { dispose: vi.fn() }

    expect(latest.accept(second, newResult)).toBe(true)
    expect(latest.accept(first, oldResult)).toBe(false)
    expect(oldResult.dispose).toHaveBeenCalledOnce()
    expect(newResult.dispose).not.toHaveBeenCalled()
  })

  it('失敗後の次世代を最新として扱う', () => {
    const latest = new LatestSelection<{ dispose(): void }>()
    const failed = latest.begin()
    expect(latest.isCurrent(failed)).toBe(true)

    latest.invalidate()
    expect(latest.isCurrent(failed)).toBe(false)
  })
})
