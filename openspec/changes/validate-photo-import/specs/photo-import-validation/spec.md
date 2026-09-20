## ADDED Requirements

### Requirement: F/S実装の分離と写真データの保護
検証実装は、製品機能と区別できる専用routeおよび専用featureへ分離し、写真選択、デコード、縮小、調整、Canvas描画をブラウザ内だけで処理しなければならない（MUST）。選択されたFile、デコード結果、写真のbinary、ファイル名、EXIF情報をサーバーへ送信、永続保存、または外部ログへ出力してはならない（MUST NOT）。

#### Scenario: F/S画面を開く
- **WHEN** 検証者が写真取り込みF/Sの専用URLを開く
- **THEN** 通常画面と区別できる検証画面が表示され、画像選択操作を行うまで端末内のFileへアクセスしない
- **AND** 選択画像を送信・保存しないことと、検証対象外の機能が表示される

#### Scenario: 写真を処理する
- **WHEN** 検証者が端末内の写真を選択して表示と調整を行う
- **THEN** Fileと生成された画像資源はブラウザのメモリ内だけで処理され、ネットワーク要求または永続ストレージへの書き込みを発生させない

#### Scenario: 診断情報を表示する
- **WHEN** 選択したFileの診断情報を表示または開発者consoleへ記録する
- **THEN** 拡張子、MIME type、byte数、画像寸法、処理経路、処理時間だけを対象とし、完全なファイル名、画像binary、EXIF metadataを含めない

### Requirement: OSの画像選択導線の検証
検証実装は、明示的なユーザー操作を契機に、単一画像を選択する`input[type=file]`を`accept="image/*"`かつ`capture`属性なしで開かなければならない（SHALL）。写真ライブラリ、OSカメラ、ファイル選択のうちOSとブラウザが提示する入口から返されたFileを、同じ写真取り込み処理へ渡さなければならない（MUST）。

#### Scenario: 写真ライブラリから選択する
- **WHEN** 検証者が画像選択を開始し、OSの写真ライブラリから一枚を選ぶ
- **THEN** 選択された一つのFileがデコード処理へ渡され、拡張子、MIME type、byte数が診断欄へ表示される

#### Scenario: OSカメラで撮影する
- **WHEN** OSの選択UIが撮影入口を提示し、検証者が撮影を完了する
- **THEN** 撮影結果は写真ライブラリまたはファイルから選んだ画像と同じデコード・調整処理へ渡される

#### Scenario: ファイルから選択する
- **WHEN** 検証者がOSのファイル選択から一枚を選ぶ
- **THEN** Fileの拡張子またはMIME typeだけで拒否せず、実際のデコードを試行する

#### Scenario: 選択をキャンセルする
- **WHEN** 検証者がFileを選ばずにOSの選択UIを閉じる
- **THEN** エラーとして扱わず、既存の選択画像と作品状態を変更しない

#### Scenario: 同じ画像を再選択する
- **WHEN** 検証者が直前と同じ画像をもう一度選ぶ
- **THEN** 新しい選択処理が開始され、前回と同じFileであることを理由に処理が省略されない

### Requirement: 標準APIによる画像形式と向きの検証
検証実装は、選択されたFileを`createImageBitmap()`でデコードし、利用不能または失敗時はobject URLと`HTMLImageElement.decode()`によるfallbackを試行しなければならない（SHALL）。`createImageBitmap()`では画像metadataに基づく向き補正を要求し、HEIC・HEIF・JPEG・PNGの返却File情報、デコード経路、成否、向き補正後の寸法を記録しなければならない（MUST）。独自のHEIC・HEIF decoderまたはEXIF parserを追加してはならない（MUST NOT）。

#### Scenario: 第一経路でデコードする
- **WHEN** `createImageBitmap()`が選択された画像をデコードできる
- **THEN** metadataを反映した描画sourceと向き補正後の幅・高さが得られ、使用した経路が診断欄へ表示される

#### Scenario: fallbackでデコードする
- **WHEN** `createImageBitmap()`が利用不能または画像のデコードに失敗し、`HTMLImageElement.decode()`が成功する
- **THEN** fallbackから描画sourceと向き補正後の幅・高さが得られ、使用した経路が診断欄へ表示される

#### Scenario: EXIF Orientation fixtureを読み込む
- **WHEN** 検証者がOrientation 1・3・6・8の方向を識別できるJPEG fixtureを順に読み込む
- **THEN** 各画像は意図した向きと縦横寸法でプレビューおよびCanvasへ表示され、二重回転または向きの無視を生じない

