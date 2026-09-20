import {
  PHOTO_ARTWORK_SIZE,
  type PhotoAreaDefinition,
  type PhotoSpikeTemplate,
} from './types'

// 実行アセットだけを共有し、写真F/SからカメラF/S featureへ依存しない。
const assetRoot = '/spikes/camera-compositing'

export const photoAreas = [
  {
    id: 'background',
    label: '背景',
    maskUrl: `${assetRoot}/background-mask.png`,
    initialColor: '#f3e8dc',
    alphaBounds: { x: 0, y: 0, width: 1080, height: 1080 },
  },
  {
    id: 'body',
    label: 'ボディ',
    maskUrl: `${assetRoot}/body-mask.png`,
    initialColor: '#e8ded2',
    alphaBounds: { x: 180, y: 175, width: 867, height: 905 },
  },
  {
    id: 'beak',
    label: 'くちばし',
    maskUrl: `${assetRoot}/beak-mask.png`,
    initialColor: '#efb16f',
    alphaBounds: { x: 373, y: 216, width: 384, height: 607 },
  },
  {
    id: 'mouth',
    label: '口の中',
    maskUrl: `${assetRoot}/mouth-mask.png`,
    initialColor: '#c9787f',
    alphaBounds: { x: 424, y: 365, width: 267, height: 421 },
  },
] as const satisfies readonly PhotoAreaDefinition[]

export const photoSpikeTemplate: PhotoSpikeTemplate = {
  size: { width: PHOTO_ARTWORK_SIZE, height: PHOTO_ARTWORK_SIZE },
  lineArtUrl: `${assetRoot}/line-art.png`,
  areas: photoAreas,
}
