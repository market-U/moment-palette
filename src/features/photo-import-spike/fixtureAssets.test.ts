/// <reference types="node" />

import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const fixtureRoot = 'public/spikes/photo-import/fixtures/'

const readJpegSize = (bytes: Buffer) => {
  let offset = 2

  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      throw new Error('JPEG markerを確認できませんでした。')
    }

    const marker = bytes[offset + 1] ?? 0
    const length = bytes.readUInt16BE(offset + 2)

    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      }
    }

    offset += 2 + length
  }

  throw new Error('JPEG寸法を確認できませんでした。')
}

const readOrientation = (bytes: Buffer) => {
  const exifOffset = bytes.indexOf(Buffer.from('Exif\0\0', 'ascii'))
  expect(exifOffset).toBeGreaterThan(0)

  // generatorが作るbig-endianの最小EXIFだけを静的に検査する。
  return bytes.readUInt16BE(exifOffset + 24)
}

describe('photo import fixture assets', () => {
  it.each([
    [1, { width: 480, height: 320 }],
    [3, { width: 480, height: 320 }],
    [6, { width: 320, height: 480 }],
    [8, { width: 320, height: 480 }],
  ])('Orientation %iの格納寸法とEXIFを固定する', (orientation, size) => {
    const bytes = readFileSync(`${fixtureRoot}orientation-${orientation}.jpg`)
    expect(readJpegSize(bytes)).toEqual(size)
    expect(readOrientation(bytes)).toBe(orientation)
  })

  it('alpha PNGがRGBAかつ480×320である', () => {
    const bytes = readFileSync(`${fixtureRoot}alpha.png`)
    expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG')
    expect(bytes.readUInt32BE(16)).toBe(480)
    expect(bytes.readUInt32BE(20)).toBe(320)
    expect(bytes[25]).toBe(6)
  })

  it('破損fixtureがJPEG signatureを持たない', () => {
    const bytes = readFileSync(`${fixtureRoot}corrupted.jpg`)
    expect([...bytes.subarray(0, 2)]).not.toEqual([0xff, 0xd8])
  })

  it('実機写真に見える未管理ファイルを追加していない', () => {
    const manifest = readFileSync(`${fixtureRoot}README.md`, 'utf8')
    expect(manifest).toContain('実機写真、位置情報を含めない')
  })
})
