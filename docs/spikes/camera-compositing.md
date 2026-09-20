# カメラ・マスク合成F/S

## 対応するOpenSpec change

`validate-camera-compositing`

## 検証する問い

- モバイルブラウザのカメラ映像を、実際のPNG maskのalphaで切り抜いてCanvas 2Dへ安定して描画できるか。
- 1本指panと2本指pinchで構図を調整し、映像のない余白を出さずに撮影できるか。
- 4エリアの撮影、撮り直し、上書き、線画との合成をメモリ内だけで行い、1080×1080 PNGを生成できるか。
- 権限拒否、カメラ切替、バックグラウンド移行、画面離脱で、意図しない再取得やtrackの解放漏れを防げるか。

## 対象環境

| 環境 | 用途 | 状態 |
| --- | --- | --- |
| Node.js 24.14.0 / pnpm 12.4.2 | 自動検査とproduction build | 完了 |
| Azure Static Web Apps CLI 2.0.10 | ローカル配信とSPA設定 | 完了 |
| Mac / Chrome / Webカメラ1台 | 基本操作とカメラの事前確認 | 完了 |
| iPhone 15 / iOS 26 / Safari | 主要な実機判定 | 完了 |
| iPhone 15 / iOS 26 / Chrome | Safariとの差分確認 | 完了 |
| Android Chrome | ブラウザ・端末差の確認 | 今回の合否から除外し、リリース後に実施 |

## 成功条件

- `文鳥01`の線画と4枚のmaskを、中間alphaと離れた複数形状を保ったまま表示できる。
- 表示比率0%、100%、中間値とpan・pinchが、対象ブラウザで破綻しない。
- 4エリアを別々に撮影・上書きでき、`image/png`の1080×1080画像を生成できる。
- 30秒以上の連続操作と10回の撮影・撮り直しで、致命的な停止、継続的な劣化、映像漏れ、camera indicatorの解放漏れがない。
- 拒否、キャンセル、バックグラウンド移行、route離脱の後は、明示操作までカメラを再取得しない。

## 実施内容

- 原本はchange内に保持し、線画と4maskをASCII名でF/S用の固定アセットへコピーした。`サムネイル.png`は実行用アセットに含めていない。
- 1080×1080の論理座標、cover倍率、offset clamp、pan、pinch、pointer状態を純粋ロジックとして分離した。
- `getUserMedia()`とtrackの所有をbrowser adapterに集約し、映像はCanvas 2Dでmask合成する。
- 撮影frameはエリアごとのdetached canvasに保持し、完成時に専用canvasからPNG Blobを生成する。アップロードと永続保存は実装していない。

## 結果

### 自動検査

| 項目 | 結果 |
| --- | --- |
| TypeScript / Vue型検査 | 成功 |
| Vitest | 6 files / 50 tests 成功 |
| ESLint | 成功 |
| Prettier | 成功 |
| Vite production build | 成功 |
| OpenSpec validate | 成功 |

### アセット検査

- 5枚の実行用PNGが原本とbyte-for-byteで一致し、1080×1080、8-bit grayscale + alphaであることを確認した。
- 4maskはすべて中間alphaを含み、`くちばし.png`に離れた複数の不透明成分があることを確認した。
- alpha 50%以上では背景とボディの720 pixelだけが重なり、ボディを後に描く順序とした。

### SWA CLI

- F/S routeは末尾スラッシュ付きURLへの301後、HTMLを200で返した。
- タイトル画面は200、線画PNGは`image/png`の200で、配信byteが原本と一致した。
- 存在しないdeep linkは`index.html`へfallbackし、200を返した。

### PRプレビュ

