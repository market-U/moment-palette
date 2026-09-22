import { describe, expect, it } from 'vitest'

import {
  backToSelection,
  beginPreparing,
  preparationFailed,
  selectionFrom,
} from './state'

describe('template selection state', () => {
  it('空と一覧を区別する', () => {
    expect(selectionFrom([])).toEqual({ phase: 'empty' })
    expect(selectionFrom([{} as never]).phase).toBe('ready')
  })

  it('準備中は別の選択を開始しない', () => {
    const preparing = beginPreparing(selectionFrom([{} as never]), 'first')
    expect(beginPreparing(preparing, 'second')).toBe(preparing)
  })

  it('失敗から再試行または一覧へ戻れる状態を作る', () => {
    const preparing = beginPreparing(selectionFrom([{} as never]), 'first')
    const failed = preparationFailed(preparing)
    expect(failed).toMatchObject({ phase: 'error', templateId: 'first' })
    expect(backToSelection(failed).phase).toBe('ready')
  })
})
