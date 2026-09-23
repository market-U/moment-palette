/** 完成画像とともにOS共有シートへ渡す固定文面を表す。 */
export type CompletedArtworkShareCopy = Readonly<{
  message: string
  hashtag: string
  url: string
}>

/** Web Shareへ渡す、生成済みFileと同期的に組み立てたデータを表す。 */
export type PreparedCompletedArtworkShare = Readonly<{
  file: File
  data: ShareData
}>

/** 固定文、ハッシュタグ、タイトルURLを共有先が扱える一つのtextへまとめる。 */
export const createCompletedArtworkShareText = (
  copy: CompletedArtworkShareCopy,
): string => `${copy.message}\n${copy.hashtag}\n${copy.url}`

/** PNG bytesと拡張子を保った互換Fileを、共有クリック時に同期的に準備する。 */
export const prepareCompletedArtworkShare = (
  blob: Blob,
  copy: CompletedArtworkShareCopy,
): PreparedCompletedArtworkShare => {
  const file = new File([blob], 'moment-palette.png', { type: 'text/plain' })
  return {
    file,
    data: {
      files: [file],
      text: createCompletedArtworkShareText(copy),
    },
  }
}
