## 1. Artworkと制作sessionの更新基盤

- [x] 1.1 `ArtworkArea.fill`を`initial`と`camera`のunionへ拡張し、指定Areaだけをcamera fillへ更新する純粋関数と不正なArea IDを拒否する単体テストを追加する
- [x] 1.2 制作sessionへArea ID単位の撮影frame所有と現在previewの置換境界を追加し、更新成功時の旧resource解放を単体テストする
- [x] 1.3 撮影frameまたはpreview生成失敗時に新resourceだけを解放し、更新前のArtwork・frame・previewを維持する原子的commitと単体テストを追加する
- [x] 1.4 sessionの置換、reset、app unmount、`pagehide`が重なってもtemplate asset・全撮影frame・previewを一度だけ解放するtestを拡張する

## 2. 製品camera featureとbrowser adapter

- [x] 2.1 F/Sのcamera port、failure code、browser camera streamを`camera-fill`の製品責務へ移し、背面優先、切替、鏡像判定、全track停止、error分類の既存testを移行する
- [x] 2.2 Permissions APIを補助的に照会するport・adapterを追加し、`denied`、`prompt`、未対応・照会失敗の分岐を単体テストする
- [x] 2.3 cameraの`closed`、`rationale`、`requesting`、`live`、`capturing`、`denied`、`unavailable`状態と再試行・cancel遷移を持つcontrollerを実装し、外部error本文をviewへ渡さないtestを追加する
- [x] 2.4 operation IDとvisibility lifecycleをcontrollerへ実装し、cancel・background・破棄後に遅れて取得したstreamを停止して自動再開しないtestを追加する

## 3. Canvas合成と撮影

- [x] 3.1 decode済みline art・順序付きmask・Artwork・撮影frameを入力にする製品camera compositor portとCanvas 2D adapterを追加する
- [x] 3.2 初期色と撮影frameのArea順合成、中間alphaと離れた形状、line art最前面、選択Areaのlive置換を単体テストする
- [x] 3.3 表示比率0%・100%・中間値でsource planeとartwork planeを合成し、選択Areaのlive映像を不透明に保つscene計算と描画testを移行する
- [x] 3.4 背面・前面の変換、1080×1080撮影frame生成、同一Areaの上書き、frame解放を実装して単体テストする
- [x] 3.5 既存`mediaTransform`と`PointerGestureTracker`を製品cameraへ接続し、中央cover、pan、pinch、倍率・移動制約の回帰testを維持する

## 4. 制作画面とcamera UI

- [x] 4.1 中央固定の選択枠、非循環の横scroll・snap、両端padding、tap時の中央移動を持つArea selectorを実装する
- [x] 4.2 container中央に最も近いAreaを確定する純粋計算と、先頭・末尾・scroll終了・tap選択のcomponent testを追加する
- [x] 4.3 権限要求前の利用理由、起動中、live preview、slider両端操作、シャッター、利用可能時だけのcamera切替、cancelをcamera UIへ実装する
- [x] 4.4 編集CanvasだけへPointer Events、pointer capture、`touch-action: none`を適用し、slider・buttonから始まるgestureを映像操作から除外する
- [x] 4.5 権限拒否、カメラなし、使用中、制約不成立、未対応、その他の失敗表示と再試行・制作復帰を日本語・英語の翻訳resourceへ追加する
- [x] 4.6 制作session facadeとapp composition rootへArea選択、camera controller、compositor、撮影commitを結線し、撮影後に更新済み作品へ戻る統合testを追加する

## 5. F/S移行と文書更新

- [x] 5.1 製品導線と回帰testへの移行完了後、camera F/Sのroute、page、feature UI、固定asset、専用asset loader、診断用compositor参照を削除する
- [x] 5.2 `docs/architecture/frontend-application.md`へArtwork fillとcamera resourceの所有・依存方向を反映し、設計と実装の対応を確認する
- [x] 5.3 `docs/development-roadmap.md`へchangeの進捗、F/Sコード移行結果、後続changeへの引き継ぎを反映する

## 6. 自動検査と実機確認

- [x] 6.1 単体テスト、型検査、lint、format、production build、OpenSpec validateを実行し、失敗を解消する
- [ ] 6.2 ローカルbrowserでArea選択、権限説明、camera開始、slider、pan、pinch、撮影、撮り直し、切替、cancel、route離脱を確認する
- [ ] 6.3 HTTPSのPR previewでiPhone Safari・Chromeの主要導線、30秒以上の連続操作、10回の撮影・撮り直し、background・route離脱時のcamera indicator消灯を確認し、結果をchangeまたは関連文書へ記録する
- [x] 6.4 Android Chromeが未確認であること、輪郭表示が非必須であること、写真・単色・完成PNGが後続changeであることを完了記録へ残す
