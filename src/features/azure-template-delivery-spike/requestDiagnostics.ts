export type RequestKind =
  'api' | 'release' | 'blob' | 'script' | 'style' | 'other'

export type SanitizedRequestRecord = {
  url: string
  kind: RequestKind
  at: number
  phase: 'before-start' | 'after-start'
}

export const sanitizeRequestUrl = (
  rawUrl: string,
  baseUrl = 'http://localhost',
): string => {
  const url = new URL(rawUrl, baseUrl)
  // SASの署名・期限などを診断、画面、logへ残さない。
  return `${url.origin}${url.pathname}`
}

export const classifyRequest = (
  url: string,
  initiatorType = '',
): RequestKind => {
  const pathname = new URL(url, 'http://localhost').pathname
  if (pathname === '/api/templates') return 'api'
  if (pathname === '/release.json') return 'release'
  if (initiatorType === 'script' || pathname.endsWith('.js')) return 'script'
  if (initiatorType === 'css' || pathname.endsWith('.css')) return 'style'
  if (pathname.endsWith('.png')) return 'blob'
  return 'other'
}

export class RequestDiagnostics {
  #startedAt: number | null = null
  #records: SanitizedRequestRecord[] = []
  #resourceEntryKeys = new Set<string>()

  markSessionStarted(at = performance.now()): void {
    this.#startedAt = at
  }

  record(rawUrl: string, kind: RequestKind, at = performance.now()): void {
    this.#records.push({
      url: sanitizeRequestUrl(rawUrl, globalThis.location?.href),
      kind,
      at,
      phase:
        this.#startedAt !== null && at >= this.#startedAt
          ? 'after-start'
          : 'before-start',
    })
  }

  addResourceEntries(entries: readonly PerformanceResourceTiming[]): void {
    for (const entry of entries) {
      const key = `${entry.name}|${String(entry.startTime)}|${String(entry.duration)}`
      if (this.#resourceEntryKeys.has(key)) continue
      this.#resourceEntryKeys.add(key)
      this.record(
        entry.name,
        classifyRequest(entry.name, entry.initiatorType),
        entry.startTime,
      )
    }
  }

  snapshot(): readonly SanitizedRequestRecord[] {
    return [...this.#records]
  }
}
