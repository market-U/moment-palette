import { describe, expect, it } from 'vitest'

import { compareBuildIdentity } from './versionCompatibility'

const frontend = { appVersion: '1.0.0', buildId: 'build-a' }
const api = { apiVersion: '1.0.0', buildId: 'build-a' }
const release = { appVersion: '1.0.0', buildId: 'build-a' }

describe('compareBuildIdentity', () => {
  it('三者が一致する場合だけ制作開始を許可する', () => {
    expect(compareBuildIdentity(frontend, api, release)).toEqual({
      compatible: true,
    })
  })

  it('version差を検出する', () => {
    expect(
      compareBuildIdentity(frontend, { ...api, apiVersion: '2.0.0' }, release),
    ).toEqual({
      compatible: false,
      reason: 'version-mismatch',
    })
  })

  it('build差を検出する', () => {
    expect(
      compareBuildIdentity(frontend, api, { ...release, buildId: 'build-b' }),
    ).toEqual({
      compatible: false,
      reason: 'build-mismatch',
    })
  })

  it('欠損値を検出する', () => {
    expect(
      compareBuildIdentity({ ...frontend, buildId: '' }, api, release),
    ).toEqual({
      compatible: false,
      reason: 'missing',
    })
  })
})
