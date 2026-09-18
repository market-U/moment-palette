export type SupportedLocale = 'ja' | 'en'

export const selectInitialLocale = (
  preferredLanguage: string,
): SupportedLocale => {
  const normalizedLanguage = preferredLanguage.toLowerCase()

  return normalizedLanguage === 'ja' || normalizedLanguage.startsWith('ja-')
    ? 'ja'
    : 'en'
}
