import { describe, expect, it } from 'vitest'

import {
  createCompletedArtworkShareText,
  prepareCompletedArtworkShare,
} from './sharePayload'

const copy = {
  message: 'Moment Paletteでつくった作品です。',
  hashtag: '#MomentPalette',
  url: 'https://example.com/',
}

describe('prepareCompletedArtworkShare', () => {
  it('PNG bytesと拡張子を保ったtext/plainの互換Fileを共有文とともに作る', async () => {
    const blob = new Blob(['png bytes'], { type: 'image/png' })
    const prepared = prepareCompletedArtworkShare(blob, copy)

    expect(prepared.file.name).toBe('moment-palette.png')
    expect(prepared.file.type).toBe('text/plain')
    await expect(prepared.file.text()).resolves.toBe('png bytes')
    expect(prepared.data).toEqual({
      files: [prepared.file],
      text: createCompletedArtworkShareText(copy),
    })
  })
})
