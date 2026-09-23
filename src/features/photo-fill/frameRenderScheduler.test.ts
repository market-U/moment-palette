import { describe, expect, it, vi } from 'vitest'

import { FrameRenderScheduler } from './frameRenderScheduler'

describe('FrameRenderScheduler', () => {
  it('同じ画面更新までの複数要求を一回の描画へ集約する', () => {
    const callbacks: Array<() => void> = []
    const render = vi.fn()
    const requestFrame = vi.fn((callback: () => void) => {
      callbacks.push(callback)
      return callbacks.length
    })
    const scheduler = new FrameRenderScheduler(render, requestFrame, vi.fn())

    scheduler.request()
    scheduler.request()
    scheduler.request()

    expect(requestFrame).toHaveBeenCalledOnce()
    callbacks[0]?.()
    expect(render).toHaveBeenCalledOnce()
  })

  it('破棄時に待機中の描画を取り消し、遅れて呼ばれても描画しない', () => {
    let callback: (() => void) | undefined
    const render = vi.fn()
    const cancelFrame = vi.fn()
    const scheduler = new FrameRenderScheduler(
      render,
      (next) => {
        callback = next
        return 42
      },
      cancelFrame,
    )

    scheduler.request()
    scheduler.dispose()
    callback?.()

    expect(cancelFrame).toHaveBeenCalledWith(42)
    expect(render).not.toHaveBeenCalled()
  })
})
