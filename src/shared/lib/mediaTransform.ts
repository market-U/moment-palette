/** 入力画像または1080px作品領域の幅と高さを表す。 */
export interface Size {
  width: number
  height: number
}

/** Pointer EventとCanvasで共通利用する2次元座標を表す。 */
export interface Point {
  x: number
  y: number
}

/** PNG maskの不透明画素範囲など、位置と寸法を持つ矩形を表す。 */
export interface Rect extends Point, Size {}

/** 元画像を作品座標へ配置する倍率と左上位置を表す。 */
export interface MediaTransform {
  scale: number
  offsetX: number
  offsetY: number
}

/** DOMRectへ依存せず、表示領域から必要な値だけを受け取る境界型。 */
export interface DisplayBounds {
  left: number
  top: number
  width: number
  height: number
}

const MAX_SCALE_MULTIPLIER = 4

const assertPositiveSize = (size: Size, name: string) => {
  if (size.width <= 0 || size.height <= 0) {
    throw new RangeError(`${name} dimensions must be greater than zero`)
  }
}

export const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value))

/**
 * 出力領域に余白を出さず、画像全体を可能な限り残す cover 倍率を返す。
 * カメラと写真選択で同じ計算を共有し、入力方式による操作感の差を防ぐ。
 */
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

/**
 * パン・拡大後も出力領域に透明な隙間が見えない範囲へ変換を収める。
 */
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

/**
 * CSSピクセルで届くPointer Eventを、Canvas描画で使う論理座標へ変換する。
 * devicePixelRatioには依存させず、表示サイズが変わっても同じ操作量にする。
 */
export const clientPointToLogical = (
  point: Point,
  bounds: DisplayBounds,
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
