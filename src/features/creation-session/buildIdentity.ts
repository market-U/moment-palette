export type BuildIdentity = Readonly<{
  appVersion: string
  buildId: string
}>

export type ApiBuildIdentity = Readonly<{
  apiVersion: string
  buildId: string
}>

export type CompatibilityResult =
  | { compatible: true }
  | {
      compatible: false
      reason: 'missing' | 'version-mismatch' | 'build-mismatch'
    }

const hasIdentity = (value: BuildIdentity): boolean =>
  value.appVersion.trim() !== '' && value.buildId.trim() !== ''

/** Frontend、API、releaseのversionとbuild IDがすべて有効かつ一致するかを判定する。 */
export const compareBuildIdentity = (
  frontend: BuildIdentity,
  api: ApiBuildIdentity,
  release: BuildIdentity,
): CompatibilityResult => {
  const apiIdentity = { appVersion: api.apiVersion, buildId: api.buildId }
  if (![frontend, apiIdentity, release].every(hasIdentity)) {
    return { compatible: false, reason: 'missing' }
  }
  if (
    frontend.appVersion !== apiIdentity.appVersion ||
    frontend.appVersion !== release.appVersion
  ) {
    return { compatible: false, reason: 'version-mismatch' }
  }
  if (
    frontend.buildId !== apiIdentity.buildId ||
    frontend.buildId !== release.buildId
  ) {
    return { compatible: false, reason: 'build-mismatch' }
  }
  return { compatible: true }
}
