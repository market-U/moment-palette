## Why

制作画面から戻ると、確認なしに制作sessionを破棄してしまう。さらに、現在の編集対象が作品previewとエリアセレクタのどちらからも判別しづらく、エリア一覧もmaskの形状ではなく補助テキストを表示しているため、直感的に対象を選べない。

## What Changes

- 制作画面から作品を破棄する遷移に、破棄確認とキャンセル操作を追加する。
- 制作画面の静的作品preview上に、選択中Areaのmaskで切り抜いた斜線patternを重ね、CSS animationで点滅表示する。
- 制作画面では線画を斜線patternより前面の独立した静的Canvasへ描き、選択maskが線画を覆わないようにする。
- 横スクロールArea selectorから名前・初期色・fill状態の補助テキストを取り除き、mask形状のサムネイルを表示する。

## Capabilities

### New Capabilities

- `creation-area-feedback`: 制作画面で選択中Areaを作品previewとselectorへ視覚的に対応付ける。

### Modified Capabilities

- `creation-session`: 制作内容を破棄するroute遷移前の確認を追加する。
- `camera-fill`: 中央固定のArea選択にmaskサムネイルを表示する。

## Impact

- `src/app/assets/selected-area.png`、`src/pages/CreationPage.vue`、Artwork preview、Area selector、制作session facadeとCanvas compositor
- 制作画面の日本語・英語翻訳resourceと単体テスト
- 外部API、template形式、保存済みArtworkには変更なし
