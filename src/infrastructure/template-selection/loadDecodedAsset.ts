export type BrowserAssetReference = {
  mimeType: string
  url: string
}

/** Browserでdecodeした画像と、そのnative resourceを解放する操作を表す。 */
export type DecodedBrowserAsset = {
  mimeType: string
  byteLength: number
  width: number
  height: number
  source: ImageBitmap
  release: () => void
}

/** 指定URLの画像を取得してImageBitmapへdecodeし、冪等な解放操作とともに返す。 */
export const loadDecodedAsset = async (
  reference: BrowserAssetReference,
  fetcher: typeof fetch,
  decode: (blob: Blob) => Promise<ImageBitmap>,
  beforeLoad?: (url: string) => void,
): Promise<DecodedBrowserAsset> => {
  beforeLoad?.(reference.url)
  const response = await fetcher(reference.url, {
    cache: 'force-cache',
    mode: 'cors',
  })
  if (!response.ok) throw new Error('template asset request failed')
  const blob = await response.blob()
  const bitmap = await decode(blob)
  let released = false
  return {
    mimeType: blob.type || reference.mimeType,
    byteLength: blob.size,
    width: bitmap.width,
    height: bitmap.height,
    source: bitmap,
    release() {
      // 複数の所有者から終了処理が呼ばれてもImageBitmapは一度だけ閉じる。
      if (released) return
      released = true
      bitmap.close()
    },
  }
}
