import { readFile, writeFile } from 'node:fs/promises'

const [, , filePath, orientationText] = process.argv
const orientation = Number(orientationText)

if (!filePath || ![1, 3, 6, 8].includes(orientation)) {
  throw new Error('usage: node set-jpeg-orientation.mjs <jpeg> <1|3|6|8>')
}

const jpeg = await readFile(filePath)

if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) {
  throw new Error(`${filePath} is not a JPEG file`)
}

// ImageMagickの環境差に左右されず、Orientationだけを持つ最小EXIF APP1を挿入する。
// 位置情報など他のmetadataは一切含めず、fixtureのプライバシーを保証する。
const app1 = Buffer.alloc(36)
app1.writeUInt16BE(0xffe1, 0)
app1.writeUInt16BE(34, 2)
app1.write('Exif\0\0', 4, 'ascii')
app1.write('MM', 10, 'ascii')
app1.writeUInt16BE(0x002a, 12)
app1.writeUInt32BE(8, 14)
app1.writeUInt16BE(1, 18)
app1.writeUInt16BE(0x0112, 20)
app1.writeUInt16BE(3, 22)
app1.writeUInt32BE(1, 24)
app1.writeUInt16BE(orientation, 28)
app1.writeUInt16BE(0, 30)
app1.writeUInt32BE(0, 32)

await writeFile(
  filePath,
  Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]),
)
