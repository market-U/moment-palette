# F/S用Azureインフラストラクチャ

このディレクトリは、実サービス本番ではなく技術F/S専用のAzure Static Web Apps（SWA）を定義する。

## 採用したリソース定義

2026-09-18にMicrosoft公式の[`Microsoft.Web/staticSites` Bicepリファレンス](https://learn.microsoft.com/azure/templates/microsoft.web/staticsites)を確認し、安定版API `2025-03-01`とFree SKU（`name: Free`、`tier: Free`）を採用した。

- [`main.bicep`](main.bicep): リソースグループスコープで一つのSWA Freeを管理する。
- [`environments/fs.bicepparam`](environments/fs.bicepparam): F/S用の名前、確定したリージョン、識別タグを保持する。

2026-09-18にAzure CLIで対象サブスクリプションを確認し、SWAの利用可能リージョンにEast Asiaが含まれること、Azure内部名が`eastasia`であること、`moment-palette-fs-market-u-20260918`と同名のSWAが対象サブスクリプション内に存在しないことを確認した。値はいずれも秘密情報ではない。リソース名は衝突を避けるため、プロジェクト、用途、所有者、確認日を組み合わせている。

## 管理境界

BicepはSWAリソースだけを作成し、GitHub連携、GitHub Actions workflow、repository secretは作成しない。`skipGithubActionWorkflowGeneration`を有効にしてPortal相当のworkflow自動生成も抑止する。デプロイトークンやGitHub認証情報をparameter、output、ファイルへ含めない。
