## Context

現在のタイトル、テンプレート選択、制作の各pageは、セーフエリアを含むpadding、headerの最大幅、左右の操作を個別のscoped CSSで持つ。言語切替も三画面に重複して配置されているが、画面仕様で言語切替を置くのはタイトルだけである。制作sessionを破棄・復帰する判断とroute遷移はpageおよびrouterにあり、共通UIへ移してはならない。

## Goals / Non-Goals

**Goals:**

- 三画面でセーフエリア、header、本文幅の基準を共有し、同じ役割の操作を同じ位置に配置する。
- 戻る操作の見た目とアクセシビリティを再利用しつつ、pageが遷移とsession操作を所有し続ける。
- 共通寸法をCSS custom propertiesに集約し、後続画面でも同じ基準を使えるようにする。
- 言語切替をタイトル画面だけへ戻す。

**Non-Goals:**

- ルーターのroute guard、制作sessionの破棄確認またはresource所有権を変更しない。
- カメラ、写真、完成確認など未実装の画面を先行して共通shellへ移行しない。
- UIライブラリ、アイコンパッケージ、状態管理ライブラリを追加しない。
- 背景、カード、個別画面の本文レイアウトを一律化しない。

## Decisions

### `shared/ui`にslotベースの画面shellを置く

`ScreenShell.vue`はVueとCSSだけに依存する汎用部品とし、`header-left`、`header-right`、既定slotを提供する。shellが全画面のセーフエリアpadding、headerの高さと最大幅、本文幅、縦方向のスクロール責務を持つ。pageは見出し、背景、本文の余白など固有の内容だけを指定する。

共通shellをpageやfeatureへ置く案は、後続画面から再利用するたびに依存方向または責務を崩すため採用しない。全画面を単一の固定headerへする案は、タイトル画面のhero中心レイアウトを不必要に制限するため採用しない。

### 共通寸法をrootのCSS custom propertiesとして定義する

`app/styles.css`に、画面のinline padding、block padding、header最大幅、content最大幅、header最小高さを表す`--screen-*`変数を置く。`ScreenShell`がその変数を基準値として用い、画面ごとの本文幅だけをpropまたはCSS custom propertyで狭められるようにする。

個別pageへ同じ`env(safe-area-inset-*)`式を複写する案は、今回のずれを再発させるため採用しない。数値をVue propとして各pageに渡す案は、レイアウト調整をmarkupへ分散させるため採用しない。

### BackButtonは通知専用にする

`BackButton.vue`はアイコン付きのnative buttonとして、label、disabled、click emitだけを公開する。遷移先、confirm、`returnToTemplates()`、`resetToStart()`などの副作用はpropsにも持たせず、利用するpageのhandlerで実行する。

routerを部品へ注入する案や、遷移先・callbackをpropsとして受け取る案は、`shared/ui`がappやfeatureへ依存する境界を招き、戻る操作ごとのsession処理を見えにくくするため採用しない。

### 言語切替はタイトルの右slotだけに置く

翻訳リソースと現在localeは維持し、`LanguageSwitcher`の配置だけをタイトル画面の`header-right` slotに限定する。テンプレート選択と制作は左slotに`BackButton`を置き、右slotは空にする。

画面ごとに言語切替を残す案は、画面仕様と異なり、共通header上の操作位置を再び不揃いにするため採用しない。

## Risks / Trade-offs

- [既存pageのスクロール領域がshellと二重になる] → pageから全画面paddingとoverflowを外し、shellだけが縦スクロールを持つことを単体テストと手動確認で確認する。
- [slotが空のheaderで左右の位置が崩れる] → headerを同一の三列gridとして実装し、中央・左右の枠を常に保持する。
- [BackButtonが遷移を持たないため利用側のhandlerが増える] → session操作を判断できるpageに明示的なhandlerを残し、routerの既存guardと二重にresource解放しないことを確認する。
- [iPhoneのsafe areaと動的viewportで位置が変わる] → `env(safe-area-inset-*)`と既存の`100dvh`基盤をshellへ集約し、Safari・Chromeで確認する。

## Migration Plan

1. 共通変数、`ScreenShell`、`BackButton`と単体テストを追加する。
2. タイトル、テンプレート選択、制作を順にshellへ移行し、page固有の背景と本文レイアウトを保持する。
3. 言語切替をタイトル以外から除去し、戻るhandlerが従来どおりsession処理後にroute遷移することを確認する。
4. 静的検査、単体テスト、production buildと、iPhone Safari・Chromeの手動確認を実行する。

変更は純粋なクライアントUIであり、データ移行や段階的配信は不要である。不具合時はpageを従来の個別レイアウトへ戻せる。

## Open Questions

- なし。戻る操作が破棄確認を表示する後続changeでは、確認の状態と判断はpageに残したまま同じ`BackButton`を使う。
