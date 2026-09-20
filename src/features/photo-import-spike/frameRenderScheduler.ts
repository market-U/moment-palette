export type RequestRenderFrame = (callback: () => void) => number
export type CancelRenderFrame = (frameId: number) => void

/**
 * 高頻度の入力イベントを、ブラウザが次に画面を更新する一回の描画へまとめる。
 * transform自体は呼び出し側が都度更新するため、実行時には常に最新状態を描ける。
 */
export class FrameRenderScheduler {
  private pendingFrameId: number | undefined
  private disposed = false

  constructor(
    private readonly render: () => void,
    private readonly requestFrame: RequestRenderFrame,
    private readonly cancelFrame: CancelRenderFrame,
  ) {}

  request() {
    if (this.disposed || this.pendingFrameId !== undefined) {
      return
    }

    this.pendingFrameId = this.requestFrame(() => {
      this.pendingFrameId = undefined

      if (!this.disposed) {
        this.render()
      }
    })
  }

  cancel() {
    if (this.pendingFrameId === undefined) {
      return
    }

    this.cancelFrame(this.pendingFrameId)
    this.pendingFrameId = undefined
  }

  dispose() {
    this.cancel()
    this.disposed = true
  }
}
