<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import AreaSelector from '@/features/camera-fill/AreaSelector.vue'
import CameraFillPanel from '@/features/camera-fill/CameraFillPanel.vue'
import { useCreationSession } from '@/features/creation-session/sessionFacade'
import BackButton from '@/shared/ui/BackButton.vue'
import ScreenShell from '@/shared/ui/ScreenShell.vue'

const { locale, t } = useI18n()
const router = useRouter()
const session = useCreationSession()
const creation = computed(() => session.activeCreation.value)
const selectedAreaId = ref('')

// Sessionが切り替わった場合も、存在しない領域を選択状態に残さない。
watchEffect(() => {
  const areas = creation.value?.areas ?? []
  if (!areas.some((area) => area.id === selectedAreaId.value)) {
    selectedAreaId.value = areas[0]?.id ?? ''
  }
})

const localized = (value: { ja: string; en: string }) =>
  locale.value === 'ja' ? value.ja : value.en

const localizedAreas = computed(
  () =>
    creation.value?.areas.map((area) => ({
      ...area,
      label: localized(area.label),
    })) ?? [],
)

const backToTemplates = async () => {
  session.returnToTemplates()
  await router.push({ name: 'template-selection' })
}

const startOver = async () => {
  session.resetToStart()
  await router.push({ name: 'title' })
}

const openCamera = async () => {
  if (selectedAreaId.value) await session.openCamera(selectedAreaId.value)
}
</script>

<template>
  <template v-if="creation">
    <ScreenShell class="creation-page">
      <template #header-left>
        <BackButton :label="t('actions.templates')" @click="backToTemplates" />
      </template>

      <section
        class="creation-page__content"
        aria-labelledby="creation-heading"
      >
        <div class="creation-page__copy">
          <p class="eyebrow">{{ t('creation.eyebrow') }}</p>
          <h1 id="creation-heading">{{ localized(creation.templateName) }}</h1>
        </div>

        <img
          class="artwork-preview"
          :src="creation.previewUrl"
          :alt="
            t('creation.previewAlt', { name: localized(creation.templateName) })
          "
        />

        <section class="area-panel" :aria-label="t('creation.areas')">
          <p>{{ t('creation.chooseArea') }}</p>
          <AreaSelector
            :areas="localizedAreas"
            :selected-area-id="selectedAreaId"
            :label="t('creation.areas')"
            :captured-label="t('creation.cameraFilled')"
            @select="selectedAreaId = $event"
          />
        </section>

        <section class="fill-actions" :aria-label="t('creation.fillMethods')">
          <button class="camera-action" type="button" @click="openCamera">
            <span>{{ t('creation.cameraAction') }}</span>
            <small>{{ t('creation.cameraActionHint') }}</small>
          </button>
        </section>

        <p class="creation-page__next">{{ t('creation.nextChanges') }}</p>
        <button class="start-over" type="button" @click="startOver">
          {{ t('actions.startOver') }}
        </button>
      </section>
    </ScreenShell>
    <CameraFillPanel
      :state="session.cameraState.value"
      :attach-target="session.attachCameraTarget"
      :detach-target="session.detachCameraTarget"
      :confirm-rationale="session.confirmCameraRationale"
      :retry="session.retryCamera"
      :switch-facing="session.switchCamera"
      :set-blend="session.setCameraBlend"
      :set-transform="session.setCameraTransform"
      :resize-preview="session.resizeCameraPreview"
      :render-preview="session.renderCameraPreview"
      :capture="session.captureCamera"
      :cancel="session.cancelCamera"
      :handle-visibility-change="session.handleCameraVisibilityChange"
    />
  </template>
</template>

<style scoped>
.creation-page {
  --screen-content-max-width: 36rem;
}

.creation-page__content {
  display: grid;
  margin: 1.5rem auto 0;
}

.creation-page__copy {
  text-align: center;
}

.eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-weight: 700;
}

h1 {
  margin: 0.25rem 0 1rem;
  font-size: clamp(1.75rem, 8vw, 2.75rem);
}

.artwork-preview {
  width: min(100%, 30rem);
  aspect-ratio: 1;
  margin: 0 auto;
  object-fit: contain;
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgb(65 54 76 / 14%);
}

.area-panel {
  min-width: 0;
  margin-top: 1.25rem;
}

.area-panel > p {
  margin: 0 0 0.75rem;
  color: var(--color-muted);
  text-align: center;
}

.fill-actions {
  display: grid;
  margin-top: 1rem;
}

.camera-action {
  display: grid;
  gap: 0.2rem;
  justify-self: center;
  min-width: min(100%, 18rem);
  min-height: 3.5rem;
  padding: 0.7rem 1.25rem;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  background: var(--color-accent);
  border: 0;
  border-radius: 999px;
  box-shadow: 0 0.7rem 1.7rem rgb(86 58 78 / 22%);
}

.camera-action small {
  font-size: 0.72rem;
  font-weight: 400;
  opacity: 0.82;
}

.creation-page__next {
  margin: 1.25rem 0 0;
  color: var(--color-muted);
  text-align: center;
}

.start-over {
  min-height: 2.75rem;
  padding: 0.55rem 1rem;
  color: var(--color-muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
}

.start-over {
  justify-self: center;
  margin-top: 0.5rem;
}
</style>
