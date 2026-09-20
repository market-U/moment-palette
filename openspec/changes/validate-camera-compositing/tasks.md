## 1. F/S入口と本番候補アセット

- [x] 1.1 `docs/development-roadmap.md`でフェーズ3を進行中とし、先行change、今回の範囲、Android実機確認をリリース後へ回す方針を記録する
- [x] 1.2 `文鳥01/`の原本を変更せず、`線画.png`、`背景.png`、`ボディ.png`、`くちばし.png`、`口の中.png`を実行用のASCII名で`public/spikes/camera-compositing/`へコピーする。全layer結合済みの`サムネイル.png`はコピーしない
- [x] 1.3 線画と4マスクが1080×1080・alpha付きであること、既知のalpha bounding box、中間alpha、`くちばし`の離れた複数形状、mask間の意図しない重複を検査できるスクリプトまたはテストを追加する
- [x] 1.4 `/spikes/camera-compositing`の遅延読み込みrouteとF/S専用ページを追加し、通常画面からリンクせず、開始操作前にカメラを取得しないことを確認する
- [x] 1.5 F/S画面に検証専用であること、映像を送信・保存しないこと、対象外機能を明示する

## 2. 座標・倍率・ジェスチャー計算

- [x] 2.1 source寸法、作品座標、mask bounding box、倍率、offsetを表すF/S用の型と不変条件を定義する
- [x] 2.2 1080×1080作品領域を隙間なくcoverする最小倍率、最大倍率、X/Y移動範囲を計算してclampする純粋関数を実装する
- [x] 2.3 1本指の差分を論理座標へ変換するpan計算と、2本指の中点を維持して距離比を適用するpinch計算を実装する
- [x] 2.4 異なるvideo縦横比、preview寸法、単一形状mask、離れた複数形状mask、最小・最大倍率、境界外panを網羅する単体テストを追加する
- [x] 2.5 active pointerの開始・追加・移動・終了・cancelからpanまたはpinch入力を生成する状態処理を実装し、pointer順序の入替えと途中cancelを単体テストする

## 3. カメラportとブラウザ実装

- [x] 3.1 開始、向き切替、停止、track settings取得を要求する最小のカメラportをF/S feature内へ定義する
- [x] 3.2 `getUserMedia()`を`audio: false`かつ背面優先で呼び、video elementへstreamを接続するbrowser adapterを`infrastructure`へ実装する
- [x] 3.3 権限取得後のvideo input列挙とtrack settingsから切替可否を判定し、既存trackを停止してから前面・背面を再取得する処理を実装する
- [x] 3.4 `NotAllowedError`、`NotFoundError`、`NotReadableError`、`OverconstrainedError`、その他を検証画面用の失敗種別へ変換する
- [x] 3.5 停止処理を冪等にし、全trackの`stop()`、videoの`srcObject`解除、保持参照の破棄をfake streamで単体テストする
- [x] 3.6 cancel、撮影完了、route離脱、component unmount、`visibilitychange`のhiddenから共通cleanupを呼び、visible復帰時は明示操作まで再取得しない状態遷移を実装する

## 4. Canvasライブ描画

- [x] 4.1 `文鳥01`からコピーした線画と4枚のPNG maskを読み込み、decode完了、1080×1080寸法、読み込み失敗を扱うasset loaderを実装する
- [x] 4.2 video frameを論理座標へ変換して描くsource planeと、初期色・撮影済みエリア・選択中mask内のlive映像を描くartwork planeをCanvas 2Dで実装する
- [x] 4.3 一時canvasと`destination-in`で各PNG maskのalphaを適用し、離れた複数形状を一つのエリアとして描画する
- [x] 4.4 表示比率0%・100%・中間値で二つの画像面を合成し、線画を最前面へ一度だけ描くrendererを実装する
- [x] 4.5 preview canvasのbacking storeを表示寸法とdevice pixel ratioに合わせて上限1080pxにし、resize後も論理変換を維持する
- [x] 4.6 `requestAnimationFrame`の開始・停止と重複防止を実装し、video寸法、facing mode、canvas寸法、概算FPSを診断表示へ渡す

## 5. 実機向けPointer Events

- [x] 5.1 編集canvasだけへ`touch-action: none`を設定し、pointer開始時に`setPointerCapture()`して領域外へ移動後も操作を継続する
- [x] 5.2 1本指pointerをpanへ、2本指pointerをpinchへ接続し、計算後の変換を毎frameのlive描画へ反映する
- [x] 5.3 `pointerup`、`pointercancel`、`lostpointercapture`でactive pointerを確実に破棄し、1本指へ戻る場合の基準位置を再設定する
- [x] 5.4 スライダー、シャッター、切替、再試行など編集canvas外から始まる操作が映像変換を変更せず、通常スクロールを妨げないことを確認する

