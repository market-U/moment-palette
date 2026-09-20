import type { Size } from '@/shared/lib/mediaTransform'

export interface NormalizationLimits {
  maxEdge: number
  maxPixels?: number
}

export const normalizationLimits = {
  quality: { maxEdge: 4096, maxPixels: 12_000_000 },
  memory: { maxEdge: 2160 },
} as const satisfies Record<string, NormalizationLimits>

/**
 * 長辺と総画素数の厳しい方を採用し、縦横比を変えずに縮小寸法を求める。
 * 1を上限に含めることで、小さな写真を品質比較のために拡大しない。
 */
export const calculateNormalizedSize = (
  source: Size,
  limits: NormalizationLimits,
): Size => {
  if (
    source.width <= 0 ||
    source.height <= 0 ||
    limits.maxEdge <= 0 ||
    (limits.maxPixels !== undefined && limits.maxPixels <= 0)
  ) {
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
