import {
  compareBuildIdentity,
  type ApiBuildIdentity,
  type BuildIdentity,
  type CompatibilityResult,
} from './buildIdentity'
import type { ReleasePort } from './releasePort'

export type BeginCreationResult<TCatalog> =
  | { status: 'ready'; snapshot: TCatalog }
  | {
      status: 'reload-required'
      reason: Exclude<CompatibilityResult, { compatible: true }>['reason']
    }

export type BeginCreationDependencies<TCatalog extends ApiBuildIdentity> = {
  frontend: BuildIdentity
  releasePort: ReleasePort
  catalogPort: { loadAvailable: () => Promise<TCatalog> }
}

/** Releaseとカタログを並列取得し、三者のbuild互換性を確認して開始可否を返す。 */
export const beginCreation = async <TCatalog extends ApiBuildIdentity>(
  dependencies: BeginCreationDependencies<TCatalog>,
): Promise<BeginCreationResult<TCatalog>> => {
  const [release, snapshot] = await Promise.all([
    dependencies.releasePort.loadCurrent(),
    dependencies.catalogPort.loadAvailable(),
  ])
  const compatibility = compareBuildIdentity(
    dependencies.frontend,
    snapshot,
    release,
  )
  return compatibility.compatible
    ? { status: 'ready', snapshot }
    : { status: 'reload-required', reason: compatibility.reason }
}
