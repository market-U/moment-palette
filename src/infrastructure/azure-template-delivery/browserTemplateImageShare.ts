import type {
  TemplateImageShareOutcome,
  TemplateImageSharePort,
} from '@/features/azure-template-delivery-spike/imageSharePort'

const shareText =
  'Moment Palette Azureテンプレート配信F/Sで生成した画像です。\n#MomentPalette\nhttps://icy-mushroom-0c0e42e00.5.azurestaticapps.net/'

export const createBrowserTemplateImageShare = (
  navigatorApi: Pick<Navigator, 'canShare' | 'share'> = navigator,
): TemplateImageSharePort => {
  const prepare = (blob: Blob) =>
    new File([blob], 'moment-palette-azure-template-fs.png', {
      // 複数の既存アプリでAndroidの画像・文同時共有に使用している実証済み方式。
      type: 'text/plain',
    })

  return {
    canShare(blob) {
      if (!navigatorApi.share || !navigatorApi.canShare) return false
      try {
        return navigatorApi.canShare({ files: [prepare(blob)] })
      } catch {
        return false
      }
    },
    async share(blob): Promise<TemplateImageShareOutcome> {
      if (!navigatorApi.share || !navigatorApi.canShare) return 'unsupported'
      const file = prepare(blob)
      if (!navigatorApi.canShare({ files: [file] })) return 'unsupported'
      try {
        await navigatorApi.share({ files: [file], text: shareText })
        return 'handed-off'
      } catch (error) {
        return error instanceof DOMException && error.name === 'AbortError'
          ? 'cancelled'
          : 'failed'
      }
    },
  }
}
