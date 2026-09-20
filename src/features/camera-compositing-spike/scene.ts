import { clamp } from './geometry'

export interface SceneAlphas {
  source: number
  artwork: number
  lineArt: number
}

export const getSceneAlphas = (
  blend: number,
  hasLiveSource: boolean,
): SceneAlphas => {
  const artwork = hasLiveSource ? clamp(blend, 0, 1) : 1

  return {
    source: hasLiveSource ? 1 - artwork : 0,
    artwork,
    lineArt: 1,
  }
}
