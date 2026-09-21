export type ShareMode = 'compatibility' | 'standard' | 'image-only'

export interface ShareFixtureCopy {
  filename: string
  message: string
  hashtag: string
  url: string
}

export interface ImageShareData {
  files: File[]
  text?: string
}

export interface PreparedImageShare {
  mode: ShareMode
  file: File
  data: ImageShareData
}

export const shareFixtureCopy: ShareFixtureCopy = {
  filename: 'moment-palette-share-fs.png',
  message: 'Moment Palette 共有F/Sで生成した画像です。',
  hashtag: '#MomentPalette',
  url: 'https://icy-mushroom-0c0e42e00.5.azurestaticapps.net/',
}

export const createShareText = (copy: ShareFixtureCopy) =>
  `${copy.message}\n${copy.hashtag}\n${copy.url}`

export const getShareFileType = (mode: ShareMode) =>
  mode === 'compatibility' ? 'text/plain' : 'image/png'

/**
 * Androidで画像と文を同時に渡す既存方式をそのまま比較できるよう、
 * compatibilityだけMIME typeを変え、PNG bytesと拡張子は変更しない。
 */
export const prepareImageShare = (
  blob: Blob,
  mode: ShareMode,
  copy: ShareFixtureCopy = shareFixtureCopy,
): PreparedImageShare => {
  const file = new File([blob], copy.filename, {
    type: getShareFileType(mode),
  })
  const data: ImageShareData = { files: [file] }

  if (mode !== 'image-only') {
    // 既存アプリと同じく文・タグ・URLを一つのtextへまとめ、OS側のURL項目差を避ける。
    data.text = createShareText(copy)
  }

  return { mode, file, data }
}
