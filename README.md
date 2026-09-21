# Moment Palette

## Azureテンプレート配信F/Sのローカル起動

本番相当のruntime差を確認するため、APIとSWA CLIを別terminalで起動する。

1. Node.js 24で`pnpm build`を実行する。
2. Node.js 22へ切り替え、`pnpm api:install`、`pnpm api:build`、`pnpm api:start`を実行する。秘密値はgitignore済みの`api/local.settings.json`へだけ設定する。
3. 別terminalをNode.js 24にし、`pnpm preview:swa`を実行する。
4. `http://localhost:4280/spikes/azure-template-delivery`と`http://localhost:4280/api/templates`を確認する。

SWA CLIはproduction build済み`dist`を配信し、`--api-devserver-url http://localhost:7071`でNode.js 22のFunctions hostを同一originの`/api`へproxyする。SWA CLIの`--api-location`による自動起動はruntime分離を保証しないため、このF/Sの合否確認には使わない。

Moment Paletteは、カメラ、端末内の写真、単色を組み合わせて作品を作るモバイル向けWebアプリケーションです。

## 必要な環境

- Node.js 24 LTS系列（`.node-version`では`24.14.0`を指定）
- pnpm `12.4.2`

## セットアップ

Node.jsを準備した後、リポジトリが指定するpnpmを有効にします。

Corepackを利用できる場合:

```sh
corepack enable
corepack install
```

Corepackを利用できない場合:

```sh
npm install --global pnpm@12.4.2
```

pnpmのバージョンを確認し、ロックファイルに基づいて依存関係をインストールします。

```sh
pnpm --version
pnpm install --frozen-lockfile
```

## 開発コマンド

| コマンド            | 用途                                     |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | ローカル開発サーバーを起動する           |
| `pnpm build`        | 型検査後にproduction buildを生成する     |
| `pnpm preview`      | production buildをローカルで確認する     |
| `pnpm preview:swa`  | build成果物をSWA互換の設定で起動する     |
| `pnpm typecheck`    | TypeScriptとVue SFCの型を検査する        |
| `pnpm test`         | 単体テストをwatchモードで実行する        |
| `pnpm test:run`     | 単体テストを一度実行して終了する         |
| `pnpm lint`         | ESLintでソースを検査する                 |
| `pnpm format`       | Prettierで対応ファイルを整形する         |
| `pnpm format:check` | ファイルを書き換えずに整形差分を検査する |

CIなどの非対話環境では、`typecheck`、`test:run`、`lint`、`format:check`、`build`を使用します。

SWAのルーティングを含めてproduction buildを確認する場合は、build後に公式SWA CLIを起動する。

```sh
pnpm build
pnpm preview:swa
```

`http://localhost:4280`で起動し、`--swa-config-location dist`を明示して`dist/staticwebapp.config.json`の`navigationFallback`や除外設定を適用する。`pnpm preview`はViteの成果物確認用であり、SWA固有の設定は解釈しない。

SWA CLIはローカルエミュレーターの`start`だけに使用し、`login`や`deploy`には使用しない。そのため、認証情報をOSのkeychainへ保存する任意依存`keytar`のネイティブbuildは[`pnpm-workspace.yaml`](pnpm-workspace.yaml)で無効化している。Azureの構築とデプロイは、後述のBicepとGitHub Actionsで行う。

## F/S用SWA検証環境

この手順は、後続の技術F/Sをモバイル実機で確認するためのAzure Static Web Apps（SWA）Free環境を構築する。SWA上のProduction環境は`main`のマージ済み状態を置くF/S用固定環境であり、実サービス本番ではない。構成と外部仕様は[`docs/architecture/fs-preview-deployment.md`](docs/architecture/fs-preview-deployment.md)を参照する。

### 実装済み環境

- リソースグループ: `rg-moment-palette-fs`
- SWA: `moment-palette-fs-market-u-20260918`（Free、East Asia）
- 固定F/S URL: <https://icy-mushroom-0c0e42e00.5.azurestaticapps.net/>
- `main`へのpushで固定環境を更新し、`main`向けの通常PRでは一時プレビュー環境を作成・更新・終了する。
- PR #3のmerge時に、固定環境へのデプロイとPRプレビューの削除が成功した。
- iPhone 15（iOS 26）のSafariとChromeで、PRプレビューおよび固定URLを証明書エラーなしで表示できることを確認した。任意のアプリ内URLへの直接アクセスでもアプリが起動し、現在のルーティング規則に従って固定URLへ戻る。
- Android Chromeは今回利用できる実機がないため、端末を確保できるリリース後に確認する。
- Dependabotは`github-actions`の週次設定を認識し、初回確認を実行済みである。

### 前提

- Azure CLIを導入し、SWAを作成できるAzureアカウントでログインできること。
- GitHub CLIを導入し、`market-U/moment-palette`のActions secretを設定できること。
- 対象サブスクリプションIDまたは名前を確認できること。

