import type { CompletedImageResource } from './completedImagePort'

/**
 * 完成画面が現在のresourceを唯一所有し、交換前と画面破棄時の解放を一箇所に集約する。
 */
export class CompletedImageOwner {
  private resource: CompletedImageResource | undefined
  private sharing = false

  get current() {
    return this.resource
  }

  get isSharing() {
    return this.sharing
  }

  replace(next: CompletedImageResource) {
    this.resource?.dispose()
    this.resource = next
  }

  beginShare() {
    if (!this.resource || this.sharing) {
      return false
    }

    this.sharing = true
    return true
  }

  finishShare() {
    this.sharing = false
  }

  dispose() {
    this.resource?.dispose()
    this.resource = undefined
    this.sharing = false
  }
}
