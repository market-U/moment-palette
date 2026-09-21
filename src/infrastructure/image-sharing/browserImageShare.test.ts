import { describe, expect, it, vi } from 'vitest'

import { prepareImageShare } from '@/features/image-sharing-spike/sharePayload'
import { createBrowserImageShare } from './browserImageShare'

const blob = new Blob(['png'], { type: 'image/png' })
const prepared = prepareImageShare(blob, 'compatibility')

const createNavigator = () => ({
  canShare: vi.fn(() => true),
  share: vi.fn().mockResolvedValue(undefined),
})

describe('createBrowserImageShare', () => {
  it('実際のFileでcanShareしてから同じdataを直ちにshareへ渡す', async () => {
    const navigatorApi = createNavigator()
    const port = createBrowserImageShare(navigatorApi)

    await expect(port.share(prepared)).resolves.toEqual({ kind: 'handed-off' })
    expect(navigatorApi.canShare).toHaveBeenCalledWith({
      files: [prepared.file],
    })
    expect(navigatorApi.share).toHaveBeenCalledWith(prepared.data)
    expect(navigatorApi.canShare.mock.invocationCallOrder[0]).toBeLessThan(
      navigatorApi.share.mock.invocationCallOrder[0]!,
    )
  })

  it('API非対応とFile共有不可を区別する', async () => {
    const unsupported = createBrowserImageShare({})
    expect(unsupported.canShare(prepared)).toEqual({
      available: false,
      reason: 'web-share',
    })

    const navigatorApi = createNavigator()
    navigatorApi.canShare.mockReturnValue(false)
    await expect(
      createBrowserImageShare(navigatorApi).share(prepared),
    ).resolves.toEqual({ kind: 'unsupported', reason: 'file-share' })
    expect(navigatorApi.share).not.toHaveBeenCalled()
  })

  it('キャンセルと失敗を分類する', async () => {
    const cancelled = createNavigator()
    cancelled.share.mockRejectedValue(new DOMException('cancel', 'AbortError'))
    await expect(
      createBrowserImageShare(cancelled).share(prepared),
    ).resolves.toMatchObject({ kind: 'cancelled' })

    const failed = createNavigator()
    failed.share.mockRejectedValue(
      new DOMException('blocked', 'NotAllowedError'),
    )
    await expect(
      createBrowserImageShare(failed).share(prepared),
    ).resolves.toMatchObject({
      kind: 'failed',
      errorName: 'NotAllowedError',
    })
  })
})