#### Scenario: HEICまたはHEIFを選ぶ
- **WHEN** 検証者がiPhoneの写真ライブラリとファイル選択からHEICまたはHEIF由来の写真を選ぶ
- **THEN** ブラウザから返された拡張子とMIME type、実デコードの成否、返却前の形式変換が疑われる差異がSafari・Chrome別に記録される

#### Scenario: PNGを読み込む
- **WHEN** 検証者がalphaを含むPNGを選ぶ
- **THEN** PNGを画像としてデコードしてCanvasへ描画でき、透明部分の見え方が結果へ記録される

### Requirement: 高解像度画像の正規化の検証
検証実装は、向き補正後の画像を拡大せず、初期候補として長辺4096px以下かつ総画素数12MP以下となる寸法へCanvas 2Dで正規化しなければならない（SHALL）。比較用に長辺2160pxの候補を生成でき、元画像、両候補の処理時間、保持寸法、最大4倍調整時の表示品質を比較できなければならない（MUST）。`createImageBitmap()`のresize optionを必須経路にしてはならない（MUST NOT）。

#### Scenario: 上限以下の画像を選ぶ
- **WHEN** 向き補正後の画像が長辺4096px以下かつ12MP以下である
- **THEN** 画像を拡大せず、元の縦横比を維持した寸法で編集sourceを作る

#### Scenario: 長辺上限を超える画像を選ぶ
- **WHEN** 向き補正後の画像の長辺が4096pxを超える
- **THEN** 長辺を4096px以下に収め、縦横比と向きを維持した寸法で編集sourceを作る

#### Scenario: 総画素数上限を超える画像を選ぶ
- **WHEN** 長辺を4096px以下にしても総画素数が12MPを超える
- **THEN** 総画素数が12MP以下になるまで縦横を同じ比率で縮小する

#### Scenario: 2160px候補と比較する
- **WHEN** 検証者が同じ高解像度画像を4096px・12MP候補と2160px候補で正規化する
- **THEN** 各候補の正規化寸法、処理時間、最大4倍表示時の画質を比較できる

#### Scenario: 縮小後の画像品質を確認する
- **WHEN** 検証者が細線、文字、斜線を含むfixtureと実機写真を正規化する
- **THEN** 一回のCanvas縮小で生じるぼけ、jaggy、色差を目視でき、採否判断へ記録できる

### Requirement: 写真の位置・倍率調整とmask合成の検証
検証実装は、正規化済み写真を1080×1080作品領域へcoverして初期表示し、表示比率、1本指pan、2本指pinch、最大4倍の倍率制限を提供しなければならない（SHALL）。画像形式を問わずcover倍率より小さく縮小して余白を残せ、画像の一部を選択エリア内に保ったまま確定できなければならない（MUST）。選択中の`文鳥01`mask内へ写真を描き、線画を最前面へ表示しなければならない（MUST）。

#### Scenario: 写真を初期表示する
- **WHEN** 選択画像のデコードと正規化が完了する
- **THEN** 写真は縦横比を維持して1080×1080作品領域を隙間なくcoverし、選択中mask内へ表示される

#### Scenario: 表示比率を変更する
- **WHEN** 検証者が表示比率を0%から100%の間で変更する
- **THEN** 0%では写真全体と線画、100%では現在の作品と選択中mask内の写真、中間では両者を比較できる合成結果を表示する
- **AND** 選択中mask内の写真は中間値でも薄くならない

#### Scenario: 写真をpanする
- **WHEN** 検証者が編集領域内から1本指dragを開始して写真を移動する
- **THEN** pointerが領域外へ移動しても操作が継続し、画像の一部が選択エリア内に残る範囲で位置を調整できる

#### Scenario: 写真をpinchする
- **WHEN** 検証者が編集領域内の2本指間隔を変更する
- **THEN** 写真は指の中点を基準に、選択エリアへ収まる倍率より小さい状態から最大4倍まで連続的に拡大縮小される

#### Scenario: 余白を残して写真を配置する
- **WHEN** 検証者が画像をcover倍率より小さく縮小する
- **THEN** 画像形式によるモード切替なしで画像外の余白を残して確定でき、余白には選択エリアの初期色が表示される

