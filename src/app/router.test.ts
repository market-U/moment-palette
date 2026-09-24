import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', async (importOriginal) => {
  const vueRouter = await importOriginal<typeof import('vue-router')>()

  return {
    ...vueRouter,
    createWebHistory: vueRouter.createMemoryHistory,
  }
})

let router: typeof import('./router').router

describe('router', () => {
  beforeAll(async () => {
    vi.stubGlobal('createImageBitmap', vi.fn())
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({})),
    })
    const routerModule = await import('./router')

    router = routerModule.router
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('制作開始後に必要な製品画面を遅延chunkに分割しない', () => {
    const productRouteNames = [
      'template-selection',
      'creation',
      'completed-artwork',
    ]

    for (const routeName of productRouteNames) {
      const component = router
        .getRoutes()
        .find((route) => route.name === routeName)?.components?.default

      expect(component).toBeDefined()
      expect(typeof component).not.toBe('function')
    }
  })
})
