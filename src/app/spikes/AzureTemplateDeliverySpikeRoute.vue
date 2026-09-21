<script setup lang="ts">
import { RequestDiagnostics } from '@/features/azure-template-delivery-spike/requestDiagnostics'
import { createBrowserReleaseAdapter } from '@/infrastructure/azure-template-delivery/browserReleaseAdapter'
import { createBrowserTemplateAssetLoader } from '@/infrastructure/azure-template-delivery/browserTemplateAssetLoader'
import { createBrowserTemplateCatalogAdapter } from '@/infrastructure/azure-template-delivery/browserTemplateCatalogAdapter'
import { createBrowserTemplateImageShare } from '@/infrastructure/azure-template-delivery/browserTemplateImageShare'
import { createCanvasTemplateCompositor } from '@/infrastructure/azure-template-delivery/canvasTemplateCompositor'
import AzureTemplateDeliverySpikePage from '@/pages/AzureTemplateDeliverySpikePage.vue'

// route読込時の静的importで、Start後に必要な生成・共有moduleをすべて取得済みにする。
const diagnostics = new RequestDiagnostics()
const catalogPort = createBrowserTemplateCatalogAdapter(fetch, diagnostics)
const releasePort = createBrowserReleaseAdapter(fetch, diagnostics)
const assetLoader = createBrowserTemplateAssetLoader(
  fetch,
  createImageBitmap,
  diagnostics,
)
const compositor = createCanvasTemplateCompositor()
const sharePort = createBrowserTemplateImageShare()
</script>

<template>
  <AzureTemplateDeliverySpikePage
    :catalog-port="catalogPort"
    :release-port="releasePort"
    :asset-loader="assetLoader"
    :compositor="compositor"
    :share-port="sharePort"
    :diagnostics="diagnostics"
  />
</template>
