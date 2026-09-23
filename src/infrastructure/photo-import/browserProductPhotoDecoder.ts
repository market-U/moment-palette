import type { PhotoDecoderPort } from '@/features/photo-fill/photoDecoderPort'

import { createBrowserPhotoDecoder } from './browserPhotoDecoder'

/** F/Sで検証済みのbrowser decoderを、製品の最小resource契約へ変換する。 */
export const createBrowserProductPhotoDecoder = (): PhotoDecoderPort => {
  const decoder = createBrowserPhotoDecoder()
  return {
    async decode(file) {
      const decoded = await decoder.decode(file, 'quality')
      return {
        source: decoded.source,
        size: decoded.diagnostics.normalizedSize,
        dispose: decoded.dispose,
      }
    },
  }
}
