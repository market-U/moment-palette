import type { Size } from '@/shared/lib/mediaTransform'

/** 正規化済み写真を制作sessionへ渡すための、ブラウザ非依存のresource境界を表す。 */
export type DecodedPhoto = Readonly<{
  source: HTMLCanvasElement
  size: Size
  dispose: () => void
}>

/** 選択画像を向き補正・縮小して、編集可能な一時resourceへ変換する境界を表す。 */
export type PhotoDecoderPort = Readonly<{
  decode: (file: File) => Promise<DecodedPhoto>
}>
