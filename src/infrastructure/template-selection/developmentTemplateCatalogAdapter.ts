import type { BuildIdentity } from '@/features/creation-session/buildIdentity'
import { parseTemplateCatalog } from '@/features/template-selection/catalog'
import type { TemplateCatalogPort } from '@/features/template-selection/templateCatalogPort'

const assetRoot = '/spikes/camera-compositing'

/** 開発用fixtureを本番と同じschema検証へ通して返すcatalog adapterを生成する。 */
export const createDevelopmentTemplateCatalogAdapter = (
  identity: BuildIdentity,
  now: () => Date = () => new Date(),
): TemplateCatalogPort => ({
  async loadAvailable() {
    const current = now()
    return parseTemplateCatalog({
      schemaVersion: 1,
      apiVersion: identity.appVersion,
      buildId: identity.buildId,
      serverTime: current.toISOString(),
      catalogRevision: 'development-catalog-r1',
      sasExpiresAt: new Date(current.getTime() + 60 * 60 * 1000).toISOString(),
      templates: [
        {
          id: 'buncho-01',
          assetRevision: 'r1',
          name: { ja: '文鳥', en: 'Java sparrow' },
          tags: ['bird'],
          thumbnail: {
            mimeType: 'image/png',
            url: `${assetRoot}/line-art.png`,
          },
          lineArt: {
            mimeType: 'image/png',
            url: `${assetRoot}/line-art.png`,
          },
          masks: [
            {
              id: 'background',
              label: { ja: '背景', en: 'Background' },
              initialColor: '#F3E8DC',
              mimeType: 'image/png',
              url: `${assetRoot}/background-mask.png`,
            },
            {
              id: 'body',
              label: { ja: 'ボディ', en: 'Body' },
              initialColor: '#E8DED2',
              mimeType: 'image/png',
              url: `${assetRoot}/body-mask.png`,
            },
            {
              id: 'beak',
              label: { ja: 'くちばし', en: 'Beak' },
              initialColor: '#EFB16F',
              mimeType: 'image/png',
              url: `${assetRoot}/beak-mask.png`,
            },
            {
              id: 'mouth',
              label: { ja: '口の中', en: 'Mouth' },
              initialColor: '#C9787F',
              mimeType: 'image/png',
              url: `${assetRoot}/mouth-mask.png`,
            },
          ],
        },
      ],
    })
  },
})
