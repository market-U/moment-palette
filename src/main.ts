import { createApp, watch } from 'vue'

import App from '@/app/App.vue'
import { createAppI18n } from '@/app/i18n'
import { router } from '@/app/router'
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
app.mount('#app')
