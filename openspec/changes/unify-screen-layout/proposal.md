## Why

タイトル、テンプレート選択、制作の各画面で、セーフエリアを含むヘッダーの余白と左右の操作位置を個別に指定している。そのため同じ役割の操作が画面ごとにずれ、次の画面追加でもレイアウトの不整合を増やすおそれがある。

## What Changes

- `shared/ui/ScreenShell.vue`を追加し、モバイル縦向き画面のセーフエリア、共通ヘッダー、左右の操作slot、本文幅を一貫して提供する。
- `shared/ui/BackButton.vue`を追加し、戻る操作の見た目、アイコン、操作領域、無効状態、click通知を共通化する。遷移先の決定と制作sessionの操作はpageに残す。
- タイトル、テンプレート選択、制作画面を共通shellへ移行し、共通の余白・ヘッダー・本文幅をCSS custom propertiesで定義する。
- 言語切替は仕様どおりタイトル画面のヘッダー右側だけに配置し、テンプレート選択と制作画面からは除去する。

## Capabilities

### New Capabilities

- なし。

### Modified Capabilities

- `frontend-application-foundation`: モバイル向けアプリケーションshellに、画面横断で再利用するヘッダーと戻る操作のレイアウト要件を追加する。

## Impact

- 影響範囲は`src/shared/ui/`、タイトル・テンプレート選択・制作のpage、および共通スタイルである。
- ルーター、制作sessionの所有権、外部API、依存パッケージは変更しない。
