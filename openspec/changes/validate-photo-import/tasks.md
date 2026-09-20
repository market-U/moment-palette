## 1. F/S準備と検証素材

- [x] 1.1 `docs/development-roadmap.md`へ`validate-photo-import`の開始、今回の検証範囲、iPhone Safari・Chromeを完了条件とすること、Android Chromeをリリース後へ回すことを記録する
- [x] 1.2 `/spikes/photo-import`の遅延読み込みrouteとF/S専用pageを追加し、通常画面からリンクせず、画像選択操作前に端末内Fileへアクセスしないことを確認する
- [x] 1.3 F/S画面に検証専用であること、写真・ファイル名・EXIF情報を送信または保存しないこと、保存・共有・Azure配信などの対象外機能を明示する
- [x] 1.4 実在人物・位置情報を含まない方向識別用JPEGを基にOrientation 1・3・6・8のfixture、alpha付きPNG、破損画像、縮小品質確認画像を再現可能に用意し、生成元・期待方向・利用目的を文書化する
- [x] 1.5 fixtureの形式、寸法、EXIF Orientation、alpha、破損状態と、実機由来写真をリポジトリへ追加しないことを静的に検査するテストを追加する

## 2. 共有する座標・gestureロジック

- [x] 2.1 カメラF/Sの`Size`、`Point`、`MediaTransform`と座標・倍率計算をブラウザAPIに依存しない`shared/lib`へ移し、公開する型と関数の意図を日本語コメントで説明する
- [x] 2.2 pan・pinchのactive pointer状態処理を`shared/lib`へ移し、pointer追加・順序変更・cancel後の基準再設定など判断が難しい箇所へ日本語コメントを付ける
- [x] 2.3 カメラF/S側のimportを共有moduleへ更新し、既存の座標・gesture単体テストを同じ場所へ移して全ケースを維持する
- [x] 2.4 写真の横長・縦長・正方形sourceについて、1080×1080全体をcoverする初期変換、最大4倍、境界外pan、pinch中点維持を単体テストへ追加する
- [x] 2.5 feature間の直接依存がなく、`shared/lib`がVue、domain、HTTP、ブラウザAPIへ依存していないことを確認する

## 3. 写真取り込みの純粋ロジックとport

- [x] 3.1 File情報、decode経路、元寸法、正規化寸法、処理時間、正規化済みsource、冪等な`dispose()`を表すF/S用の型と写真decode portを`photo-import-spike`内へ定義する
- [x] 3.2 長辺4096pxかつ12MP以下、比較用長辺2160px、拡大禁止、縦横比維持を満たす正規化寸法の純粋関数を実装する
- [x] 3.3 横長・縦長・正方形、長辺だけ超過、画素数だけ超過、両方超過、上限以下、0寸法を含む正規化寸法の単体テストを追加する
- [x] 3.4 選択なし、decode不能、寸法不正、Canvas正規化失敗、リソース不足の疑い、その他をF/S画面用の失敗種別へ変換する純粋処理と単体テストを追加する
- [x] 3.5 非同期選択へ世代番号を付け、最新結果だけを採用して古い完了結果を破棄する状態処理を実装し、逆順完了と失敗の単体テストを追加する
- [x] 3.6 世代管理、形式判定を実デコードへ委ねる理由、File情報を信用しすぎない理由を、実装の近くへ完結な日本語コメントとして残す

## 4. ブラウザ画像decode・正規化adapter

- [x] 4.1 `createImageBitmap(file, { imageOrientation: 'from-image' })`を第一経路として、向き補正後のsourceと幅・高さを取得するbrowser adapterを実装する
- [x] 4.2 第一経路が利用不能または失敗した場合に、object URLと`HTMLImageElement.decode()`で同じ情報を得るfallbackを実装する
- [x] 4.3 `createImageBitmap`のresize optionを使わず、Canvas 2Dへ一度描画して4096px・12MPまたは2160px候補の正規化済みsourceを生成し、拡大を行わないようにする
- [x] 4.4 正規化時に画像平滑化を有効化し、元画像、4096px・12MP候補、2160px候補のdecode・正規化時間と寸法を診断値として返す
- [x] 4.5 成功、第一経路失敗、fallback失敗、Canvas例外のすべてでImageBitmapの`close()`、object URLの`revokeObjectURL()`、一時canvas・image参照の破棄を行う
- [x] 4.6 採用済みsourceの`dispose()`でCanvas backing storeを0へ戻し、複数回呼んでも安全なことをfake browser APIで単体テストする
- [x] 4.7 第一経路とfallbackの切替、向き補正、縮小上限、cleanup順序などブラウザ差に関わる判断を日本語コメントで説明する

