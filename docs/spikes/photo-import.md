# 端末内写真取り込みF/S

> ステータス: F/S完了
>
> 対応OpenSpec change: `validate-photo-import`
>
> 対象: iPhone 15（iOS 26）のSafari・Chrome

## 検証する問い

- `accept="image/*"`かつ`capture`なしのfile inputから、写真ライブラリ、提示される場合のOSカメラ、ファイル選択へ進めるか。
- HEIC・HEIF由来写真、JPEG、PNGを標準APIだけでdecodeできるか。ブラウザや入口が形式を変換するか。
- `createImageBitmap({ imageOrientation: 'from-image' })`と`HTMLImageElement.decode()`でEXIF Orientationが正しく反映されるか。
- 長辺4096pxかつ12MP以下と長辺2160pxの候補は、処理時間、安定性、最大4倍表示の画質のどちらに適するか。
- 写真のpan・pinch、mask合成、確定、選び直しと、一時資源の解放が繰り返し操作でも成立するか。
- pointer更新を一画面更新一回へ集約し、確定済みレイヤーを静的キャッシュした場合、操作開始時と継続時の引っかかりを軽減できるか。レイヤー数を6程度へ増やしても操作中の再合成量を一定に保てる設計か。

## 対象外とデータ保護

この画面は技術検証専用であり、本番用の制作画面、完成画像の保存・共有、Azure配信を実装しない。選択したFile、完全なファイル名、画像binary、EXIF情報を送信、永続保存、外部ログ出力しない。Android Chromeは今回の合否から外し、端末を確保できるリリース後に確認する。

## 固定fixture

`public/spikes/photo-import/fixtures/`に、人工的なSVG原稿から生成したOrientation 1・3・6・8 JPEG、alpha PNG、破損画像、縮小品質確認JPEGを置く。内容、格納寸法、期待方向、再生成手順は同ディレクトリのREADMEに記録する。実機由来写真はリポジトリへ追加しない。

## 成功条件と判定

| 成功条件 | 判定 |
| --- | --- |
| 写真ライブラリ、OSカメラ、ファイル選択が同じ処理へ合流し、キャンセル後も継続できる | 成功 |
| HEIC・HEIF由来写真、JPEG、alpha PNGを標準APIで扱い、入口による形式差を把握できる | 成功。写真ライブラリではHEIF由来写真がJPEG化され、ファイルではHEICのままdecodeできた |
| Orientation fixtureと実機写真が正しい向きでプレビュー、mask合成、確定される | 成功 |
| 4096px・12MP候補と2160px候補を比較し、初期リリースの保持上限を判断できる | 成功。4096px・12MP候補を採用する |
| pan、pinch、余白を残した確定、透過PNG、選び直し、失敗後の再試行が成立する | 成功 |
| Safari・Chromeで30秒以上かつ10回以上操作し、クラッシュ、継続的な悪化、古い画像の再表示がない | 成功 |
| 画像や機微情報を送信・保存・外部ログ出力しない | 成功 |

## PRプレビュー共通チェックリスト

- [x] `/spikes/photo-import`へHTTPSで直接アクセスできる。
- [x] 通常タイトル画面と`/spikes/camera-compositing`に回帰がない。
- [x] 画面表示だけでは端末内Fileへアクセスせず、明示的な「写真を選択」操作でOS UIが開く。
- [x] 選択キャンセルでエラーにならず、編集中・確定済みの状態を維持する。
- [x] 同じ写真を再選択できる。
- [x] Orientation 1・3・6・8がすべて上向きかつ480×320相当で表示される。
- [x] alpha PNGの透明・半透明部分を確認できる。
- [x] 作品表示100%では、透過PNGの透明部分と画像外の余白に選択エリアの初期色が表示され、重なる別エリアの編集中・確定済み画像が透けない。0〜99%では比較用に選択写真全体が表示される。
- [x] 破損画像で原因別の案内が表示され、その後に正常画像を再選択できる。
- [x] 写真全体、作品、選択mask内の写真、線画の順で合成され、中間比率でも選択mask内の写真が薄くならない。
- [x] 画像形式を問わず、1本指pan、2本指pinch、cover未満への縮小、余白を残した確定、最大4倍、画像を完全に見失わない境界制限が機能し、ページの通常スクロールを妨げない。
- [x] 写真確定、同じエリアの置換、別エリアへの確定、編集中写真のキャンセルが機能する。
- [x] 診断欄に拡張子、MIME type、byte数、decode経路、寸法、時間だけが表示される。
- [x] 完全なファイル名、画像binary、EXIF情報、秘密情報、外部送信処理が画面、console、network記録に含まれない。
- [x] 30秒以上かつ10回以上の選択・調整・選び直し後も、クラッシュ、操作不能、継続的な遅延、古い写真の再表示がない。

