import { describe, expect, it } from 'vitest'

import { PointerGestureTracker } from './pointerGesture'

const size = { width: 1080, height: 1080 }
const transform = { scale: 1, offsetX: 0, offsetY: 0 }

describe('PointerGestureTracker', () => {
  it('pans with one pointer', () => {
    const tracker = new PointerGestureTracker()
    tracker.begin(4, { x: 500, y: 500 }, transform)

    expect(tracker.move(4, { x: 400, y: 300 }, size, size)).toEqual({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    })
  })

  it('pinches independent of pointer insertion order', () => {
    const first = new PointerGestureTracker()
    first.begin(8, { x: 400, y: 540 }, transform)
    first.begin(2, { x: 680, y: 540 }, transform)
    const firstResult = first.move(8, { x: 260, y: 540 }, size, size)

    const second = new PointerGestureTracker()
    second.begin(2, { x: 680, y: 540 }, transform)
    second.begin(8, { x: 400, y: 540 }, transform)
    const secondResult = second.move(8, { x: 260, y: 540 }, size, size)

    expect(firstResult).toEqual(secondResult)
    expect(firstResult?.scale).toBe(1.5)
  })

  it('rebases to pan after one pinch pointer ends', () => {
    const tracker = new PointerGestureTracker()
    tracker.begin(1, { x: 300, y: 540 }, transform)
    tracker.begin(2, { x: 780, y: 540 }, transform)
    const pinched = tracker.move(2, { x: 1020, y: 540 }, size, size)

    expect(pinched).toBeDefined()
    tracker.end(2, pinched ?? transform)

    expect(tracker.size).toBe(1)
    expect(tracker.move(1, { x: 240, y: 540 }, size, size)).toEqual({
      ...(pinched ?? transform),
      offsetX: Math.max(
        size.width - size.width * (pinched?.scale ?? 1),
        (pinched?.offsetX ?? 0) - 60,
      ),
    })
  })

  it('ignores moves after cancel and clears all pointers', () => {
    const tracker = new PointerGestureTracker()
    tracker.begin(1, { x: 200, y: 200 }, transform)
    tracker.end(1, transform)

    expect(tracker.move(1, { x: 300, y: 300 }, size, size)).toBeUndefined()
    tracker.begin(2, { x: 200, y: 200 }, transform)
    tracker.clear()
    expect(tracker.size).toBe(0)
  })
})
