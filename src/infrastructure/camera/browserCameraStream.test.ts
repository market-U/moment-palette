import { describe, expect, it, vi } from 'vitest'

import type { CameraVideoTarget } from '@/features/camera-compositing-spike/cameraPort'

import {
  createBrowserCameraStream,
  toCameraFailure,
} from './browserCameraStream'

const createTrack = (facingMode: 'environment' | 'user' = 'environment') => ({
  stop: vi.fn(),
  getSettings: vi.fn(() => ({ width: 1920, height: 1080, facingMode })),
})

const createStream = (track = createTrack()) =>
  ({
    getTracks: vi.fn(() => [track]),
    getVideoTracks: vi.fn(() => [track]),
  }) as unknown as MediaStream

const createTarget = (): CameraVideoTarget => ({
  srcObject: null,
  play: vi.fn(async () => undefined),
})

const devices = [
  { kind: 'videoinput', deviceId: 'back' },
  { kind: 'videoinput', deviceId: 'front' },
] as MediaDeviceInfo[]

describe('createBrowserCameraStream', () => {
  it('starts without audio and prefers the environment camera', async () => {
    const stream = createStream()
    const mediaDevices = {
      getUserMedia: vi.fn(async () => stream),
      enumerateDevices: vi.fn(async () => devices),
    }
    const target = createTarget()
    const camera = createBrowserCameraStream(mediaDevices)

    await expect(camera.start(target)).resolves.toMatchObject({
      facing: 'environment',
      canSwitch: true,
    })
    expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    })
    expect(target.srcObject).toBe(stream)
    expect(target.play).toHaveBeenCalledOnce()
  })

  it('stops the previous track before switching facing mode', async () => {
    const backTrack = createTrack('environment')
    const frontTrack = createTrack('user')
    const streams = [createStream(backTrack), createStream(frontTrack)]
    const mediaDevices = {
      getUserMedia: vi.fn(async () => streams.shift() as MediaStream),
      enumerateDevices: vi.fn(async () => devices),
    }
    const target = createTarget()
    const camera = createBrowserCameraStream(mediaDevices)

    await camera.start(target)
    await camera.switchFacing(target)

    expect(backTrack.stop).toHaveBeenCalledOnce()
    expect(mediaDevices.getUserMedia).toHaveBeenLastCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({ facingMode: { ideal: 'user' } }),
      }),
    )
    expect(camera.getSession()?.facing).toBe('user')
  })

  it('stops all tracks and clears the target idempotently', async () => {
    const track = createTrack()
    const stream = createStream(track)
    const target = createTarget()
    const camera = createBrowserCameraStream({
      getUserMedia: vi.fn(async () => stream),
      enumerateDevices: vi.fn(async () => devices.slice(0, 1)),
    })

    await camera.start(target)
    camera.stop()
    camera.stop()

    expect(track.stop).toHaveBeenCalledOnce()
    expect(target.srcObject).toBeNull()
    expect(camera.getSession()).toBeUndefined()
  })

  it('stops a newly acquired stream when video playback fails', async () => {
    const track = createTrack()
    const target: CameraVideoTarget = {
      srcObject: null,
      play: vi.fn(async () => {
        throw new Error('play failed')
      }),
    }
    const camera = createBrowserCameraStream({
      getUserMedia: vi.fn(async () => createStream(track)),
      enumerateDevices: vi.fn(async () => devices),
    })

    await expect(camera.start(target)).rejects.toThrow('play failed')
    expect(track.stop).toHaveBeenCalledOnce()
    expect(target.srcObject).toBeNull()
  })
})

describe('toCameraFailure', () => {
  it.each([
    ['NotAllowedError', 'permission-denied'],
    ['NotFoundError', 'not-found'],
    ['NotReadableError', 'not-readable'],
    ['OverconstrainedError', 'constraint-failed'],
    ['AbortError', 'unknown'],
  ] as const)('maps %s to %s', (name, code) => {
    expect(toCameraFailure(new DOMException('detail', name))).toEqual({
      code,
      name,
      message: 'detail',
    })
  })

  it('maps a missing MediaDevices API to unsupported', () => {
    expect(
      toCameraFailure(
        Object.assign(new Error('unsupported'), { name: 'UnsupportedError' }),
      ).code,
    ).toBe('unsupported')
  })
})
