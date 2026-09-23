import { describe, expect, it, vi } from 'vitest'

import { prepareCompletedArtworkShare } from '@/features/completed-artwork/sharePayload'

import { createBrowserCompletedArtworkShare } from './browserCompletedArtworkShare'

const prepared = prepareCompletedArtworkShare(
  new Blob(['png'], { type: 'image/png' }),
  {
    message: 'Moment Palette',
    hashtag: '#MomentPalette',
    url: 'https://example.com/',
  },
)

describe('createBrowserCompletedArtworkShare', () => {
  it('実際のFileを確認してから同期的に同じShareDataを渡す', async () => {
    const navigatorApi = {
      canShare: vi.fn(() => true),
      share: vi.fn().mockResolvedValue(undefined),
    }
    await expect(
      createBrowserCompletedArtworkShare(navigatorApi).share(prepared),
    ).resolves.toEqual({ kind: 'handed-off' })
    expect(navigatorApi.canShare).toHaveBeenCalledWith({
      files: [prepared.file],
    })
    expect(navigatorApi.share).toHaveBeenCalledWith(prepared.data)
  })

  it('非対応、キャンセル、失敗を分類する', async () => {
    await expect(
      createBrowserCompletedArtworkShare({}).share(prepared),
    ).resolves.toEqual({ kind: 'unsupported', reason: 'web-share' })

    const cancelled = {
      canShare: vi.fn(() => true),
      share: vi
        .fn()
        .mockRejectedValue(new DOMException('cancel', 'AbortError')),
    }
    await expect(
      createBrowserCompletedArtworkShare(cancelled).share(prepared),
    ).resolves.toEqual({ kind: 'cancelled' })
  })
})
