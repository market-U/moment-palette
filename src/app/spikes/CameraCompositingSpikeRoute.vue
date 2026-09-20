<script setup lang="ts">
import { cameraSpikeTemplate } from '@/features/camera-compositing-spike/template'
import {
  createBrowserCameraStream,
  toCameraFailure,
} from '@/infrastructure/camera/browserCameraStream'
import { createCanvasCameraCompositor } from '@/infrastructure/camera-compositing/canvasCameraCompositor'
import CameraCompositingSpikePage from '@/pages/CameraCompositingSpikePage.vue'

const cameraFactory = () => createBrowserCameraStream()
const compositorFactory = () =>
  createCanvasCameraCompositor(cameraSpikeTemplate)
</script>

<template>
  <CameraCompositingSpikePage
    :camera-factory="cameraFactory"
    :compositor-factory="compositorFactory"
    :failure-mapper="toCameraFailure"
  />
</template>
