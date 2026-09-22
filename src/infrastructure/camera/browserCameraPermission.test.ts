import { describe, expect, it, vi } from 'vitest'

import { createBrowserCameraPermission } from './browserCameraPermission'

describe('createBrowserCameraPermission', () => {
  it.each(['granted', 'prompt', 'denied'] as const)(
    '%sを製品権限状態として返す',
    async (state) => {
      const query = vi.fn().mockResolvedValue({ state })

      await expect(createBrowserCameraPermission(query).query()).resolves.toBe(
        state,
      )
      expect(query).toHaveBeenCalledWith({ name: 'camera' })
    },
  )

  it('Permissions API未対応時はunknownとして取得を妨げない', async () => {
    await expect(
      createBrowserCameraPermission(undefined).query(),
    ).resolves.toBe('unknown')
  })

  it('照会失敗時はunknownとして取得を妨げない', async () => {
    const query = vi.fn().mockRejectedValue(new Error('unsupported'))

    await expect(createBrowserCameraPermission(query).query()).resolves.toBe(
      'unknown',
    )
  })
})
