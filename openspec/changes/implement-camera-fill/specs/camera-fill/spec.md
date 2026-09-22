## ADDED Requirements

### Requirement: 中央固定のArea選択

アプリケーションは、制作画面で中央に固定した選択枠と、その背後を横方向へ移動する非循環のArea一覧を表示し、中央のAreaを現在の編集対象として確定しなければならない（SHALL）。

#### Scenario: 制作画面を初めて開く

- **WHEN** 1件以上のAreaを持つ制作sessionで制作画面を開く
- **THEN** catalog順の先頭Areaが中央の選択枠へ配置され、編集対象として選択される

#### Scenario: 一覧を横へスクロールする

- **WHEN** 利用者がArea一覧を横へスクロールして操作を終える
- **THEN** 一覧は先頭から末尾の範囲内で最も中央に近いAreaへsnapし、そのAreaを編集対象として確定する

#### Scenario: 中央以外のAreaをタップする

- **WHEN** 利用者が中央以外に表示されたAreaをタップする
- **THEN** そのAreaが中央の選択枠へ移動し、編集対象として確定する

#### Scenario: 一覧の端を選択する

- **WHEN** 利用者が先頭または末尾のAreaを選択する
- **THEN** 一覧の端部余白によってそのAreaを中央まで移動でき、一覧は反対側へ循環しない

### Requirement: 明示操作によるカメラ開始

アプリケーションは、選択中Areaに対する「景色から切り取る」操作からだけカメラ開始へ進み、初回の`getUserMedia()`より前にカメラを使う理由と続行・キャンセルを日本語と英語で表示しなければならない（SHALL）。タイトル、template選択、制作画面の表示だけを理由にカメラを取得してはならない（MUST NOT）。

#### Scenario: 初めてカメラで塗る

- **WHEN** 利用者が制作sessionで初めて選択中Areaの「景色から切り取る」を操作する
- **THEN** アプリケーションはカメラをまだ取得せず、利用理由、続行、キャンセルを表示する

#### Scenario: 利用理由を確認して続行する

- **WHEN** 利用者が利用理由の表示から続行する
- **THEN** アプリケーションは音声を要求せず、背面カメラを優先してstream取得を開始し、重複する開始操作を防ぐ

#### Scenario: 利用理由の表示をキャンセルする

- **WHEN** 利用者がカメラ取得前にキャンセルする
- **THEN** アプリケーションはカメラを取得せず、同じAreaを選択した制作画面へ戻る

### Requirement: カメラ権限と取得失敗からの復帰

アプリケーションは、利用可能な場合はカメラ権限の事前状態を補助的に確認し、`getUserMedia()`の結果を正本として、権限拒否、カメラなし、読取不能、制約不成立、API未対応、その他の失敗を安全な製品状態へ分類しなければならない（SHALL）。外部例外の本文、camera label、画像内容を利用者向け表示または外部logへ出してはならない（MUST NOT）。

#### Scenario: 権限が事前に拒否されている

- **WHEN** Permissions APIがカメラ権限を`denied`として確実に返す
- **THEN** アプリケーションはbrowserまたは端末設定の確認方法、もう一度試す操作、制作画面へ戻る操作を表示する

#### Scenario: 権限照会が利用できない

- **WHEN** Permissions APIがカメラ権限を照会できない、または状態を確定できない
- **THEN** アプリケーションは事前照会だけで開始を禁止せず、明示操作後の`getUserMedia()`で成否を判定する

#### Scenario: getUserMediaで権限を拒否される

- **WHEN** `getUserMedia()`が`NotAllowedError`で失敗する
- **THEN** アプリケーションは権限拒否として設定確認と再試行を案内し、未停止のtrackを残さない

#### Scenario: 利用できるカメラがない

- **WHEN** `getUserMedia()`がカメラ非搭載または未接続を示して失敗する
- **THEN** アプリケーションは端末・OS・browserの認識状態を確認する案内、再試行、制作画面へ戻る操作を表示する

#### Scenario: カメラを読み取れない

- **WHEN** `getUserMedia()`が他アプリによる使用中、制約不成立、API未対応、またはその他の取得失敗を返す
- **THEN** アプリケーションは分類に応じた翻訳済み説明、再試行、制作画面へ戻る操作を表示し、外部error本文を直接表示しない

### Requirement: カメラ切替と鏡像表示

アプリケーションは、取得後に前面・背面の両方を利用できると判定した場合だけ切替操作を表示し、切替中も選択Areaと現在のArtworkを保持しなければならない（SHALL）。前面カメラはpreviewと撮影結果をともに左右反転しなければならない（MUST）。

#### Scenario: 前面と背面を切り替える

- **WHEN** 両方の向きを利用できる端末で利用者がカメラ切替を操作する
- **THEN** アプリケーションは旧trackを停止して反対向きのstreamを取得し、選択Area、撮影済みArea、未編集Areaを変更しない

#### Scenario: 前面カメラを使用する

- **WHEN** 実際に使用中のcamera facingが`user`である
- **THEN** live previewとシャッターで固定するframeは同じ左右反転の鏡像になる

#### Scenario: 一方向だけを利用できる

- **WHEN** 取得後に利用可能なvideo inputが一方向だけである
- **THEN** アプリケーションは撮影を継続可能にし、利用できない切替操作を表示しない

### Requirement: 作品とlive映像の比較表示

