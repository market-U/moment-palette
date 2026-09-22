# 検証記録

## 2026-09-22 ローカルChrome

macOS上のChromeで、`http://127.0.0.1:5174`の開発サーバーを使用して確認した。

### 確認済み

- 初期表示で先頭Areaが選択され、別Areaのタップで中央選択が切り替わる。
- カメラ取得前に利用理由と続行・キャンセルが表示される。
- 許可済みのカメラを開始し、選択Areaへlive映像が合成される。
- 表示比率を0%、50%、100%へ変更できる。
- 編集Canvas上の1本指相当のdragでlive映像をpanできる。
- シャッター後に制作画面へ戻り、選択Areaが「撮影済み」になる。
- 同じAreaで再度撮影し、撮影済みframeを上書きできる。
- live表示からキャンセルすると制作画面へ戻り、Chromeのcamera indicatorが消える。
- live表示中に制作routeから離脱するとtemplate選択画面へ戻り、Chromeのcamera indicatorが消える。
- 上記操作中にbrowser consoleのwarningとerrorは発生しない。

### ローカル環境では未確認

- 自動操作環境から複数pointerを発生できないため、実ブラウザ上のpinch操作は未確認。座標・gestureロジックの単体テストは成功している。
- 確認端末で利用可能なcameraが一方向だけだったため、camera切替操作は表示されず未確認。

pinch操作とcamera切替は、以下のPR previewを使ったiPhone実機確認で補完した。

## PR preview

- PR: https://github.com/market-U/moment-palette/pull/13
- Preview: https://icy-mushroom-0c0e42e00-13.eastasia.5.azurestaticapps.net
- CI: GitHub Actionsの「品質検査とデプロイ」が成功。

### 2026-09-22 iPhone実機確認

利用者がPR previewをiPhoneのSafari・Chromeで確認し、両browserで次のすべてが正常に動作することを確認した。

- Area選択、権限説明、背面camera開始。
- 前面・背面cameraの切替と、前面cameraのpreview・撮影結果における同じ鏡像表示。
- slider両端と中間、1本指pan、2本指pinch、および操作後も映像のない余白が現れないこと。
- 30秒以上の連続操作と、10回の撮影・撮り直し、および他Areaのfillが維持されること。
- cancel、background移行、route離脱時のcamera indicator消灯と、foreground復帰時に自動再開しないこと。

ローカルChromeとPR previewの実機確認を合わせてタスク6.2と6.3を完了とする。

## 完了時の引き継ぎ

- Android Chromeの実機確認は、このchangeの完了条件に含めず、端末確保後のリリースフォロー項目とする。
- 選択中Areaの輪郭表示は非必須とし、小さいAreaや離れた複数形状の判別性に問題がある場合に後続changeで検討する。
- 写真取り込み、単色塗り、完成PNGの生成・保存・共有は、このchangeの対象外であり後続changeで実装する。