## 5. 写真Canvas合成と確定状態

- [x] 5.1 既存の`文鳥01`実行アセットを読む写真F/S固有の固定template定義とasset loaderを追加し、カメラF/S featureへ依存しないようにする
- [x] 5.2 正規化済み写真を変換込みで描くsource planeと、初期色・選択中mask内の写真を描くartwork planeを写真用Canvas 2D adapterへ実装する
- [x] 5.3 PNG maskのalphaを`destination-in`で適用し、表示比率0%・100%・中間値を合成した後に線画を最前面へ一度だけ描く
- [x] 5.4 表示比率の中間値でも選択中mask内の写真が薄くならない描画順とalpha計算を単体テストする
- [x] 5.5 preview canvasのbacking storeを表示寸法とdevice pixel ratioへ合わせて上限1080pxにし、resize後も1080×1080論理座標との変換を維持する
- [x] 5.6 写真確定時に現在の写真と変換を1080×1080のdetached canvasへ描き、選択エリアの確認状態として表示できるようにする
- [x] 5.7 写真の選び直し、確定結果の置換、画面cleanupで古いdetached canvasのbacking storeと参照を解放する
- [x] 5.8 mask合成、線画の描画順、選択中写真を不透明に保つ理由、Canvas解放方法を日本語コメントで説明する
- [x] 5.9 作品表示100%で透過画像と画像外の余白へ選択エリアの初期色を描き、重なっている別エリアの写真を露出させない合成と単体テストを追加する

## 6. 画像選択・gesture・F/S画面の結線

- [x] 6.1 単一選択の`input[type=file]`を`accept="image/*"`かつ`capture`属性なしで追加し、File取得直後にinput valueを空へ戻して同じ画像を再選択できるようにする
- [x] 6.2 Fileが得られない`change`と`cancel`をエラーにせず、選択済み写真と作品状態を維持する
- [x] 6.3 写真選択、decode・正規化中、調整中、確定済み、失敗の状態を結線し、重複操作を制御しながら新しい選択では世代管理によって最新結果だけを採用する
- [x] 6.4 編集canvasだけへ`touch-action: none`とpointer captureを適用し、共有gesture処理からpan・pinchを反映して、canvas外のinput、比較操作、通常スクロールを妨げないようにする
- [x] 6.5 表示比率、正規化候補の切替、写真確定、選び直し、再試行、キャンセルを一つのF/S画面へ結線する
- [x] 6.6 拡張子、MIME type、byte数、decode経路、元・正規化後寸法、decode時間、正規化時間、直近エラーを表示し、完全なファイル名、画像binary、EXIF情報を表示・console出力しないようにする
- [x] 6.7 decode不能、寸法不正、正規化失敗、リソース不足の疑いについて原因別の案内と再選択を表示し、失敗後も操作可能な状態へ戻す
- [x] 6.8 新しく追加・変更したソース全体を確認し、処理の要約ではなく判断理由、ブラウザ差、状態遷移、所有権、解放時点が伝わる完結な日本語コメントを配置する
- [x] 6.9 画像形式による配置モードを分けず、すべての画像をcover初期表示から縮小して余白を残したまま確定できるpan・pinch制約と単体テストを追加する

## 7. 自動検査とローカル確認

