<script setup lang="ts">
import CameraCompositingSpike from '@/features/camera-compositing-spike/CameraCompositingSpike.vue'
import type {
  CameraFailure,
  CameraStreamFactory,
} from '@/features/camera-compositing-spike/cameraPort'
import type { CameraCompositorFactory } from '@/features/camera-compositing-spike/compositorPort'

defineProps<{
  cameraFactory: CameraStreamFactory
  compositorFactory: CameraCompositorFactory
  failureMapper: (error: unknown) => CameraFailure
}>()
</script>

<template>
  <main class="camera-compositing-spike-page">
    <CameraCompositingSpike
      :camera-factory="cameraFactory"
      :compositor-factory="compositorFactory"
      :failure-mapper="failureMapper"
    />
  </main>
</template>

<style scoped>
.camera-compositing-spike-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
