import type {
  ClipboardOutcome,
  ClipboardPort,
} from '@/features/completed-artwork/clipboardPort'

type NavigatorClipboardLike = Readonly<{
  clipboard?: Pick<Clipboard, 'writeText'>
}>

/** browserのClipboard APIを共有文のコピー結果へ変換するadapterを生成する。 */
export const createBrowserClipboard = (
  navigatorApi: NavigatorClipboardLike = navigator,
): ClipboardPort => ({
  async copy(text): Promise<ClipboardOutcome> {
    const clipboard = navigatorApi.clipboard
    if (!clipboard) return { kind: 'unsupported' }
    try {
      await clipboard.writeText(text)
      return { kind: 'copied' }
    } catch {
      return { kind: 'failed' }
    }
  },
})
