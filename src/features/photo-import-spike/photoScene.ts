import { clamp } from '@/shared/lib/mediaTransform'

export interface PhotoSceneAlphas {
  source: number
  artwork: number
  lineArt: number
}

/**
 * 写真全体を下層へ不透明で描き、作品を上から重ねる。
 * 選択mask内には同じ写真を描くため、中間比率でも写真自体は薄くならない。
 */
export const getPhotoSceneAlphas = (
  blend: number,
  hasSource: boolean,
): PhotoSceneAlphas => ({
  source: hasSource ? 1 : 0,
  artwork: hasSource ? clamp(blend, 0, 1) : 1,
  lineArt: 1,
})
