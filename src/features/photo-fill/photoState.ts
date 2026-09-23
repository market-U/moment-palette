import type { MediaTransform, Rect, Size } from '@/shared/lib/mediaTransform'

/** 写真選択から調整・反映までを画面へ安全に公開する状態を表す。 */
export type PhotoFillState =
  | Readonly<{ phase: 'closed' }>
  | Readonly<{ phase: 'selecting'; areaId: string }>
  | Readonly<{ phase: 'decoding'; areaId: string }>
  | Readonly<{ phase: 'error'; areaId: string }>
  | Readonly<{
      phase: 'editing'
      areaId: string
      sourceSize: Size
      areaBounds: Rect
      transform: MediaTransform
      blend: number
    }>
