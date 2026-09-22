import type {
  DecodedTemplateAsset,
  LoadedTemplateAssets,
  TemplateAssetLoaderPort,
} from '@/features/azure-template-delivery-spike/assetLoaderPort'
import type { RequestDiagnostics } from '@/features/azure-template-delivery-spike/requestDiagnostics'
import type { TemplateAssetReference } from '@/features/azure-template-delivery-spike/types'
import { loadDecodedAsset } from './loadDecodedAsset'

const loadOne = async (
  asset: TemplateAssetReference,
  fetcher: typeof fetch,
  decode: (blob: Blob) => Promise<ImageBitmap>,
  diagnostics?: RequestDiagnostics,
): Promise<DecodedTemplateAsset> => {
  const decoded = await loadDecodedAsset(asset, fetcher, decode, (url) =>
    diagnostics?.record(url, 'blob'),
  )
  return {
    path: asset.path,
    ...decoded,
  }
}

export const createBrowserTemplateAssetLoader = (
  fetcher: typeof fetch = fetch,
  decode: (blob: Blob) => Promise<ImageBitmap> = createImageBitmap,
  diagnostics?: RequestDiagnostics,
): TemplateAssetLoaderPort => ({
  async load(template) {
    const references = [template.lineArt, ...template.masks]
    const results = await Promise.allSettled(
      references.map((asset) => loadOne(asset, fetcher, decode, diagnostics)),
    )
    const loaded = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    )
    if (loaded.length !== results.length) {
      // 一件でも失敗したら成功済みImageBitmapも閉じ、不完全なsessionを返さない。
      loaded.forEach((asset) => asset.release())
      throw new Error('template asset loading failed')
    }

    let released = false
    const lineArt = loaded[0]
    if (!lineArt) throw new Error('line art is missing')
    const masks = loaded.slice(1).map((asset, index) => ({
      ...asset,
      id: template.masks[index]?.id ?? `mask-${index}`,
    }))
    const value: LoadedTemplateAssets = {
      lineArt,
      masks,
      release() {
        if (released) return
        released = true
        loaded.forEach((asset) => asset.release())
      },
    }
    return value
  },
})
