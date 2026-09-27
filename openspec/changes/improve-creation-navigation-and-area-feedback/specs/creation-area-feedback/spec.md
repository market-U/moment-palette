## ADDED Requirements

### Requirement: 選択中Areaの作品preview上での強調表示

アプリケーションは、制作画面の現在のArtwork preview上に、`selected-area.png`の斜線patternを選択中Areaのdecode済みmaskで切り抜いた透明Canvasを重ねなければならない（SHALL）。強調表示はCanvas要素全体のCSS `opacity` animationで点滅させ、JavaScript timerまたは`requestAnimationFrame`による連続描画を開始してはならない（MUST NOT）。強調表示はArtwork previewのobject URL、Artwork、template assetを変更せず、追加のtemplate asset取得を行ってはならない（MUST NOT）。

#### Scenario: Areaを選択する
- **WHEN** 利用者が制作画面でAreaを選択する
- **THEN** アプリケーションは選択中Areaのmask内だけに斜線patternを強調し、mask外のArtwork previewを変更しない

#### Scenario: Areaを切り替える
- **WHEN** 利用者が横スクロールまたはArea itemのタップで別のAreaを選択する
- **THEN** アプリケーションは新しい選択Areaのmaskへ強調表示を更新する

#### Scenario: 強調表示を描画できない
- **WHEN** 表示補助用Canvasの描画に失敗する
- **THEN** アプリケーションは現在のArtwork previewとArea選択を維持し、制作sessionを破棄しない

#### Scenario: 動きを減らす設定を利用する
- **WHEN** 利用者の環境が`prefers-reduced-motion: reduce`を指定する
- **THEN** アプリケーションは点滅animationを開始せず、静的な強調表示を維持する
