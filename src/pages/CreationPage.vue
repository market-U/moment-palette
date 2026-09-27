<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  onBeforeRouteLeave,
  useRouter,
  type RouteLocationRaw,
} from 'vue-router'

import AreaSelector from '@/features/camera-fill/AreaSelector.vue'
import CameraFillPanel from '@/features/camera-fill/CameraFillPanel.vue'
import ArtworkAreaHighlight from '@/features/creation-session/ArtworkAreaHighlight.vue'
import PhotoFillPanel from '@/features/photo-fill/PhotoFillPanel.vue'
import SolidColorFillPanel from '@/features/solid-color-fill/SolidColorFillPanel.vue'
import { useCreationSession } from '@/features/creation-session/sessionFacade'
import BackButton from '@/shared/ui/BackButton.vue'
import ScreenShell from '@/shared/ui/ScreenShell.vue'

const { locale, t } = useI18n()
const router = useRouter()
const session = useCreationSession()
const creation = computed(() => session.activeCreation.value)
const selectedAreaId = ref('')
const showDiscardConfirmation = ref(false)
const pendingDestination = ref<RouteLocationRaw>()
let discardConfirmed = false

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

const requestTemplateBack = async () =>
  router.push({ name: 'template-selection' })

const startOver = async () => router.push({ name: 'title' })

onBeforeRouteLeave((to) => {
  if (
    discardConfirmed ||
    to.name === 'creation' ||
    to.name === 'completed-artwork'
  ) {
    discardConfirmed = false
    return true
  }
  pendingDestination.value = to.fullPath
  showDiscardConfirmation.value = true
  return false
})

const cancelDiscard = () => {
  pendingDestination.value = undefined
  showDiscardConfirmation.value = false
}

const confirmDiscard = async () => {
  const destination = pendingDestination.value
  if (!destination) return
  discardConfirmed = true
  showDiscardConfirmation.value = false
  pendingDestination.value = undefined
  await router.push(destination)
}

const openCamera = async () => {
  if (selectedAreaId.value) await session.openCamera(selectedAreaId.value)
}

const openPhoto = () => {
  if (selectedAreaId.value) session.openPhoto(selectedAreaId.value)
}

const openSolidColor = () => {
  if (selectedAreaId.value) session.openSolidColor(selectedAreaId.value)
}

const completeArtwork = async () => {
  if (await session.completeArtwork()) {
    await router.push({ name: 'completed-artwork' })
  }
}
</script>

