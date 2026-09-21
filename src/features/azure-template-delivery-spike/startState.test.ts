import { describe, expect, it } from 'vitest'

import { applyCompatibilityResult, shouldCheckRelease } from './startState'

describe('Start状態', () => {
  it('一致時だけasset読込へ進む', () => {
    expect(applyCompatibilityResult({ compatible: true })).toEqual({
      phase: 'loading-assets',
    })
    expect(
      applyCompatibilityResult({ compatible: false, reason: 'build-mismatch' }),
    ).toEqual({
      phase: 'reload-required',
      reason: 'build-mismatch',
    })
  })

  it('制作開始後はrelease確認を行わない', () => {
    expect(shouldCheckRelease({ phase: 'active' })).toBe(false)
    expect(
      shouldCheckRelease({ phase: 'retryable-error', message: 'retry' }),
    ).toBe(true)
  })
})
