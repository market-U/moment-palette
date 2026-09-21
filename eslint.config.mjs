import eslintConfigPrettier from 'eslint-config-prettier/flat'
import pluginVue from 'eslint-plugin-vue'
import { vueTsConfigs, withVueTs } from '@vue/eslint-config-typescript'

export default withVueTs(
  {
    ignores: ['dist/**', 'api/dist/**', 'coverage/**'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  eslintConfigPrettier,
)
