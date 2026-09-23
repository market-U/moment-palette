/** 共有文コピーの安全な結果を表す。 */
export type ClipboardOutcome =
  | Readonly<{ kind: 'copied' }>
  | Readonly<{ kind: 'unsupported' }>
  | Readonly<{ kind: 'failed' }>

/** Clipboard APIへの書き込みを製品状態へ変換する境界を定義する。 */
export type ClipboardPort = {
  copy: (text: string) => Promise<ClipboardOutcome>
}
