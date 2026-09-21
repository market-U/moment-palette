import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const release = JSON.parse(await readFile(resolve('dist/release.json'), 'utf8'))
const frontendSource = await readFile(
  resolve('src/app/config/generatedBuildMetadata.ts'),
  'utf8',
)
const apiSource = await readFile(
  resolve('api/src/generated/buildMetadata.ts'),
  'utf8',
)

const includes = (source, value) => source.includes(`'${value}'`)
if (
  !includes(frontendSource, release.appVersion) ||
  !includes(frontendSource, release.buildId) ||
  !includes(apiSource, release.appVersion) ||
  !includes(apiSource, release.buildId)
) {
  throw new Error('フロント、API、release.jsonのbuild metadataが一致しません。')
}

console.log(`build metadata一致: ${release.appVersion} / ${release.buildId}`)
