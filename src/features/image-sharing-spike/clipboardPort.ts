export type ClipboardOutcome =
  | { kind: 'copied' }
  | { kind: 'unsupported' }
  | { kind: 'failed'; errorName: string }

export interface ClipboardPort {
  copy(text: string): Promise<ClipboardOutcome>
}
