## Why

後続のカメラ・画像処理F/Sを正式対応予定のiPhoneおよびAndroid実機で検証するには、ローカルネットワークへ依存せずHTTPSでアクセスできる共有可能な環境が必要である。フェーズ1のVueアプリケーションを継続的に検査・配信できる最小構成を先に確立し、F/Sごとにデプロイ手順を作り直す状態を避ける。

## What Changes

- Azure Static Web Apps Freeに、現在のVueアプリケーションを配信する検証環境を追加する。
- Azureリソースを再現可能に作成・更新できる、最小限の宣言的IaCと実行手順を追加する。
- pull requestと`main`ブランチの変更に対して、既存の型検査、単体テスト、lint、format検査、production buildを実行するGitHub Actionsを追加する。
- `main`ブランチの品質検査とbuildが成功した場合に、生成済みの静的成果物をSWAへデプロイする。
- Portalが生成するワークフローテンプレートをそのまま採用せず、実装時点のAzure Static Web Apps公式仕様、公式Actionの入力定義、GitHub Actions公式推奨事項を確認してワークフローを管理する。
- 外部GitHub Actionを検証済みcommitへ固定し、DependabotがActionの更新PRを週次で作成できる設定を追加する。
- SPAのURLを直接開いた場合もアプリケーションを表示できる、最小限の`staticwebapp.config.json`を追加する。
- HTTPSのSWA URLをiPhoneおよびAndroidの実機で開き、アプリケーションシェルを表示できることを確認する。
- 検証環境のデプロイ経路とAzure構成を、編集可能なソースと確認用画像を持つ暫定アーキテクチャ図へ記録する。
- Blob Storage、マネージドAPI、SAS URL、カスタムドメイン、本番向けキャッシュ・監視・リリース継続性はこのchangeの対象外とする。

## Capabilities

### New Capabilities

- `preview-deployment`: 実機F/Sに使用するSWA検証環境の再現可能な構築、HTTPS配信、SPA設定、デプロイ、および実機確認を定める。

### Modified Capabilities

- `frontend-development-quality`: GitHub Actionsが既存の非対話品質検査とproduction buildを自動実行し、検査済み成果物だけをデプロイ対象にする要件を追加する。

## Impact

- `.github/workflows/`へCI・デプロイワークフローを、`.github/dependabot.yml`へGitHub Actionsの更新設定を追加する。
- Azureリソース定義、環境別パラメーター例、構築・認証・デプロイ手順をリポジトリへ追加する。
- `staticwebapp.config.json`と、その設定を含むproduction build成果物を追加する。
- `docs/architecture/`へ暫定構成図と説明を追加し、`README.md`へ必要な開発・運用手順を追記する。
- Azureサブスクリプション、検証用リソースグループ、SWA Freeリソース、およびGitHub Actionsのデプロイ用secretが必要になる。
- アプリケーションの機能、公開API、Blob Storage、依存方向には変更を加えない。
