import {
  ReleaseLoadError,
  type ReleasePort,
} from '@/features/creation-session/releasePort'

const parseRelease = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ReleaseLoadError('invalid-response')
  }
  const object = value as Record<string, unknown>
  if (
    typeof object.appVersion !== 'string' ||
    object.appVersion.trim() === '' ||
    typeof object.buildId !== 'string' ||
    object.buildId.trim() === ''
  ) {
    throw new ReleaseLoadError('invalid-response')
  }
  return { appVersion: object.appVersion, buildId: object.buildId }
}

/** Browserからrelease.jsonをno-storeで取得し、製品用ReleasePortとして提供する。 */
export const createBrowserReleaseAdapter = (
  fetcher: typeof fetch = fetch,
  beforeLoad?: (url: string) => void,
): ReleasePort => ({
  async loadCurrent() {
    beforeLoad?.('/release.json')
    let response: Response
    try {
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
