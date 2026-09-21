import { PublicApiError, type ApiConfig } from './types'

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

export const readApiConfig = (env: NodeJS.ProcessEnv): ApiConfig => ({
  storageConnectionString: requireSetting(
    env,
    'AZURE_STORAGE_CONNECTION_STRING',
  ),
  containerName: requireSetting(env, 'TEMPLATE_CONTAINER_NAME'),
  catalogBlobName: requireSetting(env, 'TEMPLATE_CATALOG_BLOB'),
})
