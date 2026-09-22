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
- HTTPSのPR preview上でのiPhone Safari・Chrome確認は未実施。

これらを確認するまでタスク6.2と6.3は未完了のままとする。

## PR preview

- PR: https://github.com/market-U/moment-palette/pull/13
- Preview: https://icy-mushroom-0c0e42e00-13.eastasia.5.azurestaticapps.net
- CI: GitHub Actionsの「品質検査とデプロイ」が成功。

### iPhone確認項目

- SafariとChromeの両方で、Area選択、権限説明、背面camera開始を確認する。
- 前面・背面を切り替え、前面cameraのpreviewと撮影結果が同じ鏡像になることを確認する。
- slider両端と中間、1本指pan、2本指pinchで余白が現れないことを確認する。
- 30秒以上連続操作し、10回の撮影・撮り直しで他Areaのfillが維持されることを確認する。
- cancel、background移行、route離脱でcamera indicatorが消え、foreground復帰時に自動再開しないことを確認する。

## 完了時の引き継ぎ

- Android Chromeの実機確認は、このchangeの完了条件に含めず、端末確保後のリリースフォロー項目とする。
- 選択中Areaの輪郭表示は非必須とし、小さいAreaや離れた複数形状の判別性に問題がある場合に後続changeで検討する。
- 写真取り込み、単色塗り、完成PNGの生成・保存・共有は、このchangeの対象外であり後続changeで実装する。