## 描画性能の再確認

実装上は、連続するpointer更新を`requestAnimationFrame`で一画面更新一回へ集約する。確定済みレイヤーは選択中エリアより下と上の2枚へ事前合成し、操作中は「下キャッシュ、選択中エリア、上キャッシュ」の固定三段だけを再合成する。6レイヤーを前後へ分割できることと、操作中の描画段数が増えないことは単体テストで確認する。現在の`文鳥01`は4エリアのため、実機では4エリアをすべて確定してから一つを置換する操作を最大負荷の確認に使う。

静的キャッシュ用に1080×1080 RGBA Canvasを2枚追加し、約8.9 MiBの固定backing storeを使用する。30秒以上の繰り返し操作では、滑らかさに加えてクラッシュや継続的な悪化がないことも確認する。

- [x] 4096px・12MP候補で、読み込み直後の最初のpinch、pinch直後のpan、継続したpanをそれぞれ確認する。
- [x] 2160px候補で同じ操作を行い、正規化寸法による違いを確認する。
- [x] 4エリアを確定後、一つのエリアを置換中に同じ操作を行い、未確定時との差を確認する。
- [x] SafariとChromeの両方で30秒以上操作し、クラッシュ、入力遅延の蓄積、古い合成結果の再表示がないことを確認する。

描画要求集約と静的レイヤーキャッシュの導入後は、Safari・Chromeともに4096px・12MP候補ですでに明確な引っ掛かりがなくなり、2160px候補も滑らかに操作できた。4エリアをすべて確定した後の置換操作でも差はなく、30秒以上の操作で引っ掛かりの蓄積、クラッシュ、古い合成結果の再表示は発生しなかった。変更前は両候補で同程度に引っ掛かっていたため、保持解像度よりもpointerイベントごとの過剰描画と確定済みレイヤーの再合成が主因だったと判断する。

現在のテンプレートで実機確認できた上限は4レイヤーだが、操作中の描画はレイヤー数にかかわらず固定三段であり、6レイヤーの前後分割も単体テストで確認済みである。このため6レイヤー程度へ増やしても操作中の描画負荷は増えにくい見込みとする。ただし、確定frameの保持メモリとキャッシュ再構築時間はレイヤー数に応じて増えるため、本実装で6レイヤーのテンプレートが確定した時点に再計測する。

| ブラウザ | 正規化候補 | 確定済みエリア数 | 最初のpinch | pinch直後のpan | 継続pan | 30秒以上の安定性・メモ |
| --- | --- | ---: | --- | --- | --- | --- |
| Safari | 4096px・12MP | 0 / 4 | 滑らか | 滑らか | 滑らか | 蓄積・クラッシュなし |
| Safari | 2160px | 0 / 4 | 滑らか | 滑らか | 滑らか | 蓄積・クラッシュなし |
| Safari | 確認時候補 | 4 / 4 | 滑らか | 滑らか | 滑らか | 未確定時との差なし |
| Chrome | 4096px・12MP | 0 / 4 | 滑らか | 滑らか | 滑らか | 蓄積・クラッシュなし |
| Chrome | 2160px | 0 / 4 | 滑らか | 滑らか | 滑らか | 蓄積・クラッシュなし |
| Chrome | 確認時候補 | 4 / 4 | 滑らか | 滑らか | 滑らか | 未確定時との差なし |

