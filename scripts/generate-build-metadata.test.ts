import { describe, expect, it } from 'vitest'

import {
  assertBuildId,
  assertMatchingVersions,
  createMetadataArtifacts,
} from './generate-build-metadata.mjs'

describe('build metadata生成', () => {
  it('rootとAPIのversionが一致する場合だけ採用する', () => {
    expect(assertMatchingVersions('1.2.3', '1.2.3')).toBe('1.2.3')
    expect(() => assertMatchingVersions('1.2.3', '1.2.4')).toThrow(
      /一致しません/,
    )
  })

  it('production build IDには完全長commit SHAを要求する', () => {
    expect(assertBuildId('a'.repeat(40), true)).toBe('a'.repeat(40))
    expect(() => assertBuildId('main', true)).toThrow(/commit SHA/)
    expect(assertBuildId('local-development', false)).toBe('local-development')
  })

  it('三つの成果物へversionとbuild IDだけを生成する', () => {
    const artifacts = createMetadataArtifacts('1.2.3', 'build-a')
    expect(JSON.parse(artifacts.releaseJson)).toEqual({
      appVersion: '1.2.3',
      buildId: 'build-a',
    })
    expect(artifacts.frontendModule).toContain("APP_VERSION = '1.2.3'")
    expect(artifacts.apiModule).toContain("BUILD_ID = 'build-a'")
    expect(JSON.stringify(artifacts)).not.toMatch(/secret|token|branch|sas/i)
  })
})