標準の認証経路を使用する。認証されていない場合は、次を実行してから再開する。

```sh
az login
gh auth login -h github.com
```

ログイン状態と対象を明示的に確認する。

```sh
az account list --output table
az account set --subscription "<SUBSCRIPTION_ID_OR_NAME>"
az account show --query "{name:name,id:id,tenantId:tenantId}" --output table
gh auth status -h github.com
```

### クォータとリージョンの事前確認

[Azure Static Web Appsの公式クォータ](https://learn.microsoft.com/azure/static-web-apps/quotas)では、Freeはサブスクリプションあたり最大10アプリである。2026-09-18に対象の`Azure サブスクリプション 1`をAzure CLIで確認した時点では、既存SWAは4個ですべてFreeだった。今回の1個を追加すると5/10個になる。

```sh
az staticwebapp list --query "[].{name:name,resourceGroup:resourceGroup,sku:sku.name}" --output table
az staticwebapp list --query "{total:length(@),free:length([?sku.name=='Free'])}" --output json
```

同日のMicrosoft.Webプロバイダー確認では、Central US、East US 2、West US 2、West Europe、East AsiaがSWAの利用可能リージョンとして返された。日本から近く、Azure内部名が`eastasia`であるEast Asiaを[`infra/environments/fs.bicepparam`](infra/environments/fs.bicepparam)へ確定値として記録している。将来再構築する場合は、作成前に次のコマンドで利用可否を再確認する。

```sh
az provider show --namespace Microsoft.Web --query "resourceTypes[?resourceType=='staticSites'].locations | [0]" --output table
```

### リソースグループとBicep

対象サブスクリプションを確認した後、F/S専用リソースグループを冪等に作成する。

```sh
az group create \
  --name rg-moment-palette-fs \
  --location eastasia \
  --tags project=moment-palette environment=fs managed-by=bicep
```

Bicepをbuildし、`what-if`で一つのSWA Free以外に変更がないことを確認する。

```sh
az bicep build \
  --file infra/main.bicep \
  --outfile /tmp/moment-palette-fs-main.json

az deployment group what-if \
  --resource-group rg-moment-palette-fs \
  --template-file infra/main.bicep \
  --parameters infra/environments/fs.bicepparam
```

差分が想定どおりなら適用する。既定ホスト名は秘密情報ではないため、確認用に出力する。

```sh
az deployment group create \
  --name moment-palette-fs \
  --resource-group rg-moment-palette-fs \
  --template-file infra/main.bicep \
  --parameters infra/environments/fs.bicepparam \
  --query properties.outputs.defaultHostname.value \
  --output tsv
```

同じコマンドを再適用し、重複リソースが作成されないことを確認する。状態は次で確認できる。

```sh
az staticwebapp show \
  --name moment-palette-fs-market-u-20260918 \
  --resource-group rg-moment-palette-fs \
  --query "{name:name,hostname:defaultHostname,location:location,sku:sku.name,tags:tags}" \
  --output json
```

### デプロイトークンの登録

デプロイトークンは標準出力、シェル変数、クリップボード、ファイルへ保存せず、Azure CLIからGitHub CLIの標準入力へ直接渡す。シェルのコマンドトレースを有効にした状態では実行しない。

```sh
az staticwebapp secrets list \
  --name moment-palette-fs-market-u-20260918 \
  --resource-group rg-moment-palette-fs \
  --query properties.apiKey \
  --output tsv \
  | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN_FS \
      --repo market-U/moment-palette
```

値を表示せず、secret名だけが登録されたことを確認する。

```sh
gh secret list --repo market-U/moment-palette
```

### デプロイと公開範囲

`.github/workflows/preview-deployment.yml`は、ローカルと同じ品質検査に成功した生成済み`dist`だけを配信する。

- `main`へのpushは固定F/S環境へ配信する。
- `main`向けの通常PRは、PR固有の一時環境へ配信し、PR終了時に閉じる。
- PRプレビューはURLを知る人がアクセスできる公開環境である。秘密情報、実ユーザーデータ、非公開素材を置かない。
- 外部forkとDependabot PRにはデプロイトークンを渡さず、品質検査だけを行う。
- トークンをworkflowログ、IaC、文書、`public`、`dist`へ記録しない。

### 復旧

一時的なGitHub Actions障害は、対象実行を確認して失敗jobだけを再実行する。

```sh
gh run list --workflow preview-deployment.yml --limit 10
gh run rerun <RUN_ID> --failed
```

配信内容に問題がある場合は、正常なcommitへ戻すrevertを通常のPRとして作成・mergeし、`main`へのpushで再デプロイする。workflow自体に問題がある場合も、固定SHAや設定の変更をrevertしてレビューを通す。トークンが失効または漏えいした場合はAzure側で再発行し、上記のパイプで同じrepository secretを更新する。リソース定義の差分は`what-if`で確認した後、同じBicepを再適用する。
