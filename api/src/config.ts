import { PublicApiError, type ApiConfig } from './types'

const catalogFileNamePattern = /^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/

const requireSetting = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = env[name]?.trim()
  if (!value) {
    // 設定値そのものを例外へ含めず、ログ経由の秘密値露出を防ぐ。
    throw new PublicApiError(
      'configuration-invalid',
      `必須設定 ${name} がありません。`,
      500,
    )
  }
  return value
}

/** catalog設定に許可するファイル名だけを判定し、任意のBlob path指定を防ぐ。 */
export const isSafeCatalogFileName = (value: string): boolean =>
  catalogFileNamePattern.test(value)

/** APIがprivate Storageへ接続し製品catalogを選択するための必須設定を読み取る。 */
export const readApiConfig = (env: NodeJS.ProcessEnv): ApiConfig => ({
  storageConnectionString: requireSetting(
    env,
    'AZURE_STORAGE_CONNECTION_STRING',
  ),
  containerName: requireSetting(env, 'TEMPLATE_CONTAINER_NAME'),
  catalogFileName: (() => {
    const fileName = requireSetting(env, 'TEMPLATE_CATALOG_FILE')
    if (!isSafeCatalogFileName(fileName)) {
      throw new PublicApiError(
        'configuration-invalid',
        'TEMPLATE_CATALOG_FILE は安全なJSONファイル名で指定してください。',
        500,
      )
    }
    return fileName
  })(),
})
