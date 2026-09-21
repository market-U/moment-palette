import { describe, expect, it } from 'vitest'

import {
  createShareText,
  prepareImageShare,
  shareFixtureCopy,
} from './sharePayload'

describe('prepareImageShare', () => {
  const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const blob = new Blob([pngBytes], { type: 'image/png' })

  it.each([
    ['compatibility', 'text/plain'],
    ['standard', 'image/png'],
  ] as const)('%s方式へ共有文を含める', (mode, type) => {
    const prepared = prepareImageShare(blob, mode)

    expect(prepared.file.name).toBe(shareFixtureCopy.filename)
    expect(prepared.file.type).toBe(type)
    expect(prepared.file.size).toBe(blob.size)
    expect(prepared.data).toEqual({
      files: [prepared.file],
      text: createShareText(shareFixtureCopy),
    })
  })

  it('画像のみ方式ではFile以外を含めない', () => {
    const prepared = prepareImageShare(blob, 'image-only')

    expect(prepared.file.type).toBe('image/png')
    expect(prepared.data).toEqual({ files: [prepared.file] })
  })

  it.each(['compatibility', 'standard', 'image-only'] as const)(
    '%s方式でもPNG bytesを変換しない',
    async (mode) => {
      const prepared = prepareImageShare(blob, mode)
      expect(new Uint8Array(await prepared.file.arrayBuffer())).toEqual(
        pngBytes,
      )
    },
  )
})
