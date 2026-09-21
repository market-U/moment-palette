import { describe, expect, it, vi } from 'vitest'

import type { CompletedImageResource } from './completedImagePort'
import { CompletedImageOwner } from './completedImageOwner'

const createResource = (generationId: number): CompletedImageResource => ({
  blob: new Blob(['png'], { type: 'image/png' }),
  objectUrl: `blob:${String(generationId)}`,
  width: 1080,
  height: 1080,
  bytes: 3,
  generationId,
  generationMs: 1,
  dispose: vi.fn(),
})

describe('CompletedImageOwner', () => {
  it('resource交換前に以前のresourceを解放する', () => {
    const owner = new CompletedImageOwner()
    const first = createResource(1)
    const second = createResource(2)

    owner.replace(first)
    owner.replace(second)

    expect(first.dispose).toHaveBeenCalledOnce()
    expect(owner.current).toBe(second)
  })

  it('共有中の二重開始を防ぎ、終了後も同じresourceを再利用する', () => {
    const owner = new CompletedImageOwner()
    const resource = createResource(1)
    owner.replace(resource)

    expect(owner.beginShare()).toBe(true)
    expect(owner.beginShare()).toBe(false)
    expect(owner.current?.generationId).toBe(1)
    owner.finishShare()
    expect(owner.beginShare()).toBe(true)
    expect(owner.current).toBe(resource)
  })

  it('複数回disposeしても所有resourceを一度だけ解放する', () => {
    const owner = new CompletedImageOwner()
    const resource = createResource(1)
    owner.replace(resource)

    owner.dispose()
    owner.dispose()

    expect(resource.dispose).toHaveBeenCalledOnce()
    expect(owner.current).toBeUndefined()
  })
})
