import { describe, expect, it } from 'vitest'

import {
  createServiceSasSigner,
  parseStorageConnectionString,
} from './serviceSasSigner'

const accountKey = Buffer.alloc(32, 7).toString('base64')
const connectionString = `DefaultEndpointsProtocol=https;AccountName=fstest;AccountKey=${accountKey};EndpointSuffix=core.windows.net`
const config = {
  storageConnectionString: connectionString,
  containerName: 'templates',
  catalogFileName: 'catalog.json',
}

describe('Service SAS signer', () => {
  it('接続文字列から署名に必要な値だけを取り出す', () => {
    expect(parseStorageConnectionString(connectionString)).toEqual({
      accountName: 'fstest',
      accountKey,
      blobEndpoint: 'https://fstest.blob.core.windows.net',
    })
  })

  it('個別Blobへread・HTTPS・指定期限だけを付与する', () => {
    const expiresOn = new Date('2026-09-21T01:00:00.000Z')
    const url = new URL(
      createServiceSasSigner(config).signReadUrl(
        'templates/buncho-01/r1/line-art.png',
        expiresOn,
      ),
    )

    expect(url.pathname).toBe('/templates/templates/buncho-01/r1/line-art.png')
    expect(url.searchParams.get('sp')).toBe('r')
    expect(url.searchParams.get('spr')).toBe('https')
    expect(url.searchParams.get('sr')).toBe('b')
    expect(new Date(url.searchParams.get('se') ?? '').toISOString()).toBe(
      expiresOn.toISOString(),
    )
    expect(url.searchParams.has('st')).toBe(false)
    expect(url.search).not.toContain(accountKey)
    expect(url.search).not.toContain(connectionString)
  })
})
