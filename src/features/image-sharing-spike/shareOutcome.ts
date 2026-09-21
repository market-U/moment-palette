export type ShareOutcome =
  | { kind: 'handed-off' }
  | { kind: 'cancelled'; errorName: 'AbortError' }
  | { kind: 'unsupported'; reason: 'web-share' | 'file-share' }
  | { kind: 'failed'; errorName: string; guidance: string }

const knownGuidance: Record<string, string> = {
  InvalidStateError:
    '別の共有処理が終わってから、同じ完成画像でもう一度試してください。',
  NotAllowedError:
    '共有ボタンを直接押して再試行し、ブラウザの共有許可も確認してください。',
  TypeError:
    'この共有内容を端末が受け付けませんでした。別の共有方式または長押し保存を試してください。',
  DataError:
    '共有先へ内容を渡せませんでした。別の共有先または長押し保存を試してください。',
}

export const getErrorName = (error: unknown) => {
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

/** shareのresolveは投稿成功ではなく、OSまたは共有先への引き渡し完了として扱う。 */
export const classifyShareError = (error: unknown): ShareOutcome => {
  const errorName = getErrorName(error)

  if (errorName === 'AbortError') {
    return { kind: 'cancelled', errorName: 'AbortError' }
  }

  return {
    kind: 'failed',
    errorName,
    guidance:
      knownGuidance[errorName] ??
      '共有を開始できませんでした。同じ完成画像でもう一度試すか、長押し保存を利用してください。',
  }
}
