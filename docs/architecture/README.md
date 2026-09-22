# アーキテクチャ資料

## 目的

このディレクトリには、Moment Paletteのアプリケーション構成、ソース依存規則、システム構成、データフロー、Azureアーキテクチャ図と、その編集可能なソースを保存する。

正式な要求と判断理由は `docs/vision.md` を参照する。この文書と構成図は、要求を実現する具体的なサービス境界とデータフローを説明する。

## 現在の資料

- [`frontend-application.md`](frontend-application.md): Vueフロントエンドのソース構成、責務、依存規則、外部入出力の追加方針。
- [`fs-preview-deployment.md`](fs-preview-deployment.md): 実装済みF/S用SWAのMermaid構成図、外部仕様、固定したGitHub Action、デプロイ・実機確認結果。
- [`azure-template-delivery.md`](azure-template-delivery.md): private Blob、SWAマネージドAPI、SAS、cache、release継続性を検証した構成。
- [`template-format.md`](template-format.md): 初期リリースで採用するcatalog schema、asset不変条件、API response境界。
- [`template-api.md`](template-api.md): `GET /api/templates`の製品契約、環境別catalog、SAS、cache、秘密情報境界。
- このREADME: Azureを含む初期構成案と、アーキテクチャ図の管理方針。

## F/S用SWAプレビュー構成

