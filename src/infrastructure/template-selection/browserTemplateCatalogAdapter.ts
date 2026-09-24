import {
  TemplateCatalogError,
  type TemplateCatalogPort,
} from '@/features/template-selection/templateCatalogPort'
import { parseTemplateCatalog } from '@/features/template-selection/catalog'

/** same-originの製品template APIを検証済みCatalogSnapshotとして取得するadapterを生成する。 */
export const createBrowserTemplateCatalogAdapter = (
  fetcher: typeof fetch = fetch,
): TemplateCatalogPort => ({
  async loadAvailable() {
    let response: Response
    try {
      response = await fetcher('/api/templates', { cache: 'no-store' })
    } catch {
      throw new TemplateCatalogError('network')
    }
    if (!response.ok) throw new TemplateCatalogError('http')
    try {
      return parseTemplateCatalog(await response.json())
    } catch {
      throw new TemplateCatalogError('invalid-response')
    }
  },
})
