import {
  clamp,
  type MediaTransformPolicy,
  type Rect,
} from '@/shared/lib/mediaTransform'

const looseScaleRange = 4
const minimumVisiblePixels = 24

/** 写真を選択Areaから完全に失わず、初期coverより小さくして余白を残せる制約を提供する。 */
export const createLooseTransformPolicy = (
  bounds: Rect,
): MediaTransformPolicy => ({
  getScaleBounds(source, target) {
    const minimum = Math.min(
      bounds.width / source.width,
      bounds.height / source.height,
    )
    const cover = Math.max(
      target.width / source.width,
      target.height / source.height,
    )
    return { minimum: minimum / looseScaleRange, maximum: cover * 4 }
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
      minimumVisiblePixels,
      renderedWidth / 2,
      bounds.width / 2,
    )
    const visibleY = Math.min(
      minimumVisiblePixels,
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
