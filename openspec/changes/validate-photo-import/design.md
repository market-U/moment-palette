## Context

`validate-camera-compositing`では、iPhone 15（iOS 26）のSafariとChromeでCanvas 2D、PNG mask、Pointer Events、1080×1080 PNG生成が成立することを確認した。一方、端末内の写真はカメラframeと異なり、File API経由で渡される形式、EXIF Orientation、画素数、色空間、alpha、ブラウザによる事前変換が一定ではない。特に高解像度写真は圧縮後のファイルサイズが小さくても、デコード後に大きなRGBAメモリを必要とする。

HTMLのfile inputにおける`accept`は受け入れ形式のヒントであり、返された`File.type`や拡張子だけで実際のデコード可否を確定できない。WebKitはSafari 17以降でHEIC表示に対応する一方、file inputの`accept`指定によって画像が別形式へ変換される挙動も報告されている。このF/Sでは形式対応を静的な対応表だけで決めず、iPhone Safari・Chromeが実際に返すFileとデコード結果を記録して判断する。

このchangeは製品機能ではなく、写真選択から位置・倍率調整、mask合成までの成立性を確認するF/Sである。画像をサーバーへ送信・保存せず、個人の写真やファイル名をログへ出さない。Android Chromeは端末を確保できるリリース後のフォロー項目とする。

## Goals / Non-Goals

**Goals:**

- `input[type=file]`から写真ライブラリ、OSカメラ、ファイル選択へ進み、選択された一枚を同じ処理経路へ取り込む。
- HEIC・HEIF・JPEG・PNGについて、返却されたFile情報、デコード可否、向き、自然寸法、alphaの扱いをSafari・Chrome別に記録する。
- EXIF Orientationを反映した見た目とCanvas描画結果が一致することを、向きを判別できるfixtureと実機写真で確認する。
- 高解像度画像を保持用の上限まで縮小し、元のデコード資源を速やかに解放して、繰り返し選択しても操作を継続できることを確認する。
- カメラF/Sと同じ1080×1080論理座標、表示比率、pan、pinch、mask合成を写真へ適用する。
- 成功、キャンセル、選び直し、デコード失敗、画面離脱の各経路で一時リソースの所有者と解放時点を明確にする。
- 実装ファイルごとに本実装への昇格、設計を保った再実装、削除を判断し、結果を`docs/spikes/`へ残す。

**Non-Goals:**

- 本番用の制作画面、写真一覧、クラウド写真サービスとの連携を完成させること。
- HEIC・HEIFをJavaScriptまたはWASMで独自デコードすること。
- EXIFや位置情報をアプリのデータとして抽出・保存すること。
- 複数画像の同時選択、トリミング専用画面、フィルター、色補正、HDR保持を実装すること。
- 完成PNGの長押し保存、Web Share、Azureテンプレート配信、単色塗りを検証すること。
- Android Chromeをこのchangeの合否へ含めること。

## Decisions

### 1. 既存アプリ内の専用spike routeとして隔離する

`/spikes/photo-import`を遅延読み込みrouteとして追加し、通常画面からリンクしない。画面は`src/pages/`、F/S固有のUI・状態・portは`src/features/photo-import-spike/`、File・画像デコード・Canvasの具体実装は`src/infrastructure/`へ置く。画面には検証専用であること、選択画像を送信・保存しないことを明記する。

独立したViteアプリはbuildとSWA配信を二重管理するため採用しない。カメラF/S画面へ写真機能を追加する案も、二つの検証結果と削除境界が混ざるため採用しない。

テンプレートは既存のF/S用`文鳥01`実行アセットを参照するが、写真F/S固有の固定定義を持つ。F/S feature間を直接依存させず、本実装のテンプレートdomainを先行して作らない。

### 2. file inputは`accept="image/*"`とし、`capture`を指定しない

ユーザー操作から単一選択の`<input type="file" accept="image/*">`を開く。`capture`属性は特定の撮影機構を優先するヒントであり、写真ライブラリ、撮影、ファイル選択をまとめて提示するOS側の導線を狭める可能性があるため指定しない。OSカメラを選んだ場合も返却された一つの`File`として以後の処理へ合流させる。

