/** 写真のdecodeまたは正規化で、利用者向けの安全な案内へ変換する失敗種別を表す。 */
export type PhotoFailureKind =
  | 'decode-failed'
  | 'invalid-dimensions'
  | 'normalization-failed'
  | 'resource-pressure'

/** browser実装の内部例外を、画面へ露出させない分類情報として保持する。 */
export class PhotoImportError extends Error {
  constructor(
    public readonly kind: PhotoFailureKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'PhotoImportError'
  }
}