## 6. 撮影・上書き・PNG生成

- [x] 6.1 シャッター時のvideo frameと現在の変換を1080×1080のdetached canvasへ固定し、選択中エリアへ即時反映する
- [x] 6.2 `背景`、`ボディ`、`くちばし`、`口の中`の4エリアを選択・撮影できるメモリ内状態を実装し、他エリアを維持したまま撮影済みエリアを上書きできるようにする
- [x] 6.3 撮り直しで置き換えたdetached canvasのbacking storeと参照を破棄し、全状態cleanupでも同じ解放処理を行う
- [x] 6.4 全エリアの撮影結果または初期色と線画を専用1080×1080 canvasへ描き、`image/png` Blobを生成する
- [x] 6.5 PNG Blobを単一のobject URLから画像要素へ表示し、再生成前とunmount時に以前のURLをrevokeする
- [x] 6.6 BlobのMIME type、decode後の幅・高さ、撮影時間、PNG生成時間、描画失敗を検査・表示し、失敗後もcleanupできるようにする

## 7. F/S画面と異常系

- [x] 7.1 カメラ開始、エリア選択、表示比率、シャッター、撮り直し、前面・背面切替、PNG生成、cancel、再試行を一つのF/S画面へ結線する
- [x] 7.2 権限拒否、カメラなし、使用中、constraint不一致、その他の取得失敗について原因別の案内と再試行を表示する
- [x] 7.3 カメラ取得中、video metadata待ち、撮影処理中、PNG生成中の重複操作を防ぎ、現在状態を診断表示する
- [x] 7.4 F/S画面や生成HTML、ログ、固定アセットに撮影画像、秘密情報、外部送信処理が含まれないことを確認する

## 8. ローカル検証とPRプレビュー

- [x] 8.1 `pnpm typecheck`、`pnpm test:run`、`pnpm lint`、`pnpm format:check`、`pnpm build`を実行して成功を確認する
- [x] 8.2 SWA CLIでproduction buildを起動し、F/S routeの直接アクセス、通常タイトル画面、固定アセット、SPA fallbackを確認する
- [ ] 8.3 デスクトップの利用可能なブラウザとカメラで、許可・拒否・再試行、mask、pan、pinch相当、撮影、上書き、PNG寸法、cleanupの基本動作を確認する
- [ ] 8.4 作業ブランチをpushして`main`向けPRを作成し、GitHub Actionsの品質検査とSWAプレビューデプロイが成功することを確認する
- [ ] 8.5 PRプレビューURLのF/S routeへHTTPSで直接アクセスでき、通常画面と既存の固定F/S環境に回帰がないことを確認する

## 9. iPhone 15実機確認

- [ ] 9.1 iPhone 15（iOS 26）のSafariで、背面カメラ開始、可能な場合の前面切替、4 maskの表示、表示比率、pan、pinch、4エリア撮影、撮り直し、PNG生成を確認する
- [ ] 9.2 iPhone Safariで30秒以上の連続操作と10回の撮影・撮り直しを行い、致命的停止、継続的な性能劣化、映像漏れ、camera indicatorの解放漏れがないことを確認する
- [ ] 9.3 iPhone 15（iOS 26）のChromeで9.1と9.2と同じ確認を行い、Safariとの差異を記録する
- [ ] 9.4 両ブラウザで権限拒否または設定上の拒否状態、再試行、バックグラウンド移行、画面離脱時のtrack停止を可能な範囲で確認する
- [x] 9.5 Android Chromeを今回の合否から除外し、確認端末を確保できるリリース後のフォロー項目として残す

## 10. 結果・採否・完了

- [ ] 10.1 `docs/spikes/camera-compositing.md`へ検証する問い、対象環境、成功条件、実施内容、定量値、Safari・Chrome別結果、制約、未解決事項を記録する
- [ ] 10.2 Canvas 2D、mask合成、Pointer Events、カメラ切替、track lifecycle、1080px PNGの採否と、写真取り込み・共有・Android・Azure配信へ残る問いを記録する
- [ ] 10.3 追加ファイルを単位として、本実装へ昇格、設計を保って再実装、削除のいずれにするかを決定し、F/S専用route・UI・実行用アセットコピー・診断表示の扱いを記録する。change内の`文鳥01`原本は検証時点の入力として保持する
- [ ] 10.4 F/S結果に合わせて`docs/vision.md`、`docs/design/`、`docs/development-roadmap.md`の更新要否と、後続OpenSpec changeの分割を判断する
- [ ] 10.5 `openspec validate validate-camera-compositing`と全品質検査を再実行し、proposal・spec・design・tasks・実装・結果記録の整合を確認する
- [x] 10.6 F/Sのdelta specをmain specsへ同期しないことを確認し、完了後は`--skip-specs`でarchiveする方針を記録する
