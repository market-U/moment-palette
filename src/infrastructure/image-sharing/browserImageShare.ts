import type {
  ImageSharePort,
  NavigatorShareLike,
  ShareCapability,
} from '@/features/image-sharing-spike/sharePort'
import type { PreparedImageShare } from '@/features/image-sharing-spike/sharePayload'
import { classifyShareError } from '@/features/image-sharing-spike/shareOutcome'

const unsupported = (reason: 'web-share' | 'file-share'): ShareCapability => ({
  available: false,
  reason,
})

export const createBrowserImageShare = (
  navigatorApi: NavigatorShareLike = navigator,
): ImageSharePort => {
  const canShare = (prepared: PreparedImageShare): ShareCapability => {
    if (!navigatorApi.share || !navigatorApi.canShare) {
      return unsupported('web-share')
    }

    try {
      // MIME typeを偽装する基準方式も、実際に渡すFileそのもので判定する。
      return navigatorApi.canShare({ files: [prepared.file] })
        ? { available: true }
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
        return { kind: 'unsupported', reason: capability.reason! }
      }

      try {
        // Promiseを得るまではawaitを挟まず、クリック時のtransient activationを維持する。
        const sharePromise = navigatorApi.share!(prepared.data)
        await sharePromise
        return { kind: 'handed-off' }
      } catch (error) {
        return classifyShareError(error)
      }
    },
  }
}
