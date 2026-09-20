import { createRouter, createWebHistory } from 'vue-router'

import TitlePage from '@/pages/TitlePage.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'title',
      component: TitlePage,
    },
    {
      path: '/spikes/camera-compositing',
      name: 'camera-compositing-spike',
      component: () => import('./spikes/CameraCompositingSpikeRoute.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'title' },
    },
  ],
})
