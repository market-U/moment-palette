## Why

制作画面ではArea selectorからしか編集対象を選べないため、作品上の形状と編集対象を直接対応付けにくい。previewをタップしてAreaを選べるようにし、細かな形状でも意図した領域へ素早く移れるようにする。

## What Changes

- Artwork preview上のtapを、対応するArea選択へ変換する。
- decode済みmaskから制作sessionごとに一度だけヒットマップを構築し、tapのたびに全maskを走査しない。
- mask外、maskの重なり、スクロール・dragとの競合に対する選択規則を定める。
- 既存の横スクロールArea selectorを、キーボードと支援技術を含む選択経路として維持する。

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

- `creation-area-feedback`: Artwork previewのtapから現在のAreaを選択する操作を追加する。

## Impact

- `ArtworkAreaHighlight`、`CreationPage`、制作session facade、Canvas compositorと単体テスト
- session内のdecode済みmaskを使う一時的なヒットマップCanvas
- 外部API、template形式、Artworkデータ、完成PNG、追加asset取得には変更なし
