import {
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob'

import { PublicApiError, type ApiConfig } from './types'

export type ServiceSasSigner = {
  signReadUrl: (blobName: string, expiresOn: Date) => string
}

type ConnectionParts = {
  accountName: string
  accountKey: string
  blobEndpoint: string
}

/** Storage接続文字列からService SASの署名に必要な情報だけを取り出す。 */
export const parseStorageConnectionString = (
  connectionString: string,
): ConnectionParts => {
  const entries = new Map(
    connectionString
      .split(';')
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf('=')
        return separator > 0
          ? [entry.slice(0, separator), entry.slice(separator + 1)]
          : ['', '']
      }),
  )
  const accountName = entries.get('AccountName')
  const accountKey = entries.get('AccountKey')
  if (!accountName || !accountKey) {
    throw new PublicApiError(
      'configuration-invalid',
      'Storage接続設定を解釈できません。',
      500,
    )
  }
  const endpointSuffix = entries.get('EndpointSuffix') ?? 'core.windows.net'
  const blobEndpoint =
    entries.get('BlobEndpoint') ??
    `https://${accountName}.blob.${endpointSuffix}`
  return {
    accountName,
    accountKey,
    blobEndpoint: blobEndpoint.replace(/\/$/, ''),
  }
}

/** private Blobへ最小権限の読み取りSASを発行するsignerを生成する。 */
export const createServiceSasSigner = (config: ApiConfig): ServiceSasSigner => {
  const parts = parseStorageConnectionString(config.storageConnectionString)
  const credential = new StorageSharedKeyCredential(
    parts.accountName,
    parts.accountKey,
  )

  return {
    signReadUrl(blobName, expiresOn) {
      // 個別Blob・read・HTTPSだけに限定し、container一覧や書込権限を付与しない。
      const sas = generateBlobSASQueryParameters(
        {
          containerName: config.containerName,
          blobName,
          permissions: BlobSASPermissions.parse('r'),
          expiresOn,
          protocol: SASProtocol.Https,
        },
        credential,
      ).toString()
      const encodedPath = blobName.split('/').map(encodeURIComponent).join('/')
      return `${parts.blobEndpoint}/${encodeURIComponent(config.containerName)}/${encodedPath}?${sas}`
    },
  }
}
