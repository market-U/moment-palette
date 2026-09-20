import {
  clamp,
  getScaleBounds,
  type MediaTransformPolicy,
  type Rect,
  type Size,
} from '@/shared/lib/mediaTransform'

const LOOSE_SCALE_RANGE = 4
const MINIMUM_VISIBLE_PIXELS = 24

const getContainScale = (source: Size, bounds: Rect) =>
  Math.min(bounds.width / source.width, bounds.height / source.height)

/**
 * 画像形式を区別せず余白を許す一方、画像を選択エリアから完全には失えない範囲へ留める。
 * 初期表示は従来のcoverのままとし、利用者がpinchしたときだけ小さくできる。
 */
export const createLooseTransformPolicy = (
  bounds: Rect,
): MediaTransformPolicy => ({
  getScaleBounds(source, target) {
    const initial = getContainScale(source, bounds)
    return {
      minimum: initial / LOOSE_SCALE_RANGE,
      maximum: getScaleBounds(source, target).maximum,
    }
  },
  constrain(transform, source, target) {
    const scaleBounds = this.getScaleBounds(source, target)
    const scale = clamp(
      transform.scale,
      scaleBounds.minimum,
      scaleBounds.maximum,
    )
    const renderedWidth = source.width * scale
    const renderedHeight = source.height * scale
    const visibleX = Math.min(
      MINIMUM_VISIBLE_PIXELS,
      renderedWidth / 2,
      bounds.width / 2,
    )
    const visibleY = Math.min(
      MINIMUM_VISIBLE_PIXELS,
      renderedHeight / 2,
      bounds.height / 2,
    )

    return {
      scale,
      offsetX: clamp(
        transform.offsetX,
        bounds.x + visibleX - renderedWidth,
        bounds.x + bounds.width - visibleX,
      ),
      offsetY: clamp(
        transform.offsetY,
        bounds.y + visibleY - renderedHeight,
        bounds.y + bounds.height - visibleY,
      ),
    }
  },
})
