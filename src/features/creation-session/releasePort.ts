import type { BuildIdentity } from './buildIdentity'

export type ReleaseLoadFailure = 'network' | 'http' | 'invalid-response'

/** Release情報の取得失敗を公開可能な原因区分とともに表す。 */
export class ReleaseLoadError extends Error {
  constructor(readonly kind: ReleaseLoadFailure) {
    super('release情報を取得できません。')
    this.name = 'ReleaseLoadError'
  }
}

/** 現在配信中のfrontend identityを取得する境界を定義する。 */
export type ReleasePort = {
  loadCurrent: () => Promise<BuildIdentity>
}
