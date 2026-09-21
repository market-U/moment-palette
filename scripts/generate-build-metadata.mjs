import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const productionBuildIdPattern = /^[0-9a-f]{40}$/
const developmentBuildIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/

export const assertMatchingVersions = (appVersion, apiVersion) => {
  if (appVersion !== apiVersion) {
    throw new Error(
      `package versionが一致しません: app=${appVersion}, api=${apiVersion}`,
    )
  }
  return appVersion
}

export const assertBuildId = (buildId, production) => {
  const pattern = production
    ? productionBuildIdPattern
    : developmentBuildIdPattern
  if (!pattern.test(buildId)) {
    throw new Error(
      production
        ? 'production build IDには40文字のcommit SHAが必要です。'
        : 'development build IDが不正です。',
    )
  }
  return buildId
}

export const createMetadataArtifacts = (appVersion, buildId) => ({
  frontendModule: `// build前にscripts/generate-build-metadata.mjsが生成する。\nexport const APP_VERSION = '${appVersion}'\nexport const BUILD_ID = '${buildId}'\n`,
  apiModule: `// build前にscripts/generate-build-metadata.mjsが同じ入力から生成する。\nexport const API_VERSION = '${appVersion}'\nexport const BUILD_ID = '${buildId}'\n`,
  releaseJson: `${JSON.stringify({ appVersion, buildId }, null, 2)}\n`,
})

const readPackage = async (path) => JSON.parse(await readFile(path, 'utf8'))

const parseArguments = (arguments_) => {
  const buildIdIndex = arguments_.indexOf('--build-id')
  if (buildIdIndex < 0 || !arguments_[buildIdIndex + 1]) {
    throw new Error('--build-idを明示してください。')
  }
  return {
    buildId: arguments_[buildIdIndex + 1],
    production: arguments_.includes('--production'),
  }
}

export const generateBuildMetadata = async ({ buildId, production }) => {
  const [appPackage, apiPackage] = await Promise.all([
    readPackage(resolve(projectRoot, 'package.json')),
    readPackage(resolve(projectRoot, 'api/package.json')),
  ])
  const appVersion = assertMatchingVersions(
    appPackage.version,
    apiPackage.version,
  )
  assertBuildId(buildId, production)
  const artifacts = createMetadataArtifacts(appVersion, buildId)

  await Promise.all([
    writeFile(
      resolve(projectRoot, 'src/app/config/generatedBuildMetadata.ts'),
      artifacts.frontendModule,
    ),
    writeFile(
      resolve(projectRoot, 'api/src/generated/buildMetadata.ts'),
      artifacts.apiModule,
    ),
    writeFile(
      resolve(projectRoot, 'public/release.json'),
      artifacts.releaseJson,
    ),
  ])
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  generateBuildMetadata(parseArguments(process.argv.slice(2))).catch(
    (error) => {
      console.error(
        error instanceof Error
          ? error.message
          : 'build metadataを生成できません。',
      )
      process.exitCode = 1
    },
  )
}
