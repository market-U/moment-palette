export const en = {
  title: {
    name: 'Moment Palette',
    start: 'Start',
    checking: 'Checking what you need…',
    reloadRequired: 'A new version is available. Reload before starting.',
    startFailed: 'We could not get ready. Check your connection and try again.',
    language: {
      label: 'Language',
      ja: '日本語',
      en: 'English',
    },
  },
  actions: {
    back: 'Back',
    retry: 'Try again',
    reload: 'Reload',
    checkAgain: 'Check again',
    backToList: 'Back to list',
    startOver: 'Start over',
    templates: 'Templates',
  },
  templates: {
    heading: 'Choose a template',
    lead: 'Pick the picture that fits today.',
    empty: 'No templates are available right now.',
    preparing: 'Preparing your artwork…',
    loadFailed:
      'We could not load this template. Partially loaded data was safely released.',
  },
  creation: {
    eyebrow: 'Start creating',
    previewAlt: 'Initial artwork for {name}',
    areas: 'Artwork areas',
    chooseArea: 'Choose an area to color',
    cameraFilled: 'Captured',
    fillMethods: 'Fill methods',
    cameraAction: 'Capture the view',
    cameraActionHint: 'Take a photo with the camera',
    complete: 'Finish artwork',
    completing: 'Creating your finished image…',
    completeFailed:
      'We could not create the finished image. Try again or keep creating.',
    nextChanges:
      'Photo and solid-color fills will be added in the next changes.',
  },
  completed: {
    eyebrow: 'Finished',
    heading: 'Your Moment Palette',
    imageAlt: 'Finished Moment Palette artwork',
    longPress: 'Press and hold the image to save it.',
    share: 'Share',
    sharing: 'Opening the share sheet…',
    shared:
      'The image was handed off to your device or chosen destination. Confirm posting or saving there.',
    cancelled: 'Sharing was cancelled. You can try again with the same image.',
    unsupported:
      'Image sharing is unavailable here. Save by pressing and holding the image, or copy the share text.',
    failed:
      'We could not start sharing. Try again or press and hold the image to save it.',
    shareText: 'Share text',
    copyText: 'Copy share text',
    copied: 'Share text copied.',
    copyFallback: 'Select the share text below and copy it manually.',
    backToCreation: 'Back to artwork',
    startOver: 'Start over',
  },
  camera: {
    eyebrow: 'Capture the view',
    heading: 'Camera',
    rationaleHeading: 'Use your camera',
    rationale:
      'Moment Palette uses the camera to place the view around you inside the selected area. Video and captured images are not uploaded or stored on a server.',
    continue: 'Open camera',
    cancel: 'Cancel',
    starting: 'Starting the camera…',
    startingHint: 'If your browser asks, allow camera access to continue.',
    switch: 'Switch camera',
    previewLabel: 'Artwork and camera preview',
    showSource: 'Show the full camera view',
    showArtwork: 'Show the current artwork',
    blend: 'Current artwork visibility',
    gestureHelp:
      'Drag with one finger and pinch with two fingers inside the square.',
    shutterLabel: 'Capture the current view in the selected area',
    unavailableHeading: 'Camera unavailable',
    alternativesLater:
      'Photo and solid-color alternatives will be added in a future update.',
    backToCreation: 'Back to artwork',
    errors: {
      denied:
        'Camera access is blocked. Check this site’s camera permission in your browser or device settings, then try again.',
      'not-found':
        'No camera is available. Check that your device camera is recognized by the operating system and browser.',
      'not-readable':
        'The camera could not be read. Check whether another app is using it.',
      'constraint-failed':
        'The requested camera settings are not available on this device.',
      unsupported:
        'This browser cannot access the camera. Check that the page is using HTTPS.',
      unknown: 'Something went wrong while using the camera. Please try again.',
    },
  },
} as const