## 実機結果

Safari・Chromeともに、写真ライブラリ、OSカメラ、ファイル選択の各入口から同じ写真処理へ合流し、選択キャンセルでもエラーにならなかった。HEIF由来写真は、写真ライブラリから選ぶとJPEGへ変換されて返却され、ファイルから選ぶとHEICのまま返却された。いずれも標準の`createImageBitmap()`経路でdecodeに成功した。

写真アプリへ保存したalpha付き画像は透過が失われるものが多く、写真ライブラリ経由では有効なalpha PNGを用意できなかったため未判定とする。ファイル経由のalpha PNGは透過を保持したままdecodeに成功しており、Webアプリ側のalpha PNG対応は確認できた。この未判定はブラウザの非対応を意味しない。

Orientation 1・3・6・8の固定fixtureは、Safari・ChromeともにEXIFの格納方向にかかわらず矢印が上を向く480×320相当の見た目で読み込まれ、プレビュー、mask合成、確定後も向きが変わらなかった。縦横の実機写真も、写真アプリまたはファイルで表示される向きと一致し、二重回転や向きの無視は発生しなかった。

Safariでは表示比率、pan、pinch、余白を残した確定、重なるエリア間の透過PNG合成、同じ写真の再選択、別写真への選び直し、破損画像の案内と再試行がすべて成立した。30秒以上かつ10回以上の選択・調整・選び直しでも、クラッシュ、操作不能、継続的な処理時間悪化、古い画像の再表示は発生しなかった。Chromeの共通チェックリストでも同じ結果で、差異は確認されていない。

Android Chromeは今回の合否から除外し、実機を確保できるリリース後のフォロー項目とする。

### 高解像度比較（Safari・Chrome）

カメラで撮影した3024×4032の写真を両ブラウザで同じ条件により比較し、SafariとChromeで差はなかった。正規化時間の`0.0ms`は処理がなかったことではなく、診断表示の精度では差を計測できないほど短かったことを表す。

| 正規化候補 | 正規化後寸法 | decode時間 | 正規化時間 | 最大4倍表示 | 色味 |
| --- | ---: | ---: | ---: | --- | --- |
| 4096px・12MP | 3000×4000 | 64ms | 0.0ms | ぼけは見えるが、2160px候補よりわずかに良好 | 元画像との差を認識せず |
| 2160px | 1620×2160 | 62ms | 0.0ms | ぼけが見える | 元画像との差を認識せず |

両候補のdecode・正規化時間に実用上の差はなく、通常表示の色味にも差はなかった。最大4倍ではどちらもぼけるが、4096px・12MP候補がわずかに良好だった。細線・文字・斜線の専用fixtureによる追加比較と、広色域・HDRの色保持に関する厳密な確認は実施していない。初期リリースで要求する画質に対しては通常の実機写真による比較で十分と判断し、これらを完了条件にはしない。

### Safari

| 入口 | 選択元 | 返却拡張子 | MIME type | 元寸法 | 4096px・12MP | 2160px | decode経路・時間 | 正規化時間 | 成否・形式変換・画質メモ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 写真ライブラリ | HEIF由来写真 | jpeg | `image/jpeg` | 3024×4032 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | 成功。選択時にJPEGへ変換 |
| 写真ライブラリ | JPEG | jpeg | `image/jpeg` | 未記録 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | 成功 |
| 写真ライブラリ | alpha PNG | 未判定 | 未判定 | 未判定 | 未判定 | 未判定 | 未判定 | 未判定 | 写真アプリへの保存時に透過を失うサンプルが多く、有効な入力を用意できず |
| OSカメラ（提示時） | 撮影結果 | jpg | `image/jpeg` | 未記録 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | 成功 |
| ファイル | HEIF由来写真 | heic | `image/heic` | 3024×4032 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | 成功。HEICのまま返却 |
| ファイル | JPEG | jpg | `image/jpeg` | 未記録 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | 成功 |
| ファイル | alpha PNG | png | `image/png` | 未記録 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | 成功。透過を保持 |
| ファイル | Orientation 1・3・6・8 | jpg | `image/jpeg` | 補正後480×320相当 | 対象外 | 対象外 | 未記録 | 未記録 | 成功。全fixtureが上向きで、確定後も維持 |