- [PR #6](https://github.com/market-U/moment-palette/pull/6)でGitHub Actionsの品質検査とSWAプレビューデプロイが成功した。
- F/S直接URL、通常画面、線画PNGがHTTPSで200を返し、線画の配信byteが原本と一致した。
- 既存の固定F/S環境のタイトル画面も引き続きHTTPSで200を返した。

### iPhone Safari

- カメラ開始、前面・背面切替、4mask、表示比率、pan、pinch、4エリア撮影、撮り直し、1080×1080 PNG生成は成功した。
- 30秒以上の連続操作と10回の撮影・撮り直しを完了し、致命的な停止、継続的な性能劣化、映像漏れは確認されなかった。
- キャンセル、バックグラウンド移行、画面離脱後にcamera indicatorが消灯し、権限拒否時の案内と再試行も正常に動作した。
- 診断欄のvideo寸法、向き、render FPS、撮影時間、PNG生成時間、生成画像寸法は表示・更新された。renderは概算60fps、撮影は0〜4.0ms、PNG生成は約100ms、生成画像は1080×1080であった。
- 初回確認で、表示比率の中間値で選択中エリアも薄くなることと、シャッターとプレビューが離れて同時に見づらいことを確認した。合成方式とシャッター配置を修正し、両方の解消を実機で確認した。
- 前面カメラが鏡像でなく直感に反したため、facing modeが`user`の場合はプレビューと撮影結果の両方を左右反転するよう修正した。修正後は両方が同じ鏡像となることを確認した。

### iPhone Chrome

- Safariと同じ必須操作、30秒以上の連続操作、10回の撮影・撮り直し、リソース解放、権限拒否と再試行に成功した。Safariとの機能差は確認されなかった。
- renderは概算60fps、撮影は0〜4.0ms、PNG生成は約100ms、生成PNGは1080×1080であった。
- 前面カメラのプレビューと撮影結果はどちらも同じ鏡像となり、問題は確認されなかった。

### Mac Chrome

- Webカメラ1台でカメラ開始からmask合成、位置・倍率調整、撮影・上書き、PNG生成、cleanupまでの基本動作を確認した。カメラが1台のため向き切替は無効となった。

## 制約と未解決事項

- Android Chromeは端末を確保できないため未検証である。今回の合否から外し、リリース後に知人等の端末で確認する。
- 写真取り込み、HEIC/HEIF、EXIF Orientation、Web Share、長押し保存、単色塗り、Azureテンプレート配信は対象外である。
- ブラウザがtrack settingsで実際と異なるfacing modeを返す場合は、前面カメラの鏡像判定を誤る可能性がある。
- カメラ非搭載を権限取得前に確実に判定できないブラウザがある。F/Sでは`NotFoundError`後に設定確認を案内し、本実装では写真取り込みを代替導線とする。

## 採否判断

- Canvas 2Dによるライブプレビューと最終合成を採用する。両ブラウザで概算60fpsを維持したため、現時点でWebGLは不要である。
- PNG maskの中間alpha、離れた複数形状、線画の最前面描画、領域間の描画順を採用する。実機で目立つ映像漏れやhaloは確認されなかった。
- Pointer Events、pointer capture、編集領域だけの`touch-action: none`を採用する。pan、pinch、通常スクロールがSafariとChromeで成立した。
- `facingMode`による背面優先と前面・背面切替を採用する。前面はプレビューと撮影結果をともに鏡像化する。
- trackの所有をbrowser adapterへ集約し、撮影、キャンセル、バックグラウンド移行、route離脱で明示停止する方式を採用する。
- 1080×1080のdetached canvasへ撮影frameを保持し、完成時に`image/png` Blobを生成する方式を採用する。撮影0〜4.0ms、PNG生成約100msで、初期要件に対して十分である。
- 写真取り込みの形式・向き・メモリ、長押し保存とWeb Share、Android実機、Azure配信アセットのCORSは未検証であり、後続changeで扱う。

## コードの扱い

| 扱い | 対象 | 理由 |
| --- | --- | --- |
| 本実装へ昇格 | `geometry.ts`、`pointerGesture.ts`、`scene.ts`と各単体テスト | ブラウザ非依存の計算と状態処理で、実機結果と単体テストの両方が成立したため。本実装の所有featureに合わせて配置と名称は調整する。 |
| 本実装へ昇格 | `cameraPort.ts`、`browserCameraStream.ts`と単体テスト | portとtrack所有の境界が明確で、エラー分類と冪等cleanupを自動検査できるため。UI文言は本実装のi18nへ移す。 |
| 設計を保って再実装 | `canvasCameraCompositor.ts`、`browserAssetLoader.ts`、`compositorPort.ts` | 本実装では写真・単色とリモートテンプレートを同じ作品状態へ統合し、読み込み失敗とCORSを扱う必要があるため。Canvas 2D、mask、描画順、鏡像、解放の設計は引き継ぐ。 |
| 削除 | `CameraCompositingSpike.vue`、F/S用page・route・composition root | 診断と検証操作を一画面に集めたF/S専用UIであり、本番画面デザインと状態遷移は別途実装するため。 |
| 削除 | `template.ts`、`public/spikes/camera-compositing/`、`templateAssets.test.ts` | 固定テンプレートとF/S用コピーであり、本実装ではカタログとテンプレート配信へ置き換えるため。 |
| 保持 | change内の`文鳥01/`原本、この結果レポート、archive済みchange | 検証時点の入力、結果、判断根拠を後続changeから参照できるようにするため。 |

## vision・design・本実装changeへの反映

- `docs/vision.md`へ、表示比率の中間値で選択中映像を薄くしないことと、前面カメラの鏡像をプレビューと撮影結果で揃えることを反映する。
- `docs/design/figma.md`へ同じ操作仕様を反映する。Figmaのレイアウト自体は今回のF/S用シャッター配置に合わせて更新せず、本実装changeで確定する。
- 後続changeは、写真形式・向き・メモリを扱う`validate-photo-import`、長押し保存とWeb Shareを扱う`validate-image-sharing`、Blob・SAS URL・CORSを扱う`validate-azure-template-delivery`に分ける。
- 本実装changeでは、このF/Sで採用した方式を正式specへ記載し、カメラ非搭載時は写真選択または単色塗りを代替導線とする。
- このF/Sのdelta specはmain specsへ同期せず、完了時は`openspec archive validate-camera-compositing --skip-specs`でarchiveする。
