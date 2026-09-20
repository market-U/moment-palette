## Context

Moment Paletteは、カメラのスルー映像を選択中エリアの形へ切り抜き、位置と倍率を調整して撮影し、複数エリアと線画を端末内で一枚のPNGへ合成する体験を中核にする。現時点のアプリケーションはタイトル画面とF/S用SWA配信基盤だけを持ち、カメラ、ジェスチャー、Canvas描画、作品状態は未実装である。

このchangeは本実装ではなく、技術方式と実機上の成立性を判断するF/Sである。対象実機はiPhone 15（iOS 26）のSafariとChromeとし、Android Chromeは端末を確保できるリリース後のフォロー項目にする。写真ライブラリ、共有、単色塗り、Azureテンプレート配信は別の問いとして分離する。

ブラウザ標準では、カメラはsecure context上の`navigator.mediaDevices.getUserMedia()`から取得し、不要になった`MediaStreamTrack`へ`stop()`を呼ぶ。タッチ操作はPointer Eventsとpointer captureを使用し、ブラウザ標準のpan・zoom抑止はイベントの`preventDefault()`だけに依存せず、編集領域へ事前に`touch-action`を指定する。Canvas 2Dは`HTMLVideoElement`の現在frameを`drawImage()`でき、`HTMLCanvasElement.toBlob()`からPNG Blobを生成できる。

## Goals / Non-Goals

**Goals:**

- HTTPS上の明示的なユーザー操作からカメラを取得し、背面優先、可能な場合の前面・背面切替、停止、再試行を検証する。
- 本番候補`文鳥01`の4マスク、撮影済みエリア、初期色、線画、ライブ映像を同じ座標系でCanvas 2Dへ合成する。
- 作品とカメラ全体の表示比率、1本指移動、2本指ピンチ、余白を防ぐ制約をiPhone実機で検証する。
- `背景`、`ボディ`、`くちばし`、`口の中`の4エリアについて撮影、撮り直し、上書きを行い、1080×1080 PNGを生成する。
- 純粋な座標計算とブラウザAPI接続を分離し、本実装へ昇格できる部分を判定する。
- 操作性、安定性、処理時間、画像品質、ブラウザ差、未解決事項を再現可能な結果として残す。

**Non-Goals:**

- 本番用の制作画面、完成画面、作品状態、デザインを完成させること。
- 写真ライブラリ・ファイル取り込み、HEIC/HEIF、EXIF Orientation、Web Share、長押し保存を検証すること。
- 単色塗り、カラーピッカー、選択中エリアの輪郭生成を検証すること。
- Azure Blob Storage、マネージドAPI、SAS URL、テンプレートカタログを構築すること。
- Android Chromeをこのchangeの完了条件にすること。
- 撮影画像または完成画像をサーバーへ送信・保存すること。

## Decisions

### 1. 既存アプリ内の専用spike featureとして隔離する

F/S画面を`/spikes/camera-compositing`の遅延読み込みrouteとして追加し、通常のタイトル画面と明確に分離する。配置は既存の依存規則に従い、画面を`src/pages/`、F/S固有のUI・状態・port・純粋計算を`src/features/camera-compositing-spike/`、ブラウザのカメラ具体実装を`src/infrastructure/`、実行用アセットを`public/spikes/camera-compositing/`へ置く。

提供された原本はchange内の`文鳥01/`へ保持し、変更しない。実装時は`線画.png`と4マスクだけをASCII名へrenameして`public/`へコピーし、`サムネイル.png`はコピーしない。これにより、URL encodingや開発時の誤編集による影響を避けつつ、archive後も検証時点の原本を追跡できる。

独立したViteアプリを追加する案は本番コードとの分離が最も明確だが、build・SWA配信・ルーティングを二重管理し、既存PRプレビューでの実機確認を複雑にする。専用routeと`-spike`命名で削除境界を明示し、通常画面からリンクしないことで、単一buildのまま隔離する。

F/S画面はURLを知る人がアクセスできる公開プレビューである。固定アセット以外を配信せず、取得した画像はブラウザメモリ内だけで扱う。

### 2. 追加ライブラリを使わずCanvas 2Dで表示と出力を統一する

非表示の`<video playsinline muted>`をframe sourceとし、表示は`requestAnimationFrame`でCanvas 2Dへ描画する。ライブプレビューと最終PNGで同じrendererと座標変換を使用し、CSS mask、DOM screenshot、WebGL、描画ライブラリは採用しない。

