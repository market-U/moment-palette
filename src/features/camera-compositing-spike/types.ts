export const ARTWORK_SIZE = 1080

export interface Size {
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

export interface Rect extends Point, Size {}

export interface MediaTransform {
  scale: number
  offsetX: number
  offsetY: number
}

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
