export type TemplateImageShareOutcome =
  'handed-off' | 'cancelled' | 'unsupported' | 'failed'

export type TemplateImageSharePort = {
  canShare: (blob: Blob) => boolean
  share: (blob: Blob) => Promise<TemplateImageShareOutcome>
}