現在のデプロイ対象は、後続の技術F/Sをモバイル実機で確認するためのAzure Static Web Apps Free一つだけである。[F/S用SWA実装済み構成図](fs-preview-deployment.md#実装済み構成図)は次の経路を示す。

- `main`へのpushは、SWA上の固定F/S環境へ配信する。
- `main`向けの通常PRは、PR固有の一時環境へ配信する。
- 固定環境とPR環境はいずれも公開HTTPS URLであり、機密情報や実ユーザーデータを置かない。
- 外部forkとDependabot PRではrepository secretを利用せず、品質検査だけを行う。
- このchangeではBlob Storage、マネージドAPI、SAS URL、固定dev環境を構築しない。後続のAzureテンプレート配信F/Sで、同じSWAへprivate BlobとマネージドAPIを追加済みである。

固定F/S URLは<https://icy-mushroom-0c0e42e00.5.azurestaticapps.net/>である。iPhone 15（iOS 26）のSafariとChromeで固定環境とPR環境を確認済みであり、Android Chromeの実機確認は端末を確保できるリリース後に行う。

SWA上の「Production環境」はAzure側の名称であり、実サービス本番を意味しない。実サービスの環境分離とリリース戦略は、ロードマップのフェーズ6で決める。

Freeプランはサブスクリプションあたり最大10アプリ、アプリあたり最大3個のプレビュー環境という制限がある。Azureリソース作成前に対象サブスクリプションの既存数を再確認し、一人開発では同時に開くプレビュー対象PRを3件以内に保つ。

## 現在の初期構成案

```text
GitHubリポジトリ
    │ GitHub Actions
    ▼
Azure Static Web Apps Free
    ├── Vueアプリ
    ├── リリース情報JSON
    ├── staticwebapp.config.json
    └── マネージドAzure Functions
            │ GET /api/templates
            │ カタログを読み取り、SAS URLを生成
            ▼
       非公開Azure Blob Storage
            ├── テンプレートカタログJSON
            └── テンプレート画像・定義

モバイルブラウザ
    ├── HTTPSでVueアプリとAPIへアクセス
    ├── 読み取り専用・短期間のSAS URLでBlobからアセットを取得
    └── 撮影、画像合成、PNG生成を端末内で実行
```

主要な判断は次のとおりである。

- Azure Static Web AppsのFreeプランを使用する。
- テンプレートカタログとアセットは、匿名アクセスを無効化したBlobコンテナへ置く。
- フロントエンドは `GET /api/templates` を介してカタログを取得する。
- マネージドAPIは公開状態と公開期間を判定し、読み取り専用・短期間のSAS URLを返す。
- Blobへの接続に必要な秘密情報はApplication Settingsで管理し、ブラウザへ渡さない。
- Cosmos DBは使用せず、Blob上のJSONをカタログの正本とする。
- 撮影画像、制作状態、完成画像はサーバーへ送信しない。
- ログイン、作品のクラウド保存、テンプレート管理画面は計画対象外とする。
- 制作開始前にapp versionとbuild IDを照合し、必要なcodeとtemplate assetを読み切る。制作中は配信中buildへ再アクセスせず、デプロイをまたいでも保存・共有まで完遂する。

この構成は[`Azureテンプレート配信F/S構成`](azure-template-delivery.md)として実装・実機検証済みである。Blob単位・読み取り専用・HTTPS限定・60分のSAS、template選択後かつ制作画面へ進む前の全asset取得、hash付きcode、revision付きasset、旧assetの24時間削除猶予を初期方針とする。

## フェーズ4で確定した初期判断

| 対象 | 初期リリースの判断 |
| --- | --- |
| UI component | libraryを導入せず、native要素と製品固有componentから始める |
| 状態管理 | Piniaを導入せず、Vue composableと`app/`がprovideする単一の制作sessionを使う |
| 画像処理 | Canvas 2D、PNG mask、Pointer Eventsを使用し、WebGLを追加しない |
| 写真decode | 標準APIを優先し、長辺4096px以下かつ12MP以下へ正規化する |
| 完成画像 | 1080×1080 PNGを一度生成し、表示、長押し保存、再共有へ再利用する |
| template形式 | Blob上のschema version 1 catalogとrevision付きPNG assetを使用する |
| Blob認可 | private containerとBlob単位・read-only・HTTPS限定・60分のService SASを使用する |
| CORS | origin `*`、method `GET`・`HEAD`・`OPTIONS`だけを許可し、認可はSASで行う |
| cache | HTMLとcatalogは再検証し、release/APIは`no-store`、hash・revision付きassetは1年`immutable`とする |
| release継続 | Start前にbuild identityを照合し、制作開始後は取得済みcodeとassetだけで完遂する |
| 削除・復旧 | catalogを先に更新し、旧assetは24時間保持する。soft deleteは14日、versioningは有効にする |

各判断の根拠は`docs/spikes/`、画面とsessionの境界は`docs/design/screen-flow.md`、製品catalogの詳細は[`template-format.md`](template-format.md)を参照する。本実装changeでは、対象となる判断をdelta specとdesignへ正式に移す。

## 本番アーキテクチャ図の更新

カメラ・画像合成とAzureテンプレート配信の技術F/S、および初期の認証・cache・session継続方式の決定までは完了した。ロードマップのフェーズ6で本番用Azure構成を実装するときも、F/Sと同じくMarkdown内のMermaidを正本兼表示形式とする。

1. Azure配信基盤のOpenSpec changeでproposalとdesignを作成する。
2. IaC実装を開始する前までに、本番構成を示すシンプルなMermaid図をこのディレクトリへ追加または更新する。
3. 実装・検証後に、図と実際の構成との差分を確認する。
4. 以後、Azure構成を変更するchangeでは図も同時に更新する。

## 図の管理方針

F/S用と本番用のどちらも、Markdown内のMermaidを正本兼表示形式とする。GitHubがMermaidをネイティブ描画するため、Java、ネイティブCLI、公式アイコン、派生SVGを追加せず、テキスト差分だけで更新できる。

- 図のソースを関連文書と同じリポジトリでversion管理する。
- 対象環境、更新日、構成状態が「提案」「実装済み」のどちらかを明記する。
- 方向付き矢印を使い、プロトコルやイベントなど意味が自明でない経路にラベルを付ける。
- 計画対象外の要素を視覚的に区別し、図を過密にしない。
- 色だけに意味を持たせず、ラベルと線種を併用する。
- 画像だけで判断理由を表現せず、READMEまたはOpenSpec designへ補足を書く。

図は構成要素と通信経路を把握できる最小限の粒度に保つ。Azureの正式なサービス名、方向付きでラベルのある経路、対象環境、更新日、構成状態を明示し、詳細な設定値や判断理由は本文またはOpenSpec designへ記載する。構成が増えた場合も別の作図形式やアイコンへ移行せず、必要に応じて目的別のMermaid図へ分割する。

## 現時点で構成に含めない要素

- Cosmos DBなどのデータベース。
- 一般ユーザー向けログイン、作品保存、履歴機能。
- テンプレート管理画面と管理者認証。
- 独立したAzure Functions AppやAPI Management。
- 撮影画像や完成作品のサーバー保存。

必要性が生じた場合は、既定の将来構成として図へ追加せず、先に `docs/vision.md` とOpenSpec proposalでスコープを見直す。

## 参考資料

- [Architecture design diagrams](https://learn.microsoft.com/azure/well-architected/architect-role/design-diagrams)
- [GitHubでMermaid図を作成する](https://docs.github.com/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams)
- [Azure Static Web Appsのホスティングプラン](https://learn.microsoft.com/azure/static-web-apps/plans)
- [Azure Static Web AppsへAPIを追加する](https://learn.microsoft.com/azure/static-web-apps/add-api)
- [Shared Access Signatureの概要](https://learn.microsoft.com/azure/storage/common/storage-sas-overview)
