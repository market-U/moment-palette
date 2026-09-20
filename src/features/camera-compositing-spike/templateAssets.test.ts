/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'

import { describe, expect, it } from 'vitest'

import { cameraAreas } from './template'

interface DecodedMask {
  width: number
  height: number
  alpha: Uint8Array
}

const sourceRoot = fileURLToPath(
  new URL(
    '../../../openspec/changes/archive/2026-09-20-validate-camera-compositing/文鳥01/',
    import.meta.url,
  ),
)
const publicRoot = fileURLToPath(
  new URL('../../../public/spikes/camera-compositing/', import.meta.url),
)

const assets = [
  ['線画.png', 'line-art.png'],
  ['背景.png', 'background-mask.png'],
  ['ボディ.png', 'body-mask.png'],
  ['くちばし.png', 'beak-mask.png'],
  ['口の中.png', 'mouth-mask.png'],
] as const

const expectedBounds = new Map([
  ['background-mask.png', { x: 0, y: 0, width: 1080, height: 1080 }],
  ['body-mask.png', { x: 180, y: 175, width: 867, height: 905 }],
  ['beak-mask.png', { x: 373, y: 216, width: 384, height: 607 }],
  ['mouth-mask.png', { x: 424, y: 365, width: 267, height: 421 }],
])

const paeth = (left: number, above: number, upperLeft: number) => {
  const prediction = left + above - upperLeft
  const leftDistance = Math.abs(prediction - left)
  const aboveDistance = Math.abs(prediction - above)
  const upperLeftDistance = Math.abs(prediction - upperLeft)

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left
  }

  return aboveDistance <= upperLeftDistance ? above : upperLeft
}

const decodeGrayscaleAlphaPng = (path: string): DecodedMask => {
  const png = readFileSync(path)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  expect(png.subarray(0, signature.length)).toEqual(signature)

  let offset = signature.length
  let width = 0
  let height = 0
  const compressed: Buffer[] = []

  while (offset < png.length) {
    const length = png.readUInt32BE(offset)
    const type = png.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    const data = png.subarray(dataStart, dataEnd)

    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      expect(data[8]).toBe(8)
      expect(data[9]).toBe(4)
      expect(data[12]).toBe(0)
    } else if (type === 'IDAT') {
      compressed.push(data)
    } else if (type === 'IEND') {
      break
    }

    offset = dataEnd + 4
  }

  const bytesPerPixel = 2
  const stride = width * bytesPerPixel
  const inflated = inflateSync(Buffer.concat(compressed))
  const alpha = new Uint8Array(width * height)
  let previous = new Uint8Array(stride)
  let inputOffset = 0

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inputOffset]
    inputOffset += 1
    const row = new Uint8Array(stride)

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[inputOffset + x] ?? 0
      const left = x >= bytesPerPixel ? (row[x - bytesPerPixel] ?? 0) : 0
      const above = previous[x] ?? 0
      const upperLeft =
        x >= bytesPerPixel ? (previous[x - bytesPerPixel] ?? 0) : 0
      let value: number

      switch (filter) {
        case 0:
          value = raw
          break
        case 1:
          value = raw + left
          break
        case 2:
          value = raw + above
          break
        case 3:
          value = raw + Math.floor((left + above) / 2)
          break
        case 4:
          value = raw + paeth(left, above, upperLeft)
          break
        default:
          throw new Error(`Unsupported PNG filter: ${String(filter)}`)
      }

      row[x] = value & 0xff
    }

    for (let x = 0; x < width; x += 1) {
      alpha[y * width + x] = row[x * bytesPerPixel + 1] ?? 0
    }

    inputOffset += stride
    previous = row
  }

  return { width, height, alpha }
}

