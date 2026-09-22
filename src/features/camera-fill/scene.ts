import { clamp } from '@/shared/lib/mediaTransform'

/** 全体映像、現在作品、線画を重ねる際の各alphaを表す。 */
export interface CameraSceneAlphas {
  source: number
  artwork: number
  lineArt: number
}

/** 比較sliderとlive sourceの有無から、preview各面のalphaを決定する。 */
export const getCameraSceneAlphas = (
  blend: number,
  hasLiveSource: boolean,
): CameraSceneAlphas => ({
  source: hasLiveSource ? 1 : 0,
  artwork: hasLiveSource ? clamp(blend, 0, 1) : 1,
  lineArt: 1,
})
