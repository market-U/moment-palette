import type { ReleaseMetadata } from './types'

export type ReleaseLoadFailure = 'network' | 'http' | 'invalid-response'

export class ReleaseLoadError extends Error {
  constructor(readonly kind: ReleaseLoadFailure) {
    super('release情報を取得できません。')
    this.name = 'ReleaseLoadError'
  }
}

export type ReleasePort = {
  loadCurrent: () => Promise<ReleaseMetadata>
}
