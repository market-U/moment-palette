## MODIFIED Requirements

### Requirement: 選択中Areaの作品preview上での強調表示

アプリケーションは、制作画面の現在のArtwork preview上に、`selected-area.png`の斜線patternを選択中Areaのdecode済みmaskで切り抜いた透明Canvasを重ねなければならない（SHALL）。さらに、アプリケーションは斜線Canvasより前面に、decode済みline artだけを描いた独立した透明Canvasを重ねなければならない（SHALL）。静的Artwork previewはAreaの塗りだけを含め、前面の線画CanvasへCSS animationを適用してはならない（MUST NOT）。

アプリケーションは、Artwork preview上で同じpointerによるpointerdownとpointerupの移動距離が8 CSS px以下であるとき、表示領域の座標を1080×1080のArtwork座標へ変換し、その位置のAreaを選択しなければならない（SHALL）。hit testは制作sessionが所有するdecode済みmaskから一度だけ構築したhit mapを使い、alpha値128以上の画素だけをArea内として、pointer操作ごとに全maskを走査してはならない（MUST NOT）。hit mapはArtworkと同じ描画順で重なりを解決し、最前面のAreaを返さなければならない（MUST）。

強調表示はCanvas要素全体のCSS `filter` animationで`hue-rotate()`と`brightness()`を時間変化させ、JavaScript timerまたは`requestAnimationFrame`による連続描画を開始してはならない（MUST NOT）。強調表示はArtwork previewのobject URL、Artwork、template assetを変更せず、追加のtemplate asset取得を行ってはならない（MUST NOT）。既存のArea selectorは、preview tapの有無に関わらず選択操作と支援技術向けの経路として維持しなければならない（MUST）。

#### Scenario: Areaを選択する

- **WHEN** 利用者が制作画面でAreaを選択する
- **THEN** アプリケーションは選択中Areaのmask内だけに斜線patternを強調し、mask外のArtwork previewを変更しない

#### Scenario: Areaを切り替える

- **WHEN** 利用者が横スクロールまたはArea itemのタップで別のAreaを選択する
- **THEN** アプリケーションは新しい選択Areaのmaskへ強調表示を更新する

#### Scenario: Artwork preview上のAreaをtapする

- **WHEN** 利用者がArtwork preview上の不透明なmask領域を8 CSS px以下の移動でtapする
- **THEN** アプリケーションはその位置のAreaを選択し、Area selectorと強調表示を同じAreaへ更新する

#### Scenario: mask外をtapする

- **WHEN** 利用者がArtwork preview上でどのAreaのmaskにも含まれない位置をtapする
- **THEN** アプリケーションは現在のArea選択と強調表示を変更しない

#### Scenario: 重なったmask領域をtapする

- **WHEN** 利用者が複数のArea maskが重なる位置をtapする
- **THEN** アプリケーションはArtworkの描画順で最前面となるAreaを選択する

#### Scenario: preview上でscrollまたはdragする

- **WHEN** 利用者のpointer操作がcancelされる、別pointerで終了する、またはpointerdownから8 CSS pxより大きく移動する
- **THEN** アプリケーションはArea選択を変更せず、browserの通常scrollを妨げない

#### Scenario: 表示倍率またはdevice pixel ratioが変わる

- **WHEN** Artwork previewのCSS表示サイズまたはdevice pixel ratioが変わる
- **THEN** アプリケーションはCSS座標をArtwork座標へ変換して同じmask位置を判定し、Canvasのbacking store解像度へ依存しない

#### Scenario: 強調表示を描画できない

- **WHEN** 表示補助用Canvasの描画に失敗する
- **THEN** アプリケーションは現在のArtwork previewとArea選択を維持し、制作sessionを破棄しない

#### Scenario: 斜線の色相と明度を変化させる

- **WHEN** 選択中Areaの強調表示が表示される
- **THEN** アプリケーションはCanvasを再描画せず、CSS `filter` animationによって斜線の色相と明度を時間変化させる

#### Scenario: 選択maskが線画と重なる

- **WHEN** 選択中Areaのmaskがline artの不透明な画素と重なる
- **THEN** アプリケーションは線画を斜線patternより前面に静的に表示し、斜線のCSS animationを線画へ適用しない
