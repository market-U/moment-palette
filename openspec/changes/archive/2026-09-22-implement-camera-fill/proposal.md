## Why

制作画面は現在、初期色の作品と単純なエリア一覧を表示するだけで、Moment Paletteの中核体験である「その場の景色を選択エリアへ切り取る」導線を利用できない。カメラF/Sで確定したCanvas 2D、Pointer Events、カメラtrack所有、鏡像処理を製品の制作sessionへ統合し、選択・撮影・撮り直しまでを一つの検証可能な能力として実装する。

## What Changes

- 制作画面へ中央固定・横スクロール・snap式のエリア選択を追加し、先頭選択、端部余白、項目タップによる移動を提供する。
- 選択中エリアから「景色から切り取る」を開始し、権限要求前の利用理由、背面優先のカメラ起動、利用可能な場合の前面・背面切替、キャンセルを提供する。
- カメラ画面で、現在の作品と全体スルー映像の表示比率、1本指pan、2本指pinch、余白を防ぐ制約、前面カメラの鏡像previewを提供する。
- シャッター時のframeを選択中エリアへ即時反映し、撮影済みエリアだけを再撮影・上書きできるArtworkと制作sessionの更新処理を追加する。
- 権限拒否、カメラなし、他アプリ使用中、制約不成立、未対応、その他の取得失敗を安全に分類し、再試行、制作画面への復帰、後続changeで追加する写真・単色導線の案内を表示する。
- 撮影、キャンセル、画面離脱、component破棄、`visibilitychange`によるbackground移行でカメラtrackを停止し、撮り直し・session終了時に撮影frameと表示resourceを一度だけ解放する。
- F/Sで検証済みの座標・gesture処理とcamera adapterを製品moduleへ昇格し、製品用Canvas compositorを制作sessionのasset・Artworkへ適合させる。
- 製品導線へ移行したカメラF/S専用route、page、UI、固定asset、診断表示を削除し、採用した回帰testを製品moduleへ移す。
- カメラ映像と撮影frameは端末内のmemoryだけで処理し、network送信または永続保存を行わない。

## Capabilities

### New Capabilities

- `camera-fill`: 制作画面のエリア選択、カメラ権限・取得・切替、作品比較、pan・pinch、撮影・上書き、失敗からの復帰、およびカメラresourceのライフサイクルを定める。

### Modified Capabilities

- `creation-session`: 制作sessionが更新可能なArtwork、エリアごとの撮影frame、再生成した表示resourceを単一所有し、置換・終了時に解放する要件へ拡張する。

## Impact

- `domain/`のArtwork fill、カメラ用feature・port、制作session facade、app composition root、制作page、i18nを変更する。
- `infrastructure/`のbrowser camera adapterとCanvas compositorを製品portへ接続し、F/S専用camera moduleと静的assetを削除する。
- 既存の`shared/lib`にあるmedia transformとpointer gestureは、カメラと後続の写真取り込みで共有する純粋ロジックとして維持する。
- 外部API、Azure resource、catalog schema、依存packageは変更しない。カメラ映像・撮影frameのuploadや永続化も追加しない。
- 自動検査に加え、iPhone Safari・Chromeで権限、切替、pan、pinch、撮影、撮り直し、background・route離脱時の解放を確認する。Android Chromeはロードマップどおりリリース後のフォロー項目とする。
