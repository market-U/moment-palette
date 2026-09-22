/** 製品が区別する前面・背面カメラの向きを表す。 */
export type CameraFacing = 'environment' | 'user'

/** MediaStreamを接続して再生するvideo要素の最小境界を表す。 */
export interface CameraVideoTarget {
  srcObject: MediaProvider | null
  readonly videoWidth: number
  readonly videoHeight: number
  play(): Promise<void>
}

/** 利用者向け表示へ変換可能なカメラ取得失敗の分類を表す。 */
export type CameraFailureCode =
  | 'permission-denied'
  | 'not-found'
  | 'not-readable'
  | 'constraint-failed'
  | 'unsupported'
  | 'unknown'

/** Browser例外の詳細を画面へ漏らさず、製品内で扱う失敗情報を表す。 */
export interface CameraFailure {
  code: CameraFailureCode
  name: string
  message: string
}

/** 取得済みstreamの向き、切替可否、実際のtrack設定を表す。 */
export interface CameraStreamSession {
  facing: CameraFacing
  canSwitch: boolean
  settings: MediaTrackSettings
}

/** Camera streamの取得、向き切替、停止をbrowser実装へ要求するport。 */
export interface CameraStreamPort {
  start(
    target: CameraVideoTarget,
    facing?: CameraFacing,
  ): Promise<CameraStreamSession>
  switchFacing(target: CameraVideoTarget): Promise<CameraStreamSession>
  stop(): void
  getSession(): CameraStreamSession | undefined
}
