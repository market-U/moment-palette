## Why

カメラで作った作品は制作画面まで表示できるが、現時点では一枚の完成PNGへ統合して保存・共有する導線がない。画像共有F/Sで確定した方式を製品の制作sessionと画面遷移へ組み込み、ユーザーが未着色エリアを残したままでも完成、保存、共有まで完了できるようにする。

## What Changes

- 制作中のArtwork、decode済みtemplate asset、Areaごとのfillを1080×1080のPNG Blobへ一度だけ合成し、完成確認画面へ遷移する導線を追加する。
- 通常の画像要素による長押し保存案内、Web Shareによる画像・固定の紹介文・ハッシュタグ・アプリURLの共有、File共有不可時の共有文コピーと手動コピーfallbackを実装する。
- 共有シートのキャンセルを通常状態へ戻し、Web Share・Clipboard・PNG生成の失敗を安全な翻訳済み状態へ分類して再試行または制作画面へ戻れるようにする。
- 完成PNG Blobとobject URLを完成確認中の表示・複数回の共有で再利用し、Artwork変更、session終了、route離脱時に一度だけ破棄する。
- 完成確認画面から制作へ戻る、または「もういちど遊ぶ」でタイトルへ戻る画面遷移を追加し、制作途中のresourceと完成画像を適切に解放する。
- 画像共有F/Sで採用したpayload構築、共有結果分類、browser adapter、resource所有権を製品構成へ移設し、不要になるF/S専用UI・route・fixtureを削除する。

## Capabilities

### New Capabilities

- `completed-artwork`: 完成PNGの生成、完成確認、長押し保存、OS共有、共有文fallback、完成画像resourceのライフサイクルを定める。

### Modified Capabilities

- `creation-session`: 制作sessionが完成画像resourceを所有・解放し、完成確認と制作画面の遷移でも同一sessionを安全に維持する要件を追加する。

## Impact

- `src/app/`のcomposition rootと制作sessionサービス、`src/pages/`の制作・完成確認画面、`src/features/`の完成画像生成・共有用portと状態、`src/infrastructure/`のCanvas、Web Share、Clipboard adapterを変更する。
- 既存の`image-sharing-spike`のうち製品へ昇格するコードを移設し、F/S専用route・UI・fixtureを削除する。バックエンドAPI、Azureリソース、新規依存、画像のサーバー送信・永続保存は追加しない。
- 日本語・英語の翻訳リソース、router、単体テスト、`docs/development-roadmap.md`を更新する。iPhone Safari・ChromeでPNG生成、長押し保存、共有、キャンセル、fallbackを確認する。
