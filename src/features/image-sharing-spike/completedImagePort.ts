export interface CompletedImageResource {
  blob: Blob
  objectUrl: string
  width: number
  height: number
  bytes: number
  generationId: number
  generationMs: number
  dispose(): void
}

export interface CompletedImageGeneratorPort {
  generate(generationId: number): Promise<CompletedImageResource>
}

export type CompletedImageGeneratorFactory = () => CompletedImageGeneratorPort
