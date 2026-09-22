import type { RequestDiagnostics } from '@/features/azure-template-delivery-spike/requestDiagnostics'
import type { ReleasePort } from '@/features/creation-session/releasePort'
import { createBrowserReleaseAdapter as createProductBrowserReleaseAdapter } from '@/infrastructure/creation-session/browserReleaseAdapter'

export const createBrowserReleaseAdapter = (
  fetcher: typeof fetch = fetch,
  diagnostics?: RequestDiagnostics,
): ReleasePort => ({
  loadCurrent: createProductBrowserReleaseAdapter(fetcher, (url) =>
    diagnostics?.record(url, 'release'),
  ).loadCurrent,
})
