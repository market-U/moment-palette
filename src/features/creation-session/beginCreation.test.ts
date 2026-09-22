import { describe, expect, it, vi } from 'vitest'

import { beginCreation } from './beginCreation'

const snapshot = (buildId = 'build-a') =>
  Object.freeze({
    apiVersion: '0.0.0',
    buildId,
    catalogRevision: 'r1',
    templates: [],
  })

describe('begin creation', () => {
  it('releaseとcatalogを確認してsnapshotを返す', async () => {
    const loadCurrent = vi
      .fn()
      .mockResolvedValue({ appVersion: '0.0.0', buildId: 'build-a' })
    const loadAvailable = vi.fn().mockResolvedValue(snapshot())

    await expect(
      beginCreation({
        frontend: { appVersion: '0.0.0', buildId: 'build-a' },
        releasePort: { loadCurrent },
        catalogPort: { loadAvailable },
      }),
    ).resolves.toMatchObject({ status: 'ready' })
    expect(loadCurrent).toHaveBeenCalledOnce()
    expect(loadAvailable).toHaveBeenCalledOnce()
  })

  it('build不一致ではsnapshotを公開しない', async () => {
    await expect(
      beginCreation({
        frontend: { appVersion: '0.0.0', buildId: 'build-a' },
        releasePort: {
          loadCurrent: vi
            .fn()
            .mockResolvedValue({ appVersion: '0.0.0', buildId: 'build-b' }),
        },
        catalogPort: { loadAvailable: vi.fn().mockResolvedValue(snapshot()) },
      }),
    ).resolves.toEqual({
      status: 'reload-required',
      reason: 'build-mismatch',
    })
  })

  it('取得失敗を呼び出し側へ渡す', async () => {
    const failure = new Error('offline')
    await expect(
      beginCreation({
        frontend: { appVersion: '0.0.0', buildId: 'build-a' },
        releasePort: { loadCurrent: vi.fn().mockRejectedValue(failure) },
        catalogPort: { loadAvailable: vi.fn().mockResolvedValue(snapshot()) },
      }),
    ).rejects.toBe(failure)
  })
})
