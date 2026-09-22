import { createApp, watch } from 'vue'

import App from '@/app/App.vue'
import { creationSessionAppService } from '@/app/creationSessionAppService'
import { createAppI18n } from '@/app/i18n'
import { router } from '@/app/router'
import { creationSessionFacadeKey } from '@/features/creation-session/sessionFacade'
import '@/app/styles.css'

const app = createApp(App)
const i18n = createAppI18n(navigator.language)

watch(
  i18n.global.locale,
  (locale) => {
    document.documentElement.lang = locale
  },
  { immediate: true },
)

app.use(router)
app.use(i18n)
app.provide(creationSessionFacadeKey, creationSessionAppService)

// Browserがpageを破棄または履歴へ退避するとき、tab内だけの画像resourceを解放する。
window.addEventListener('pagehide', () => creationSessionAppService.dispose())
app.mount('#app')
