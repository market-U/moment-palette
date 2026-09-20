export interface DisposableSelection {
  dispose(): void
}

/**
 * OS pickerと画像decodeは完了順を保証しないため、開始順の世代番号を正本にする。
 * 古い結果の破棄もここで行い、呼び出し側がdisposeを忘れないようにする。
 */
export class LatestSelection<T extends DisposableSelection> {
  private generation = 0

  begin() {
    this.generation += 1
    return this.generation
  }

  isCurrent(generation: number) {
    return generation === this.generation
  }

  accept(generation: number, result: T): result is T {
    if (!this.isCurrent(generation)) {
      result.dispose()
      return false
    }

    return true
  }

  invalidate() {
    this.generation += 1
  }
}
