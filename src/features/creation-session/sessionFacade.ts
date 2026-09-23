import { inject, type InjectionKey, type Ref } from 'vue'

import type { MediaTransform, Size } from '@/shared/lib/mediaTransform'
import type { ClipboardOutcome } from '@/features/completed-artwork/clipboardPort'
import type { CompletedArtworkShareCopy } from '@/features/completed-artwork/sharePayload'
import type { CompletedArtworkShareOutcome } from '@/features/completed-artwork/shareOutcome'
import type { PhotoFillState } from '@/features/photo-fill/photoState'

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
    fillKind: 'initial' | 'camera' | 'photo'
  }>[]
}>

type ActiveCameraView = Readonly<{
  areaId: string
  facing: 'environment' | 'user'
  canSwitch: boolean
  sourceSize: Size
  transform: MediaTransform
  blend: number
}>

/** 製品camera UIへ公開する、外部例外本文を含まない表示状態を表す。 */
export type CameraViewState =
  | Readonly<{ phase: 'closed' }>
  | Readonly<{ phase: 'rationale'; areaId: string }>
  | Readonly<{ phase: 'requesting'; areaId: string }>
  | (ActiveCameraView & Readonly<{ phase: 'live' }>)
  | (ActiveCameraView & Readonly<{ phase: 'capturing' }>)
  | Readonly<{ phase: 'denied'; areaId: string }>
  | Readonly<{
      phase: 'unavailable'
      areaId: string
      reason:
        | 'not-found'
        | 'not-readable'
        | 'constraint-failed'
        | 'unsupported'
        | 'unknown'
    }>

/** 完成PNGの生成・表示・共有について、画面へ公開する安全な状態を表す。 */
export type CompletedArtworkViewState =
  | Readonly<{ phase: 'idle' }>
  | Readonly<{ phase: 'generating' }>
  | Readonly<{ phase: 'error' }>
  | Readonly<{
      phase: 'ready'
      objectUrl: string
      width: number
      height: number
      sharing: boolean
      shareOutcome?: CompletedArtworkShareOutcome
      copyOutcome?: ClipboardOutcome
    }>

/** 製品画面へ公開する制作開始フローの状態と操作を定義する。 */
export type CreationSessionFacade = {
  readonly appVersion: string
  readonly startState: Readonly<Ref<StartViewState>>
  readonly templateSelection: Readonly<Ref<TemplateSelectionViewState>>
  readonly activeCreation: Readonly<Ref<ActiveCreationView | null>>
  readonly cameraState: Readonly<Ref<CameraViewState>>
  readonly photoState: Readonly<Ref<PhotoFillState>>
  readonly completedArtwork: Readonly<Ref<CompletedArtworkViewState>>
  start: () => Promise<boolean>
  selectTemplate: (templateId: string) => Promise<boolean>
  retryTemplate: () => Promise<boolean>
  backToTemplateList: () => void
  returnToTemplates: () => void
  resetToStart: () => void
  reload: () => void
  attachCameraTarget: (target: HTMLVideoElement) => void
  detachCameraTarget: () => void
  openCamera: (areaId: string) => Promise<void>
  confirmCameraRationale: () => Promise<void>
  retryCamera: () => Promise<void>
  switchCamera: () => Promise<void>
  setCameraBlend: (blend: number) => void
  setCameraTransform: (transform: MediaTransform) => void
  resizeCameraPreview: (
    canvas: HTMLCanvasElement,
    cssPixels: number,
    pixelRatio: number,
  ) => Size
  renderCameraPreview: (canvas: HTMLCanvasElement) => void
  captureCamera: () => Promise<boolean>
  cancelCamera: () => void
  handleCameraVisibilityChange: () => void
  openPhoto: (areaId: string) => void
  selectPhoto: (file: File) => Promise<void>
  retryPhoto: () => void
  setPhotoBlend: (blend: number) => void
  setPhotoTransform: (transform: MediaTransform) => void
  resizePhotoPreview: (
    canvas: HTMLCanvasElement,
    cssPixels: number,
    pixelRatio: number,
  ) => Size
  renderPhotoPreview: (canvas: HTMLCanvasElement) => void
  applyPhoto: () => Promise<boolean>
  cancelPhoto: () => void
  completeArtwork: () => Promise<boolean>
  retryCompletedArtwork: () => Promise<boolean>
  shareCompletedArtwork: (copy: CompletedArtworkShareCopy) => Promise<void>
  copyCompletedArtworkShareText: (
    copy: CompletedArtworkShareCopy,
  ) => Promise<void>
  hasCompletedArtwork: () => boolean
}

export const creationSessionFacadeKey: InjectionKey<CreationSessionFacade> =
  Symbol('creation-session-facade')

/** Appから提供された制作session facadeを取得し、未提供なら構成エラーとして拒否する。 */
export const useCreationSession = (): CreationSessionFacade => {
  const facade = inject(creationSessionFacadeKey)
  if (!facade) throw new Error('制作sessionがappから提供されていません。')
  return facade
}
