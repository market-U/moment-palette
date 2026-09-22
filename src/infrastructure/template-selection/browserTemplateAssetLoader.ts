import type {
  DecodedTemplateAsset,
  LoadedTemplateAssets,
  TemplateAssetLoaderPort,
} from '@/features/template-selection/assetLoaderPort'

import { loadDecodedAsset } from '@/infrastructure/azure-template-delivery/loadDecodedAsset'

/** Templateの線画と全maskを並列取得し、一括解放できるbrowser loaderを生成する。 */
export const createBrowserTemplateAssetLoader = (
  fetcher: typeof fetch = fetch,
  decode: (blob: Blob) => Promise<ImageBitmap> = createImageBitmap,
): TemplateAssetLoaderPort => ({
  async load(entry) {
    const references = [entry.lineArt, ...entry.masks]
    const results = await Promise.allSettled(
      references.map((reference) =>
        loadDecodedAsset(reference, fetcher, decode),
      ),
    )
    const loaded = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    )
    if (loaded.length !== results.length) {
      // 一部だけ成功した場合もsessionへ所有権を渡さず、準備済みresourceを回収する。
      loaded.forEach((asset) => asset.release())
      throw new Error('template asset loading failed')
    }

    const lineArt = loaded[0]
    if (!lineArt) throw new Error('line art is missing')
    const masks = loaded.slice(1).map((asset, index) => ({
      ...asset,
      id: entry.masks[index]?.id ?? '',
    }))
    let released = false
    return {
      lineArt: lineArt satisfies DecodedTemplateAsset,
      masks,
      release() {
        // sessionの複数終了経路が重なっても全assetは一度だけ解放する。
        if (released) return
        released = true
        loaded.forEach((asset) => asset.release())
      },
    } satisfies LoadedTemplateAssets
  },
})
