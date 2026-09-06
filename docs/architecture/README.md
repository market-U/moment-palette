# アーキテクチャ資料

## 目的

このディレクトリには、Moment Paletteのシステム構成、データフロー、Azureアーキテクチャ図と、その編集可能なソースを保存する。

正式な要求と判断理由は `docs/vision.md` を参照する。この文書と構成図は、要求を実現する具体的なサービス境界とデータフローを説明する。

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
- 制作中のデプロイをまたいでも保存・共有まで完遂できる方式を、技術F/Sで検証する。

## 初期アーキテクチャ図を作成するタイミング

1. カメラ・画像合成とAzureテンプレート配信の技術F/Sを完了する。
2. Azure Static Web Apps、Blob Storage、マネージドAPIの認証・キャッシュ・デプロイ方式を決定する。
3. Azure配信基盤のOpenSpec changeでproposalとdesignを作成する。
4. IaC実装を開始する前までに、Azure公式アイコンを用いた初期構成図をこのディレクトリへ追加する。
5. 実装・検証後に、図と実際の構成との差分を確認する。
6. 以後、Azure構成を変更するchangeでは図も同時に更新する。

## 図の管理方針

図の編集形式は未決定である。どの形式を選んでも、編集可能なソースを正本とし、GitHub、IDE、ブラウザで確認しやすいSVGを派生成果物として管理する。

```text
編集可能なソース
    │ レンダリングまたはエクスポート
    ▼
確認用SVG
```

- SVGを直接編集せず、正本となるソースを変更して再生成する。
- 正本とSVGを同じコミットで更新する。
- Microsoftが提供するAzure Architecture Iconsを使用する。
- アイコンの近くにサービス名を記載し、公式の利用ガイドラインに従う。
- 図には対象環境、更新日、構成の状態が「提案」「実装済み」のどちらかを明記する。
- 計画対象外または比較用の構成を描く場合は、実装済みの構成と視覚的に区別する。
- 画像だけで判断理由を表現せず、READMEまたはOpenSpec designへ補足を書く。

## 図作成ツールの選択肢

### Draw.ioとSVG

```text
azure-initial.drawio  ← 編集用の正本
          │ diagrams.netでエクスポート
          ▼
azure-initial.svg     ← 確認用
```

- 人間がドラッグ操作で配置や見た目を細かく調整しやすい。
- diagrams.netのAzure図形を利用するか、Microsoftが配布する公式SVGを取り込める。
- AIはDraw.ioのXMLを直接生成・編集するか、ブラウザや対応ツールを操作して編集する。
- XMLのGit差分が読みづらく、自動生成やAIによる部分修正では注意が必要である。
- 現在のCodex環境には専用のDraw.ioプラグインを導入していない。採用時に、直接生成、ブラウザ操作、CLI、MCPまたは専用スキルのどれを使うか決める。

### PlantUMLとSVG

```text
azure-initial.puml  ← テキスト形式の正本
         │ PlantUMLでレンダリング
         ▼
azure-initial.svg   ← 確認用
```

- テキストとしてGit差分を確認しやすい。
- AIによる生成・修正と、スクリプトやCIによるSVG再生成に向いている。
- コミュニティ管理のAzure-PlantUMLを使うと、Azureサービスのアイコンとマクロを利用できる。
- Azure-PlantUMLは公式アイコンを主な素材としているが、Microsoft公式のライブラリではない。採用時はバージョンを固定し、必要なincludeをリポジトリ内へ保持する。
- 自動レイアウトが中心になるため、人間が位置を細かく調整する用途ではDraw.ioより自由度が低い。

### FigmaとSVG

```text
Figmaファイル         ← 編集用の正本
       │ Figmaからエクスポート
       ▼
azure-initial.svg     ← リポジトリ内の確認用
```

- UIデザインと同じツールで見た目を細かく整えられる。
- Microsoftが配布する公式SVGアイコンを取り込める。
- 編集用の正本がリポジトリ外に置かれるため、Figmaファイルへの参照、権限、履歴の管理が必要になる。
- アーキテクチャの変更とGitコミットを自動的に対応付けにくい。

### 比較

| 方式 | 主な長所 | 主な注意点 | 適する運用 |
|---|---|---|---|
| Draw.io＋SVG | 人間が直感的に配置を調整できる | XML差分が読みづらい | 人間が図を頻繁に手動編集する |
| PlantUML＋SVG | Git差分と自動生成に強い | レイアウト調整とアイコンライブラリの管理が必要 | AIとコード中心で継続更新する |
| Figma＋SVG | 見た目を細かく整えやすい | 正本がリポジトリ外になる | UI資料と同じ環境で管理する |

一人開発でAIが継続的に更新する現在の想定では、PlantUML＋SVGをやや優先する。ただし、開発者が図を手動で調整する頻度が高い場合はDraw.io＋SVGを選ぶ。最終決定は、Azure配信基盤のOpenSpec changeを開始する前に行う。

## 想定するファイル構成

Draw.ioを採用する場合:

```text
docs/architecture/
├── README.md
├── azure-initial.drawio
└── azure-initial.svg
```

PlantUMLを採用する場合:

```text
docs/architecture/
├── README.md
├── azure-initial.puml
├── azure-initial.svg
└── vendor/
    └── azure-plantuml/
```

Figmaを採用する場合は、編集用ファイルへの参照と権限上の注意を `docs/architecture/figma.md` に記録し、確認用SVGをこのディレクトリへ保存する。

データフローやリリース継続性を一枚で表すと読みづらい場合は、`azure-template-flow.*` や `azure-release-flow.*` として図を分ける。

## 現時点で構成に含めない要素

- Cosmos DBなどのデータベース。
- 一般ユーザー向けログイン、作品保存、履歴機能。
- テンプレート管理画面と管理者認証。
- 独立したAzure Functions AppやAPI Management。
- 撮影画像や完成作品のサーバー保存。

必要性が生じた場合は、既定の将来構成として図へ追加せず、先に `docs/vision.md` とOpenSpec proposalでスコープを見直す。

## 参考資料

- [Azure Architecture Icons](https://learn.microsoft.com/azure/architecture/icons/)
- [Azure Static Web Appsのホスティングプラン](https://learn.microsoft.com/azure/static-web-apps/plans)
- [Azure Static Web AppsへAPIを追加する](https://learn.microsoft.com/azure/static-web-apps/add-api)
- [Shared Access Signatureの概要](https://learn.microsoft.com/azure/storage/common/storage-sas-overview)
- [Azure-PlantUML](https://github.com/plantuml-stdlib/Azure-PlantUML)
