import { describe, expect, it } from 'vitest'

import {
  classifyRequest,
  RequestDiagnostics,
  sanitizeRequestUrl,
} from './requestDiagnostics'

describe('request diagnostics', () => {
  it('SAS queryとfragmentを除去する', () => {
    expect(
      sanitizeRequestUrl('https://blob.test/a.png?sp=r&sig=secret#part'),
    ).toBe('https://blob.test/a.png')
  })

  it('resource種別を分類する', () => {
    expect(classifyRequest('/api/templates')).toBe('api')
    expect(classifyRequest('/release.json')).toBe('release')
    expect(classifyRequest('https://blob.test/a.png?sig=x')).toBe('blob')
    expect(classifyRequest('/assets/a.js', 'script')).toBe('script')
  })

  it('Start前後を時刻だけで記録する', () => {
    const diagnostics = new RequestDiagnostics()
    diagnostics.record('/api/templates?secret=x', 'api', 10)
    diagnostics.markSessionStarted(20)
    diagnostics.record('https://blob.test/a.png?sig=x', 'blob', 21)
    expect(diagnostics.snapshot()).toEqual([
      {
        url: 'http://localhost/api/templates',
        kind: 'api',
        at: 10,
        phase: 'before-start',
      },
      {
        url: 'https://blob.test/a.png',
        kind: 'blob',
        at: 21,
        phase: 'after-start',
      },
    ])
  })
})