描画は次の二つの画像面を作り、表示比率`r`で補間した後に線画を一度だけ最前面へ描く。

1. `source plane`: 調整中のカメラ映像を正方形全体へ描く。
2. `artwork plane`: 未撮影エリアの初期色、撮影済みエリア、選択中マスク内のライブ映像を描く。
3. `source plane`を不透明で描き、`artwork plane`を`r`のalphaでsource-over合成する。選択中エリアは両面で同じカメラ映像となるため、中間値でも透過させない。
4. 線画を不透明で描く。

各エリアは一時canvasへ映像または撮影済みframeを描き、`globalCompositeOperation = 'destination-in'`でPNGマスクを適用してから作品canvasへ転送する。一つのマスクに離れた複数形状があってもalpha全体をそのまま利用する。

CSS maskはライブ表示を簡潔にできるが、最終PNGと異なる描画経路になり、ブラウザ差の原因を切り分けにくい。WebGLは性能面の余地がある一方、shader、texture、context lossという追加の検証対象が生じるため、この最小F/Sでは採用しない。

### 3. 論理座標を1080×1080へ統一し、プレビュー解像度だけ端末へ適応する

テンプレート、マスク、線画、撮影結果、変換計算は1080×1080の論理座標へ統一する。ライブプレビューcanvasのbacking storeは表示サイズと`devicePixelRatio`から求め、1080pxを上限にする。最終出力は表示サイズにかかわらず専用canvasで必ず1080×1080として再描画する。

本番候補`文鳥01`は、すべて1080×1080・alpha付きの`線画.png`、`背景.png`、`ボディ.png`、`くちばし.png`、`口の中.png`で構成される。`サムネイル.png`も同じ寸法だが全layerの結合画像であり、このF/Sでは使用しない。4マスクは次のalpha bounding boxを持ち、`くちばし.png`には離れた複数形状が含まれる。

| エリア | 原本 | alpha bounding box |
| --- | --- | --- |
| 背景 | `背景.png` | `1080×1080 +0,+0` |
| ボディ | `ボディ.png` | `867×905 +180,+175` |
| くちばし | `くちばし.png` | `384×607 +373,+216` |
| 口の中 | `口の中.png` | `267×421 +424,+365` |

mask境界には中間alphaが含まれるため、二値化せず原本のalphaを合成へ使う。bounding boxはalphaが0より大きいpixelを含む矩形として固定メタデータへ記録し、asset検査と診断に使う。実行時にmask pixelを毎frame走査する案は不要な負荷になるため採用しない。

`背景`と`ボディ`には、線画で覆われる左右の輪郭付近にalpha 50%以上の重なりが720 pixelある。他のmask組合せに同水準の重なりはない。これは原本の境界特性として加工せず保持し、areaの配列順で`背景`、`ボディ`の順に描いてボディを優先する。実機と生成PNGで線画下の漏れやhaloを確認し、テンプレート仕様として許容できるかを結果へ記録する。

### 4. 座標と倍率の制約を純粋関数にする

映像変換は、sourceの自然寸法、作品の論理寸法、mask bounding box、倍率、X/Y offsetで表す。次の計算をVueとCanvas APIから独立したTypeScript純粋関数にし、単体テストする。

- sourceを1080×1080の作品領域全体へ隙間なくcoverする最小倍率。
- 最小倍率から検証用最大倍率までのclamp。
- 変換後のsource矩形がmask bounding boxを覆うX/Y offsetのclamp。
- 1本指の差分によるpan。
- 2本指の距離比と中点を保つpinch。
- プレビュー座標と1080px論理座標の相互変換。

表示比率0%ではカメラ映像を正方形全体へ表示するため、sourceは1080×1080の作品領域全体を常にcoverするよう制約する。この条件は選択中maskのalpha領域も同時にcoverし、表示比率を動かしても映像のない余白を生じさせない。mask bounding boxは境界検査と診断へ使用し、本実装でmask形状に応じたより広い移動範囲が必要かをF/S結果から判断する。

### 5. Pointer Eventsとpointer captureで1本指・2本指を統一する

編集canvasへ`touch-action: none`を静的に指定し、active pointerを`pointerId`ごとのMapで管理する。最初のpointerではpan、二つ目が加わった時点でpinch開始時の距離、中点、変換を保存し、pointer moveごとに純粋関数から新しい変換を得る。各pointerは`setPointerCapture()`し、`pointerup`、`pointercancel`、`lostpointercapture`で必ず破棄する。