#### Scenario: 透過画像を重なるエリアへ配置する
- **WHEN** 検証者が透過PNGを一つのエリアへ確定し、作品表示100%で重なっている別エリアの写真を編集または確定する
- **THEN** 透過PNGの透明画素にはそのエリアの初期色が表示され、別エリアの写真が透けて表示されない

#### Scenario: 写真を選択エリアへ確定する
- **WHEN** 検証者が調整済み写真を確定する
- **THEN** その写真と変換が1080×1080の選択エリア状態へ反映され、元画像の向き、crop、線画との描画順を維持する

### Requirement: 失敗と一時リソースのライフサイクル検証
検証実装は、選び直し、デコード完了、デコード失敗、正規化失敗、route離脱、component破棄の各時点で、不要になったobject URL、ImageBitmap、HTMLImageElement参照、Canvas backing storeを明示的に解放しなければならない（MUST）。複数の非同期選択が前後して完了しても最新の選択だけを採用し、古い結果を解放しなければならない（MUST）。

#### Scenario: デコード完了後に元資源を解放する
- **WHEN** 選択画像から正規化済みcanvasの生成が完了する
- **THEN** 元のImageBitmapをcloseし、使用したobject URLをrevokeし、元FileとHTMLImageElementへの不要な参照を保持しない

#### Scenario: 写真を選び直す
- **WHEN** 検証者が別の写真を選択し、新しい正規化済みsourceが採用される
- **THEN** 以前のsource canvasのbacking storeと参照を解放し、新しい写真だけを表示する

#### Scenario: 非同期処理が逆順で完了する
- **WHEN** 二つの選択処理が重なり、古い選択のデコードが新しい選択より後に完了する
- **THEN** 新しい選択結果だけを採用し、遅れて完了した古い結果を表示せず直ちに解放する

#### Scenario: 未対応または破損画像を選ぶ
- **WHEN** 第一経路とfallbackの両方で画像をデコードできない
- **THEN** 未対応形式または破損の可能性と再選択方法を表示し、作成済みの一時リソースを解放する

#### Scenario: 正規化に失敗する
- **WHEN** Canvas確保、縮小、または描画が例外で失敗する
- **THEN** 画像処理またはリソース不足の可能性と小さい画像を選ぶ方法を案内し、再選択可能な状態へ戻る

#### Scenario: F/S画面を離れる
- **WHEN** 正規化済み写真を保持した状態でroute離脱またはcomponent破棄が発生する
- **THEN** 保持するすべての一時画像資源を解放し、別画面へ写真データを持ち越さない

### Requirement: iPhone実機での判定と結果記録
検証者は、SWAのPRプレビューをiPhone 15（iOS 26）のSafariとChromeで開き、写真ライブラリ、提示される場合のOSカメラ、ファイル選択、HEIC・HEIF・JPEG・PNG、EXIF Orientation、高解像度縮小、表示比率、pan、pinch、選び直し、失敗、cleanupを確認しなければならない（MUST）。両ブラウザで少なくとも30秒間に10回の写真選択・調整・選び直しを完了でき、クラッシュ、操作不能、継続的な処理時間悪化、古い画像の再表示を生じてはならない（MUST NOT）。Android Chromeは今回の合否へ含めてはならない（MUST NOT）。

#### Scenario: iPhone Safariで縦断確認する
- **WHEN** 検証者がSafariで定めた画像形式、入口、向き、縮小、調整、失敗、繰り返し操作を確認する
- **THEN** 各操作の成否、返却File情報、元・正規化後寸法、decode・正規化時間、画質、制約が記録される

#### Scenario: iPhone Chromeで縦断確認する
- **WHEN** 検証者がChromeでSafariと同じ確認を行う
- **THEN** 各結果とSafariとの差異が区別して記録される

#### Scenario: Android実機を利用できない
- **WHEN** このchangeの実施期間中にAndroid Chrome実機を確保できない
- **THEN** iPhone SafariとChromeの必須条件を満たしていればchangeを完了でき、Android確認をリリース後のフォロー項目として残す

#### Scenario: F/Sを完了する
- **WHEN** 実装と実機確認が完了する
- **THEN** `docs/spikes/`へ検証した問い、対象環境、定量値、ブラウザ別結果、制約、採否、コードの昇格・再実装・削除判断、および後続changeへの反映を記録する
- **AND** delta specをmain specsへ同期せず、`--skip-specs`でarchiveする方針を記録する
