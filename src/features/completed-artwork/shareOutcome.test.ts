import { describe, expect, it } from 'vitest'

import { classifyCompletedArtworkShareError } from './shareOutcome'

describe('classifyCompletedArtworkShareError', () => {
  it('共有シートのキャンセルを通常の結果として分類する', () => {
    expect(
      classifyCompletedArtworkShareError(
        new DOMException('cancel', 'AbortError'),
      ),
    ).toEqual({ kind: 'cancelled' })
  })

  it('外部例外本文を含めずに失敗名だけを返す', () => {
    expect(
      classifyCompletedArtworkShareError(
        new DOMException('blocked', 'NotAllowedError'),
      ),
    ).toEqual({ kind: 'failed', errorName: 'NotAllowedError' })
  })
})