HEICやJPEGを`accept`へ個別列挙する案は、WebKitが選択時に別形式へ変換する条件へ影響し得るため採用しない。`File.name`、`File.type`、`File.size`は診断情報としてメモリ内で参照するが、形式の採否は実デコードの成否を正本とする。個人情報になり得るファイル名は画面やログへ表示せず、拡張子とMIME typeだけを表示する。

同じファイルを続けて選び直せるよう、処理対象のFileを取り出した後にinputのvalueを空へ戻す。`change`でFileが得られない場合と`cancel`イベントは作品状態を変更せず、現在の選択画像を維持する。

### 3. デコードは`createImageBitmap()`を第一経路、`HTMLImageElement.decode()`をfallbackにする

feature側に、Fileから向き補正済みの描画source、自然寸法、返却File情報、明示的な`dispose()`を得るportを定義する。browser adapterは次の順で処理する。

1. `createImageBitmap(file, { imageOrientation: 'from-image' })`を試す。
2. API未対応またはデコード失敗時は、一時object URLを`HTMLImageElement`へ設定して`decode()`する。
3. どちらの経路もCanvasへ描画した結果を正規化済みsourceとし、元の`ImageBitmap`は`close()`、object URLは`revokeObjectURL()`する。

HTML標準では`createImageBitmap()`の`imageOrientation`既定値は`from-image`であるが、意図を明示し、EXIF Orientation 1・3・6・8のfixtureで見た目と出力寸法を検査する。Safariも画像表示時にEXIF Orientationを利用するため、fallbackで同じ向きになることを実機で比較する。独自EXIF parserや外部デコードライブラリは、このF/Sの標準API成立性を不明確にするため追加しない。

`FileReader.readAsDataURL()`は元データより大きな文字列表現を作り、解放時点も曖昧になるため採用しない。

### 4. `createImageBitmap`のresize optionへ依存せず、Canvasで保持用sourceへ正規化する

WebKitには`createImageBitmap()`のresize optionに関する未解決報告があるため、`resizeWidth`、`resizeHeight`、`resizeQuality`を必須経路へ使わない。向き補正後の幅・高さから縮小率を計算し、Canvas 2Dの`drawImage()`で一度だけ保持用canvasへ描く。拡大は行わない。

初期候補は長辺4096pxかつ総画素数12MP以下とする。これは1080px出力で最大4倍の構図調整へ一定の余裕を残しつつ、正方形に近い画像の保持用RGBA backing storeを約48MB以下へ抑えるためのF/S値であり、製品要件として確定しない。元画像、2160px上限、4096px・12MP上限を実機で比較し、処理時間、拡大時の画質、10回の選び直しに基づいて本実装値を決める。

縮小時は`imageSmoothingEnabled = true`、`imageSmoothingQuality = 'high'`を指定する。ただし品質指定は実装依存のhintであるため、細線・文字・斜線を含むfixtureと実写真で目視確認する。多段縮小は一時canvasとピークメモリを増やすため初期案では採用せず、画質不足の場合だけ比較対象にする。

### 5. 正規化済みcanvasだけを編集sourceとして保持する

選択完了後に保持する状態は、正規化済み`HTMLCanvasElement`、向き補正後の幅・高さ、変換、最小限の診断値とする。元File、object URL、ImageBitmap、HTMLImageElementは正規化後に参照を破棄する。これにより、previewと最終描画がブラウザ固有の遅延デコードへ再度依存せず、Canvas rendererへ同じ`CanvasImageSource`を渡せる。

写真を選び直す前、デコード失敗時、route離脱時、component unmount時に、旧source canvasの幅・高さを0へ戻して参照を破棄する。新しい選択処理中にさらに選択された場合は世代番号で最新処理だけを採用し、遅れて完了した古い結果も直ちに`dispose()`する。`createImageBitmap()`自体を中断できるとは仮定しない。

元Fileを保持し続けて必要時に再デコードする案はピークメモリと待ち時間を繰り返すため採用しない。ImageBitmapを編集完了まで直接保持する案は`close()`可能だが、高解像度のデコードサイズを制限できないため採用しない。

### 6. 純粋な変換・gestureだけを共有化し、F/S feature同士は依存させない

