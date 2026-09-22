## Context

`establish-creation-session`により、Start時の互換性確認、catalog snapshot、全template assetのdecode、初期Artwork、表示用PNG、tab内で一つの制作sessionを所有する境界が製品コードへ導入された。現在の制作画面は初期作品と単純なエリアボタンを表示するだけで、Artworkのfillは`initial`だけを表し、sessionも作成後に更新されない。

`validate-camera-compositing`では、iPhone 15（iOS 26）のSafari・Chromeで、Canvas 2Dによるlive mask合成、Pointer Eventsによるpan・pinch、背面・前面切替、前面の鏡像、撮影・上書き、track解放を確認した。純粋な座標・gesture処理は既に`shared/lib`へ移されており、camera portとbrowser adapterはF/S型へ依存したまま、compositorとUIは固定template・診断表示に閉じている。

このchangeではF/Sの方式を製品のtemplate asset、Artwork、制作sessionへ統合する。次の制約を守る。

- `domain`はVue、Canvas、MediaStream、HTML要素を知らず、作品の意味だけを表す。
- camera featureが利用側のport、状態遷移、失敗分類を所有し、`infrastructure`のbrowser adapterをimportしない。
- decode済みtemplate asset、撮影frame、表示resource、camera trackは所有者と解放境界を一つにする。
- camera起動後もrelease、catalog、template assetを再取得しない。
- 画像はbrowser memory内だけで処理し、network送信または永続化しない。
- UIは日本語・英語に対応し、Figmaの構成を基準にしつつ、具体的な余白やアイコンをdomainや画像処理へ結合しない。

## Goals / Non-Goals

**Goals:**

- 中央固定の選択枠と横方向のsnap一覧で、制作対象Areaを一つ選択できるようにする。
- 明示操作と利用理由の説明後にカメラを起動し、背面優先、可能な場合の前面・背面切替、キャンセル、再試行を提供する。
- 現在の作品、選択中Areaのlive映像、全体映像、line artを一つのCanvas rendererで表示する。
- 作品比較slider、1本指pan、2本指pinch、cover制約、前面カメラの鏡像をF/Sと同じ規則で製品導線へ移す。
- 撮影frameを選択中Areaへ原子的に反映し、他Areaを保ったまま撮り直し・上書きできるArtworkとresource所有を確立する。
- 権限拒否、カメラなし、使用中、制約不成立、未対応、想定外失敗を分類し、安全な復帰操作を提供する。
- camera F/Sから採用する実装とtestを製品moduleへ移し、専用route、固定asset、診断UIを削除する。

**Non-Goals:**

- 写真取り込み、写真調整、単色塗りを実装すること。
- 完成画面、1080×1080完成PNG、長押し保存、Web Shareを実装すること。
- 選択中Areaの輪郭asset生成または輪郭表示を必須にすること。
- 超広角・望遠などの個別レンズ選択を提供すること。
- 制作sessionを永続化し、再読み込みや別tabで復元すること。
- Azure、template API、catalog schema、依存packageを変更すること。
- Android Chromeの実機確認をこのchangeの完了条件にすること。

## Decisions

### 1. Artworkはfillの意味だけを持ち、撮影frameはsession resourceとして分離する

`ArtworkArea.fill`を`initial`と`camera`の判別可能なunionへ拡張し、純粋関数で指定Areaだけをcamera fillへ更新する。`camera` fillはCanvasを保持せず、Area IDに対応する撮影resourceがsession側に存在するという意味を表す。撮影frameはArea IDをkeyとするresource集合へ保持する。

これによりdomainをbrowser APIから分離したまま、後続changeで`photo`と`solid-color`を同じfill unionへ追加できる。Canvas自体をArtworkへ格納する案はdomainの依存規則とserializableなview stateを壊すため採用しない。BlobへencodeしてArtworkへ保持する案も、撮影ごとのencode・decode負荷と追加のobject URL所有を生むため採用しない。

### 2. Artworkとresourceの更新はsession内で原子的にcommitする

制作sessionは現在のArtwork、Areaごとの撮影frame、現在の静的previewを所有する編集可能なresource controllerを持つ。撮影時は次の順序で更新する。

1. videoの現在frameを1080×1080のdetached canvasへ変換込みで固定する。
2. 純粋関数で選択Areaだけを`camera` fillにした次のArtworkを作る。
3. 既存frame集合へ新frameを仮適用し、次の静的previewを生成する。
4. すべて成功した場合だけArtwork、frame、previewを一括で置き換える。
5. commit後に旧previewと同じAreaの旧frameを解放する。失敗時は新しく作ったresourceだけを解放し、従来の作品を維持する。

session全体の置換・終了では、template asset、全撮影frame、previewを冪等に解放する。Vueのrefをresource所有者にせず、所有者の更新後にapp serviceがview stateを再公開する。これによりroute離脱、reset、`pagehide`が重なっても二重解放しない。

### 3. camera featureが状態機械とportを所有し、app serviceが制作sessionへ結線する

