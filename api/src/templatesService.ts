import { selectPublishedTemplates } from './catalog'
import type { CatalogReader } from './catalogReader'
import type { ServiceSasSigner } from './serviceSasSigner'
import type {
  CatalogAsset,
  CatalogMask,
  SignedAsset,
  SignedMask,
  TemplatesResponse,
} from './types'

type TemplatesServiceDependencies = {
  catalogReader: CatalogReader
  sasSigner: ServiceSasSigner
  now: () => Date
  apiVersion: string
  buildId: string
}

const signAsset = (
  asset: CatalogAsset,
  expiresOn: Date,
  signer: ServiceSasSigner,
): SignedAsset => ({
  mimeType: asset.mimeType,
  url: signer.signReadUrl(asset.path, expiresOn),
})

const signMask = (
  mask: CatalogMask,
  expiresOn: Date,
  signer: ServiceSasSigner,
): SignedMask => ({
  id: mask.id,
  label: mask.label,
  initialColor: mask.initialColor,
  mimeType: mask.mimeType,
  url: signer.signReadUrl(mask.path, expiresOn),
})

/** 検証済みcatalogから公開中templateのAPI responseを組み立てるサービスを生成する。 */
export const createTemplatesService = (
  dependencies: TemplatesServiceDependencies,
) => ({
  async execute(): Promise<TemplatesResponse> {
    const now = dependencies.now()
    const catalog = await dependencies.catalogReader.read()
    const { templates } = selectPublishedTemplates(catalog, now)
    const expiresOn = new Date(now.getTime() + 60 * 60 * 1000)

    return {
      schemaVersion: 1,
      apiVersion: dependencies.apiVersion,
      buildId: dependencies.buildId,
      serverTime: now.toISOString(),
      catalogRevision: catalog.catalogRevision,
      sasExpiresAt: expiresOn.toISOString(),
      // 非公開templateの表示情報や内部pathはresponseへ写さない。
      templates: templates.map((template) => ({
        id: template.id,
        assetRevision: template.assetRevision,
        name: template.name,
        tags: template.tags,
        thumbnail: signAsset(
          template.thumbnail,
          expiresOn,
          dependencies.sasSigner,
        ),
        lineArt: signAsset(template.lineArt, expiresOn, dependencies.sasSigner),
        masks: template.masks.map((mask) => ({
          ...signMask(mask, expiresOn, dependencies.sasSigner),
          initialColor: mask.initialColor,
        })),
      })),
    }
  },
})
