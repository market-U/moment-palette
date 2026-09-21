import type { ReleasePort } from './releasePort'
import type {
  TemplateAssetLoaderPort,
  LoadedTemplateAssets,
} from './assetLoaderPort'
import type {
  AvailableTemplate,
  BuildIdentity,
  SessionSnapshot,
  TemplateCatalogResponse,
} from './types'
import { compareBuildIdentity } from './versionCompatibility'

export class ReloadRequiredError extends Error {
  constructor(
    readonly reason: 'missing' | 'version-mismatch' | 'build-mismatch',
  ) {
    super('配信内容が更新されています。')
    this.name = 'ReloadRequiredError'
  }
}

export type TemplateSession = {
  snapshot: SessionSnapshot
  template: AvailableTemplate
  assets: LoadedTemplateAssets
  release: () => void
}

type StartSessionDependencies = {
  frontend: BuildIdentity
  releasePort: ReleasePort
  assetLoader: TemplateAssetLoaderPort
  now: () => Date
}

export const startTemplateSession = async (
  catalog: TemplateCatalogResponse,
  template: AvailableTemplate,
  dependencies: StartSessionDependencies,
): Promise<TemplateSession> => {
  const release = await dependencies.releasePort.loadCurrent()
  const compatibility = compareBuildIdentity(
    dependencies.frontend,
    catalog,
    release,
  )
  if (!compatibility.compatible)
    throw new ReloadRequiredError(compatibility.reason)

  // 全assetのdecodeに成功するまでsessionを公開しないため、部分的な制作状態を残さない。
  const assets = await dependencies.assetLoader.load(template)
  let released = false
  return {
    snapshot: {
      ...dependencies.frontend,
      catalogRevision: catalog.catalogRevision,
      templateRevision: template.assetRevision,
      startedAt: dependencies.now().toISOString(),
    },
    template,
    assets,
    release() {
      if (released) return
      released = true
      assets.release()
    },
  }
}

export class TemplateSessionOwner {
  #current: TemplateSession | null = null

  get current(): TemplateSession | null {
    return this.#current
  }

  replace(next: TemplateSession): void {
    if (this.#current === next) return
    this.#current?.release()
    this.#current = next
  }

  clear(): void {
    this.#current?.release()
    this.#current = null
  }
}
