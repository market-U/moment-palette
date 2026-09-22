<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { RouterView } from 'vue-router'

import { creationSessionAppService } from '@/app/creationSessionAppService'

// Appのunmount時にも同じ冪等な終了処理を通し、開発時の再mountでもresourceを残さない。
onBeforeUnmount(() => creationSessionAppService.dispose())
</script>

<template>
  <RouterView />
</template>
