import type {
  CameraFailure,
  CameraFailureCode,
  CameraFacing,
  CameraStreamPort,
  CameraStreamSession,
  CameraVideoTarget,
} from '@/features/camera-fill/cameraPort'

interface MediaDevicesPort {
  getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>
  enumerateDevices(): Promise<MediaDeviceInfo[]>
}

const failureCodes: Partial<Record<string, CameraFailureCode>> = {
  NotAllowedError: 'permission-denied',
  NotFoundError: 'not-found',
  NotReadableError: 'not-readable',
  OverconstrainedError: 'constraint-failed',
  UnsupportedError: 'unsupported',
}

/** Browser例外を利用者向け文言から独立した製品failure codeへ変換する。 */
export const toCameraFailure = (error: unknown): CameraFailure => {
  if (error instanceof DOMException) {
    return {
      code: failureCodes[error.name] ?? 'unknown',
      name: error.name,
      message: error.message,
    }
  }

  if (error instanceof Error) {
    return {
      code: error.name === 'UnsupportedError' ? 'unsupported' : 'unknown',
      name: error.name,
      message: error.message,
    }
  }

  return {
    code: 'unknown',
    name: 'UnknownError',
    message: String(error),
  }
}

/** MediaDevicesを使い、同時に一つのcamera streamだけを所有するadapterを生成する。 */
export const createBrowserCameraStream = (
  mediaDevices: MediaDevicesPort | undefined = navigator.mediaDevices,
): CameraStreamPort => {
  let activeStream: MediaStream | undefined
  let activeTarget: CameraVideoTarget | undefined
  let session: CameraStreamSession | undefined

  const stop = () => {
    activeStream?.getTracks().forEach((track) => track.stop())

    if (activeTarget) {
      activeTarget.srcObject = null
    }

    activeStream = undefined
    activeTarget = undefined
    session = undefined
  }

  const start = async (
    target: CameraVideoTarget,
    facing: CameraFacing = 'environment',
  ) => {
    stop()

    if (!mediaDevices) {
      throw new DOMException(
        'このブラウザはMediaDevices APIを公開していません。',
        'UnsupportedError',
      )
    }

    const stream = await mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    })

    try {
      const track = stream.getVideoTracks()[0]

      if (!track) {
        throw new DOMException(
          'Video trackを取得できませんでした。',
          'NotFoundError',
        )
      }

      target.srcObject = stream
      await target.play()

      const videoInputs = (await mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === 'videoinput',
      )
      const settings = track.getSettings()
      const actualFacing =
        settings.facingMode === 'user' || settings.facingMode === 'environment'
          ? settings.facingMode
          : facing

      activeStream = stream
      activeTarget = target
      session = {
        facing: actualFacing,
        canSwitch: videoInputs.length > 1,
        settings,
      }

      return session
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop())
      target.srcObject = null
      throw error
    }
  }

  return {
    start,
    async switchFacing(target) {
      const nextFacing: CameraFacing =
        session?.facing === 'user' ? 'environment' : 'user'
      return start(target, nextFacing)
    },
    stop,
    getSession: () => session,
  }
}
