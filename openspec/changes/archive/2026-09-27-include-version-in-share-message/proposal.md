## Why

共有文だけでは、どのMoment Paletteの版で作品を作ったかを確認できない。タイトル画面と同じフロントエンド版を共有文へ含め、投稿後の問い合わせや再現時に利用した版を特定できるようにする。

## What Changes

- 完成画像のOS共有と共有文コピーで使うテキストに、`package.json`由来のフロントエンド版を`v<version>`形式で追加する。
- タイトル画面に表示する版と共有文に含める版が、同じbuild metadataを参照するようにする。

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

- `completed-artwork`: OS共有とコピー用の共有文へフロントエンド版を含める。

## Impact

- `CompletedArtworkPage`の共有文組み立て
- `sharePayload`とその単体テスト
- 完成確認・共有の仕様
