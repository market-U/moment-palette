import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('./CreationPage.vue', import.meta.url),
  'utf8',
)

describe('CreationPage', () => {
  it('pageが破棄前の確認を通してから遷移し、言語切替を置かない', () => {
    expect(source).toContain(
      `<BackButton
          :label="t('actions.templates')"
          :hideLabel="true"
          @click="requestTemplateBack"
        />`,
    )
    expect(source).toContain('onBeforeRouteLeave((to) =>')
    expect(source).toContain('showDiscardConfirmation.value = true')
    expect(source).toContain('await router.push(destination)')
    expect(source).toContain('role="dialog"')
    expect(source).not.toContain('LanguageSwitcher')
    expect(source).toContain('session.completeArtwork()')
    expect(source).toContain("router.push({ name: 'completed-artwork' })")
    expect(source).toContain('session.openSolidColor(selectedAreaId.value)')
    expect(source).toContain('<SolidColorFillPanel')
    expect(source).toContain(':state="session.solidColorState.value"')
    expect(source).toContain('<ArtworkAreaHighlight')
    expect(source).toContain(':render-thumbnail="session.renderAreaThumbnail"')
  })
})