アプリケーションは、取得済みのline art、順序付きmask、現在のArtwork、撮影frame、選択中Areaのlive映像をCanvas 2Dで同じ1080×1080座標系へ合成し、現在の作品とカメラ全体との表示比率を0%から100%まで連続的に変更できなければならない（SHALL）。

#### Scenario: カメラを開始する

- **WHEN** camera streamとvideo frameが利用可能になる
- **THEN** 表示比率は100%から開始し、撮影済みAreaには各frame、未編集Areaには初期色、選択中Areaには不透明なlive映像、最前面にはline artを表示する

#### Scenario: 表示比率を0%にする

- **WHEN** 利用者がsliderまたは端部操作で表示比率を0%にする
- **THEN** アプリケーションは現在のArea fillを隠し、カメラ全体のlive映像とline artを表示する

#### Scenario: 表示比率を中間にする

- **WHEN** 利用者が表示比率を0%より大きく100%より小さい値にする
- **THEN** アプリケーションは全体live映像と現在の作品を比率に応じて重ね、選択中Area内のlive映像は薄くせず不透明に保つ

#### Scenario: 離れた複数形状を持つAreaを表示する

- **WHEN** 選択中AreaのPNG maskが離れた複数の不透明形状または中間alphaを含む
- **THEN** アプリケーションは同じ映像変換をmaskのalpha全体へ適用し、mask外へ映像を漏らさない

### Requirement: live映像のpanとpinch

アプリケーションは、正方形の編集領域内から開始したPointer Eventsについて、1本指dragでlive映像の位置を、2本指pinchで倍率を変更できなければならない（SHALL）。映像変換は作品領域に映像のない余白が現れない倍率・移動範囲へ制限しなければならない（MUST）。

#### Scenario: 1本指で移動する

- **WHEN** 利用者が編集領域内から1本指dragを開始し、指を領域外まで移動する
- **THEN** pointer captureにより操作を継続し、制限後の位置でも作品領域に映像のない余白を表示しない

#### Scenario: 2本指で拡大縮小する

- **WHEN** 利用者が編集領域内へ2本の指を置き、その距離と中点を変更する
- **THEN** 映像は中点を基準に連続的に拡大縮小し、許容する最小倍率から最大倍率の範囲に収まる

#### Scenario: 操作部品からgestureを開始する

- **WHEN** 利用者がslider、シャッター、切替、キャンセルまたは編集領域外からdragやpinchを開始する
- **THEN** アプリケーションはそのgestureでlive映像の位置・倍率を変更せず、ページの通常操作を不必要に抑止しない

#### Scenario: 編集領域を操作する

- **WHEN** 利用者がcameraの編集領域でpanまたはpinchする
- **THEN** アプリケーションはその領域に限ってbrowserのページscrollとページzoomとの競合を防ぐ

### Requirement: 撮影とArea上書き

アプリケーションは、シャッター時のvideo frame、位置、倍率、鏡像状態を選択中Areaへ固定し、確認画面を挟まず現在のArtworkへ反映しなければならない（SHALL）。既存のcamera fillを再撮影した場合は、他Areaを変更せず選択Areaだけを原子的に上書きしなければならない（MUST）。

#### Scenario: 未編集Areaを撮影する

- **WHEN** 利用者がlive映像を調整してシャッターを操作する
- **THEN** アプリケーションはその瞬間のframeを選択中Areaのcamera fillとして反映し、cameraを停止して更新済み作品を表示する制作画面へ戻る

#### Scenario: 撮影済みAreaを撮り直す

- **WHEN** 利用者がcamera fill済みAreaを再選択し、新しいframeを撮影する
- **THEN** アプリケーションは選択Areaだけを新frameへ置き換え、他Areaのfillとframeを保持し、旧frameを解放する

#### Scenario: 作品previewの更新に失敗する

- **WHEN** 新frameから更新済み作品previewを生成できない
- **THEN** アプリケーションは新frameを解放し、撮影前のArtwork、frame、previewを維持して再試行または制作画面へ戻る操作を表示する

### Requirement: カメラresourceの停止とデータ保護

アプリケーションは、cameraの撮影完了、キャンセル、画面離脱、component破棄、制作session終了、またはdocumentが非表示になった時点で、保持する全video trackと描画loopを停止しなければならない（MUST）。カメラ映像と撮影frameをnetworkへ送信または永続保存してはならない（MUST NOT）。

#### Scenario: Cameraをキャンセルする

- **WHEN** 利用者がlive表示または取得失敗画面からキャンセルする
- **THEN** アプリケーションはtrackと描画loopを停止し、Artworkを変更せず同じAreaを選択した制作画面へ戻る

#### Scenario: Backgroundへ移行する

- **WHEN** camera取得中またはlive表示中にdocumentのvisibility stateが`hidden`になる
- **THEN** アプリケーションは取得済みtrackを停止し、foreground復帰時に自動再取得せず、利用者の明示操作を待つ

#### Scenario: Camera取得完了前に画面を離れる

- **WHEN** camera streamの非同期取得中に利用者がcancel、route離脱、またはsession終了を行い、その後取得が完了する
- **THEN** アプリケーションは遅れて取得した全trackを停止し、camera画面を再表示しない

#### Scenario: Cameraで撮影する

- **WHEN** 利用者がlive映像からAreaを撮影する
- **THEN** アプリケーションは映像とframeをbrowser memory内だけで処理し、serverまたは外部serviceへ送信しない

