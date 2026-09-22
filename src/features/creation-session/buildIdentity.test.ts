import { describe, expect, it } from 'vitest'

import { compareBuildIdentity } from './buildIdentity'

const frontend = { appVersion: '1.0.0', buildId: 'build-a' }
const api = { apiVersion: '1.0.0', buildId: 'build-a' }
const release = { appVersion: '1.0.0', buildId: 'build-a' }

describe('build identity', () => {
  it('三者が一致すると互換と判定する', () => {
    expect(compareBuildIdentity(frontend, api, release)).toEqual({
      compatible: true,
    })
  })

  it('version差を検出する', () => {
    expect(
      compareBuildIdentity(frontend, { ...api, apiVersion: '2.0.0' }, release),
    ).toEqual({ compatible: false, reason: 'version-mismatch' })
  })

  it('build差を検出する', () => {
    expect(
      compareBuildIdentity(frontend, api, { ...release, buildId: 'build-b' }),
    ).toEqual({ compatible: false, reason: 'build-mismatch' })
  })

  it('空のidentityを欠損として扱う', () => {
    expect(
      compareBuildIdentity({ ...frontend, buildId: ' ' }, api, release),
    ).toEqual({ compatible: false, reason: 'missing' })
  })
})
