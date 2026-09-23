import { describe, expect, it, vi } from 'vitest'

import type { CompletedArtworkResource } from './completedArtworkPort'
import { CompletedArtworkOwner } from './completedArtworkOwner'

const resource = (id: string): CompletedArtworkResource => ({
  blob: new Blob(['png'], { type: 'image/png' }),
  objectUrl: `blob:${id}`,
  width: 1080,
  height: 1080,
  dispose: vi.fn(),
})

describe('CompletedArtworkOwner', () => {
  it('置換と明示破棄でresourceを一度ずつ解放する', () => {
    const owner = new CompletedArtworkOwner()
    const first = resource('first')
    const second = resource('second')

    owner.replace(first)
    owner.replace(second)
    owner.dispose()
    owner.dispose()

    expect(first.dispose).toHaveBeenCalledOnce()
    expect(second.dispose).toHaveBeenCalledOnce()
  })

  it('共有中の二重開始を防ぎ、終了後に同じresourceを再利用する', () => {
    const owner = new CompletedArtworkOwner()
    const image = resource('image')
    owner.replace(image)

    expect(owner.beginShare()).toBe(true)
    expect(owner.beginShare()).toBe(false)
    owner.finishShare()
    expect(owner.beginShare()).toBe(true)
    expect(owner.current).toBe(image)
  })
})
