import { describe, expect, it } from 'vitest'

import { findNearestAreaId, getAreaEdgePadding } from './areaSelector'

describe('findNearestAreaId', () => {
  it('container中央へ最も近いAreaを選ぶ', () => {
    expect(
      findNearestAreaId(200, [
        { id: 'background', center: 80 },
        { id: 'body', center: 190 },
        { id: 'beak', center: 310 },
      ]),
    ).toBe('body')
  })

  it('空一覧では選択を作らない', () => {
    expect(findNearestAreaId(200, [])).toBeUndefined()
  })
})

describe('getAreaEdgePadding', () => {
  it('先頭と末尾を中央へ置ける半幅差を返す', () => {
    expect(getAreaEdgePadding(320, 96)).toBe(112)
  })

  it('項目がcontainerより大きい場合は負の余白を返さない', () => {
    expect(getAreaEdgePadding(100, 120)).toBe(0)
  })
})
