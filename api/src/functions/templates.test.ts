import { afterEach, describe, expect, it, vi } from 'vitest'

import { templatesHandler } from './templates'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('templates handler', () => {
  it('旧BLOB設定をfallbackに使わずno-storeの設定errorを返す', async () => {
    vi.stubEnv('AZURE_STORAGE_CONNECTION_STRING', 'secret-value')
    vi.stubEnv('TEMPLATE_CONTAINER_NAME', 'moment-palette-templates')
    vi.stubEnv('TEMPLATE_CATALOG_BLOB', 'catalog/catalog.json')
    vi.stubEnv('TEMPLATE_CATALOG_FILE', '')

    const response = await templatesHandler({} as never, {} as never)
    const body = JSON.stringify(
      'jsonBody' in response ? response.jsonBody : undefined,
    )

    expect(response.status).toBe(500)
    expect(response.headers).toMatchObject({ 'Cache-Control': 'no-store' })
    expect(body).toContain('configuration-invalid')
    expect(body).not.toContain('secret-value')
  })
})