const getAlphaBounds = ({ width, height, alpha }: DecodedMask) => {
  let minimumX = width
  let minimumY = height
  let maximumX = -1
  let maximumY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if ((alpha[y * width + x] ?? 0) === 0) {
        continue
      }

      minimumX = Math.min(minimumX, x)
      minimumY = Math.min(minimumY, y)
      maximumX = Math.max(maximumX, x)
      maximumY = Math.max(maximumY, y)
    }
  }

  return {
    x: minimumX,
    y: minimumY,
    width: maximumX - minimumX + 1,
    height: maximumY - minimumY + 1,
  }
}

const countOpaqueComponents = ({ width, height, alpha }: DecodedMask) => {
  const opaque = Uint8Array.from(alpha, (value) => (value >= 128 ? 1 : 0))
  const stack = new Int32Array(width * height)
  let components = 0

  for (let start = 0; start < opaque.length; start += 1) {
    if (opaque[start] !== 1) {
      continue
    }

    components += 1
    let stackSize = 1
    stack[0] = start
    opaque[start] = 0

    while (stackSize > 0) {
      stackSize -= 1
      const index = stack[stackSize] ?? 0
      const x = index % width
      const y = Math.floor(index / width)
      const neighbors = [
        x > 0 ? index - 1 : -1,
        x + 1 < width ? index + 1 : -1,
        y > 0 ? index - width : -1,
        y + 1 < height ? index + width : -1,
      ]

      for (const neighbor of neighbors) {
        if (neighbor >= 0 && opaque[neighbor] === 1) {
          opaque[neighbor] = 0
          stack[stackSize] = neighbor
          stackSize += 1
        }
      }
    }
  }

  return components
}

describe('production candidate camera spike assets', () => {
  it.each(assets)('copies %s byte-for-byte as %s', (source, target) => {
    expect(readFileSync(`${publicRoot}${target}`)).toEqual(
      readFileSync(`${sourceRoot}${source}`),
    )
  })

  it('does not copy the merged thumbnail', () => {
    expect(existsSync(`${publicRoot}thumbnail.png`)).toBe(false)
    expect(existsSync(`${sourceRoot}サムネイル.png`)).toBe(true)
  })

  it.each(assets)(
    '%s is an antialiased 1080px grayscale-alpha PNG',
    (_, target) => {
      const decoded = decodeGrayscaleAlphaPng(`${publicRoot}${target}`)

      expect(decoded.width).toBe(1080)
      expect(decoded.height).toBe(1080)
      expect(decoded.alpha.some((alpha) => alpha > 0 && alpha < 255)).toBe(true)
    },
  )

  it.each([...expectedBounds])(
    '%s has the expected alpha bounds',
    (target, bounds) => {
      expect(
        getAlphaBounds(decodeGrayscaleAlphaPng(`${publicRoot}${target}`)),
      ).toEqual(bounds)
    },
  )

  it('keeps the disconnected beak shapes in one mask', () => {
    expect(
      countOpaqueComponents(
        decodeGrayscaleAlphaPng(`${publicRoot}beak-mask.png`),
      ),
    ).toBeGreaterThan(1)
  })

  it('only overlaps the documented background/body boundary pixels', () => {
    const masks = cameraAreas.map((area) =>
      decodeGrayscaleAlphaPng(`${publicRoot}${area.maskUrl.split('/').at(-1)}`),
    )
    const overlaps = new Map<string, number>()

    for (let first = 0; first < masks.length; first += 1) {
      for (let second = first + 1; second < masks.length; second += 1) {
        let overlap = 0

        for (let pixel = 0; pixel < 1080 * 1080; pixel += 1) {
          if (
            (masks[first]?.alpha[pixel] ?? 0) >= 128 &&
            (masks[second]?.alpha[pixel] ?? 0) >= 128
          ) {
            overlap += 1
          }
        }

        overlaps.set(`${String(first)}:${String(second)}`, overlap)
      }
    }

    expect(overlaps).toEqual(
      new Map([
        ['0:1', 720],
        ['0:2', 0],
        ['0:3', 0],
        ['1:2', 0],
        ['1:3', 0],
        ['2:3', 0],
      ]),
    )
  })
})