`features/camera-fill`へcamera表示状態、permission probe、camera stream port、compositor port、失敗分類、撮影use caseを置く。状態は少なくとも`closed`、`rationale`、`requesting`、`live`、`capturing`、`denied`、`unavailable`を区別し、外部例外本文をviewへ渡さない。

app serviceは現在のsessionと選択Areaをcamera controllerへ渡し、成功した撮影結果をsessionへcommitする。page/componentはserializableなview stateとcommandを使い、`infrastructure`をimportしない。video要素とcanvas要素はcamera UIが保持し、portへ渡す最小targetとして扱う。

camera処理を`CreationPage.vue`だけへ直接実装する案は、MediaStream、描画loop、Artwork更新、resource解放が表示責務へ混在するため採用しない。Piniaは一つのtab・一つのsessionに閉じた所有関係を不明瞭にするため追加しない。

### 4. 権限説明とPermissions APIの事前照会を補助的に使う

session内で最初に「景色から切り取る」を選んだときは、`getUserMedia()`より前に利用理由と続行・キャンセルを表示する。Permissions APIで`camera`を照会できる環境では開始操作時の補助情報として使い、`denied`なら設定変更案内を先に表示する。未対応、`prompt`、不正確な応答では取得を禁止せず、最終判定は`getUserMedia()`の成否と例外名にする。

説明をアプリ起動時に出す案は、利用者がカメラを選んでいない段階で権限文脈を提示するため採用しない。Permission queryだけで取得可否を決める案もbrowser差があるため採用しない。

### 5. camera stream adapterはF/Sの所有規則を製品portへ移す

初回は`audio: false`と`facingMode: { ideal: 'environment' }`で取得する。取得後にvideo input数とtrack settingsを確認し、前面・背面を利用できる場合だけ切替操作を表示する。切替時は旧trackを停止してから反対向きのstreamを取得し、選択Areaと作品状態を保持する。settingsが向きを返さない場合は要求した向きをfallbackとする。

開始・切替の非同期raceにはoperation IDを使う。キャンセル、background移行、route離脱後に遅れて取得が完了した場合も、新streamを即時停止してUIへ復帰させない。adapterは全track停止とvideo target解除を冪等に行う。

F/Sの`cameraPort.ts`と`browserCameraStream.ts`は型の所属先を製品featureへ移し、error mappingとcleanup testを維持する。camera API自体をcomposition rootから直接操作する案は採用しない。

### 6. 製品Canvas compositorは取得済みtemplate assetとsession frameだけを描画する

compositorはsessionが持つline art、順序付きmask、Artwork、撮影frameを入力にし、独自にassetをloadしない。描画座標は1080×1080へ統一し、maskのalphaを二値化せず、catalog順にAreaを描き、line artを最後に前面へ描く。

live previewはF/Sと同じ二面構成にする。

1. source planeへ変換済みカメラ全体を描く。
2. artwork planeへ現在の各fillを描き、選択Areaだけはlive映像で置き換える。
3. source planeを不透明で描き、artwork planeをslider値のalphaで重ねる。
4. line artを不透明で一度だけ描く。

このためsliderの中間値でも、両面に同じlive sourceを持つ選択Areaは薄くならない。0%では全体映像とline art、100%では現在作品と選択Area内のlive映像になる。slider両端の操作は0%と100%を直接設定し、初期値は100%とする。

preview canvasのbacking storeはCSS寸法とdevice pixel ratioから求め、1080pxを上限にする。静的な制作previewと撮影frameは1080×1080を維持する。WebGL、CSS mask、DOM screenshotは、F/SでCanvas 2Dが約60fpsで成立しており描画経路を増やすため採用しない。

### 7. pan・pinchは既存shared純粋ロジックを再利用する

`shared/lib/mediaTransform.ts`と`pointerGesture.ts`を製品camera UIから利用する。カメラsourceは作品領域全体を常にcoverする最小倍率から4倍までに制限し、移動後も映像のない余白を出さない。初期transformは中央coverとする。

編集canvasだけへ`touch-action: none`を指定し、active pointerをcaptureする。slider、シャッター、切替、キャンセルから始まる操作はtrackerへ渡さない。cameraを停止または閉じるとtrackerをclearする。

mask boundsだけをcoverして移動自由度を広げる案は、slider 0%の全体映像で余白が見えるため採用しない。写真は余白を許す別policyを後続changeで使用する。

### 8. エリア選択はCSS scroll snapと中央距離の確定ロジックを組み合わせる

制作画面のArea一覧は循環させず、`scroll-snap-type`と各項目の`scroll-snap-align: center`を使う。container幅に応じた両端paddingにより先頭・末尾も中央へ移動できるようにする。初期表示では先頭項目を中央へ置く。

選択確定は、scrollが静止した時点でcontainer中央に最も近い項目をArea IDへ変換する。`scrollend`だけには依存せず、scroll eventを短いdebounceで補完する。項目tapでは`scrollIntoView({ inline: 'center' })`を行い、移動完了後に同じ確定処理を通す。中央距離の計算はDOMから分離して単体テストする。

