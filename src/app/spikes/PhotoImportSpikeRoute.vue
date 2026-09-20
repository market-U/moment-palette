<script setup lang="ts">
import { createCanvasPhotoCompositor } from '@/infrastructure/photo-import/canvasPhotoCompositor'
import { createBrowserPhotoDecoder } from '@/infrastructure/photo-import/browserPhotoDecoder'
import PhotoImportSpikePage from '@/pages/PhotoImportSpikePage.vue'

const decoderFactory = () => createBrowserPhotoDecoder()
const compositorFactory = createCanvasPhotoCompositor
</script>

<template>
  <PhotoImportSpikePage
    :decoder-factory="decoderFactory"
    :compositor-factory="compositorFactory"
  />
</template>
