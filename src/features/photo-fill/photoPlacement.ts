import {
  clamp,
  createCenteredCoverTransform,
  getCoverScale,
  type MediaTransform,
  type MediaTransformPolicy,
  type Rect,
  type Size,
} from '@/shared/lib/mediaTransform'

const minimumScaleFactor = 0.25

/** 写真の余白を許可しつつ、選択Areaから写真が完全に外れないようにする制約を提供する。 */
export const photoTransformPolicy = (
  areaBounds: Rect,
): MediaTransformPolicy => ({
  getScaleBounds(source, target) {
    const cover = getCoverScale(source, target)
    return { minimum: cover * minimumScaleFactor, maximum: cover * 4 }
  },
  constrain(transform, source, target) {
    const bounds = this.getScaleBounds(source, target)
    const scale = clamp(transform.scale, bounds.minimum, bounds.maximum)
    const width = source.width * scale
    const height = source.height * scale
    return {
      scale,
      offsetX: clamp(
        transform.offsetX,
        areaBounds.x - width,
        areaBounds.x + areaBounds.width,
      ),
      offsetY: clamp(
        transform.offsetY,
        areaBounds.y - height,
        areaBounds.y + areaBounds.height,
      ),
    }
  },
})

/** 1080座標の作品全体を覆う初期写真変換を生成する。 */
export const createInitialPhotoTransform = (
  source: Size,
  target: Size,
): MediaTransform => createCenteredCoverTransform(source, target)
