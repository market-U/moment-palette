import { describe, expect, it, vi } from 'vitest'

import { createBrowserTemplateImageShare } from './browserTemplateImageShare'

describe('template image share', () => {
  it('PNG bytesを互換Fileと固定文へ渡す', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const navigatorApi = { canShare: vi.fn().mockReturnValue(true), share }
    const blob = new Blob(['png'], { type: 'image/png' })
    const port = createBrowserTemplateImageShare(navigatorApi)

    expect(port.canShare(blob)).toBe(true)
    await expect(port.share(blob)).resolves.toBe('handed-off')
    const data = share.mock.calls[0]?.[0] as ShareData
    expect(data.files?.[0]?.name).toBe('moment-palette-azure-template-fs.png')
    expect(data.files?.[0]?.type).toBe('text/plain')
    expect(data.text).toContain('#MomentPalette')
  })

  it('キャンセルを失敗と区別する', async () => {
    const port = createBrowserTemplateImageShare({
      canShare: vi.fn().mockReturnValue(true),
      share: vi
        .fn()
        .mockRejectedValue(new DOMException('cancel', 'AbortError')),
    })
    await expect(port.share(new Blob(['png']))).resolves.toBe('cancelled')
  })
})
