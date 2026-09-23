import { computed, readonly, ref, shallowRef, triggerRef } from 'vue'

import { applyCameraFill, applyPhotoFill } from '@/domain/template'
import { createCameraFillController } from '@/features/camera-fill/cameraController'
import type { CameraCompositorPort } from '@/features/camera-fill/compositorPort'
import type {
  CameraFailure,
  CameraStreamPort,
} from '@/features/camera-fill/cameraPort'
import type { CameraPermissionPort } from '@/features/camera-fill/permissionPort'
import { beginCreation } from '@/features/creation-session/beginCreation'
import type { BuildIdentity } from '@/features/creation-session/buildIdentity'
import { CreationSessionOwner } from '@/features/creation-session/creationSessionOwner'
import type { ReleasePort } from '@/features/creation-session/releasePort'
import type {
  ActiveCreationView,
  CameraViewState,
  CompletedArtworkViewState,
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
import type { ClipboardPort } from '@/features/completed-artwork/clipboardPort'
import { CompletedArtworkOwner } from '@/features/completed-artwork/completedArtworkOwner'
import type { CompletedArtworkGeneratorPort } from '@/features/completed-artwork/completedArtworkPort'
import {
  createCompletedArtworkShareText,
  prepareCompletedArtworkShare,
  type CompletedArtworkShareCopy,
} from '@/features/completed-artwork/sharePayload'
import type { CompletedArtworkSharePort } from '@/features/completed-artwork/sharePort'
import type {
  PhotoDecoderPort,
  DecodedPhoto,
} from '@/features/photo-fill/photoDecoderPort'
import type { PhotoFillState } from '@/features/photo-fill/photoState'

type Dependencies = {
  frontend: BuildIdentity
  releasePort: ReleasePort
  catalogPort: TemplateCatalogPort
  assetLoader: TemplateAssetLoaderPort
  previewPort: ArtworkPreviewPort
  cameraPort: CameraStreamPort
  cameraPermission: CameraPermissionPort
  cameraCompositor: CameraCompositorPort
  completedArtworkGenerator: CompletedArtworkGeneratorPort
  completedArtworkShare: CompletedArtworkSharePort
  clipboard: ClipboardPort
  photoDecoder?: PhotoDecoderPort
  mapCameraFailure: (error: unknown) => CameraFailure
  isDocumentHidden: () => boolean
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
          fillKind:
            session.artwork.areas.find((entry) => entry.areaId === area.id)
              ?.fill.kind ?? 'initial',
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
  const cameraState = shallowRef<CameraViewState>({ phase: 'closed' })
  const photoState = shallowRef<PhotoFillState>({ phase: 'closed' })
  let pendingPhoto: DecodedPhoto | undefined
  let photoGeneration = 0
  const completedArtwork = shallowRef<CompletedArtworkViewState>({
    phase: 'idle',
  })
  const completedArtworkOwner = new CompletedArtworkOwner()
  let completionGeneration = 0
  let cameraTarget: HTMLVideoElement | undefined
  const cameraController = createCameraFillController({
    camera: dependencies.cameraPort,
    permission: dependencies.cameraPermission,
    mapFailure: dependencies.mapCameraFailure,
    isDocumentHidden: dependencies.isDocumentHidden,
    onStateChange: (state) => {
      cameraState.value = state
    },
  })

  const templateSelection = computed(() =>
    selectionViewOf(selectionState.value),
  )
  const activeCreation = computed(() =>
    activeSession.value ? activeViewOf(activeSession.value) : null,
  )

  const clearActiveSession = () => {
    // 所有者と画面用参照を同じ境界で消し、解放済みsessionの参照を残さない。
    cameraController.resetSession()
    photoGeneration += 1
    pendingPhoto?.dispose()
    pendingPhoto = undefined
    photoState.value = { phase: 'closed' }
    completionGeneration += 1
    completedArtworkOwner.dispose()
    completedArtwork.value = { phase: 'idle' }
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

  const completedArtworkView = () => {
    const resource = completedArtworkOwner.current
    if (!resource) return { phase: 'idle' } as const
    return {
      phase: 'ready' as const,
      objectUrl: resource.objectUrl,
      width: resource.width,
      height: resource.height,
      sharing: completedArtworkOwner.isSharing,
    }
  }

  const readyCompletedArtworkView = () => {
    const view = completedArtworkView()
    if (view.phase !== 'ready') {
      throw new Error('完成画像resourceがありません。')
    }
    return view
  }

  const completeArtwork = async (): Promise<boolean> => {
    const current = completedArtworkOwner.current
    if (current) {
      completedArtwork.value = completedArtworkView()
      return true
    }
    if (completedArtwork.value.phase === 'generating') return false
    const session = activeSession.value
    if (!session) return false

    const generation = completionGeneration + 1
    completionGeneration = generation
    completedArtwork.value = { phase: 'generating' }
    try {
      const resource = await dependencies.completedArtworkGenerator.generate({
        template: session.template,
        artwork: session.artwork,
        assets: {
          lineArt: session.assets.lineArt.source,
          masks: session.assets.masks.map((mask) => ({
            id: mask.id,
            source: mask.source,
          })),
        },
        areaResources: session.areaResources,
      })
      if (
        generation !== completionGeneration ||
        activeSession.value !== session
      ) {
        resource.dispose()
        return false
      }
      completedArtworkOwner.replace(resource)
      completedArtwork.value = completedArtworkView()
      return true
    } catch {
      if (generation === completionGeneration) {
        completedArtwork.value = { phase: 'error' }
      }
      return false
    }
  }

  const invalidateCompletedArtwork = () => {
    completionGeneration += 1
    completedArtworkOwner.dispose()
    completedArtwork.value = { phase: 'idle' }
  }

  const shareCompletedArtwork = async (
    copy: CompletedArtworkShareCopy,
  ): Promise<void> => {
    const resource = completedArtworkOwner.current
    if (!resource || !completedArtworkOwner.beginShare()) return
    const prepared = prepareCompletedArtworkShare(resource.blob, copy)
    const capability = dependencies.completedArtworkShare.canShare(prepared)
    if (!capability.available) {
      completedArtworkOwner.finishShare()
      completedArtwork.value = {
        ...readyCompletedArtworkView(),
        shareOutcome: { kind: 'unsupported', reason: capability.reason },
      }
      return
    }
    completedArtwork.value = readyCompletedArtworkView()
    const outcome = await dependencies.completedArtworkShare.share(prepared)
    completedArtworkOwner.finishShare()
    completedArtwork.value = {
      ...readyCompletedArtworkView(),
      shareOutcome: outcome,
    }
  }

  const copyCompletedArtworkShareText = async (
    copy: CompletedArtworkShareCopy,
  ): Promise<void> => {
    const outcome = await dependencies.clipboard.copy(
      createCompletedArtworkShareText(copy),
    )
    completedArtwork.value = {
      ...readyCompletedArtworkView(),
      copyOutcome: outcome,
    }
  }

  return {
    appVersion: dependencies.frontend.appVersion,
    startState: readonly(startState),
    templateSelection: readonly(templateSelection),
    activeCreation: readonly(activeCreation),
    cameraState: readonly(cameraState),
    photoState: readonly(photoState),
    completedArtwork: readonly(completedArtwork),
    start,
    selectTemplate,
    retryTemplate,
    backToTemplateList,
    returnToTemplates,
    resetToStart,
    reload: dependencies.reloadPage,
    attachCameraTarget: (target) => {
      cameraTarget = target
      cameraController.attachTarget(target)
    },
    detachCameraTarget: () => {
      cameraTarget = undefined
      cameraController.detachTarget()
    },
    openCamera: (areaId) => cameraController.request(areaId),
    confirmCameraRationale: () => cameraController.confirmRationale(),
    retryCamera: () => cameraController.retry(),
    switchCamera: () => cameraController.switchFacing(),
    setCameraBlend: (blend) => cameraController.setBlend(blend),
    setCameraTransform: (transform) => cameraController.setTransform(transform),
    resizeCameraPreview: (canvas, cssPixels, pixelRatio) =>
      dependencies.cameraCompositor.resizePreview(
        canvas,
        cssPixels,
        pixelRatio,
      ),
    renderCameraPreview: (canvas) => {
      const state = cameraController.state
      const session = activeSession.value
      if (
        !cameraTarget ||
        !session ||
        (state.phase !== 'live' && state.phase !== 'capturing')
      ) {
        return
      }
      dependencies.cameraCompositor.renderPreview(canvas, cameraTarget, {
        template: session.template,
        artwork: session.artwork,
        assets: session.assets,
        areaResources: session.areaResources,
        selectedAreaId: state.areaId,
        blend: state.blend,
        transform: state.transform,
        mirrorSource: state.facing === 'user',
      })
    },
    captureCamera: async () => {
      const session = activeSession.value
      const target = cameraTarget
      const state = cameraController.beginCapture()
      if (!session || !target || !state) return false

      let frame: ReturnType<CameraCompositorPort['captureFrame']> | undefined
      let ownershipTransferred = false
      try {
        frame = dependencies.cameraCompositor.captureFrame(
          target,
          state.transform,
          state.facing === 'user',
        )
        const nextArtwork = applyCameraFill(session.artwork, state.areaId)
        ownershipTransferred = true
        await session.replaceAreaResource(
          state.areaId,
          nextArtwork,
          frame,
          (artwork, areaResources) =>
            dependencies.cameraCompositor.generatePreview({
              template: session.template,
              artwork,
              assets: session.assets,
              areaResources,
            }),
        )
        invalidateCompletedArtwork()
        triggerRef(activeSession)
        cameraController.finishCapture()
        return true
      } catch {
        if (frame && !ownershipTransferred) frame.release()
        cameraController.failCapture()
        return false
      }
    },
    cancelCamera: () => cameraController.cancel(),
    handleCameraVisibilityChange: () =>
      cameraController.handleVisibilityChange(),
    openPhoto: (areaId) => {
      if (!activeSession.value || !areaId) return
      pendingPhoto?.dispose()
      pendingPhoto = undefined
      photoState.value = { phase: 'selecting', areaId }
    },
    selectPhoto: async (file) => {
      const current = photoState.value
      if (current.phase !== 'selecting' && current.phase !== 'error') return
      const areaId = current.areaId
      const generation = photoGeneration + 1
      photoGeneration = generation
      pendingPhoto?.dispose()
      pendingPhoto = undefined
      photoState.value = { phase: 'decoding', areaId }
      try {
        if (!dependencies.photoDecoder)
          throw new Error('写真decoderが構成されていません。')
        const decoded = await dependencies.photoDecoder.decode(file)
        if (generation !== photoGeneration || !activeSession.value) {
          decoded.dispose()
          return
        }
        pendingPhoto = decoded
        photoState.value = {
          phase: 'editing',
          areaId,
          sourceSize: decoded.size,
          transform: {
            scale: Math.max(
              1080 / decoded.size.width,
              1080 / decoded.size.height,
            ),
            offsetX:
              (1080 -
                decoded.size.width *
                  Math.max(
                    1080 / decoded.size.width,
                    1080 / decoded.size.height,
                  )) /
              2,
            offsetY:
              (1080 -
                decoded.size.height *
                  Math.max(
                    1080 / decoded.size.width,
                    1080 / decoded.size.height,
                  )) /
              2,
          },
          blend: 1,
        }
      } catch {
        if (generation === photoGeneration)
          photoState.value = { phase: 'error', areaId }
      }
    },
    retryPhoto: () => {
      const current = photoState.value
      if (current.phase === 'error')
        photoState.value = { phase: 'selecting', areaId: current.areaId }
    },
    setPhotoBlend: (blend) => {
      const current = photoState.value
      if (current.phase === 'editing')
        photoState.value = {
          ...current,
          blend: Math.min(1, Math.max(0, blend)),
        }
    },
    setPhotoTransform: (transform) => {
      const current = photoState.value
      if (current.phase === 'editing')
        photoState.value = { ...current, transform }
    },
    resizePhotoPreview: (canvas, cssPixels, pixelRatio) =>
      dependencies.cameraCompositor.resizePreview(
        canvas,
        cssPixels,
        pixelRatio,
      ),
    renderPhotoPreview: (canvas) => {
      const current = photoState.value
      const session = activeSession.value
      if (
        current.phase !== 'editing' ||
        !pendingPhoto ||
        !session ||
        !dependencies.cameraCompositor.renderPhotoPreview
      )
        return
      dependencies.cameraCompositor.renderPhotoPreview(
        canvas,
        pendingPhoto.source,
        pendingPhoto.size,
        {
          template: session.template,
          artwork: session.artwork,
          assets: session.assets,
          areaResources: session.areaResources,
          selectedAreaId: current.areaId,
          blend: current.blend,
          transform: current.transform,
        },
      )
    },
    applyPhoto: async () => {
      const current = photoState.value
      const session = activeSession.value
      const decoded = pendingPhoto
      if (current.phase !== 'editing' || !session || !decoded) return false
      const capturePhotoFrame = dependencies.cameraCompositor.capturePhotoFrame
      if (!capturePhotoFrame) {
        photoState.value = { phase: 'error', areaId: current.areaId }
        return false
      }
      const frame = capturePhotoFrame(
        decoded.source,
        decoded.size,
        current.transform,
      )
      try {
        await session.replaceAreaResource(
          current.areaId,
          applyPhotoFill(session.artwork, current.areaId),
          frame,
          (artwork, areaResources) =>
            dependencies.cameraCompositor.generatePreview({
              template: session.template,
              artwork,
              assets: session.assets,
              areaResources,
            }),
        )
        pendingPhoto = undefined
        decoded.dispose()
        invalidateCompletedArtwork()
        triggerRef(activeSession)
        photoState.value = { phase: 'closed' }
        return true
      } catch {
        frame.release()
        photoState.value = { phase: 'error', areaId: current.areaId }
        return false
      }
    },
    cancelPhoto: () => {
      photoGeneration += 1
      pendingPhoto?.dispose()
      pendingPhoto = undefined
      photoState.value = { phase: 'closed' }
    },
    completeArtwork,
    retryCompletedArtwork: completeArtwork,
    shareCompletedArtwork,
    copyCompletedArtworkShareText,
    hasCompletedArtwork: () => completedArtworkOwner.current !== undefined,
    hasCatalog: () => snapshot.value !== null,
    hasActiveSession: () => activeSession.value !== null,
    dispose: resetToStart,
  }
}
