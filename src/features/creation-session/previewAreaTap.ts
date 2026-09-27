const artworkSize = 1080
const tapDistance = 8

/** preview内のCSS座標を1080pxのArtwork座標へ変換する。 */
export const toArtworkPoint = (
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
) => ({
  x: Math.max(
    0,
    Math.min(
      artworkSize - 1,
      Math.floor(((clientX - rect.left) / rect.width) * artworkSize),
    ),
  ),
  y: Math.max(
    0,
    Math.min(
      artworkSize - 1,
      Math.floor(((clientY - rect.top) / rect.height) * artworkSize),
    ),
  ),
})

/** pointer移動量がArea選択として扱えるtapの範囲内かを判定する。 */
export const isPreviewTap = (
  start: { x: number; y: number },
  end: { x: number; y: number },
) => Math.hypot(end.x - start.x, end.y - start.y) <= tapDistance
