import {
  clamp,
  createCenteredCoverTransform,
  type MediaTransform,
  type Size,
} from '@/shared/lib/mediaTransform'

import type {
  CameraFailure,
  CameraFacing,
  CameraStreamPort,
  CameraStreamSession,
  CameraVideoTarget,
} from './cameraPort'
import type { CameraPermissionPort } from './permissionPort'

type LiveCameraState = Readonly<{
  phase: 'live'
  areaId: string
  facing: CameraFacing
  canSwitch: boolean
  sourceSize: Size
  transform: MediaTransform
  blend: number
}>

type CapturingCameraState = Readonly<{
  phase: 'capturing'
  areaId: string
  facing: CameraFacing
  canSwitch: boolean
  sourceSize: Size
  transform: MediaTransform
  blend: number
}>

/** Camera画面が表示する安全な状態と、復帰に必要な最小情報を表す。 */
export type CameraFillState =
  | Readonly<{ phase: 'closed' }>
  | Readonly<{ phase: 'rationale'; areaId: string }>
  | Readonly<{ phase: 'requesting'; areaId: string }>
  | LiveCameraState
  | CapturingCameraState
  | Readonly<{ phase: 'denied'; areaId: string }>
  | Readonly<{
      phase: 'unavailable'
      areaId: string
      reason:
        | 'not-found'
        | 'not-readable'
        | 'constraint-failed'
        | 'unsupported'
        | 'unknown'
    }>

type CameraControllerDependencies = Readonly<{
  camera: CameraStreamPort
  permission: CameraPermissionPort
  mapFailure: (error: unknown) => CameraFailure
  isDocumentHidden: () => boolean
  onStateChange: (state: CameraFillState) => void
}>

/** Camera取得の状態遷移、非同期race、track停止を一つの境界で管理する。 */
export interface CameraFillController {
  readonly state: CameraFillState
  attachTarget(target: CameraVideoTarget): void
  detachTarget(): void
  request(areaId: string): Promise<void>
  confirmRationale(): Promise<void>
  retry(): Promise<void>
  switchFacing(): Promise<void>
  setBlend(blend: number): void
  setTransform(transform: MediaTransform): void
  beginCapture(): CapturingCameraState | undefined
  finishCapture(): void
  failCapture(): void
  cancel(): void
  handleVisibilityChange(): void
  resetSession(): void
  dispose(): void
}

const sourceSizeOf = (
  target: CameraVideoTarget,
  session: CameraStreamSession,
): Size => ({
  width: target.videoWidth || session.settings.width || 1080,
  height: target.videoHeight || session.settings.height || 1080,
})

/** 製品camera画面の状態機械を生成する。 */
export const createCameraFillController = (
  dependencies: CameraControllerDependencies,
): CameraFillController => {
  let state: CameraFillState = Object.freeze({ phase: 'closed' })
  let target: CameraVideoTarget | undefined
  let currentAreaId: string | undefined
  let rationaleAcknowledged = false
  let operationId = 0
  let disposed = false

  const publish = (next: CameraFillState) => {
    state = Object.freeze(next)
    dependencies.onStateChange(state)
  }

  const stop = () => {
    operationId += 1
    dependencies.camera.stop()
  }

  const fail = (areaId: string, failure: CameraFailure) => {
    if (failure.code === 'permission-denied') {
      publish({ phase: 'denied', areaId })
      return
    }
    publish({
      phase: 'unavailable',
      areaId,
      reason: failure.code,
    })
  }

  const start = async (
    operation: (target: CameraVideoTarget) => Promise<CameraStreamSession> = (
      video,
    ) => dependencies.camera.start(video, 'environment'),
  ) => {
    const areaId = currentAreaId
    const video = target
    if (!areaId || !video || disposed) return

    const id = ++operationId
    const permission = await dependencies.permission.query()
    if (disposed || id !== operationId || areaId !== currentAreaId) return
    if (permission === 'denied') {
      stop()
      publish({ phase: 'denied', areaId })
      return
    }

    publish({ phase: 'requesting', areaId })
    try {
      const session = await operation(video)
      if (disposed || id !== operationId || dependencies.isDocumentHidden()) {
        dependencies.camera.stop()
        return
      }
      const sourceSize = sourceSizeOf(video, session)
      publish({
        phase: 'live',
        areaId,
        facing: session.facing,
        canSwitch: session.canSwitch,
        sourceSize,
        transform: createCenteredCoverTransform(sourceSize, {
          width: 1080,
          height: 1080,
        }),
        blend: 1,
      })
    } catch (error) {
      dependencies.camera.stop()
      if (disposed || id !== operationId) return
      fail(areaId, dependencies.mapFailure(error))
    }
  }

  const controller: CameraFillController = {
    get state() {
      return state
    },
    attachTarget(nextTarget) {
      target = nextTarget
    },
    detachTarget() {
      if (target) target.srcObject = null
      target = undefined
    },
    async request(areaId) {
      if (disposed || !areaId) return
      stop()
      currentAreaId = areaId
      if (!rationaleAcknowledged) {
        publish({ phase: 'rationale', areaId })
        return
      }
      await start()
    },
    async confirmRationale() {
      if (state.phase !== 'rationale') return
      rationaleAcknowledged = true
      await start()
    },
    async retry() {
      if (state.phase !== 'denied' && state.phase !== 'unavailable') return
      await start()
    },
    async switchFacing() {
      if (state.phase !== 'live' || !state.canSwitch || !target) return
      await start((video) => dependencies.camera.switchFacing(video))
    },
    setBlend(blend) {
      if (state.phase !== 'live') return
      publish({ ...state, blend: clamp(blend, 0, 1) })
    },
    setTransform(transform) {
      if (state.phase !== 'live') return
      publish({ ...state, transform })
    },
    beginCapture() {
      if (state.phase !== 'live') return undefined
      const capturing = Object.freeze({
        ...state,
        phase: 'capturing' as const,
      })
      publish(capturing)
      return capturing
    },
    finishCapture() {
      stop()
      publish({ phase: 'closed' })
    },
    failCapture() {
      const areaId = currentAreaId
      stop()
      if (areaId) {
        publish({ phase: 'unavailable', areaId, reason: 'unknown' })
      } else {
        publish({ phase: 'closed' })
      }
    },
    cancel() {
      stop()
      publish({ phase: 'closed' })
    },
    handleVisibilityChange() {
      if (
        dependencies.isDocumentHidden() &&
        state.phase !== 'closed' &&
        state.phase !== 'rationale'
      ) {
        controller.cancel()
      }
    },
    resetSession() {
      controller.cancel()
      rationaleAcknowledged = false
      currentAreaId = undefined
    },
    dispose() {
      if (disposed) return
      disposed = true
      stop()
      controller.detachTarget()
      publish({ phase: 'closed' })
    },
  }

  return controller
}