`touch-action`は編集canvasだけに適用し、スライダー、シャッター、切替、画面全体の通常スクロールには適用しない。Touch Eventsを直接扱う案は、mouse入力との二重実装になり、pointer capture相当の継続処理も別途必要になるため採用しない。

モバイルではカメラ表示中だけシャッターをviewport下部に固定し、プレビュを見たまま撮影できるようにする。これはF/S画面固有の配置であり、本番UIのレイアウト決定とは分離する。

### 6. カメラportとtrack所有者を一つにする

feature側に、開始、向き切替、停止、現在設定取得を要求する最小portを定義し、`navigator.mediaDevices`を使う実装を`infrastructure`へ置く。ストリーム所有者はこのadapter一つに限定し、停止処理は保持する全trackへ冪等に`stop()`を呼んでvideoの`srcObject`を解除する。

初回は`audio: false`と`facingMode: { ideal: 'environment' }`を指定する。権限取得後に`enumerateDevices()`とtrack settingsを記録し、複数video inputを識別できる場合だけ切替操作を有効にする。iPhoneで向きを切り替える際は、既存trackを停止してから反対の`facingMode`で新しいstreamを要求する。個別レンズの選択やdevice labelの永続利用は行わない。

track settingsの`facingMode`が`user`の場合は、前面カメラと判定して映像sourceを水平反転する。settingsが向きを返さないブラウザでは要求した向きをfallbackにする。構図と生成PNGを一致させるため、ライブプレビューだけでなく撮影用detached canvasにも同じ鏡像変換を適用する。ブラウザが実際の向きと異なるsettingsを返す端末は未解決の制約とする。

Permissions APIによる事前照会はブラウザ差があるため、利用可能な場合の診断補助に留める。状態判定の正本は`getUserMedia()`の成否と例外名にし、`NotAllowedError`、`NotFoundError`、`NotReadableError`、`OverconstrainedError`、その他へ大別して画面に表示する。

カメラの有無を権限取得前に確実に判定できないブラウザがあるため、`enumerateDevices()`の事前結果だけで開始操作を無効化しない。`getUserMedia()`が`NotFoundError`を返した場合に、搭載・接続とOS・ブラウザの認識状態を確認する案内を表示する。本実装では、写真取り込みを代替導線として併記する。

### 7. 撮影frameはエリアごとのdetached canvasとして保持する

シャッター時にvideoの現在frameを1080×1080のdetached `HTMLCanvasElement`へ変換込みで描き、選択中エリアの撮影sourceとしてメモリ内に保持する。作品描画時にそのcanvasへPNG maskを適用する。撮り直し時は古いcanvasの寸法を0へ戻して参照を破棄する。

撮影ごとにPNGへencodeして再decodeする案は、圧縮・復号時間が操作感の測定へ混ざる。`ImageBitmap`や`OffscreenCanvas`は有効な最適化候補だが、このF/Sでは互換性の広いDOM canvasを基準にし、処理時間またはメモリに問題が出た場合だけ後続判断として記録する。

### 8. PNG Blobとobject URLの所有期間を明示する

完成操作では1080×1080 canvasへ現在の全エリア、初期色、線画を描き、`toBlob(callback, 'image/png')`でBlobを生成する。Blobの`type`、decode後の画像寸法、生成時間を画面と結果記録へ出す。表示用object URLは常に一つだけ保持し、再生成前とunmount時に`URL.revokeObjectURL()`する。

Canvasがtaintedにならないよう、F/Sでは同一originの固定アセットとMediaStream由来videoだけを描画する。Azure BlobとSAS URLのCORSは`validate-azure-template-delivery`で別に検証する。

### 9. visibilityとroute lifecycleでは安全側に停止する

撮影完了、キャンセル、route離脱、component unmount、`visibilitychange`でhiddenになった時点に共通cleanupを呼ぶ。バックグラウンドから戻った場合は自動再取得せず、画面上の再開操作を必要とする。ブラウザに権限が保持されていても、意図せずカメラを再起動しないことを優先する。

### 10. 自動検査と実機チェックリストを分ける

単体テストは座標変換、pan、pinch、clamp、描画順を決めるscene入力、cleanupの冪等性を対象にする。ブラウザカメラ、複数指、権限UI、camera indicator、実際のPNG品質はSWA PRプレビュー上の実機チェックリストで確認する。

