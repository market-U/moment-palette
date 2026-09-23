/** 高頻度の入力イベントを、次の画面更新に一度だけ反映するためのrAF境界を表す。 */
export type RequestRenderFrame = (callback: () => void) => number

/** 予約済みの画面更新を取り消すためのrAF境界を表す。 */
export type CancelRenderFrame = (frameId: number) => void

/** 最新の状態だけを次の一画面更新へ描画し、破棄後の描画も防止する。 */
export class FrameRenderScheduler {
  private pendingFrameId: number | undefined
  private disposed = false

  constructor(
    private readonly render: () => void,
    private readonly requestFrame: RequestRenderFrame,
    private readonly cancelFrame: CancelRenderFrame,
  ) {}

  request(): void {
    if (this.disposed || this.pendingFrameId !== undefined) return

    this.pendingFrameId = this.requestFrame(() => {
      this.pendingFrameId = undefined
      if (!this.disposed) this.render()
    })
  }

  cancel(): void {
    if (this.pendingFrameId === undefined) return
    this.cancelFrame(this.pendingFrameId)
    this.pendingFrameId = undefined
  }

  dispose(): void {
    this.cancel()
    this.disposed = true
  }
}
