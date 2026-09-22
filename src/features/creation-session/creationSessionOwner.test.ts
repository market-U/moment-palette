import { describe, expect, it, vi } from 'vitest'

import { CreationSessionOwner } from './creationSessionOwner'

describe('creation session owner', () => {
  it('置換と複数回clearで各sessionを一度だけ解放する', () => {
    const first = { release: vi.fn() }
    const second = { release: vi.fn() }
    const owner = new CreationSessionOwner()

    owner.replace(first)
    owner.replace(first)
    owner.replace(second)
    owner.clear()
    owner.clear()

    expect(first.release).toHaveBeenCalledOnce()
    expect(second.release).toHaveBeenCalledOnce()
    expect(owner.current).toBeNull()
  })
})
