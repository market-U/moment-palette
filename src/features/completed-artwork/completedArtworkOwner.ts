import type { CompletedArtworkResource } from './completedArtworkPort'

/** 完成画像resourceを一つだけ所有し、共有中の競合と破棄を管理する。 */
export class CompletedArtworkOwner {
  #current: CompletedArtworkResource | undefined
  #sharing = false

  get current(): CompletedArtworkResource | undefined {
    return this.#current
  }

  get isSharing(): boolean {
    return this.#sharing
  }

  /** 現在の完成画像を交換し、置換されるresourceを一度だけ解放する。 */
  replace(next: CompletedArtworkResource): void {
    this.#current?.dispose()
    this.#current = next
  }

  /** 共有開始を排他的に取得し、表示する完成画像がない場合は拒否する。 */
  beginShare(): boolean {
    if (!this.#current || this.#sharing) return false
    this.#sharing = true
    return true
  }

  /** 共有中の排他状態を解除し、同じ完成画像の再共有を可能にする。 */
  finishShare(): void {
    this.#sharing = false
  }

  /** 所有中の完成画像を解放し、複数回呼んでも副作用を重ねない。 */
  dispose(): void {
    this.#current?.dispose()
    this.#current = undefined
    this.#sharing = false
  }
}