選択中Areaはcameraを開いた時点で固定し、別Areaへ変える場合は制作画面へcancelで戻る。camera画面内にもArea carouselを重複配置する案は操作密度とstate同期を増やすため採用しない。

### 9. 失敗表示は分類済みcodeだけを翻訳し、復帰先を保つ

`NotAllowedError`、`NotFoundError`、`NotReadableError`、`OverconstrainedError`、API未対応、その他を製品codeへ変換する。権限拒否はbrowser・端末設定の確認と再試行を、カメラなし・使用中・制約不成立・その他は原因に応じた説明と再試行を表示する。すべての失敗で制作画面へ戻れる。

写真・単色への実操作は後続changeまで存在しないため、このchangeでは未実装ボタンを先取りしない。案内文として代替手段が後続で利用可能になることを示す場合も、操作可能と誤認させない。外部error message、camera label、画像内容は画面や外部logへ出さない。

### 10. lifecycle停止をUI操作とbrowser eventの両方から保証する

撮影成功、キャンセル、camera UI unmount、制作route離脱、session終了、`visibilitychange`でhiddenになった時点に共通の停止処理を呼ぶ。backgroundから戻っても自動再取得せず、利用者の明示操作を必要とする。撮影後は確認画面を挟まず制作画面へ戻し、カメラは停止した状態にする。

F/S専用route、page、feature UI、固定camera asset、専用asset loader、診断表示は、製品routeで回帰確認できた同じchange内で削除する。archive済みchange内の原本と`docs/spikes/camera-compositing.md`は検証記録として保持する。

## Risks / Trade-offs

- [撮影frameとpreviewの置換途中で失敗し、Artworkとresourceが不整合になる] → 新しいframe・Artwork・previewを仮生成し、成功時だけ一括commitする。失敗時は新resourceだけを解放するtestを追加する。
- [camera取得の非同期完了がcancelやroute離脱後にUIを復帰させる] → operation IDとdisposed/visibility判定で古い完了を無効化し、取得済みtrackを停止する。
- [Permission APIのcamera照会が未対応または不正確である] → 照会は補助に限定し、`getUserMedia()`の結果を正本にする。
- [track settingsが実際と異なるfacing modeを返し鏡像判定を誤る] → settingsを優先しつつ要求値をfallbackにする。既知の端末差として実機確認へ残す。
- [複数の1080px canvasがmobile memoryを圧迫する] → Areaごとにframeを一つだけ所有し、上書き時に旧backing storeを0へ戻す。previewも常に一つだけ保持する。
- [Area carouselのscroll確定がbrowserごとに揺れる] → CSS snapに加えて中央距離を純粋計算し、`scrollend`非対応でもdebounceで確定する。iPhone両browserで操作確認する。
- [制作画面とcamera画面の切替で描画loopが残る] → live状態だけrequestAnimationFrameを継続し、停止処理で必ずcancelする。
- [F/S route削除により検証用入口を失う] → 採用した回帰testを先に製品moduleへ移し、製品routeで同等操作を確認してから削除する。履歴と実機結果はarchiveとspike文書に残る。
- [後続の写真・単色追加でArtwork unionやcompositorが変わる] → fill種別とresourceを分離し、compositorを入力方式ごとのsource解決と共通mask描画へ分ける。用途未確定の共通抽象化はこのchangeで作らない。

## Migration Plan

1. Artwork fill union、camera fill更新の純粋関数、session内resource置換を追加し、原子的commitと冪等解放を単体テストする。
2. F/Sのcamera port・browser adapter・error分類を製品`camera-fill`へ移し、既存testを製品型へ付け替える。
3. 製品Canvas compositorをdecode済みtemplate assetとArtworkに接続し、描画順、slider alpha、鏡像、撮影frame、上書きを単体テストする。
4. camera controller、permission補助、非同期race、visibility lifecycleを実装して単体テストする。
5. 中央固定Area carouselとcamera UIを制作pageへ接続し、日本語・英語の状態・操作・エラー文言を追加する。
6. 製品導線で回帰確認後、camera F/S route、page、feature、固定asset、診断用infrastructureを削除する。
7. 単体テスト、型検査、lint、format、production build、OpenSpec validateを実行する。
8. HTTPSのPR previewでiPhone Safari・Chromeの権限、切替、slider、pan、pinch、撮影、撮り直し、cancel、background、route離脱を確認する。

rollback時は製品camera UIとArtwork拡張を戻し、初期作品だけの制作画面へ戻す。外部API、catalog、Azure resourceを変更しないためcloud側のrollbackは不要である。ただしF/S専用routeを戻す必要がある場合は、同じcommit系列から固定assetを含めて復元する。

## Open Questions

- 中央固定のArea選択とslider両端の星アイコンが説明なしで伝わるかは、製品UIをiPhoneで試用して確認する。要求を満たす範囲の見た目調整はこのchange内で行う。
- 小さいAreaや離れた複数形状が輪郭なしで判別しにくい場合は、輪郭asset生成を後続changeとして切り出す。camera fillの完了条件には含めない。
- Android Chrome固有のcamera、gesture、facing mode挙動は端末確保後のリリースフォロー項目とする。
