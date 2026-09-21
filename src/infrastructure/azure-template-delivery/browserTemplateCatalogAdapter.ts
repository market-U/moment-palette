import {
  TemplateCatalogError,
  type TemplateCatalogPort,
} from '@/features/azure-template-delivery-spike/templateCatalogPort'
import { parseTemplateCatalogResponse } from '@/features/azure-template-delivery-spike/templateResponse'
import type { RequestDiagnostics } from '@/features/azure-template-delivery-spike/requestDiagnostics'

export const createBrowserTemplateCatalogAdapter = (
  fetcher: typeof fetch = fetch,
  diagnostics?: RequestDiagnostics,
): TemplateCatalogPort => ({
  async loadAvailable() {
    diagnostics?.record('/api/templates', 'api')
    let response: Response
    try {
      response = await fetcher('/api/templates', { cache: 'no-store' })
    } catch {
      throw new TemplateCatalogError('network')
    }
    if (!response.ok) throw new TemplateCatalogError('http')
    try {
      return parseTemplateCatalogResponse(await response.json())
    } catch (error) {
      if (error instanceof TemplateCatalogError) throw error
      throw new TemplateCatalogError('invalid-response')
    }
  },
})
