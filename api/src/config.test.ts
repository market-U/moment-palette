import { describe, expect, it } from 'vitest'

import { isSafeCatalogFileName, readApiConfig } from './config'

const baseEnvironment = {
  AZURE_STORAGE_CONNECTION_STRING: 'UseDevelopmentStorage=true',
  TEMPLATE_CONTAINER_NAME: 'moment-palette-templates',
  TEMPLATE_CATALOG_FILE: 'catalog.json',
}

describe('catalog file設定', () => {
  it('安全なJSONファイル名だけを許可する', () => {
    expect(isSafeCatalogFileName('catalog.json')).toBe(true)
    expect(isSafeCatalogFileName('catalog-staging.r1.json')).toBe(true)
  })

  it.each([
    'catalog/catalog.json',
    '../catalog.json',
    'https://example.com/catalog.json',
    'catalog.txt',
    '',
  ])('危険または不正な設定を拒否する: %s', (fileName) => {
    expect(() =>
      readApiConfig({ ...baseEnvironment, TEMPLATE_CATALOG_FILE: fileName }),
    ).toThrow(/TEMPLATE_CATALOG_FILE/)
  })

  it('旧BLOB設定をfallbackに使わない', () => {
    expect(() =>
      readApiConfig({
        AZURE_STORAGE_CONNECTION_STRING: 'secret-value',
        TEMPLATE_CONTAINER_NAME: 'moment-palette-templates',
        TEMPLATE_CATALOG_BLOB: 'catalog/catalog.json',
      }),
    ).toThrow(/TEMPLATE_CATALOG_FILE/)
  })
})
