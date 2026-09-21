import type {
  ClipboardOutcome,
  ClipboardPort,
} from '@/features/image-sharing-spike/clipboardPort'
import { getErrorName } from '@/features/image-sharing-spike/shareOutcome'

export interface ClipboardLike {
  writeText(text: string): Promise<void>
}

export const createBrowserClipboard = (
  clipboard: ClipboardLike | undefined = navigator.clipboard,
): ClipboardPort => ({
  async copy(text): Promise<ClipboardOutcome> {
    if (!clipboard) {
      return { kind: 'unsupported' }
    }

    try {
      await clipboard.writeText(text)
      return { kind: 'copied' }
    } catch (error) {
      return { kind: 'failed', errorName: getErrorName(error) }
    }
  },
})
