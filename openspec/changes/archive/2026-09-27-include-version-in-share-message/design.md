## Context

タイトル画面はbuild metadataから公開される`session.appVersion`を`v<version>`形式で表示している。完成確認画面は共有・コピーの双方で同じ`shareCopy`を`sharePayload`へ渡すが、現状は紹介文、ハッシュタグ、URLだけであり、フロントエンド版を含めない。

## Goals / Non-Goals

**Goals:**

- OS共有と共有文コピーのテキストへ、タイトル画面と同じ`v<version>`を追加する。
- 共有とコピーが常に同一の文面を使う既存経路を維持する。

**Non-Goals:**

- `package.json`のversion値、build ID、API version、release metadataの変更。
- 共有用File、Web Share API、Clipboard API、共有画面の見た目の変更。

## Decisions

### 完成確認画面で公開済みのappVersionを共有文へ渡す

`CompletedArtworkPage`はタイトル画面と同じcreation session facadeから`appVersion`を読む。`shareCopy`に`version`を加え、共有とコピーが既存どおり同じ`createCompletedArtworkShareText()`を通るようにする。画面で改めて`package.json`や生成済みmetadataをimportしないため、表示中の版と共有する版が分岐しない。

### 版は独立した`v<version>`行として末尾へ追加する

紹介文、ハッシュタグ、URLの改行区切りを維持し、URLの後ろに`v<version>`を追加する。既存の固定文面を変更せず、タイトル画面と同じ表記で人が読み取れる。

## Risks / Trade-offs

- [共有先が複数行のtextを一部しか扱わない] → 既存の共有文も改行区切りであり、版だけを追加して共有APIのデータ形式を変えない。
- [表示版と共有版がずれる] → 両方ともsession facadeの`appVersion`を唯一の入力とする。
