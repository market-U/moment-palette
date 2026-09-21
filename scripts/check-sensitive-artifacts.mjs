import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const roots = ['dist', 'api/dist']
const sensitivePatterns = [
  /DefaultEndpointsProtocol=[^\s"']+;[^\s"']*AccountKey=/i,
  /[?&]sig=[A-Za-z0-9%+/=]{16,}/i,
]

const files = []
const visit = async (path) => {
  const information = await stat(path)
  if (information.isDirectory()) {
    for (const entry of await readdir(path)) await visit(resolve(path, entry))
  } else {
    files.push(path)
  }
}

for (const root of roots) await visit(resolve(root))
for (const file of files) {
  const bytes = await readFile(file)
  if (bytes.includes(0)) continue
  const text = bytes.toString('utf8')
  for (const pattern of sensitivePatterns) {
    if (pattern.test(text))
      throw new Error(`秘密値らしき文字列をbuild成果物で検出しました: ${file}`)
  }
}

console.log(
  'build成果物に接続文字列または完全なSAS署名は見つかりませんでした。',
)
