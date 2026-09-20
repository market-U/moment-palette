import type { MediaTransform, Point, Size } from './types'

const MAX_SCALE_MULTIPLIER = 4

const assertPositiveSize = (size: Size, name: string) => {
  if (size.width <= 0 || size.height <= 0) {
    throw new RangeError(`${name} dimensions must be greater than zero`)
  }
}

export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

export const getCoverScale = (source: Size, target: Size) => {
  assertPositiveSize(source, 'source')
  assertPositiveSize(target, 'target')

  return Math.max(target.width / source.width, target.height / source.height)
}

export const getScaleBounds = (source: Size, target: Size) => {
  const minimum = getCoverScale(source, target)

  return {
    minimum,
    maximum: minimum * MAX_SCALE_MULTIPLIER,
  }
}

export const constrainTransform = (
  transform: MediaTransform,
  source: Size,
  target: Size,
): MediaTransform => {
  const bounds = getScaleBounds(source, target)
  const scale = clamp(transform.scale, bounds.minimum, bounds.maximum)
  const renderedWidth = source.width * scale
  const renderedHeight = source.height * scale

  return {
    scale,
    offsetX: clamp(transform.offsetX, target.width - renderedWidth, 0),
    offsetY: clamp(transform.offsetY, target.height - renderedHeight, 0),
  }
}

export const createCenteredCoverTransform = (
  source: Size,
  target: Size,
): MediaTransform => {
  const scale = getCoverScale(source, target)

  return {
    scale,
    offsetX: (target.width - source.width * scale) / 2,
    offsetY: (target.height - source.height * scale) / 2,
  }
}

export const applyPan = (
  transform: MediaTransform,
  delta: Point,
  source: Size,
  target: Size,
) =>
  constrainTransform(
    {
      ...transform,
      offsetX: transform.offsetX + delta.x,
      offsetY: transform.offsetY + delta.y,
    },
    source,
    target,
  )

export const applyPinch = (
  transform: MediaTransform,
  scaleFactor: number,
  startAnchor: Point,
  currentAnchor: Point,
  source: Size,
  target: Size,
) => {
  const bounds = getScaleBounds(source, target)
  const scale = clamp(
    transform.scale * scaleFactor,
    bounds.minimum,
    bounds.maximum,
  )
  const sourceAnchor = {
    x: (startAnchor.x - transform.offsetX) / transform.scale,
    y: (startAnchor.y - transform.offsetY) / transform.scale,
  }

  return constrainTransform(
    {
      scale,
      offsetX: currentAnchor.x - sourceAnchor.x * scale,
      offsetY: currentAnchor.y - sourceAnchor.y * scale,
    },
    source,
    target,
  )
}

export const clientPointToLogical = (
  point: Point,
  bounds: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  logicalSize: Size,
): Point => {
  if (bounds.width <= 0 || bounds.height <= 0) {
    throw new RangeError('preview dimensions must be greater than zero')
  }

  return {
    x: ((point.x - bounds.left) / bounds.width) * logicalSize.width,
    y: ((point.y - bounds.top) / bounds.height) * logicalSize.height,
  }
}
