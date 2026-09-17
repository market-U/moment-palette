## Why

Moment Palette は要求と画面設計の基準版を整備済みだが、アプリケーションコードと、後続の機能を安全に追加するための開発基盤がまだ存在しない。モバイル向けWebアプリとして必要な機能を段階的に実装・検証できるよう、責務境界を備えたフロントエンド基盤を先に確立する。

## What Changes

- Vue 3、Vite、TypeScript を用いたフロントエンドプロジェクトを作成する。
- design段階で、基本ディレクトリ構成、各層の責務、画面・ユーザー操作・作品状態・外部入出力の依存方向、将来の実装を差し替え可能にする境界の追加方針を対話的に検討して合意する。
- タイトル画面、ルーティング、日本語・英語の切替、モバイル向けの基本レイアウトを備えた最小限のアプリケーションシェルと、公開可能なクライアント設定の扱い方針を用意する。
- 合意した構成と依存ルールを実装開始前に `docs/architecture/` へ記録し、単体テスト、lint、format、README、`.gitignore`、`AGENTS.md` を整備する。
- カメラ、Canvas、Web Share、Azureテンプレート取得の実装およびAzureリソースの構築は、このchangeの対象外とし、後続changeまたは技術F/Sで行う。

## Capabilities

### New Capabilities

- `frontend-application-foundation`: モバイル向けアプリケーションシェルと、画面・ドメイン・外部依存を分離するフロントエンドの基本構成を提供する。
- `frontend-development-quality`: 一貫したローカル開発、静的解析、整形、単体テストを行うための開発ツールと手順を提供する。

### Modified Capabilities

なし。

## Impact

- 新規のVue 3/Vite/TypeScriptソース、テスト、設定ファイル、パッケージマネージャーのロックファイルを追加する。
- 後続機能でブラウザAPIや外部データ取得を追加する際の依存方向と、利用側にportを定義する方針を記録する。今回利用しないportや開発用実装は追加しない。
- designで合意したソース構成とモジュール依存を `docs/architecture/` へ記録し、README、`.gitignore`、`AGENTS.md` を更新する。
- 本番のAzure Static Web Apps、Blob Storage、マネージドAPI、カメラ、Canvas、Web Shareの具体的な実装・接続には変更を加えない。
