import { APP_VERSION, BUILD_ID } from '@/app/config/generatedBuildMetadata'
import { createCanvasCameraCompositor } from '@/infrastructure/camera-fill/canvasCameraCompositor'
import { createBrowserCameraPermission } from '@/infrastructure/camera/browserCameraPermission'
import {
  createBrowserCameraStream,
  toCameraFailure,
} from '@/infrastructure/camera/browserCameraStream'
import { createBrowserReleaseAdapter } from '@/infrastructure/creation-session/browserReleaseAdapter'
import { createBrowserClipboard } from '@/infrastructure/completed-artwork/browserClipboard'
import { createBrowserCompletedArtworkShare } from '@/infrastructure/completed-artwork/browserCompletedArtworkShare'
import { createCanvasCompletedArtworkGenerator } from '@/infrastructure/completed-artwork/canvasCompletedArtworkGenerator'
import { createBrowserTemplateAssetLoader } from '@/infrastructure/template-selection/browserTemplateAssetLoader'
import { createCanvasArtworkPreview } from '@/infrastructure/template-selection/canvasArtworkPreview'
import { createDevelopmentTemplateCatalogAdapter } from '@/infrastructure/template-selection/developmentTemplateCatalogAdapter'

import { createCreationSessionAppService } from './createCreationSessionAppService'

const frontend = { appVersion: APP_VERSION, buildId: BUILD_ID }

/** Browser用adapterを結線し、tab内で共有する単一の制作sessionサービスを提供する。 */
export const creationSessionAppService = createCreationSessionAppService({
  frontend,
  releasePort: createBrowserReleaseAdapter(),
  catalogPort: createDevelopmentTemplateCatalogAdapter(frontend),
  assetLoader: createBrowserTemplateAssetLoader(),
  previewPort: createCanvasArtworkPreview(),
  cameraPort: createBrowserCameraStream(),
  cameraPermission: createBrowserCameraPermission(),
  cameraCompositor: createCanvasCameraCompositor(),
  completedArtworkGenerator: createCanvasCompletedArtworkGenerator(),
  completedArtworkShare: createBrowserCompletedArtworkShare(),
  clipboard: createBrowserClipboard(),
  mapCameraFailure: toCameraFailure,
  isDocumentHidden: () => document.visibilityState === 'hidden',
  now: () => new Date(),
  reloadPage: () => window.location.reload(),
})
