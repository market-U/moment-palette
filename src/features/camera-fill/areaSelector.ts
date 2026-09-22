/** Area項目の識別子と、viewport上の水平中心位置を表す。 */
export type AreaCenter = Readonly<{ id: string; center: number }>

/** Container中央に最も近いArea IDを返し、空一覧ではundefinedを返す。 */
export const findNearestAreaId = (
  containerCenter: number,
  areas: readonly AreaCenter[],
): string | undefined => {
  let nearest: AreaCenter | undefined
  let nearestDistance = Number.POSITIVE_INFINITY
  for (const area of areas) {
    const distance = Math.abs(area.center - containerCenter)
    if (distance < nearestDistance) {
      nearest = area
      nearestDistance = distance
    }
  }
  return nearest?.id
}

/** 端のAreaをcontainer中央へ置くために必要な余白を求める。 */
export const getAreaEdgePadding = (
  containerWidth: number,
  itemWidth: number,
): number => Math.max(0, (containerWidth - itemWidth) / 2)
