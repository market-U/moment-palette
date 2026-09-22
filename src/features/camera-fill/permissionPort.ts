/** Permissions APIから補助的に得られるカメラ権限状態を表す。 */
export type CameraPermissionState = 'granted' | 'prompt' | 'denied' | 'unknown'

/** Camera権限を事前照会し、未対応時も安全に継続するためのport。 */
export interface CameraPermissionPort {
  query(): Promise<CameraPermissionState>
}
