import { describe, expect, it } from 'vitest'

import { classifyShareError } from './shareOutcome'

describe('classifyShareError', () => {
  it('AbortErrorを正常なキャンセルとして扱う', () => {
    expect(
      classifyShareError(new DOMException('cancel', 'AbortError')),
    ).toEqual({
      kind: 'cancelled',
      errorName: 'AbortError',
    })
  })

  it.each(['InvalidStateError', 'NotAllowedError', 'TypeError', 'DataError'])(
    '%sへ再試行案内を返す',
    (name) => {
      expect(
        classifyShareError(new DOMException('failed', name)),
      ).toMatchObject({
        kind: 'failed',
        errorName: name,
      })
    },
  )

  it('未知の値をUnknownErrorとして扱う', () => {
    expect(classifyShareError('failed')).toMatchObject({
      kind: 'failed',
      errorName: 'UnknownError',
    })
  })
})
