export const ja = {
  title: {
    name: 'Moment Palette',
    start: 'はじめる',
    checking: '準備を確認しています…',
    reloadRequired:
      '新しいバージョンがあります。再読み込みしてから始めてください。',
    startFailed:
      '開始に必要な情報を取得できませんでした。通信環境を確認して、もう一度お試しください。',
    language: {
      label: '表示言語',
      ja: '日本語',
      en: 'English',
    },
  },
  actions: {
    back: '戻る',
    retry: 'もう一度試す',
    reload: '再読み込み',
    checkAgain: '最初から確認する',
    backToList: '一覧へ戻る',
    startOver: '最初からやり直す',
    templates: 'テンプレート',
  },
  templates: {
    heading: 'テンプレートを選ぶ',
    lead: '今日の気分に合う絵を選んでください。',
    empty: '現在利用できるテンプレートがありません。',
    preparing: '作品を準備しています…',
    loadFailed:
      'テンプレートを読み込めませんでした。取得済みのデータは安全に破棄しました。',
  },
  creation: {
    eyebrow: '制作をはじめましょう',
    previewAlt: '{name}の初期作品',
    areas: '作品のエリア',
    chooseArea: '色をつけるエリアを選んでください',
    cameraFilled: '設定済み',
    fillMethods: '色のつけ方',
    cameraAction: '景色から切り取る',
    cameraActionHint: 'カメラで撮影する',
    photoAction: '思い出から切り取る',
    photoActionHint: '端末の写真を選ぶ',
    solidColorAction: '気持ちからつくる',
    solidColorActionHint: '好きな色を選ぶ',
    complete: '作品を完成する',
    completing: '完成画像を生成しています…',
    completeFailed:
      '完成画像を生成できませんでした。もう一度試すか、制作を続けてください。',
  },
  solidColor: {
    eyebrow: '気持ちからつくる',
    heading: '色を選ぶ',
    choose: '好きな色を選ぶ',
    previewLabel: '単色と作品の合成プレビュー',
    apply: 'この色を反映',
    cancel: 'キャンセル',
  },
  photo: {
    heading: '写真を調整',
    selecting: '写真を選んでください',
    decoding: '写真を読み込んでいます…',
    private: '選んだ写真は端末内だけで処理します。',
    errorHeading: '写真を読み込めませんでした',
    error: '別の写真を選ぶか、制作へ戻ってください。',
    chooseAgain: '写真を選び直す',
    previewLabel: '写真と作品の合成プレビュー',
    gestureHelp: '正方形の中を1本指で移動、2本指で拡大できます。',
    apply: 'この写真を反映',
    cancel: 'キャンセル',
  },
  completed: {
    eyebrow: '完成しました',
    heading: 'あなたのMoment Palette',
    imageAlt: '完成したMoment Palette作品',
    longPress: '画像を長押しして保存できます。',
    share: '共有する',
    sharing: '共有シートを開いています…',
    shared:
      'OSまたは共有先へ画像を渡しました。投稿や保存の完了は共有先で確認してください。',
    cancelled: '共有をキャンセルしました。同じ画像で再試行できます。',
    unsupported:
      'この環境では画像を共有できません。長押し保存または共有文のコピーを利用してください。',
    failed:
      '共有を開始できませんでした。もう一度試すか、画像を長押しして保存してください。',
    shareText: '共有文',
    copyText: '共有文をコピー',
    copied: '共有文をコピーしました。',
    copyFallback: '共有文を手動で選択してコピーしてください。',
    backToCreation: '制作へ戻る',
    startOver: 'もういちど遊ぶ',
  },
  camera: {
    eyebrow: '景色から切り取る',
    heading: 'カメラで撮影',
    rationaleHeading: 'カメラを使用します',
    rationale:
      '選んだエリアへ、その場の景色を切り取るためにカメラを使用します。映像や写真をサーバーへ送信・保存することはありません。',
    continue: 'カメラを開く',
    cancel: 'キャンセル',
    starting: 'カメラを起動しています…',
    startingHint:
      'ブラウザの確認が表示された場合は、カメラの使用を許可してください。',
    switch: 'カメラ切替',
    previewLabel: '作品とカメラ映像の合成プレビュー',
    showSource: 'カメラ全体を表示',
    showArtwork: '現在の作品を表示',
    blend: '現在の作品との表示比率',
    gestureHelp: '正方形の中を1本指で移動、2本指で拡大できます。',
    shutterLabel: '現在の映像を選択中のエリアへ撮影',
    unavailableHeading: 'カメラを利用できません',
    alternativesLater:
      '写真または単色で塗る方法は、今後のアップデートで追加します。',
    backToCreation: '制作へ戻る',
    errors: {
      denied:
        'カメラの使用が許可されていません。ブラウザまたは端末のサイト設定を確認してから、もう一度お試しください。',
      'not-found':
        '利用できるカメラが見つかりません。端末のカメラがOSとブラウザで認識されているか確認してください。',
      'not-readable':
        'カメラを読み取れませんでした。他のアプリが使用していないか確認してください。',
      'constraint-failed':
        'この端末では要求したカメラ設定を利用できませんでした。',
      unsupported:
        'このブラウザではカメラを利用できません。HTTPSで開いているか確認してください。',
      unknown: 'カメラの処理中に問題が発生しました。もう一度お試しください。',
    },
  },
} as const