- [x] 7.1 fixture、正規化寸法、失敗分類、世代管理、decode fallback、cleanup、Canvas描画、共有gestureの単体テストを通し、既存テストを含めて`pnpm test:run`を成功させる
- [x] 7.2 `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build`、`openspec validate validate-photo-import`を実行して成功を確認する
- [x] 7.3 SWA CLIでproduction buildを起動し、通常タイトル画面、既存カメラF/S route、写真F/S routeの直接アクセス、固定アセット、SPA fallbackを確認する
- [x] 7.4 デスクトップの利用可能なブラウザでJPEG・PNG・Orientation fixture・破損画像を選び、decode、向き、縮小候補、pan、pinch相当、確定、選び直し、失敗、cleanupの基本動作を確認する
- [x] 7.5 F/S画面や生成HTML、console、network記録に選択写真、完全なファイル名、EXIF情報、秘密情報、外部送信処理が含まれないことを確認する

## 8. PRプレビュー配信

- [x] 8.1 作業ブランチをpushして`main`向けPRを作成し、GitHub Actionsの全品質検査とSWAプレビューデプロイが成功することを確認する
- [x] 8.2 PRプレビューURLの`/spikes/photo-import`へHTTPSで直接アクセスでき、通常画面、既存カメラF/S、固定F/S環境に回帰がないことを確認する
- [x] 8.3 実機確認に使うSafari・Chrome共通チェックリストと、入口・返却形式・MIME type・寸法・処理時間・画質を記録する表を`docs/spikes/photo-import.md`へ用意する

## 9. iPhone Safari・Chrome実機確認

- [ ] 9.1 iPhone 15（iOS 26）のSafariで、写真ライブラリ、提示される場合のOSカメラ、ファイル選択を開き、同じ写真処理へ合流することと選択キャンセルを確認する
- [ ] 9.2 SafariでHEIC・HEIF由来写真、JPEG、alpha付きPNGを各入口から選び、返却された拡張子・MIME type、decode経路、成否、ブラウザによる形式変換の有無を記録する
- [ ] 9.3 SafariでOrientation 1・3・6・8 fixtureと縦横の実機写真を選び、プレビュー、mask合成、確定画像の向きと寸法が一致することを確認する
- [ ] 9.4 Safariで高解像度写真を4096px・12MP候補と2160px候補へ正規化し、処理時間、最大4倍表示の画質、細線・文字・斜線、広色域・HDR写真の色差を可能な範囲で比較する
- [ ] 9.5 Safariで表示比率、pan、pinch、余白を残した確定、重なるエリア間の透過PNG合成、同じ写真の再選択、別写真への選び直し、破損・未対応画像の案内と再試行を確認する
- [ ] 9.6 Safariで30秒以上かつ10回以上の写真選択・調整・選び直しを行い、クラッシュ、操作不能、継続的な処理時間悪化、古い画像の再表示がないことを確認する
- [ ] 9.7 iPhone 15（iOS 26）のChromeで9.1〜9.6と同じ確認を行い、Safariとの差異を記録する
- [ ] 9.8 Android Chromeを今回の合否から除外し、確認端末を確保できるリリース後のフォロー項目として残す

## 10. 結果・採否・完了

- [ ] 10.1 `docs/spikes/photo-import.md`へ検証する問い、対象環境、成功条件、実施内容、入口・形式・向き・処理時間・寸法・画質の定量結果、Safari・Chrome別結果、制約、未解決事項を記録する
- [ ] 10.2 `accept="image/*"`、標準decoderとfallback、EXIF Orientation、4096px・12MPまたは2160pxの上限、一回のCanvas縮小、共有座標・gesture、cleanup方式の採否を記録する
- [ ] 10.3 追加・移動ファイル単位で本実装へ昇格、設計を保って再実装、削除のいずれにするかを決め、F/S専用route・UI・fixture・診断表示と既存カメラF/Sコードの扱いを記録する
- [ ] 10.4 F/S結果に合わせて`docs/vision.md`、`docs/design/`、`docs/development-roadmap.md`の更新要否と、写真取り込み本実装および`validate-image-sharing`への反映を判断する
- [ ] 10.5 `openspec validate validate-photo-import`と全品質検査を再実行し、proposal・spec・design・tasks・実装・日本語コメント・結果記録の整合を確認する
- [ ] 10.6 F/Sのdelta specをmain specsへ同期しないことを確認し、完了後は`openspec archive validate-photo-import --skip-specs`でarchiveする方針を結果へ記録する
