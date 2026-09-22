import type { TemplateCatalogEntry } from './catalog'

export type TemplateSelectionState =
  | { phase: 'unavailable' }
  | { phase: 'empty' }
  | { phase: 'ready'; templates: readonly TemplateCatalogEntry[] }
  | {
      phase: 'preparing'
      templates: readonly TemplateCatalogEntry[]
      templateId: string
    }
  | {
      phase: 'error'
      templates: readonly TemplateCatalogEntry[]
      templateId: string
    }

/** Catalogの件数から、選択可能または空の初期表示状態を生成する。 */
export const selectionFrom = (
  templates: readonly TemplateCatalogEntry[],
): TemplateSelectionState =>
  templates.length === 0 ? { phase: 'empty' } : { phase: 'ready', templates }

/** 選択可能な状態からだけasset準備中へ遷移し、重複した準備開始を拒否する。 */
export const beginPreparing = (
  state: TemplateSelectionState,
  templateId: string,
): TemplateSelectionState => {
  if (state.phase !== 'ready' && state.phase !== 'error') return state
  return { phase: 'preparing', templates: state.templates, templateId }
}

/** 準備中のtemplateを保ったまま、再試行可能な失敗状態へ遷移する。 */
export const preparationFailed = (
  state: TemplateSelectionState,
): TemplateSelectionState =>
  state.phase === 'preparing'
    ? {
        phase: 'error',
        templates: state.templates,
        templateId: state.templateId,
      }
    : state

/** 保持中のsnapshotを再取得せず、同じテンプレート一覧へ戻す。 */
export const backToSelection = (
  state: TemplateSelectionState,
): TemplateSelectionState =>
  state.phase === 'error' || state.phase === 'preparing'
    ? { phase: 'ready', templates: state.templates }
    : state
