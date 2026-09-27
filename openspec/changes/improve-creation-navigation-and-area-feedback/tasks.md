## 1. 制作画面からの破棄確認

- [x] 1.1 CreationPageの破棄するroute遷移を確認dialogで保護し、BackButton、Start over、browser historyを同じ確認経路へ通す
- [x] 1.2 日本語・英語の確認文言と、制作sessionを保持・破棄する単体テストを追加する

## 2. Area表示フィードバック

- [x] 2.1 Canvas compositorとsession facadeに、選択mask overlayおよびmaskサムネイルを描画する操作を追加する
- [x] 2.2 静的Artwork previewに選択mask overlayを重ね、選択変更時に描き直すVue部品とテストを追加する
- [x] 2.3 Area selectorをmaskサムネイルだけの表示へ置き換え、アクセシブルなArea名と既存の中央選択操作を維持する
- [x] 2.4 `selected-area.png`と選択maskを一度だけ合成したoverlay Canvasを描き、CSS opacity animationとreduced-motion時の静的表示へ置き換える

## 3. 検証

- [x] 3.1 関連する単体テスト、format、lint、型検査、production buildを実行する
- [x] 3.2 斜線overlay、CSS animation、reduced-motionを含む単体テストと全自動品質検査を実行する
