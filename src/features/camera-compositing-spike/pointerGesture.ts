import { applyPan, applyPinch } from './geometry'
import type { MediaTransform, Point, Size } from './types'

type GestureBaseline =
  | {
      mode: 'pan'
      transform: MediaTransform
      point: Point
    }
  | {
      mode: 'pinch'
      transform: MediaTransform
      first: Point
      second: Point
    }

const distance = (first: Point, second: Point) =>
  Math.hypot(second.x - first.x, second.y - first.y)

const midpoint = (first: Point, second: Point): Point => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
})

export class PointerGestureTracker {
  private readonly pointers = new Map<number, Point>()
  private baseline: GestureBaseline | undefined

  get size() {
    return this.pointers.size
  }

  begin(pointerId: number, point: Point, transform: MediaTransform) {
    this.pointers.set(pointerId, point)
    this.rebase(transform)
  }

  move(
    pointerId: number,
    point: Point,
    source: Size,
    target: Size,
  ): MediaTransform | undefined {
    if (!this.pointers.has(pointerId) || !this.baseline) {
      return undefined
    }

    this.pointers.set(pointerId, point)

    if (this.baseline.mode === 'pan' && this.pointers.size === 1) {
      const current = this.sortedPoints()[0]

      if (!current) {
        return undefined
      }

      return applyPan(
        this.baseline.transform,
        {
          x: current.x - this.baseline.point.x,
          y: current.y - this.baseline.point.y,
        },
        source,
        target,
      )
    }

    if (this.baseline.mode === 'pinch' && this.pointers.size >= 2) {
      const [first, second] = this.sortedPoints()

      if (!first || !second) {
        return undefined
      }

      const initialDistance = distance(
        this.baseline.first,
        this.baseline.second,
      )
      const currentDistance = distance(first, second)

      if (initialDistance === 0) {
        return this.baseline.transform
      }

      return applyPinch(
        this.baseline.transform,
        currentDistance / initialDistance,
        midpoint(this.baseline.first, this.baseline.second),
        midpoint(first, second),
        source,
        target,
      )
    }

    return undefined
  }

  end(pointerId: number, transform: MediaTransform) {
    this.pointers.delete(pointerId)
    this.rebase(transform)
  }

  clear() {
    this.pointers.clear()
    this.baseline = undefined
  }

  private sortedPoints() {
    return [...this.pointers.entries()]
      .sort(([firstId], [secondId]) => firstId - secondId)
      .map(([, point]) => point)
  }

  private rebase(transform: MediaTransform) {
    const [first, second] = this.sortedPoints()

    if (!first) {
      this.baseline = undefined
    } else if (!second) {
      this.baseline = { mode: 'pan', transform, point: first }
    } else {
      this.baseline = { mode: 'pinch', transform, first, second }
    }
  }
}
