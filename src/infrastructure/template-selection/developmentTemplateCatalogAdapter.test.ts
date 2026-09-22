import { describe, expect, it } from 'vitest'

import { createDevelopmentTemplateCatalogAdapter } from './developmentTemplateCatalogAdapter'

describe('development template catalog adapter', () => {
  it('製品schemaのvalidationを通したfixtureを返す', async () => {
    const catalog = await createDevelopmentTemplateCatalogAdapter(
      { appVersion: '0.0.0', buildId: 'build-a' },
      () => new Date('2026-09-21T00:00:00.000Z'),
    ).loadAvailable()

    expect(catalog).toMatchObject({
      schemaVersion: 1,
      apiVersion: '0.0.0',
      buildId: 'build-a',
      catalogRevision: 'development-catalog-r1',
    })
    expect(catalog.templates[0]?.template.tags).toEqual(['bird'])
    expect(catalog.templates[0]?.template.areas).toHaveLength(4)
    expect(catalog.templates[0]?.template.areas.slice(0, 2)).toMatchObject([
      { id: 'background', initialColor: '#F3E8DC' },
      { id: 'body', initialColor: '#E8DED2' },
    ])
  })
})
