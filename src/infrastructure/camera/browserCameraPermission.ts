import type {
  CameraPermissionPort,
  CameraPermissionState,
} from '@/features/camera-fill/permissionPort'

type PermissionsQuery = (descriptor: PermissionDescriptor) => Promise<{
  state: PermissionState
}>

const normalizeState = (state: PermissionState): CameraPermissionState =>
  state === 'granted' || state === 'prompt' || state === 'denied'
    ? state
    : 'unknown'

/** Permissions APIを補助的に照会し、未対応や失敗をunknownへ畳み込むadapterを生成する。 */
export const createBrowserCameraPermission = (
  query: PermissionsQuery | undefined = navigator.permissions?.query.bind(
    navigator.permissions,
  ),
): CameraPermissionPort => ({
  async query() {
    if (!query) return 'unknown'

    try {
      // TypeScriptのPermissionNameにcameraがない環境でも、browserが対応していれば照会する。
      const status = await query({ name: 'camera' } as PermissionDescriptor)
      return normalizeState(status.state)
    } catch {
      return 'unknown'
    }
  },
})
