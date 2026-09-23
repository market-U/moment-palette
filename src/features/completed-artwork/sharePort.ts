import type { PreparedCompletedArtworkShare } from './sharePayload'
import type { CompletedArtworkShareOutcome } from './shareOutcome'

/** 実際に共有するFileをOSへ渡せるかの判定を表す。 */
export type CompletedArtworkShareCapability =
  | Readonly<{ available: true }>
  | Readonly<{ available: false; reason: 'web-share' | 'file-share' }>

/** Web Share APIを製品の共有状態へ変換する境界を定義する。 */
export type CompletedArtworkSharePort = {
  canShare: (
    prepared: PreparedCompletedArtworkShare,
  ) => CompletedArtworkShareCapability
  share: (
    prepared: PreparedCompletedArtworkShare,
  ) => Promise<CompletedArtworkShareOutcome>
}

/** browser依存を除いたWeb Share APIの最小境界を表す。 */
export type NavigatorShareLike = Readonly<{
  canShare?: (data: ShareData) => boolean
  share?: (data: ShareData) => Promise<void>
}>
