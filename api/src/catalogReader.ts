import { BlobServiceClient } from '@azure/storage-blob'

import { parseCatalog } from './catalog'
import { PublicApiError, type ApiConfig, type TemplateCatalog } from './types'

export type CatalogReader = {
  read: () => Promise<TemplateCatalog>
}

export const parseCatalogJson = (text: string): TemplateCatalog => {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new PublicApiError(
      'catalog-invalid',
      'カタログJSONを解析できません。',
      502,
    )
  }
  return parseCatalog(value)
}

export const createAzureCatalogReader = (config: ApiConfig): CatalogReader => ({
  async read() {
    try {
      const client = BlobServiceClient.fromConnectionString(
        config.storageConnectionString,
      )
        .getContainerClient(config.containerName)
        .getBlobClient(config.catalogBlobName)
      const response = await client.download()
      if (!response.readableStreamBody) {
        throw new Error('catalog response body is empty')
      }
      const chunks: Buffer[] = []
      for await (const chunk of response.readableStreamBody) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      return parseCatalogJson(Buffer.concat(chunks).toString('utf8'))
    } catch (error) {
      if (error instanceof PublicApiError) throw error
      // SDKの例外はrequest情報を含み得るため、外部へは固定した分類だけを返す。
      throw new PublicApiError(
        'storage-unavailable',
        'テンプレートカタログを取得できません。',
        503,
      )
    }
  },
})
