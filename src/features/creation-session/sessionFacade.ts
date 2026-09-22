import { inject, type InjectionKey, type Ref } from 'vue'

export type LocalizedViewText = Readonly<{ ja: string; en: string }>

export type StartViewState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'ready' }
  | {
      phase: 'reload-required'
      reason: 'missing' | 'version-mismatch' | 'build-mismatch'
    }
  | { phase: 'retryable-error' }

export type TemplateCardView = Readonly<{
  id: string
  name: LocalizedViewText
  thumbnailUrl: string
}>

export type TemplateSelectionViewState =
  | { phase: 'unavailable' }
  | { phase: 'empty' }
  | { phase: 'ready'; templates: readonly TemplateCardView[] }
  | {
      phase: 'preparing'
      templates: readonly TemplateCardView[]
      templateId: string
    }
  | {
      phase: 'error'
      templates: readonly TemplateCardView[]
      templateId: string
    }

export type ActiveCreationView = Readonly<{
  templateName: LocalizedViewText
  previewUrl: string
  areas: readonly Readonly<{
    id: string
    label: LocalizedViewText
    initialColor: string
  }>[]
}>

/** 製品画面へ公開する制作開始フローの状態と操作を定義する。 */
export type CreationSessionFacade = {
  readonly appVersion: string
  readonly startState: Readonly<Ref<StartViewState>>
  readonly templateSelection: Readonly<Ref<TemplateSelectionViewState>>
  readonly activeCreation: Readonly<Ref<ActiveCreationView | null>>
  start: () => Promise<boolean>
  selectTemplate: (templateId: string) => Promise<boolean>
  retryTemplate: () => Promise<boolean>
  backToTemplateList: () => void
  returnToTemplates: () => void
  resetToStart: () => void
  reload: () => void
}

export const creationSessionFacadeKey: InjectionKey<CreationSessionFacade> =
  Symbol('creation-session-facade')

/** Appから提供された制作session facadeを取得し、未提供なら構成エラーとして拒否する。 */
export const useCreationSession = (): CreationSessionFacade => {
  const facade = inject(creationSessionFacadeKey)
  if (!facade) throw new Error('制作sessionがappから提供されていません。')
  return facade
}
