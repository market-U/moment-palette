## Why

初期リリースで採用予定のAzure Static Web Apps Free、マネージドAPI、非公開Blob Storageによるテンプレート配信が、ローカル開発、PRプレビュー、iPhone実機で成立することを本実装前に確定する必要がある。さらに、同じSWA環境への再デプロイ中も制作中のユーザーが旧CSS・JavaScript・テンプレートへ再アクセスせず、完成、保存、共有まで完遂できるかを最後の技術F/Sとして検証する。

## What Changes

- F/S用SWA Free環境へ非公開Blob StorageとマネージドAzure Functionsを追加し、Vueフロントエンドと`/api`をSWA CLIおよびGitHub Actionsから一体で実行・配信する。
- Blob上のカタログJSONを検証し、公開状態と公開期間をサーバー時刻で判定して、公開対象の各Blobへ短期間・読み取り専用のService SASを付与する`GET /api/templates`を追加する。
- ストレージ接続文字列をApplication Settings相当の環境変数から取得し、クライアント成果物、リポジトリ、ログへ秘密情報を露出しない構成を検証する。
- フロントエンドがSAS URLからテンプレート画像を直接取得し、CORSを通してCanvasへ描画してPNGを生成できることをiPhone Safari・Chromeで確認する。Android Chromeは端末を確保できるリリース後のフォロー項目とする。
- フロントとAPIの`package.json` versionを照合するとともに、デプロイごとに一意なbuild IDをフロント、API、`release.json`で照合し、不一致時は制作開始前にリロードを案内する。
- Start前に制作セッションで必要なコードとテンプレートアセットを読み込み、Start後は更新を検出しても強制再読み込みせず、Canvasによる完成PNG生成、保存、共有まで取得済み資源だけで継続する。
- 同じPRプレビュー環境へBuild A、Build Bを順にデプロイし、Build Aで開始した制作がBuild B配信後も旧buildアセットを要求せず完遂できることを検証する。
- カタログ、APIレスポンス、テンプレートアセット、`index.html`、`release.json`のキャッシュ方針、SAS有効期間、旧アセットの削除猶予を検証して採否を記録する。
- 検証結果、制約、運用手順、F/Sコードの昇格・再実装・削除判断を`docs/spikes/`と`docs/architecture/`へ残し、delta specはmain specsへ同期しない。

## Capabilities

### New Capabilities

- `azure-template-delivery-validation`: 非公開Blob、マネージドAPI、Service SAS、CORS、キャッシュ、フロント・API・releaseのversion整合、および再デプロイをまたぐ制作継続性を検証する手順と合格条件。

### Modified Capabilities

なし。

## Impact

- `infra/`へF/S用Storage Account、Blob Service、private container、CORS、復旧設定を追加し、既存SWA Freeと同じリソースグループで管理する。
- `api/`へNode.js 22・Azure Functions v4のマネージドAPI、カタログ検証、公開期間判定、Blob単位の読み取り専用Service SAS発行を追加する。
- `src/app/`、`src/pages/`、`src/features/`、`src/infrastructure/`へF/S専用route、テンプレート取得port、SAS画像の事前取得、Canvas検証、version照合、診断UIを追加する。
- `public/staticwebapp.config.json`、build処理、GitHub Actionsを更新し、`release.json`生成、キャッシュ制御、API build、現行公式Actionの完全長commit SHA参照へ対応する。
- `@azure/functions`、`@azure/storage-blob`などAPI用依存を追加する。ストレージ接続文字列はローカルでは追跡対象外の設定、AzureではApplication Settingsで管理する。
- F/Sで使用するテンプレートカタログと画像をBlobへ配置し、`docs/spikes/`、`docs/architecture/`、`docs/development-roadmap.md`へ検証結果と運用判断を反映する。
