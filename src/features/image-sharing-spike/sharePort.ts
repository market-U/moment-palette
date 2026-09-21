import type { ImageShareData, PreparedImageShare } from './sharePayload'
import type { ShareOutcome } from './shareOutcome'

export interface ShareCapability {
  available: boolean
  reason?: 'web-share' | 'file-share'
}

export interface ImageSharePort {
  canShare(prepared: PreparedImageShare): ShareCapability
  share(prepared: PreparedImageShare): Promise<ShareOutcome>
}

export interface NavigatorShareLike {
  canShare?: (data: ImageShareData) => boolean
  share?: (data: ImageShareData) => Promise<void>
}
