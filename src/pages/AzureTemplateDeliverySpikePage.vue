<script setup lang="ts">
import AzureTemplateDeliverySpike from '@/features/azure-template-delivery-spike/AzureTemplateDeliverySpike.vue'
import type { TemplateAssetLoaderPort } from '@/features/azure-template-delivery-spike/assetLoaderPort'
import type { TemplateCompositorPort } from '@/features/azure-template-delivery-spike/compositorPort'
import type { TemplateImageSharePort } from '@/features/azure-template-delivery-spike/imageSharePort'
import type { ReleasePort } from '@/features/azure-template-delivery-spike/releasePort'
import type { RequestDiagnostics } from '@/features/azure-template-delivery-spike/requestDiagnostics'
import type { TemplateCatalogPort } from '@/features/azure-template-delivery-spike/templateCatalogPort'

defineProps<{
  catalogPort: TemplateCatalogPort
  releasePort: ReleasePort
  assetLoader: TemplateAssetLoaderPort
  compositor: TemplateCompositorPort
  sharePort: TemplateImageSharePort
  diagnostics: RequestDiagnostics
}>()
</script>

<template>
  <main class="azure-template-delivery-page">
    <AzureTemplateDeliverySpike v-bind="$props" />
  </main>
</template>

<style scoped>
.azure-template-delivery-page {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
