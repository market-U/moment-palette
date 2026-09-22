export type ReleasableSession = {
  release: () => void
}

/** Tab内で有効な制作sessionを一つだけ所有し、置換・終了時に旧sessionを解放する。 */
export class CreationSessionOwner<T extends ReleasableSession> {
  #current: T | null = null

  get current(): T | null {
    return this.#current
  }

  replace(next: T): void {
    if (this.#current === next) return
    this.#current?.release()
    this.#current = next
  }

  clear(): void {
    this.#current?.release()
    this.#current = null
  }
}
