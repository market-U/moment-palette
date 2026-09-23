## Context

`implement-camera-fill` は、中央固定のArea選択、1080×1080のCanvas compositor、camera frameのsession所有、作品preview更新を確立した。写真取り込みF/Sでは、`input[type=file]`、`createImageBitmap()` と `HTMLImageElement.decode()` の二段階decode、EXIF Orientationを反映したCanvas正規化、4096px・12MP上限、photo用のpan・pinchと静的レイヤー分割をiPhone Safari・Chromeで確認済みである。

本changeでは、F/S専用routeや診断UIを製品へ持ち込まず、検証済みの純粋処理とbrowser adapterを、現在のArtwork、CreationSessionFacade、preview・完成PNG compositorのresource境界へ統合する。ユーザー写真および元Fileは端末内でのみ扱い、個人情報になり得るファイル名、EXIF、画像binaryを画面または外部logへ出さない。

## Goals / Non-Goals

**Goals:**

- 「思い出から切り取る」からOSの単一画像選択UIを開き、写真ライブラリ、ファイル選択、OSが提供するカメラ撮影を同じ処理へ合流させる。
- 実decodeに成功した画像だけを向き補正・正規化し、初期cover、余白を許す縮小、pan、pinch、比較sliderで調整できるようにする。
- 写真fillをArtwork、表示preview、完成PNG、sessionのresource所有権へ一貫して反映し、上書き・失敗・離脱時に一時resourceを一度だけ解放する。
- 正規化、変換、編集gesture、合成、失敗復帰の自動テストと、iPhone Safari・Chromeでの縦断確認を行う。

**Non-Goals:**

- 複数画像選択、クラウド写真サービス、画像フィルター、トリミング専用UI、独自HEIC decoder、EXIFまたは位置情報の保存を追加しない。
- 単色塗り、Azure本番template配信、Android Chrome実機確認を本changeの完了条件に含めない。
- 写真の永続化、network送信、File名・binary・EXIFの外部log出力を行わない。

## Decisions

### 1. 製品featureに画像選択portとdecode portを置き、browser adapterをinfrastructureへ残す

写真選択とdecodeの利用側portは `features/photo-fill/` に定義し、`input[type=file]` の起動・`createImageBitmap()`・Canvas・Object URLを使う実装は `infrastructure/photo-import/` に置く。inputは `accept="image/*"` とし、`capture` は指定しない。同じFileを連続して選び直せるよう、Fileを受け取った直後にinput valueを空へ戻す。

この構成により、OSのpicker差とbrowser APIをfeatureから隔離し、キャンセルを例外ではなく「Artworkを変更せず制作画面へ戻る」結果として扱える。File typeや拡張子による事前拒否、またはF/S画面に依存した実装は採用しない。

### 2. 正規化済みCanvasを写真resourceの唯一の編集sourceにする

adapterは `createImageBitmap(file, { imageOrientation: 'from-image' })` を先に試し、失敗時だけObject URLを使う `HTMLImageElement.decode()` にfallbackする。成功後は向き補正後のsourceをCanvas 2Dへ一度描画して長辺4096px以下かつ12MP以下へ縮小し、元ImageBitmap、HTMLImageElement、Object URL、Fileの参照を解放する。正規化済みCanvasと寸法、`dispose()`だけを製品側へ渡す。

`createImageBitmap` のresize option、Data URL、独自EXIF parser、独自形式decoderはブラウザ差またはメモリ増加を持ち込むため採用しない。Canvas確保・描画の失敗は、decode失敗と区別して利用者へ安全な再選択案内を出す。

### 3. cameraと共通の変換・gesture規則を使い、写真だけは余白を許容する

正規化写真は1080×1080の作品座標へcoverで初期配置し、既存の`MediaTransform`、Pointer Events、pointer capture、編集領域だけの`touch-action: none`を使う。写真は最小倍率をcover倍率の4分の1とし、選択Areaに写真の一部が残る範囲でoffsetを制限する。これにより、画像外の余白を残せる一方で選択Areaを空にしない。

編集previewと完成合成では、選択Areaの初期色を先に描き、その上へmaskで切り抜いた写真を描く。透明PNGの透明画素と画像外の余白で他Areaを透けさせない。比較sliderの0〜99%では写真全体を比較用planeとして表示し、100%および中間値の選択Area内の写真は不透明に保つ。cameraの映像は余白を許可しないため、camera用の制限を変更しない。

### 4. 写真fillをArtworkの値、resourceをsession所有物として分ける

`ArtworkFill` に `photo` を追加し、Area IDごとの正規化写真とtransformはsessionのresource mapが保持する。反映処理は、写真resourceを使ったpreview生成とArtwork更新がともに成功してからsessionへcommitする。既存cameraまたはphotoを上書きするときは、置換後のArtworkとpreviewを有効にしてから旧resourceを一度だけdisposeし、完成PNGも無効化する。

previewまたはArtwork更新に失敗した場合は、新resourceをdisposeして、更新前のArtwork、resource、preview、完成PNGを保持する。session終了、route離脱、pagehide、app unmountではcamera frame、photo Canvas、preview、完成PNGを同じ冪等な解放経路で処理する。

### 5. F/Sを移行した後に専用routeと診断UIを削除する

F/Sの正規化計算、photo compositor、gesture、browser decoderのうち製品境界に適合するものを移設し、その単体テストを維持する。`/spikes/photo-import` route、固定template、処理時間・MIME・拡張子の診断表示は、製品の写真導線と回帰テストが成立した後に削除する。F/S featureを製品featureからimportする形は採用しない。

## Risks / Trade-offs

- [iOSの入口やbrowserによりFileのMIME type・拡張子が変わる] → `accept="image/*"` はOSへのヒントに留め、実decodeの成否だけを採否に使う。
- [高解像度画像が大きなRGBA memoryを必要とする] → 4096px・12MPへ一度だけ正規化し、元decode resourceを即時解放する。resource不足時は安全な説明と選び直しを表示する。
- [非同期decode中に選び直し・離脱が起きる] → 世代番号を用いて最新結果だけを採用し、遅れて完了した結果も直ちにdisposeする。
- [写真の透明部や余白でレイヤー順が崩れる] → 各Areaの初期色を写真の下に描き、cameraと写真のresource種別を明示してcompositorをテストする。
- [Android Chromeとの差が未確認] → iPhone Safari・Chromeを本changeの完了条件とし、Android実機は端末確保後の回帰項目として文書化する。

## Migration Plan

1. F/Sの純粋処理とadapterを製品のfeature・infrastructure境界へ移し、domain、session、preview、完成PNGをphoto fill対応にする。
2. 既存のcamera作品、未編集作品、完成PNGの回帰テストを維持したまま、写真選択・調整・反映・上書き・破棄のテストを追加する。
3. F/S routeと診断UIを削除し、品質検査とiPhone Safari・ChromeのPRプレビューで写真から完成まで確認する。
4. 問題時は写真導線だけを外し、既存camera・完成作品のresource形式と公開済みtemplate schemaを変更しないため、直前の正常buildへ戻せる。

## Open Questions

- なし。写真の選択、decode、正規化、編集、resource解放の方式と初期上限はF/Sで決定済みであり、製品UIの細かな見た目は既存Figmaと実装時の試用で調整する。
