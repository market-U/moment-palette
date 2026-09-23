/** OS共有シートへの引き渡し結果を、共有先の投稿結果と分けて表す。 */
export type CompletedArtworkShareOutcome =
  | Readonly<{ kind: 'handed-off' }>
  | Readonly<{ kind: 'cancelled' }>
  | Readonly<{ kind: 'unsupported'; reason: 'web-share' | 'file-share' }>
  | Readonly<{ kind: 'failed'; errorName: string }>

/** 外部例外を利用者向けに露出しないための識別子だけを取り出す。 */
export const getCompletedArtworkShareErrorName = (error: unknown): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string'
  ) {
    return error.name
  }
  return 'UnknownError'
}

/** Web Shareの例外を、キャンセルと安全な再試行可能エラーへ分類する。 */
export const classifyCompletedArtworkShareError = (
  error: unknown,
): CompletedArtworkShareOutcome => {
  const errorName = getCompletedArtworkShareErrorName(error)
  return errorName === 'AbortError'
    ? { kind: 'cancelled' }
    : { kind: 'failed', errorName }
}
