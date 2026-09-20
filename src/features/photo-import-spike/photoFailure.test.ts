import { describe, expect, it } from 'vitest'

import {
  classifyPhotoFailure,
  createPhotoFailure,
  PhotoImportError,
} from './photoFailure'

describe('classifyPhotoFailure', () => {
  it('選択なしをエラーにせず現在状態を保つ案内にする', () => {
    expect(createPhotoFailure('no-selection')).toMatchObject({
      kind: 'no-selection',
      title: '写真は選択されませんでした',
    })
  })

  it.each([
    'decode-failed',
    'invalid-dimensions',
    'normalization-failed',
    'resource-pressure',
  ] as const)('%sを保った案内へ変換する', (kind) => {
    expect(
      classifyPhotoFailure(new PhotoImportError(kind, '内部詳細')).kind,
    ).toBe(kind)
  })

  it('未知の値や例外本文を画面案内へ含めない', () => {
    const failure = classifyPhotoFailure(new Error('private.jpg'))
    expect(failure.kind).toBe('unknown')
    expect(`${failure.title}${failure.guidance}`).not.toContain('private.jpg')
  })
})
