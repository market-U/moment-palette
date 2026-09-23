## 1. 共通レイアウト基盤

- [x] 1.1 `app/styles.css`へセーフエリア、画面padding、header、本文幅の共通CSS custom propertiesを追加する。
- [x] 1.2 `shared/ui/ScreenShell.vue`を追加し、セーフエリア、三列header、左右slot、本文slot、画面内スクロールを提供する。
- [x] 1.3 `ScreenShell`のslot配置、空slot時のheader位置、scroll領域を確認する単体テストを追加する。
- [x] 1.4 `shared/ui/BackButton.vue`を追加し、アイコン、label、十分な操作領域、disabled、click emitを提供する。
- [x] 1.5 `BackButton`のラベル、無効状態、click通知を確認する単体テストを追加する。

## 2. 既存画面への適用

- [x] 2.1 タイトル画面を`ScreenShell`へ移行し、言語切替をheader右slotに配置したままheroの固有レイアウトを維持する。
- [x] 2.2 テンプレート選択画面を`ScreenShell`と`BackButton`へ移行し、page handlerで開始状態をリセットしてタイトルへ遷移する。
- [x] 2.3 制作画面を`ScreenShell`と`BackButton`へ移行し、page handlerで制作sessionをテンプレート選択へ戻してから遷移する。
- [x] 2.4 テンプレート選択と制作画面から`LanguageSwitcher`を除去し、タイトル以外で言語切替を表示しない。
- [x] 2.5 pageの個別safe area・header位置指定を除去し、本文固有の背景、幅、余白、スクロール可能性を維持する。

## 3. 検証

- [x] 3.1 既存テストを更新し、戻る操作でpage側のsession処理とroute遷移が維持されることを確認する。
- [x] 3.2 `pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build`を実行する。
- [x] 3.3 iPhone Safari・Chromeでタイトル、テンプレート選択、制作のheader位置、safe area、スクロール、言語切替の配置、戻る操作を確認する。

## 4. 撮影対象選択部品の分割

- [x] 4.1 `AreaSelector`内のArea選択button markupとstyleを、`camera-fill` feature内の`AreaSelectorItem`へ切り出す。
- [x] 4.2 選択状態、撮影済み表示、選択通知を確認する`AreaSelectorItem`の単体テストを追加する。
- [x] 4.3 `pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build`を実行する。
