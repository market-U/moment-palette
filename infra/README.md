# 初期Production Azureインフラストラクチャ

このディレクトリは、既存のAzure Static Web Apps（SWA）とprivate Blob Storageを、再作成せず初期Production環境として検査・管理する。

## 採用したリソース定義

2026-09-18にMicrosoft公式の[`Microsoft.Web/staticSites` Bicepリファレンス](https://learn.microsoft.com/azure/templates/microsoft.web/staticsites)を確認し、安定版API `2025-03-01`とFree SKU（`name: Free`、`tier: Free`）を採用した。

- [`static-web-app.bicep`](static-web-app.bicep): 過去の初回SWA作成用定義。現行運用では既存SWAを再作成しない。
- [`main.bicep`](main.bicep): 既存SWAは参照だけにし、private Blob Storageを管理する。Storage追加時にSWAのGitHub連携を変更しない。
- [`environments/production.bicepparam`](environments/production.bicepparam): 既存resource名、確定したリージョン、本番用途タグを保持する。

2026-09-21にMicrosoft公式の[`Microsoft.Storage` Bicepリファレンス](https://learn.microsoft.com/azure/templates/microsoft.storage/allversions)を再確認し、安定版API `2025-06-01`で次を宣言した。

- StorageV2 / Standard_LRS / Hot tier
- HTTPS only、TLS 1.2以上、匿名Blob access無効
- browser CORSはorigin `*`からの`GET`、`HEAD`、`OPTIONS`だけ
- blob soft deleteとcontainer soft deleteは14日、Blob versioning有効
- `moment-palette-templates` containerは`publicAccess: None`

CORSは認可ではない。containerはprivateのまま保ち、SWA managed APIが公開中assetへ発行したBlob単位・read-only・60分のService SASを認可境界とする。Managed APIはShared Keyを使用するが、Bicepは接続文字列、account key、SASをparameterまたはoutputへ含めない。

2026-09-18にAzure CLIで対象サブスクリプションを確認し、SWAの利用可能リージョンにEast Asiaが含まれること、Azure内部名が`eastasia`であること、`moment-palette-fs-market-u-20260918`と同名のSWAが対象サブスクリプション内に存在しないことを確認した。値はいずれも秘密情報ではない。リソース名は衝突を避けるため、プロジェクト、用途、所有者、確認日を組み合わせている。

## 管理境界

BicepはSWAとStorageのresourceだけを扱い、GitHub連携、GitHub Actions workflow、repository secret、SWA Application Settings、Blob dataは作成しない。SWA初回作成用定義では`skipGithubActionWorkflowGeneration`を有効にしてPortal相当のworkflow自動生成も抑止する。デプロイトークン、GitHub認証情報、Storage接続文字列をparameter、output、ファイルへ含めない。

既存SWAへStorageを追加する`main.bicep`では、SWAを`existing` resourceとして参照する。初回のwhat-ifで、SWAを再宣言するとAzure側で追加されたbranch、provider、repository URLなどが削除差分として表示されたためである。Storageの追加・更新からSWAのGitHub連携を分離し、意図外のPUTを避ける。

## 適用前の検査

対象subscriptionとresource groupを明示して、format、lint/build、validate、what-ifの順に実行する。what-ifで既存SWAに差分がなく、Storage関連の追加・設定更新だけであることを確認してからdeployする。

```sh
az account show --query '{subscription:id,name:name}' -o table
az bicep format --file infra/main.bicep
az bicep build --file infra/main.bicep
az deployment group validate --resource-group rg-moment-palette-fs --template-file infra/main.bicep --parameters infra/environments/production.bicepparam
az deployment group what-if --resource-group rg-moment-palette-fs --template-file infra/main.bicep --parameters infra/environments/production.bicepparam
```

## asset更新・公開停止・復旧

1. `templates/<template-id>/<new-revision>/`へ全assetを先に配置する。
2. 各Blobの`Content-Type`と`Cache-Control: public, max-age=31536000, immutable`を確認する。
3. `catalog/catalog.json`を最後に更新し、`Content-Type: application/json`、`Cache-Control: no-cache`を設定する。
4. 公開停止はcatalogの`published`または公開期間を先に変更する。Start済みsessionが保持したbytesを使えるよう旧assetを即時削除しない。
5. catalogから参照されなくなった旧assetは24時間の削除猶予後に削除する。誤削除・上書きは14日のsoft deleteとversionから復旧する。

Storage keyをrotationするときは、未使用側のkeyを再生成し、SWA Application Settingsをそのkeyの接続文字列へ切り替えてAPIを確認してから旧keyを再生成する。設定値はterminal出力、文書、リポジトリへ保存しない。
