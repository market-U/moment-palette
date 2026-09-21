<script setup lang="ts">
import type { ClipboardPort } from '@/features/image-sharing-spike/clipboardPort'
import type { CompletedImageGeneratorPort } from '@/features/image-sharing-spike/completedImagePort'
import ImageSharingSpike from '@/features/image-sharing-spike/ImageSharingSpike.vue'
import type { ImageSharePort } from '@/features/image-sharing-spike/sharePort'

defineProps<{
  generator: CompletedImageGeneratorPort
  sharePort: ImageSharePort
  clipboardPort: ClipboardPort
}>()
</script>

<template>
  <main class="image-sharing-spike-page">
    <ImageSharingSpike
      :generator="generator"
      :share-port="sharePort"
      :clipboard-port="clipboardPort"
    />
  </main>
</template>

<style scoped>
.image-sharing-spike-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