カメラF/Sで実機検証済みの`geometry.ts`と`pointerGesture.ts`は写真でも同じ規則を必要とするため、関連する`Size`、`Point`、`MediaTransform`とともにブラウザAPIへ依存しない`shared/lib`へ移し、既存テストとカメラF/Sのimportを更新する。実際に二つのfeatureから使う時点で共有化し、動作を変えない回帰テストを保つ。

Canvas compositor、テンプレート定義、画面状態まで共通化すると、本番domainが未確定な段階で抽象化が広がるため、このchangeでは写真用portとadapterを独立して作る。実装後に共通部分が明確になった場合だけ、本実装への昇格候補として記録する。

### 7. 表示比率、pan、pinch、mask合成はカメラF/Sと同じ意味にする

作品座標は1080×1080とし、正規化済み写真を正方形全体へcoverする初期変換を作る。倍率は初期cover倍率から4倍まで、offsetは正方形に余白が出ない範囲へ制限する。編集canvasだけへ`touch-action: none`を設定し、Pointer Eventsとpointer captureでpan・pinchを処理する。

描画は`source plane`へ写真全体、`artwork plane`へ現在の作品と選択中mask内の写真を描き、表示比率で重ねた後、線画を最前面へ一度だけ描く。選択中エリアの写真は中間値でも薄くしない。写真確定時は変換込みの1080×1080 detached canvasを選択エリアの状態として保持できるところまで確認するが、完成PNGの保存・共有は別changeとする。

### 8. 形式名ではなく失敗段階に基づいてエラーを分類する

画面上の失敗は次へ分類し、すべて再選択可能にする。

- 選択なし・キャンセル: エラーにせず現在状態を維持する。
- 画像としてデコード不能: 未対応形式または破損の可能性を案内する。
- 寸法不正: 幅または高さが0の画像として案内する。
- 正規化失敗: Canvas確保または描画に失敗した可能性を案内する。
- リソース不足が疑われる失敗: より小さい画像の選択を案内する。
- その他: 例外名を診断欄だけに残し、利用者向けには再選択を案内する。

HEIC専用のエラー文言は、File情報だけではブラウザによる変換後か判定できないため用意しない。例外、File、画像のbinary内容を外部ログへ送信しない。

### 9. deterministic fixtureと実機写真の責務を分ける

リポジトリには、内容と期待方向を目視できる小さなJPEG Orientation 1・3・6・8、alpha付きPNG、破損画像、縮小品質確認画像をfixtureとして追加する。fixtureの生成元と期待値をテストで固定し、実在人物や位置情報を含めない。巨大なbinary fixtureは置かず、高解像度確認は端末で撮影した写真と、F/S画面で生成できる任意の合成画像を使う。

単体テストは縮小寸法計算、画素上限、世代管理、cleanupの冪等性、エラー分類、共有化した座標・gestureを対象とする。Node上のテストだけでブラウザdecoderやEXIF適用を保証せず、fixtureの実デコード、OS picker、HEIC、Canvas出力はSWA PRプレビュー上の実機チェックリストで判定する。

### 10. 診断値と繰り返し操作からメモリ上の成立性を判断する

F/S画面には、返却された拡張子・MIME type・byte数、decode経路、元寸法、正規化後寸法、decode時間、正規化時間、直近エラーを表示する。ファイル名、EXIF、画像binaryは表示・ログ出力しない。

iOSで利用できない可能性が高い非標準heap計測値を合否条件にしない。SafariとChromeで、写真選択、調整、選び直しを少なくとも10回、30秒以上繰り返し、クラッシュ、操作不能、継続的な処理時間悪化、古い画像の再表示がないことを確認する。可能な環境でだけheap情報を参考値として記録する。

## Risks / Trade-offs

