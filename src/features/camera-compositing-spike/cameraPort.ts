import type { CameraFacing } from './types'

export interface CameraVideoTarget {
  srcObject: MediaProvider | null
  play(): Promise<void>
}

export type CameraFailureCode =
  | 'permission-denied'
  | 'not-found'
  | 'not-readable'
  | 'constraint-failed'
  | 'unsupported'
  | 'unknown'

export interface CameraFailure {
  code: CameraFailureCode
  name: string
  message: string
}

export interface CameraSession {
  facing: CameraFacing
  canSwitch: boolean
  settings: MediaTrackSettings
}

export interface CameraStreamPort {
  start(
    target: CameraVideoTarget,
    facing?: CameraFacing,
  ): Promise<CameraSession>
  switchFacing(target: CameraVideoTarget): Promise<CameraSession>
  stop(): void
  getSession(): CameraSession | undefined
}

export type CameraStreamFactory = () => CameraStreamPort
