import { describe, expect, it, vi } from 'vitest'

import { createBrowserClipboard } from './browserClipboard'

describe('createBrowserClipboard', () => {
  it('Clipboard APIの成功、非対応、失敗を安全な結果へ変換する', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(
      createBrowserClipboard({ clipboard: { writeText } }).copy('text'),
    ).resolves.toEqual({ kind: 'copied' })
    expect(writeText).toHaveBeenCalledWith('text')

    await expect(createBrowserClipboard({}).copy('text')).resolves.toEqual({
      kind: 'unsupported',
    })
    await expect(
      createBrowserClipboard({
        clipboard: { writeText: vi.fn().mockRejectedValue(new Error()) },
      }).copy('text'),
    ).resolves.toEqual({ kind: 'failed' })
  })
})