- [iOSが写真ライブラリの画像を選択時に別形式へ変換し、元形式とFile情報が一致しない] → `accept="image/*"`だけを指定し、返却File情報と実デコード結果を記録して、形式名だけで拒否しない。
- [HEIC対応がSafariとChrome、写真ライブラリとファイル選択で異なる] → 入口とブラウザごとに同じ画像を選び、結果を分けて記録する。失敗時はJPEG・PNGへの変換を本実装の代替案として判断する。
- [EXIF Orientationがdecoder経路で二重適用または無視される] → 向きと寸法を識別できるOrientation fixtureをCanvasへ描き、`createImageBitmap`経路と`img.decode`経路を比較する。
- [48MP級の写真を一度デコードする時点でピークメモリが高くなる] → 正規化後すぐ元sourceを解放し、10回の繰り返しで安定性を確認する。問題が残る場合はブラウザのresize decode、段階縮小、選択前変換を後続候補にする。
- [4096px・12MPという候補上限が画質またはメモリのどちらかに適さない] → 2160px候補と比較し、最大4倍表示の画質と実機安定性から本実装値を決める。
- [Canvas描画で広色域やHDRの見え方が変わる] → 元画像要素と正規化後canvasを並べて目視し、色差を結果へ記録する。初期リリースでのHDR保持は保証しない。
- [input cancelイベントやOS pickerの選択肢がブラウザで異なる] → cancelイベントだけに依存せず、Fileが得られない場合は無変更として扱い、Safari・Chrome別に実UIを記録する。
- [共有化の移動が既存カメラF/Sを壊す] → 純粋モジュールと型だけを移し、既存52テストとカメラF/S routeの基本操作を回帰確認する。
- [F/Sコードが本番品質と誤認される] → route、feature名、画面表示、結果文書でspikeと明示し、完了時にファイル単位の扱いを決める。
- [Android固有のdecoder・picker問題を発見できない] → 今回の合否から外した事実を結果へ残し、リリース前の実機確認項目にする。

## Migration Plan

1. ロードマップへこのF/Sの開始、対象環境、Android除外を記録する。
2. deterministic fixtureと純粋な縮小寸法・状態・cleanup処理を作り、単体テストを追加する。
3. カメラF/Sの純粋な座標・gestureモジュールを`shared/lib`へ移し、既存挙動を維持する。
4. 写真decode portとbrowser adapterを作り、`createImageBitmap`、fallback、向き、正規化、明示解放を実装する。
5. F/S routeへfile input、写真調整、mask合成、診断、失敗・再選択を結線する。
6. ローカル品質検査とSWA CLIで通常画面、既存カメラF/S、写真F/S routeを確認する。
7. PRプレビューを作成し、iPhone Safari・Chromeで形式、入口、向き、高解像度、繰り返し操作を確認する。
8. `docs/spikes/photo-import.md`へ定量値、制約、採否、コードの扱い、後続changeへの影響を記録する。
9. delta specをmain specsへ同期せず、完了後は`--skip-specs`でarchiveする。

通常画面または既存カメラF/Sへ回帰が生じた場合は、写真F/S routeと共有化をrevertして以前の構成へ戻す。サーバー状態やAzureリソースのmigrationはない。

## Open Questions

- `accept="image/*"`からSafari・Chromeの写真ライブラリ、OSカメラ、ファイル選択が実際に返す形式とMIME typeは何か。
- HEIC・HEIFは両ブラウザ・両入口で標準APIだけから安定してデコードできるか。OSによるJPEG等への変換は発生するか。
- `createImageBitmap({ imageOrientation: 'from-image' })`と`HTMLImageElement.decode()`でOrientation 1・3・6・8の向きと寸法が一致するか。
- 4096px・12MP上限は48MP級の写真で安定し、最大4倍の構図調整に十分な画質を保てるか。2160px上限の方が適切か。
- 一回のCanvas縮小で細線や文字の品質は十分か。多段縮小が必要か。
- 広色域・HDR写真をCanvasへ描いた際に、初期リリースで許容できない色差が生じるか。
- 10回以上の選択・選び直し後も処理時間と操作性を維持し、一時リソースの解放漏れを疑う症状がないか。
- browser adapterと共有化した純粋ロジックのどこまでを本実装へ昇格できるか。

## References

- [WHATWG HTML: File Upload state](https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file))
- [W3C HTML Media Capture](https://www.w3.org/TR/html-media-capture/)
- [W3C File API](https://www.w3.org/TR/FileAPI/)
- [WHATWG HTML: ImageBitmap](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html)
- [WebKit Features in Safari 17.0: HEIC](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)
- [WebKit Features in Safari 17.2: Image Orientation](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/)
- [WebKit bug 202458: createImageBitmap with resize option](https://bugs.webkit.org/show_bug.cgi?id=202458)
- [WebKit bug 303803: file input acceptとHEIC変換](https://bugs.webkit.org/show_bug.cgi?id=303803)
