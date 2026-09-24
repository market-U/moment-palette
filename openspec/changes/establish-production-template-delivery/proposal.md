## Why

フロントエンドの主要機能は製品schemaに準拠する開発用catalogで確認できている一方、実際のテンプレート配信はF/S用Azure環境とF/S APIに留まっている。実機確認を継続してきた既存のSWAとprivate Blob Storageを初期本番環境として昇格し、任意の時点で安全にリリースできる配信経路へ移行する。

## What Changes

- 既存のF/S Azure Static Web Apps、private Blob Storage、復旧設定を初期本番基盤として継続利用し、製品運用向けのIaC、タグ、手順、アーキテクチャ記録へ移行する。
- F/SのManaged Functionsを製品`GET /api/templates`契約へ移行し、`TEMPLATE_CATALOG_FILE`で環境ごとのcatalog JSONを選択する。すべての環境は同じprivate Storageとrevision付きtemplate assetを共有する。
- フロントエンドの開発用catalog adapterを本番API adapterへ差し替え、開始時のrelease情報・API response・frontend build IDの照合と、開始後に取得済み資源だけで作品を完了できる性質を維持する。
- `release`ブランチを本番配信元、`main`を統合候補のデフォルトブランチとして扱う。`main`と`release`向けPRには一時プレビューを提供し、`release`へのpushだけがProduction環境を更新する。
- デプロイトークン、Application Settings、catalog/asset公開・停止・復旧、リリースとロールバックの手順を本番運用向けに整備し、F/S専用の設定・route・fixture・診断表示を製品移行の確認後に削除する。

## Capabilities

### New Capabilities

- `production-template-delivery`: private Blob、Managed Functions、catalog/asset運用を用いて、製品templateを安全かつ復旧可能に配信する。

### Modified Capabilities

- `preview-deployment`: F/S用の`main`固定配信を、`release`だけがProductionを更新する本番配信・PRプレビュー構成へ変更する。
- `template-selection`: 開発用catalog adapterから製品`GET /api/templates`へ接続し、製品schemaのtemplateを制作開始へ渡すように変更する。

## Impact

- `.github/workflows/preview-deployment.yml`、GitHub branch protection・Actions secret、既存SWA Application Settings。
- `infra/`、Azure Resource Group・SWA・Storage・Blob data、`docs/architecture/`、`docs/spikes/`、`README.md`、開発ロードマップ。
- `api/`のFunctions endpoint・catalog reader・Service SAS signer・設定・テスト、`src/app/`のcomposition root、template-selectionのproduction adapter、F/S専用コードとテスト。
