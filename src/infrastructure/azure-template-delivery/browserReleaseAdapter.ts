import {
  ReleaseLoadError,
  type ReleasePort,
} from '@/features/azure-template-delivery-spike/releasePort'
import type { ReleaseMetadata } from '@/features/azure-template-delivery-spike/types'
import type { RequestDiagnostics } from '@/features/azure-template-delivery-spike/requestDiagnostics'

const parseRelease = (value: unknown): ReleaseMetadata => {
  if (!value || typeof value !== 'object')
    throw new ReleaseLoadError('invalid-response')
  const object = value as Record<string, unknown>
  if (
    typeof object.appVersion !== 'string' ||
    typeof object.buildId !== 'string'
  ) {
    throw new ReleaseLoadError('invalid-response')
  }
  return { appVersion: object.appVersion, buildId: object.buildId }
}

export const createBrowserReleaseAdapter = (
  fetcher: typeof fetch = fetch,
  diagnostics?: RequestDiagnostics,
): ReleasePort => ({
  async loadCurrent() {
    diagnostics?.record('/release.json', 'release')
    let response: Response
    try {
      // 保存cacheを使わず、Start直前に現在配信中のreleaseを確認する。
      response = await fetcher('/release.json', { cache: 'no-store' })
    } catch {
      throw new ReleaseLoadError('network')
    }
    if (!response.ok) throw new ReleaseLoadError('http')
    try {
      return parseRelease(await response.json())
    } catch (error) {
      if (error instanceof ReleaseLoadError) throw error
      throw new ReleaseLoadError('invalid-response')
    }
  },
})
