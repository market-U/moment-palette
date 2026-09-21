import type { CompatibilityResult } from './versionCompatibility'

export type StartState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'loading-assets' }
  | { phase: 'active' }
  | {
      phase: 'reload-required'
      reason: Exclude<CompatibilityResult, { compatible: true }>['reason']
    }
  | { phase: 'retryable-error'; message: string }

export const applyCompatibilityResult = (
  result: CompatibilityResult,
): Extract<StartState, { phase: 'loading-assets' | 'reload-required' }> =>
  result.compatible
    ? { phase: 'loading-assets' }
    : { phase: 'reload-required', reason: result.reason }

// 制作開始後はversion確認を繰り返さず、再deploy中も取得済み資源を維持する。
export const shouldCheckRelease = (state: StartState): boolean =>
  state.phase !== 'active'
