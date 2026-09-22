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

### 未確認

- 自動操作環境から複数pointerを発生できないため、実ブラウザ上のpinch操作は未確認。座標・gestureロジックの単体テストは成功している。
- 確認端末で利用可能なcameraが一方向だけだったため、camera切替操作は表示されず未確認。
- HTTPSのPR previewとiPhone Safari・Chromeの確認は未実施。

これらを確認するまでタスク6.2と6.3は未完了のままとする。

## 完了時の引き継ぎ

- Android Chromeの実機確認は、このchangeの完了条件に含めず、端末確保後のリリースフォロー項目とする。
- 選択中Areaの輪郭表示は非必須とし、小さいAreaや離れた複数形状の判別性に問題がある場合に後続changeで検討する。
- 写真取り込み、単色塗り、完成PNGの生成・保存・共有は、このchangeの対象外であり後続changeで実装する。
