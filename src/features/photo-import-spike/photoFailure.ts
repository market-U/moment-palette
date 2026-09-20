export type PhotoFailureKind =
  | 'no-selection'
  | 'decode-failed'
  | 'invalid-dimensions'
  | 'normalization-failed'
  | 'resource-pressure'
  | 'unknown'

export class PhotoImportError extends Error {
  constructor(
    public readonly kind: Exclude<PhotoFailureKind, 'no-selection' | 'unknown'>,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'PhotoImportError'
  }
}

export interface PhotoFailure {
  kind: PhotoFailureKind
  title: string
  guidance: string
}

const failureCopy: Record<PhotoFailureKind, Omit<PhotoFailure, 'kind'>> = {
  'no-selection': {
    title: '写真は選択されませんでした',
    guidance:
      '現在の編集内容はそのままです。必要ならもう一度選択してください。',
  },
  'decode-failed': {
    title: '画像を読み込めませんでした',
    guidance:
      '未対応形式または破損画像の可能性があります。別の画像を選択してください。',
  },
  'invalid-dimensions': {
    title: '画像の寸法を確認できませんでした',
    guidance: '別の画像を選ぶか、JPEGまたはPNGへ変換して再試行してください。',
  },
  'normalization-failed': {
    title: '編集用画像を作成できませんでした',
    guidance: 'より小さい画像を選択して再試行してください。',
  },
  'resource-pressure': {
    title: '端末の画像処理用メモリが不足した可能性があります',
    guidance: '2160px候補を選ぶか、より小さい画像で再試行してください。',
  },
  unknown: {
    title: '画像の処理中に問題が発生しました',
    guidance: '別の画像を選択して再試行してください。',
  },
}

export const createPhotoFailure = (kind: PhotoFailureKind): PhotoFailure => ({
  kind,
  ...failureCopy[kind],
})

/** 例外本文を画面へ露出せず、利用者が次に取れる行動だけへ変換する。 */
export const classifyPhotoFailure = (error: unknown): PhotoFailure => {
  const kind =
    error instanceof PhotoImportError
      ? error.kind
      : error instanceof DOMException && error.name === 'QuotaExceededError'
        ? 'resource-pressure'
        : 'unknown'

  return createPhotoFailure(kind)
}