### Chrome

| 入口 | 選択元 | 返却拡張子 | MIME type | 元寸法 | 4096px・12MP | 2160px | decode経路・時間 | 正規化時間 | Safariとの差・成否・画質メモ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 写真ライブラリ | HEIF由来写真 | jpeg | `image/jpeg` | 3024×4032 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | Safariとの差なし。成功、選択時にJPEGへ変換 |
| 写真ライブラリ | JPEG | jpeg | `image/jpeg` | 未記録 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | Safariとの差なし。成功 |
| 写真ライブラリ | alpha PNG | 未判定 | 未判定 | 未判定 | 未判定 | 未判定 | 未判定 | 未判定 | Safariと同じ理由で有効な入力を用意できず |
| OSカメラ（提示時） | 撮影結果 | jpg | `image/jpeg` | 未記録 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | Safariとの差なし。成功 |
| ファイル | HEIF由来写真 | heic | `image/heic` | 3024×4032 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | Safariとの差なし。成功、HEICのまま返却 |
| ファイル | JPEG | jpg | `image/jpeg` | 未記録 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | Safariとの差なし。成功 |
| ファイル | alpha PNG | png | `image/png` | 未記録 | 未記録 | 未記録 | `image-bitmap` / 未記録 | 未記録 | Safariとの差なし。成功、透過を保持 |
| ファイル | Orientation 1・3・6・8 | jpg | `image/jpeg` | 補正後480×320相当 | 対象外 | 対象外 | 未記録 | 未記録 | Safariとの差なし。全fixtureが上向きで、確定後も維持 |

## 採否

| 対象 | 判断 | 理由・条件 |
| --- | --- | --- |
| `accept="image/*"`かつ`capture`なしの単一file input | 採用 | iOSの写真ライブラリ、OSカメラ、ファイル選択が提示され、同じ処理へ合流した |
| 拡張子・MIME typeだけで拒否せず、実decodeを正本にする | 採用 | 同じHEIF由来写真でも、写真ライブラリではJPEG、ファイルではHEICとして返却された |
| `createImageBitmap({ imageOrientation: 'from-image' })` | 第一経路として採用 | Safari・ChromeともJPEG、HEIC、PNGをdecodeでき、Orientationも正しく反映された |
| object URLと`HTMLImageElement.decode()` | fallbackとして採用 | 実機入力では第一経路が成功したため発動しなかったが、自動テストで切替とcleanupを確認済み |
| 独自HEIC decoder・EXIF parser | 不採用 | 正式確認したiPhone環境では標準APIだけで成立した |
| 長辺4096px以下かつ12MP以下 | 本実装の初期上限として採用 | 2160px候補と操作性能・処理時間に実用上の差がなく、最大4倍ではわずかに良好だった |
| 長辺2160px | 既定値には不採用 | メモリ不足時の将来候補にはできるが、今回の実機では4096px・12MP候補を下げる根拠がなかった |
| Canvas 2Dによる一回の縮小 | 採用 | 通常写真の色差を認識せず、追加の多段縮小を必要とする画質問題も確認されなかった |
| 共有座標・gesture処理 | 採用 | カメラ・写真の両F/Sでpan、pinch、境界制御が成立した |
| `requestAnimationFrame`への描画集約と前後の静的レイヤーキャッシュ | 採用 | 4096px・12MP候補と4エリア確定後の置換でも操作が滑らかになった |
| 正規化後の元資源破棄と冪等な`dispose()` | 採用 | 10回以上の選び直しで悪化や古い画像の再表示がなく、自動テストでも解放経路を確認した |
| 画像形式ごとに異なる配置モードを設ける | 不採用 | すべて同じ操作でcover状態から縮小し、余白を残して確定できる方が要件に合う |

## コードの扱い