F/S画面には診断用として、ブラウザが返したvideo寸法・facing mode、表示canvas寸法、概算render FPS、直近の撮影時間、PNG生成時間、エラー名を表示する。30秒の連続操作と10回の撮影・撮り直しをSafariとChromeで行い、停止、顕著な劣化、camera indicatorの解放漏れがないことを確認する。計測API自体にブラウザ差があるため、JavaScript heap量は必須判定にせず、取得できる場合だけ参考値として記録する。

## Risks / Trade-offs

- [iOSのSafariとChromeが同じエンジン系列でも権限UIやアプリ状態遷移に差が残る] → 両ブラウザで同じチェックリストを実行し、結果を別々に記録する。
- [カメラのdevice数、label、facing modeが端末や許可状態で異なる] → 背面優先を保証ではなくconstraintとして要求し、取得後のsettingsと実映像で判定する。切替不能でも撮影経路は継続可能にする。
- [1080px Canvasを毎frame描画すると発熱やframe dropが起きる] → プレビューbacking storeを表示寸法とDPRに合わせて上限1080pxとし、最終出力だけ1080pxへ固定する。実機結果からWebGL等の再検討条件を残す。
- [実素材の中間alphaとCanvasの合成順序によって縁にhaloや映像漏れが出る] → `文鳥01`の原本alphaを二値化せず使い、ライブ表示と生成PNGを拡大して確認する。
- [作品領域全体をcoverする制約がmaskだけをcoverする場合より移動範囲を狭くする] → 表示比率0%の全画面表示との一貫性を優先し、UX上問題なら表示面ごとに変換を分ける方式を後続候補にする。
- [detached canvasを複数保持してメモリを消費する] → 4エリアに限定し、撮り直し・unmount時に参照とbacking storeを解放する。実機で10回繰り返して劣化を確認する。
- [バックグラウンド移行時にブラウザ側でtrackがmuteされるだけの場合がある] → visibility hiddenでアプリ側から全trackを明示停止する。
- [F/Sコードがそのまま本番品質と誤認される] → route、feature名、画面表示、結果文書でspikeと明示し、完了時にファイル単位で昇格・再実装・削除を決定する。
- [Androidの固有問題をこのchangeでは発見できない] → Androidを合否から外した事実と未検証項目を結果へ残し、リリース前に実機確認する。

## Migration Plan

1. `文鳥01/`の原本を保持し、`サムネイル.png`を除いた線画と4マスクを実行用ASCII名でコピーして、寸法、alpha、bounding box、形状を静的に検査する。
2. 純粋な座標・倍率計算と単体テストを作成する。
3. カメラport、ブラウザadapter、cleanupを作成し、デスクトップブラウザで基本動作を確認する。
4. Canvas renderer、Pointer Events、撮影状態、PNG生成をF/S routeへ統合する。
5. ローカル品質検査とSWA CLIでroute・SPA fallbackを確認する。
6. PRプレビューを作成し、iPhone SafariとChromeでチェックリストを実行する。
7. 結果を`docs/spikes/camera-compositing.md`へ記録し、vision・design・ロードマップへの反映事項を整理する。
8. 純粋ロジックを本実装へ昇格するか、設計を保って再実装するかを判断し、F/S専用route、UI、固定アセット、診断表示を削除するか明示的に残置理由を記録する。

不具合が通常画面または既存デプロイへ影響する場合は、F/S routeとその参照をrevertしてタイトル画面だけの状態へ戻す。Azureリソースの変更は行わない。

## Open Questions

- iPhone 15の実測で、Canvas 2Dのプレビュー品質と操作追従性は本実装へ採用できるか。WebGLを検討する閾値は何か。
- 作品領域全体をcoverする移動制約で十分な構図自由度が得られるか。
- `facingMode`と`enumerateDevices()`だけで、利用可能な前面・背面切替を混乱なく提供できるか。
- ライブ表示と生成PNGの色、向き、cropにSafariとChromeで差が出るか。
- 純粋な変換・rendererロジックのどこまでを本実装へ昇格できるか。

## References

- [W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/)
- [W3C Pointer Events](https://www.w3.org/TR/pointerevents/)
- [WHATWG HTML: Canvas](https://html.spec.whatwg.org/multipage/canvas.html)
- [WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- [WebKit Features for Safari 26.1](https://webkit.org/blog/17541/webkit-features-for-safari-26-1/)
