import { describe, expect, it, vi } from 'vitest'

import type {
  CameraStreamPort,
  CameraStreamSession,
  CameraVideoTarget,
} from './cameraPort'
import { createCameraFillController } from './cameraController'

const streamSession = (
  facing: 'environment' | 'user' = 'environment',
): CameraStreamSession => ({
  facing,
  canSwitch: true,
  settings: { width: 1920, height: 1080, facingMode: facing },
})

const target = (): CameraVideoTarget => ({
  srcObject: null,
  videoWidth: 1920,
  videoHeight: 1080,
  play: vi.fn(async () => undefined),
})

const setup = (overrides: Partial<CameraStreamPort> = {}) => {
  const camera: CameraStreamPort = {
    start: vi.fn().mockResolvedValue(streamSession()),
    switchFacing: vi.fn().mockResolvedValue(streamSession('user')),
    stop: vi.fn(),
    getSession: vi.fn(),
    ...overrides,
  }
  const states: string[] = []
  const hidden = { value: false }
  const permission = { query: vi.fn().mockResolvedValue('prompt') }
  const controller = createCameraFillController({
    camera,
    permission,
    mapFailure: (error) => ({
      code:
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'permission-denied'
          : 'unknown',
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
    }),
    isDocumentHidden: () => hidden.value,
    onStateChange: (state) => states.push(state.phase),
  })
  controller.attachTarget(target())
  return { camera, controller, hidden, permission, states }
}

describe('camera fill controller', () => {
  it('初回は理由を表示し、確認後だけ背面cameraを取得する', async () => {
    const { camera, controller } = setup()

    await controller.request('body')
    expect(controller.state).toEqual({ phase: 'rationale', areaId: 'body' })
    expect(camera.start).not.toHaveBeenCalled()

    await controller.confirmRationale()
    expect(camera.start).toHaveBeenCalledWith(expect.anything(), 'environment')
    expect(controller.state).toMatchObject({
      phase: 'live',
      areaId: 'body',
      facing: 'environment',
      blend: 1,
    })
  })

  it('事前権限がdeniedならgetUserMediaを呼ばず拒否状態にする', async () => {
    const { camera, controller, permission } = setup()
    permission.query.mockResolvedValue('denied')
    await controller.request('body')

    await controller.confirmRationale()

    expect(camera.start).not.toHaveBeenCalled()
    expect(controller.state).toEqual({ phase: 'denied', areaId: 'body' })
  })

  it('外部例外本文を持たない安全な拒否状態へ変換する', async () => {
    const { controller } = setup({
      start: vi
        .fn()
        .mockRejectedValue(
          new DOMException('secret detail', 'NotAllowedError'),
        ),
    })
    await controller.request('body')

    await controller.confirmRationale()

    expect(controller.state).toEqual({ phase: 'denied', areaId: 'body' })
    expect(JSON.stringify(controller.state)).not.toContain('secret detail')
  })

  it('取得待ちでcancelした後の遅い完了を無効化してtrackを停止する', async () => {
    let resolve!: (session: CameraStreamSession) => void
    const pending = new Promise<CameraStreamSession>((done) => {
      resolve = done
    })
    const { camera, controller } = setup({
      start: vi.fn().mockReturnValue(pending),
    })
    await controller.request('body')
    const confirmation = controller.confirmRationale()
    await Promise.resolve()

    controller.cancel()
    resolve(streamSession())
    await confirmation

    expect(controller.state).toEqual({ phase: 'closed' })
    expect(camera.stop).toHaveBeenCalled()
  })

  it('権限照会待ちでcancelした後はcamera取得を開始しない', async () => {
    let resolvePermission!: (state: 'prompt') => void
    const pendingPermission = new Promise<'prompt'>((done) => {
      resolvePermission = done
    })
    const { camera, controller, permission } = setup()
    permission.query.mockReturnValue(pendingPermission)
    await controller.request('body')
    const confirmation = controller.confirmRationale()
    await Promise.resolve()

    controller.cancel()
    resolvePermission('prompt')
    await confirmation

    expect(controller.state).toEqual({ phase: 'closed' })
    expect(camera.start).not.toHaveBeenCalled()
  })

  it('background移行で停止し、自動再取得しない', async () => {
    const { camera, controller, hidden } = setup()
    await controller.request('body')
    await controller.confirmRationale()
    hidden.value = true

    controller.handleVisibilityChange()

    expect(controller.state).toEqual({ phase: 'closed' })
    expect(camera.stop).toHaveBeenCalled()
    expect(camera.start).toHaveBeenCalledOnce()
  })

  it('切替後もAreaを保持して前面camera stateへ更新する', async () => {
    const { camera, controller } = setup()
    await controller.request('body')
    await controller.confirmRationale()

    await controller.switchFacing()

    expect(camera.switchFacing).toHaveBeenCalledOnce()
    expect(controller.state).toMatchObject({
      phase: 'live',
      areaId: 'body',
      facing: 'user',
    })
  })
})
