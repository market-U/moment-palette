<script setup lang="ts">
import PhotoImportSpike from '@/features/photo-import-spike/PhotoImportSpike.vue'
import type { PhotoCompositorFactory } from '@/features/photo-import-spike/photoCompositorPort'
import type { PhotoDecoderFactory } from '@/features/photo-import-spike/photoDecoderPort'

defineProps<{
  decoderFactory: PhotoDecoderFactory
  compositorFactory: PhotoCompositorFactory
}>()
</script>

<template>
  <main class="photo-import-spike-page">
    <PhotoImportSpike
      :decoder-factory="decoderFactory"
      :compositor-factory="compositorFactory"
    />
  </main>
</template>

<style scoped>
.photo-import-spike-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
