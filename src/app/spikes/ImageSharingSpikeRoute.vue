<script setup lang="ts">
import { createBrowserClipboard } from '@/infrastructure/image-sharing/browserClipboard'
import { createBrowserImageShare } from '@/infrastructure/image-sharing/browserImageShare'
import { createCanvasCompletedImageGenerator } from '@/infrastructure/image-sharing/canvasCompletedImageGenerator'
import ImageSharingSpikePage from '@/pages/ImageSharingSpikePage.vue'

// composition rootだけがブラウザ実装を知り、F/S featureはportへ依存する。
const generator = createCanvasCompletedImageGenerator()
const sharePort = createBrowserImageShare()
const clipboardPort = createBrowserClipboard()
</script>

<template>
  <ImageSharingSpikePage
    :generator="generator"
    :share-port="sharePort"
    :clipboard-port="clipboardPort"
  />
</template>
