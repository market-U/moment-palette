import type { Rect, Size } from '@/shared/lib/mediaTransform'

export const ARTWORK_SIZE = 1080

// 既存のカメラF/Sの公開型を保ち、共有化による利用側の破壊を避ける。
export type {
  MediaTransform,
  Point,
  Rect,
  Size,
} from '@/shared/lib/mediaTransform'

export type CameraFacing = 'environment' | 'user'

export type CameraAreaId = 'background' | 'body' | 'beak' | 'mouth'

export interface CameraAreaDefinition {
  id: CameraAreaId
  label: string
  maskUrl: string
  initialColor: string
  alphaBounds: Rect
}

export interface CameraSpikeTemplate {
  size: Size
  lineArtUrl: string
  areas: readonly CameraAreaDefinition[]
}
