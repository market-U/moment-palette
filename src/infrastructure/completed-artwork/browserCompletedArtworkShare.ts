import type {
  CompletedArtworkShareCapability,
  CompletedArtworkSharePort,
  NavigatorShareLike,
} from '@/features/completed-artwork/sharePort'
import { classifyCompletedArtworkShareError } from '@/features/completed-artwork/shareOutcome'

const unsupported = (
  reason: 'web-share' | 'file-share',
): CompletedArtworkShareCapability => ({ available: false, reason })

/** browserのWeb Share APIを完成画像の共有結果へ変換するadapterを生成する。 */
export const createBrowserCompletedArtworkShare = (
  navigatorApi: NavigatorShareLike = navigator,
): CompletedArtworkSharePort => {
  const canShare = (
    prepared: Parameters<CompletedArtworkSharePort['canShare']>[0],
  ) => {
    if (!navigatorApi.share || !navigatorApi.canShare) {
      return unsupported('web-share')
    }
    try {
      return navigatorApi.canShare({ files: [prepared.file] })
        ? { available: true as const }
        : unsupported('file-share')
    } catch {
      return unsupported('file-share')
    }
  }

  return {
    canShare,
    async share(prepared) {
      const capability = canShare(prepared)
      if (!capability.available) {
        return { kind: 'unsupported', reason: capability.reason }
      }
      try {
        // 生成済みBlobから同期的に作ったdataを直ちに渡し、transient activationを維持する。
        await navigatorApi.share!(prepared.data)
        return { kind: 'handed-off' }
      } catch (error) {
        return classifyCompletedArtworkShareError(error)
      }
    },
  }
}