| 対象ファイル | 扱い | 理由 |
| --- | --- | --- |
| `src/shared/lib/mediaTransform.ts`、`pointerGesture.ts`と各テスト | 本実装へ昇格 | ブラウザAPIに依存せず、カメラ・写真の両方から利用されている |
| `src/features/photo-import-spike/normalization.ts`、`photoPlacement.ts`、`latestSelection.ts`、`photoFailure.ts`、`frameRenderScheduler.ts`と各テスト | 設計とテストを保って本実装featureへ移す | 純粋ロジックは再利用できるが、spike名と本実装の状態・責務へ合わせた配置変更が必要 |
| `src/features/photo-import-spike/photoDecoderPort.ts`、`photoCompositorPort.ts`、`photoScene.ts`、`types.ts` | 設計を保って再実装 | 本実装の作品状態、template domain、画面遷移に合わせて契約を確定する必要がある |
| `src/infrastructure/photo-import/browserPhotoDecoder.ts`、`canvasPhotoCompositor.ts`と各テスト | 設計と主要処理を保って本実装へ昇格 | 標準decoder、正規化、cleanup、Canvas合成は成立したが、本実装portへ結線し直す必要がある |
| `src/app/spikes/PhotoImportSpikeRoute.vue`、`src/pages/PhotoImportSpikePage.vue`、`src/features/photo-import-spike/PhotoImportSpike.vue`とrouter追加 | 本実装完了後に削除 | F/S専用route、操作部品、診断表示であり、製品UIへは昇格しない |
| `src/features/photo-import-spike/template.ts`、`src/infrastructure/photo-import/browserPhotoAssetLoader.ts` | 本実装完了後に削除 | `文鳥01`固定の検証用定義であり、本番のtemplate取得契約を先取りしない |
| `public/spikes/photo-import/fixtures/`、`fixtureAssets.test.ts`、`scripts/generate-photo-import-fixtures.sh`、`scripts/set-jpeg-orientation.mjs` | 必要なものをテストfixtureへ再配置後、公開F/S資産を削除 | Orientation・alpha・破損画像の回帰価値はあるが、製品の公開静的資産には含めない |
| カメラF/Sの共有module参照変更 | 維持 | 共有化後も既存カメラF/Sの動作とテストを維持できた |

## 制約と未解決事項

- 写真アプリ経由のalpha PNGは、写真アプリへ保存した時点で透過を失うサンプルが多く、有効な入力を用意できなかった。ファイル経由ではalphaを保持して成功している。
- 広色域・HDRの色保持、細線・文字・斜線の専用fixtureによる厳密な画質比較は行っていない。通常の実機写真では許容できない色差を認識せず、初期リリースの完了条件にはしない。
- `HTMLImageElement.decode()` fallbackは実機では発動せず、自動テストでのみ確認した。
- Android Chromeは今回の合否から除外した。正式リリース前または端末を確保できた時点で、picker、HEIC、Orientation、操作性能をフォロー確認する。
- 現在の実機templateは4レイヤーである。6レイヤーの前後キャッシュ分割は自動テスト済みだが、6レイヤー実機templateが確定した時点で保持メモリとキャッシュ再構築時間を再計測する。

## 後続changeへの反映

- 写真取り込み本実装changeでは、この文書の採用事項を正式なdelta specへ記述し、F/S用の固定templateや診断UIではなく、製品の作品状態と画面遷移へ結線する。
- `docs/vision.md`と`docs/design/figma.md`は、写真形式によらず余白を残して配置できる要件へ更新した。`docs/development-roadmap.md`にはF/Sの完了結果と後続確認事項を反映した。
- `validate-image-sharing`の検証範囲は変更しない。写真は共有処理より前に1080×1080の作品へ統合されるため、共有F/Sは写真の元形式ではなく、統合済みPNGの長押し保存、Web Share、再利用、破棄を対象とする。

## 完了方針

このF/Sのdelta specは製品の正式要件ではないためmain specsへ同期しない。後続の写真取り込み本実装changeで採用事項を正式なspecへ記述し、このchangeは`openspec archive validate-photo-import --skip-specs`でarchiveする。
