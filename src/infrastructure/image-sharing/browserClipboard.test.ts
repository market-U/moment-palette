import { describe, expect, it, vi } from 'vitest'

import { createBrowserClipboard } from './browserClipboard'

describe('createBrowserClipboard', () => {
  it('共有文全体をClipboardへ渡す', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) }
    await expect(
      createBrowserClipboard(clipboard).copy('message'),
    ).resolves.toEqual({ kind: 'copied' })
    expect(clipboard.writeText).toHaveBeenCalledWith('message')
  })

  it('非対応と拒否を区別する', async () => {
    await expect(
      createBrowserClipboard(undefined).copy('message'),
    ).resolves.toEqual({ kind: 'unsupported' })

    const clipboard = {
      writeText: vi
        .fn()
        .mockRejectedValue(new DOMException('denied', 'NotAllowedError')),
    }
    await expect(
      createBrowserClipboard(clipboard).copy('message'),
    ).resolves.toEqual({ kind: 'failed', errorName: 'NotAllowedError' })
  })
})
