import {
  ARTWORK_SIZE,
  type CameraAreaDefinition,
  type CameraAreaId,
  type CameraSpikeTemplate,
} from './types'

const assetRoot = '/spikes/camera-compositing'

export const cameraAreas = [
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
] as const satisfies readonly CameraAreaDefinition[]

export const cameraSpikeTemplate: CameraSpikeTemplate = {
  size: { width: ARTWORK_SIZE, height: ARTWORK_SIZE },
  lineArtUrl: `${assetRoot}/line-art.png`,
  areas: cameraAreas,
}

export const getCameraArea = (areaId: CameraAreaId): CameraAreaDefinition => {
  const area = cameraAreas.find((candidate) => candidate.id === areaId)

  if (!area) {
    throw new Error(`Unknown camera area: ${areaId}`)
  }

  return area
}
