## Why

初期リリースで利用者が気持ちを自由な色として作品へ表現するには、カメラと写真に加えて単色でAreaを塗る導線が必要である。現在のArtworkとCanvas合成は初期色・カメラ・写真だけを扱うため、単色を確定前に確認して安全に上書きできる製品導線を追加する。

## What Changes

- 制作画面の選択Areaに対し、「気持ちからつくる」から全画面の単色調整画面を開く。
- 単色調整画面に不透明色だけを扱う標準の`input[type="color"]`を配置し、色を何度でも選び直しながら作品全体をライブプレビューできるようにする。
- 選択Areaが既に単色の場合はその色を、それ以外の場合はAreaの`initialColor`を初期選択色にする。反映時だけArtworkへ単色を確定し、キャンセル時は既存Artworkを保つ。
- Artwork、制作中preview、完成PNGの合成に不透明な単色fillを追加し、既存のcamera・photo・初期色を単色で上書きできるようにする。
- 色候補のプリセットパレット、透明色、独自カラーピッカーライブラリは追加しない。標準inputの実機操作性を確認してから必要時に再評価する。
- 日本語・英語の導線、色選択、反映、キャンセルの文言を追加し、画面遷移・UI状態の文書を実装内容へ更新する。

## Capabilities

### New Capabilities

- `solid-color-fill`: 標準カラーピッカーを使った単色の選択、全画面プレビュー、反映・キャンセルを定める。

### Modified Capabilities

- `creation-session`: 単色をAreaへ確定して表示resourceと完成PNGを無効化する制作sessionの責務を追加する。
- `completed-artwork`: 単色fillを含むArtworkを1080×1080の完成PNGへ合成する要件を追加する。

## Impact

- 影響箇所: `src/domain/template.ts`、制作session service、Artwork preview／完成PNGのCanvas adapter、制作画面、単色塗りfeature、i18n、関連単体テスト。
- 依存追加、ネットワーク通信、永続保存、外部サービスへの送信は行わない。
- `docs/design/screen-flow.md`、`docs/design/ui-states.md`、`docs/development-roadmap.md`を実装結果に合わせて更新する。
