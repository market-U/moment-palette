import type { Size } from '@/shared/lib/mediaTransform'

/** 写真の保持用Canvasへ適用する画素上限を表す。 */
export const photoNormalizationLimit = { maxEdge: 4096, maxPixels: 12_000_000 }

/** 縦横比を保ち、拡大せずに長辺・総画素数の両上限へ収める寸法を求める。 */
export const calculateNormalizedSize = (
  source: Size,
  limits: Readonly<{ maxEdge: number; maxPixels?: number }>,
): Size => {
  if (source.width <= 0 || source.height <= 0 || limits.maxEdge <= 0) {
    throw new RangeError('画像寸法と上限は0より大きい必要があります。')
  }
  const edgeScale = limits.maxEdge / Math.max(source.width, source.height)
  const pixelScale = limits.maxPixels
    ? Math.sqrt(limits.maxPixels / (source.width * source.height))
    : 1
  const scale = Math.min(1, edgeScale, pixelScale)
  return {
    width: Math.max(1, Math.floor(source.width * scale)),
    height: Math.max(1, Math.floor(source.height * scale)),
  }
}
