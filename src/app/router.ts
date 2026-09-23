import { createRouter, createWebHistory } from 'vue-router'

import { creationSessionAppService } from '@/app/creationSessionAppService'
import TitlePage from '@/pages/TitlePage.vue'

/** 製品画面と残存する技術F/S画面のroute、および制作状態に基づく遷移境界を提供する。 */
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'title',
      component: TitlePage,
    },
    {
      path: '/templates',
      name: 'template-selection',
      component: () => import('@/pages/TemplateSelectionPage.vue'),
      meta: { requiresCatalog: true },
    },
    {
      path: '/create',
      name: 'creation',
      component: () => import('@/pages/CreationPage.vue'),
      meta: { requiresSession: true },
    },
    {
      path: '/complete',
      name: 'completed-artwork',
      component: () => import('@/pages/CompletedArtworkPage.vue'),
      meta: { requiresSession: true, requiresCompletedArtwork: true },
    },
    {
      path: '/spikes/photo-import',
      name: 'photo-import-spike',
      component: () => import('./spikes/PhotoImportSpikeRoute.vue'),
    },
    {
      path: '/spikes/azure-template-delivery',
      name: 'azure-template-delivery-spike',
      component: () => import('./spikes/AzureTemplateDeliverySpikeRoute.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'title' },
    },
  ],
})

router.beforeEach((to, from) => {
  // Snapshotやsessionは永続化しないため、直接URLや再読み込みではタイトルへ戻す。
  if (to.meta.requiresCatalog && !creationSessionAppService.hasCatalog()) {
    return { name: 'title' }
  }
  if (
    to.meta.requiresSession &&
    !creationSessionAppService.hasActiveSession()
  ) {
    return { name: 'title' }
  }
  if (
    to.meta.requiresCompletedArtwork &&
    !creationSessionAppService.hasCompletedArtwork()
  ) {
    return { name: 'creation' }
  }

  // 制作画面を離れる経路に応じて、sessionだけ、または開始状態全体を破棄する。
  if (
    (from.name === 'creation' || from.name === 'completed-artwork') &&
    to.name !== 'creation' &&
    to.name !== 'completed-artwork'
  ) {
    if (to.name === 'template-selection') {
      creationSessionAppService.returnToTemplates()
    } else {
      creationSessionAppService.resetToStart()
    }
  } else if (
    from.name === 'template-selection' &&
    to.name !== 'template-selection' &&
    to.name !== 'creation'
  ) {
    creationSessionAppService.resetToStart()
  }
  return true
})