<template>
  <template v-if="creation">
    <ScreenShell class="creation-page">
      <template #header-left>
        <BackButton
          :label="t('actions.templates')"
          :hideLabel="true"
          @click="requestTemplateBack"
        />
      </template>

      <section
        class="creation-page__content"
        aria-labelledby="creation-heading"
      >
        <div v-show="false" class="creation-page__copy">
          <p class="eyebrow">{{ t('creation.eyebrow') }}</p>
          <h1 id="creation-heading">{{ localized(creation.templateName) }}</h1>
        </div>

        <ArtworkAreaHighlight
          :src="creation.previewUrl"
          :alt="
            t('creation.previewAlt', { name: localized(creation.templateName) })
          "
          :selected-area-id="selectedAreaId"
          :resize="session.resizeAreaFeedback"
          :render="session.renderAreaHighlight"
          :render-line-art="session.renderLineArtOverlay"
        />

        <section class="area-panel" :aria-label="t('creation.areas')">
          <p>{{ t('creation.chooseArea') }}</p>
          <AreaSelector
            :areas="localizedAreas"
            :selected-area-id="selectedAreaId"
            :label="t('creation.areas')"
            :render-thumbnail="session.renderAreaThumbnail"
            @select="selectedAreaId = $event"
          />
        </section>

        <section class="fill-actions" :aria-label="t('creation.fillMethods')">
          <button class="camera-action" type="button" @click="openCamera">
            <span>{{ t('creation.cameraAction') }}</span>
            <small>{{ t('creation.cameraActionHint') }}</small>
          </button>
          <button
            class="camera-action photo-action"
            type="button"
            @click="openPhoto"
          >
            <span>{{ t('creation.photoAction') }}</span>
            <small>{{ t('creation.photoActionHint') }}</small>
          </button>
          <button
            class="camera-action solid-color-action"
            type="button"
            @click="openSolidColor"
          >
            <span>{{ t('creation.solidColorAction') }}</span>
            <small>{{ t('creation.solidColorActionHint') }}</small>
          </button>
        </section>

        <p
          v-if="session.completedArtwork.value.phase === 'generating'"
          class="creation-page__status"
          role="status"
        >
          {{ t('creation.completing') }}
        </p>
        <p
          v-else-if="session.completedArtwork.value.phase === 'error'"
          class="creation-page__error"
          role="alert"
        >
          {{ t('creation.completeFailed') }}
        </p>
        <button
          class="complete-action"
          type="button"
          :disabled="session.completedArtwork.value.phase === 'generating'"
          @click="completeArtwork"
        >
          {{ t('creation.complete') }}
        </button>

        <button class="start-over" type="button" @click="startOver">
          {{ t('actions.startOver') }}
        </button>
      </section>
    </ScreenShell>
    <section
      v-if="showDiscardConfirmation"
      class="discard-confirmation"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discard-heading"
    >
      <div class="discard-confirmation__panel">
        <h2 id="discard-heading">{{ t('creation.discardHeading') }}</h2>
        <p>{{ t('creation.discardDescription') }}</p>
        <div class="discard-confirmation__actions">
          <button type="button" @click="cancelDiscard">
            {{ t('creation.discardCancel') }}
          </button>
          <button type="button" @click="confirmDiscard">
            {{ t('creation.discardConfirm') }}
          </button>
        </div>
      </div>
    </section>
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
    <PhotoFillPanel
      :state="session.photoState.value"
      :select="session.selectPhoto"
      :retry="session.retryPhoto"
      :set-blend="session.setPhotoBlend"
      :set-transform="session.setPhotoTransform"
      :resize-preview="session.resizePhotoPreview"
      :render-preview="session.renderPhotoPreview"
      :apply="session.applyPhoto"
      :cancel="session.cancelPhoto"
    />
    <SolidColorFillPanel
      :state="session.solidColorState.value"
      :set-color="session.setSolidColor"
      :resize-preview="session.resizeSolidColorPreview"
      :render-preview="session.renderSolidColorPreview"
      :apply="session.applySolidColor"
      :cancel="session.cancelSolidColor"
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

.solid-color-action {
  margin-top: 0.65rem;
  background: #805d85;
}

.complete-action {
  justify-self: center;
  min-width: min(100%, 18rem);
  min-height: 3.5rem;
  margin-top: 1rem;
  padding: 0.7rem 1.25rem;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  background: var(--color-ink);
  border: 0;
  border-radius: 999px;
}

.complete-action:disabled {
  cursor: wait;
  opacity: 0.65;
}

.creation-page__status,
.creation-page__error {
  margin: 1rem 0 0;
  text-align: center;
}

.creation-page__error {
  color: #a13d5b;
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

.discard-confirmation {
  position: fixed;
  z-index: 10;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgb(35 25 42 / 48%);
}

.discard-confirmation__panel {
  width: min(100%, 25rem);
  padding: 1.5rem;
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 1rem 3rem rgb(35 25 42 / 28%);
}

.discard-confirmation__panel h2,
.discard-confirmation__panel p {
  margin-top: 0;
}

.discard-confirmation__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.discard-confirmation__actions button {
  min-height: 2.75rem;
  padding: 0.55rem 1rem;
  font: inherit;
  cursor: pointer;
  background: #fff;
  border: 1px solid rgb(54 45 59 / 18%);
  border-radius: 999px;
}

.discard-confirmation__actions button:last-child {
  color: #fff;
  background: #a13d5b;
  border-color: #a13d5b;
}
</style>
