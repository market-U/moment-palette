import { computed, readonly, ref, shallowRef } from 'vue'

import { beginCreation } from '@/features/creation-session/beginCreation'
import type { BuildIdentity } from '@/features/creation-session/buildIdentity'
import { CreationSessionOwner } from '@/features/creation-session/creationSessionOwner'
import type { ReleasePort } from '@/features/creation-session/releasePort'
import type {
  ActiveCreationView,
  CreationSessionFacade,
  StartViewState,
  TemplateSelectionViewState,
} from '@/features/creation-session/sessionFacade'
import type { ArtworkPreviewPort } from '@/features/template-selection/artworkPreviewPort'
import type { TemplateAssetLoaderPort } from '@/features/template-selection/assetLoaderPort'
import type { CatalogSnapshot } from '@/features/template-selection/catalog'
import {
  prepareTemplate,
  type ActiveCreationSession,
} from '@/features/template-selection/prepareTemplate'
import {
  backToSelection,
  beginPreparing,
  preparationFailed,
  selectionFrom,
  type TemplateSelectionState,
} from '@/features/template-selection/state'
import type { TemplateCatalogPort } from '@/features/template-selection/templateCatalogPort'

type Dependencies = {
  frontend: BuildIdentity
  releasePort: ReleasePort
  catalogPort: TemplateCatalogPort
  assetLoader: TemplateAssetLoaderPort
  previewPort: ArtworkPreviewPort
  now: () => Date
  reloadPage: () => void
}

/** 制作開始フローを画面へ公開し、snapshotとsessionの所有権を一元管理する。 */
export type CreationSessionAppService = CreationSessionFacade & {
  hasCatalog: () => boolean
  hasActiveSession: () => boolean
  dispose: () => void
}

const selectionViewOf = (
  state: TemplateSelectionState,
): TemplateSelectionViewState => {
  if (state.phase === 'unavailable' || state.phase === 'empty') return state
  const templates = state.templates.map((entry) =>
    Object.freeze({
      id: entry.template.id,
      name: entry.template.name,
      thumbnailUrl: entry.thumbnail.url,
    }),
  )
  return state.phase === 'ready'
    ? { phase: 'ready', templates }
    : {
        phase: state.phase,
        templates,
        templateId: state.templateId,
      }
}

const activeViewOf = (session: ActiveCreationSession): ActiveCreationView =>
  Object.freeze({
    templateName: session.template.name,
    previewUrl: session.preview.url,
    areas: Object.freeze(
      session.template.areas.map((area) =>
        Object.freeze({
          id: area.id,
          label: area.label,
          initialColor: area.initialColor,
        }),
      ),
    ),
  })

/** 製品のportを結線し、画面遷移に依存しない制作sessionサービスを生成する。 */
export const createCreationSessionAppService = (
  dependencies: Dependencies,
): CreationSessionAppService => {
  const startState = ref<StartViewState>({ phase: 'idle' })
  const selectionState = shallowRef<TemplateSelectionState>({
    phase: 'unavailable',
  })
  const snapshot = shallowRef<CatalogSnapshot | null>(null)
  const owner = new CreationSessionOwner<ActiveCreationSession>()
  const activeSession = shallowRef<ActiveCreationSession | null>(null)

  const templateSelection = computed(() =>
    selectionViewOf(selectionState.value),
  )
  const activeCreation = computed(() =>
    activeSession.value ? activeViewOf(activeSession.value) : null,
  )

  const clearActiveSession = () => {
    // 所有者と画面用参照を同じ境界で消し、解放済みsessionの参照を残さない。
    owner.clear()
    activeSession.value = null
  }

  const resetToStart = () => {
    clearActiveSession()
    snapshot.value = null
    selectionState.value = { phase: 'unavailable' }
    startState.value = { phase: 'idle' }
  }

  const start = async (): Promise<boolean> => {
    if (startState.value.phase === 'checking') return false
    clearActiveSession()
    snapshot.value = null
    selectionState.value = { phase: 'unavailable' }
    startState.value = { phase: 'checking' }
    try {
      const result = await beginCreation(dependencies)
      if (result.status === 'reload-required') {
        startState.value = {
          phase: 'reload-required',
          reason: result.reason,
        }
        return false
      }
      snapshot.value = result.snapshot
      selectionState.value = selectionFrom(result.snapshot.templates)
      startState.value = { phase: 'ready' }
      return true
    } catch {
      startState.value = { phase: 'retryable-error' }
      return false
    }
  }

  const selectTemplate = async (templateId: string): Promise<boolean> => {
    const currentSnapshot = snapshot.value
    if (!currentSnapshot) return false
    const nextState = beginPreparing(selectionState.value, templateId)
    if (nextState === selectionState.value) return false
    selectionState.value = nextState
    try {
      const session = await prepareTemplate(currentSnapshot, templateId, {
        assetLoader: dependencies.assetLoader,
        previewPort: dependencies.previewPort,
        now: dependencies.now,
      })
      owner.replace(session)
      activeSession.value = session
      return true
    } catch {
      selectionState.value = preparationFailed(selectionState.value)
      return false
    }
  }

  const retryTemplate = async (): Promise<boolean> => {
    const state = selectionState.value
    if (state.phase !== 'error') return false
    return selectTemplate(state.templateId)
  }

  const backToTemplateList = () => {
    selectionState.value = backToSelection(selectionState.value)
  }

  const returnToTemplates = () => {
    clearActiveSession()
    if (snapshot.value) {
      // 制作sessionだけを終了し、Start時に固定したsnapshotは再取得せず再利用する。
      selectionState.value = selectionFrom(snapshot.value.templates)
    }
  }

  return {
    appVersion: dependencies.frontend.appVersion,
    startState: readonly(startState),
    templateSelection: readonly(templateSelection),
    activeCreation: readonly(activeCreation),
    start,
    selectTemplate,
    retryTemplate,
    backToTemplateList,
    returnToTemplates,
    resetToStart,
    reload: dependencies.reloadPage,
    hasCatalog: () => snapshot.value !== null,
    hasActiveSession: () => activeSession.value !== null,
    dispose: resetToStart,
  }
}
