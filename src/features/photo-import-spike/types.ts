import type { Rect, Size } from '@/shared/lib/mediaTransform'

export const PHOTO_ARTWORK_SIZE = 1080

export type PhotoAreaId = 'background' | 'body' | 'beak' | 'mouth'

export interface PhotoAreaDefinition {
  id: PhotoAreaId
  label: string
  maskUrl: string
  initialColor: string
  alphaBounds: Rect
}

export interface PhotoSpikeTemplate {
  size: Size
  lineArtUrl: string
  areas: readonly PhotoAreaDefinition[]
}
