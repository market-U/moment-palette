/** 非同期画像選択の結果として解放できる一時resourceを表す。 */
export interface DisposableSelection {
  dispose(): void
}

/** 最新のOS picker操作だけを採用し、遅れて完了した画像resourceを確実に解放する。 */
export class LatestSelection<T extends DisposableSelection> {
  private generation = 0

  begin(): number {
    this.generation += 1
    return this.generation
  }

  isCurrent(generation: number): boolean {
    return generation === this.generation
  }

  accept(generation: number, result: T): result is T {
    if (this.isCurrent(generation)) return true
    result.dispose()
    return false
  }

  invalidate(): void {
    this.generation += 1
  }
}
