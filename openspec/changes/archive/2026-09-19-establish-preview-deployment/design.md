## Context

Moment Paletteは、後続のカメラ・画像処理F/Sをモバイルブラウザで実施するため、インターネットからHTTPSでアクセスできる固定URLと、変更をマージする前に実機確認できるURLを必要としている。今回利用可能なiPhone実機ではSafariとChromeを確認し、端末を確保できないAndroid Chromeの実機確認はリリース後のフォロー項目とする。現在はVueアプリケーションと非対話の品質検査コマンドが存在するが、CI、クラウドリソース、デプロイ設定は存在しない。

今回作るAzure Static Web Apps（以下SWA）はF/S専用リソースであり、そのSWA内の「Production環境」は実サービスの本番環境を意味しない。実サービス向けの環境分離、リリースブランチ、デプロイ承認は、F/S結果を反映して本番配信基盤を構築するフェーズ6で決める。

Azure公式仕様では、Productionブランチへのpull request（以下PR）ごとに一時的なプレビュー環境を作成できる。SWA Freeでは、一つのアプリにつきProduction環境とは別に最大3個のプレビュー環境を持てる。2026-09-18に対象サブスクリプションをAzure CLIで確認した時点では4個のSWAがすべてFreeであり、Freeのサブスクリプション上限10個に対して今回の1個を追加すると5個になる。

Portalが生成するGitHub Actionsテンプレートは、生成時期によって利用Actionや設定例が古い可能性がある。ワークフローはリポジトリで明示的に管理し、実装時点のAzure公式ドキュメント、公式SWA Actionの入力定義、GitHub Actionsのセキュリティ推奨事項を確認してからActionと入力値を固定する。

## Goals / Non-Goals

**Goals:**

- F/S専用のSWA Freeリソースを、再現可能な定義から作成・更新できるようにする。
- `main`のマージ済み状態を固定HTTPS URLへ配信する。
- `main`向けPRをPR固有の一時HTTPS URLへ配信し、マージ前に実機確認できるようにする。
- ローカルと同じ型検査、単体テスト、lint、format検査、production buildに成功した成果物だけを配信する。
- SPAのアプリ内URLを直接開いても`index.html`から起動できるようにする。
- リソース構成、デプロイ経路、認証情報の設定手順、実機確認手順を後続作業から再利用できる形で記録する。

**Non-Goals:**

- 実サービス向けProduction環境、固定dev環境、`production`や`develop`などの長期ブランチを作成すること。
- Blob Storage、テンプレートカタログ、マネージドAPI、SAS URLを構築すること。
- カスタムドメイン、監視、SLA、キャッシュ、WAF、Private Endpointを構築すること。
- 制作中のデプロイをまたぐセッション継続性を確定すること。
- PRプレビューへ機密データや実ユーザーデータを配置すること。
- 外部forkからのPRをSWAへデプロイすること。
- Android Chromeの実機確認を、このchangeの完了前に必須とすること。

## Decisions

### 1. F/S専用SWAを一つ作成する

今回のリソースは、既存または将来の実サービス向けSWAと分離したSWA Freeアプリとして作成する。リソースとリソースグループには、プロジェクト名、`fs`環境、Bicep管理であることを示す名前とタグを付ける。

一つのSWA内で固定URLとPRプレビューを利用できるため、固定dev用のSWAや2個目の長期ブランチは作らない。二つのSWAを作る案は環境分離が明確になる一方、IaC、secret、ワークフロー、クォータ消費が二重になるため、最小F/S環境には採用しない。

### 2. `main`をF/S用SWAのProductionブランチにする

GitHub Actionsのpush triggerを`main`だけに限定する。現在のSWA Actionは`production_branch`を公開inputとして持たないため指定せず、pushイベントは固定環境、`main`向けpull requestイベントはPR一時環境へ配信する。

```text
feature branch
      │
      └── PR → main
               │
               ├── opened / synchronize / reopened
               │        └── PR固有の一時プレビュー環境へ配信
               │
               ├── closed
               │        └── 一時プレビュー環境を削除
               │
               └── merge
                        └── mainの固定F/S環境へ配信
```

これにより、PR URLでマージ前の実機確認を行い、`main`の固定URLでマージ済みの最新F/S環境を共有できる。`production`と`develop`を持つ案は、昇格操作、差分、hotfixの同期を管理する必要が生じ、現段階の一人開発とF/S用途には過剰であるため採用しない。

### 3. 品質検査、build、deployをリポジトリ管理の単一ワークフローで行う

ワークフローは`main`へのpush、および`main`向けPRの`opened`、`synchronize`、`reopened`、`closed`を契機にする。

PR終了以外のイベントでは、次を順に実行する。

1. リポジトリをcheckoutする。
2. リポジトリ指定のNode.js 24系列とpnpm 12.4.2を準備し、pnpm storeをキャッシュする。
3. `pnpm install --frozen-lockfile`を実行する。
4. `pnpm typecheck`、`pnpm test:run`、`pnpm lint`、`pnpm format:check`、`pnpm build`を実行する。
5. すべて成功した場合だけ、生成済みの`dist`をSWAへuploadする。

SWA Actionには`skip_app_build: true`を指定し、`app_location`を生成済み`dist`、`output_location`を空文字列にする。これにより、SWA Action内部のOryxによる暗黙の依存インストールやbuildへ品質保証を委ねず、固定したNode.js、pnpm、lockfileで検査した成果物をそのまま配信する。今回APIは存在しないため、`api_location`とAPI buildは設定しない。

PRの`closed`イベントではbuildを行わず、SWA Actionの`close`処理だけを実行して一時環境を削除する。PRまたはブランチ単位のconcurrencyを設定し、新しいcommitがpushされた場合は古い実行をキャンセルして、古い成果物が後から配信される競合を防ぐ。

CIとdeployを別ワークフローへ分けて`workflow_run`で接続する案は、commit、PR、artifact、権限の受け渡しが複雑になるため採用しない。単一ワークフロー内でも品質検査の成功をdeployの前提にできる。

### 4. Portal生成テンプレートではなく、検証したAction定義を固定する

実装時に、次を公式情報で再確認する。

- `Azure/static-web-apps-deploy`の現行入力と、upload・close・PR環境の挙動。
- `actions/checkout`、Node.js設定、pnpm設定、キャッシュ用Actionの現行推奨バージョン。
- `skip_app_build`使用時の`app_location`と`output_location`の解釈。
- `staticwebapp.config.json`をbuild出力へ含める要件。

各GitHub Actionは、公式リポジトリの正規commitであることを確認した完全長commit SHAへ固定し、同じ行のコメントに対応するリリース名を記載する。完全長SHAは参照先の意図しない変更を防ぐ一方、bug修正やセキュリティ修正を自動では受け取らない。そのため`.github/dependabot.yml`で`github-actions` ecosystemを週次監視し、利用可能な更新があればSHAとバージョンコメントを更新するPRを作成する。更新PRは自動mergeしない。

Dependabotが作成したPRのworkflowはfork由来と同等に扱われ、Actionsのrepository secretを受け取れない。更新PRでは通常の品質検査だけを行い、SWAへの自動プレビューは行わない。レビューした更新を通常の作業ブランチへ取り込んだ確認PRで実デプロイを検証する。デプロイトークンをDependabot専用secretへ複製せず、信頼されないコードへ強い権限を与え得る`pull_request_target`も利用しない。

浮動major tagだけを参照する案は、互換性のある更新や一部の保護変更を自動的に受け取れる一方、同じtagが別commitへ移動するとレビューなしで実行コードが変わる。デプロイトークンを扱うworkflowでは供給網の変更をPRとして確認できる方を優先し、完全長SHAとDependabotを組み合わせる。

`Azure/static-web-apps-deploy`は、Actionリポジトリ内のDockerfileから`mcr.microsoft.com/appsvc/staticappsclient:stable`を利用している。完全長SHAが固定するのはActionリポジトリ側の定義であり、Azureが配信するコンテナやSWAサービス全体の挙動までは固定しない。この制約を前提に、Action更新時だけでなく実際のPR・固定環境へのデプロイでも互換性を確認する。

Portalが作成したworkflowファイルはコミットせず、PortalやBicepによるworkflow自動生成も利用しない。

### 5. BicepでSWAリソースを定義する

Azureネイティブで追加のstate管理を必要としないBicepを採用する。`infra/main.bicep`をリソースグループスコープとし、SWA Free、リソース名、利用可能なSWAリージョン、タグをパラメーター化する。選択したF/S用パラメーターは秘密情報を含まない`.bicepparam`として記録する。

リソースグループの作成は、対象サブスクリプションを明示した冪等な`az group create`手順として文書化する。リソースグループ自体までsubscriptionスコープのBicepで作成する案は、モジュール分割とサブスクリプションスコープ権限を必要とし、SWA一つを作る今回には複雑なため採用しない。

SWAのリージョンは、2026-09-18にAzure CLIで取得した利用可能候補のうち対象ユーザーに近いEast Asiaを選び、Azure内部名`eastasia`を`.bicepparam`へ固定する。再構築時は最新の候補を取得して再確認する。リソース名はグローバルな重複を避けるsuffixをパラメーターで受け取る。

Terraformは複数クラウドや既存stateとの統合に利点があるが、今回のAzure単独・単一リソースではproviderとstateの管理が追加負担になるため採用しない。Azure CLIだけでリソース作成を記述する案は、目標状態と変更差分をレビューしにくいため採用しない。

### 6. デプロイトークンをGitHub Actionsのsecretとして管理する

BicepはSWAリソースの作成までを担当し、GitHubリポジトリのsecretは作成しない。SWA作成後、Azure CLIでデプロイトークンを取得し、F/S用途が分かる名前のGitHub Actions repository secretへ登録する。トークンを標準出力、ログ、Bicep output、`.bicepparam`、README、ソースへ保存しない。

ワークフローの権限は`contents: read`を基本とし、SWA ActionがPRへプレビューURLを通知するために必要な最小権限だけを追加する。外部forkからのPRではrepository secretを利用できないため、外部forkの自動プレビューは今回の対象外とする。

Azure OpenID Connectでの認証は長期secretを減らせる可能性があるが、SWA Actionのデプロイ方式と追加設定を検証する必要がある。最小構成では公式に案内されているSWAデプロイトークンを採用し、本番配信基盤で再評価する。

### 7. `staticwebapp.config.json`をViteのbuild出力へ含める

設定ファイルは`public/staticwebapp.config.json`へ配置し、Vite buildによって`dist`直下へコピーする。`navigationFallback.rewrite`を`/index.html`とし、実在しないアセット要求へHTMLを返さないよう、少なくとも`/assets/*`をfallback対象から除外する。

ローカル確認には公式の`@azure/static-web-apps-cli`を開発依存として固定し、production build後に`swa start dist --swa-config-location dist`で起動する。設定場所を明示してbuild成果物内の`staticwebapp.config.json`を必ず検証する。Vite Previewは同設定を解釈しないため、SWA固有のfallbackと除外設定の判定には使用しない。SWA CLIはローカルエミュレーターであり、Azureへのデプロイには使用しない。

認証、ロール、独自header、API runtime、キャッシュ方針は今回設定しない。必要性が確認された設定だけを後続changeで追加する。

### 8. 暫定構成図はMarkdown内のMermaidを正本兼表示形式とする

Git差分とAIによる継続的な更新に向き、GitHub上で追加のレンダラーなしに表示できるMermaidを採用する。図にはGitHub Actions、F/S用SWA、`main`の固定環境、PR一時環境、モバイル実機、HTTPS経路、対象外のBlob・APIを示す。対象環境、更新日、構成状態も図と同じ文書へ明記する。

Microsoft公式のAzure Architecture IconsとAzure Well-Architected Frameworkの作図方針は確認する。一方、今回の小さな提案図では、GitHubのMermaid描画へ公式SVGを安全かつ可搬に登録するための追加処理や、コミュニティ管理のアイコンライブラリを導入しない。正式なAzureサービス名、方向付きの矢印、経路ラベル、対象範囲を明示することで意図を伝える。実サービス向けの詳細な構成図で公式アイコンが必要になった場合は、その時点の公式素材を使う。

PlantUMLと確認用SVGを管理する案は、ローカルレンダラーとJavaまたはネイティブ実行ファイルの準備が必要で、現状の図一枚に対して再現手順が重いため採用しない。

## Risks / Trade-offs

- [SWA Freeではプレビュー環境が同時に3個まで] → 一人開発では同時PRを3個以内に保ち、PR終了時の`close`処理を必ず実行する。上限を超える運用が必要になった場合は、本番配信基盤changeでプランまたは環境戦略を見直す。
- [PRプレビューURLはリポジトリが非公開でもURLを知る人からアクセスできる] → 機密情報、秘密設定、実ユーザーデータを配置せず、F/S用の公開可能なクライアントだけを配信する。
- [完全長SHAへ固定したActionは修正を自動取得しない] → DependabotでGitHub Actionsを週次監視し、SHAとバージョンコメントを更新するPRを作成する。Dependabot PRではsecretを使うプレビューを行わず、通常の品質検査とレビュー後、通常ブランチの確認PRで実デプロイを検証する。
- [SWA ActionやGitHub Actionsの入力・推奨バージョンが変わる] → Portal生成例を流用せず、実装時と更新PRのレビュー時に公式仕様とAction定義を再確認する。
- [SWA Actionの完全長SHAだけでは内部の`stable`コンテナとSWAサービスを固定できない] → 完全な実行環境固定とは扱わず、PR環境と固定F/S環境への実デプロイで互換性を確認する。
- [デプロイトークンが漏えい・失効すると配信できない] → repository secretで管理し、ログへ出力せず、漏えいまたは失効時はAzure側で再発行してsecretを更新する。
- [古いworkflow実行が新しいcommitの後に完了する] → PR・ブランチ単位のconcurrencyと`cancel-in-progress`を設定する。
- [F/S用SWAのProductionという名称が実サービス本番と誤認される] → リソース名、タグ、README、構成図でF/S専用と明示し、本番戦略はフェーズ6の判断として分離する。
- [FreeプランにはSLAがない] → F/S用途として許容し、実サービス本番の可用性要件はフェーズ6で評価する。
- [選択したリージョンが新規SWA作成時に利用できない] → デプロイ直前にAzure CLIで候補を取得し、パラメーターへ記録する。
- [GitHub CLIまたはAzure CLIの認証が失効するとクラウド操作を継続できない] → 操作前に`gh auth status -h github.com`と`az account show`で認証状態を確認する。標準の認証経路が利用できない場合は別経路へ迂回せず作業を停止する。
- [Android実機を今回確保できず、Chromeでの確認が残る] → 今回はiPhone 15（iOS 26）のSafariとChromeでPR環境および固定環境を確認し、Android Chromeはリリース後に知人などの協力を得て確認結果を記録する。

## Migration Plan

1. ユーザーがGitHub CLIを再認証し、Azure CLIを導入して対象サブスクリプションへログインする。
2. Azure CLIで対象サブスクリプション、Freeアプリ数、利用可能なSWAリージョンを確認する。
3. Bicepを静的検査し、`what-if`で作成対象がF/S用リソースグループとSWAだけであることを確認する。
4. F/S用リソースグループを作成し、Bicepを適用してSWA Freeを作成する。
5. SWAデプロイトークンをGitHub Actions repository secretへ登録する。
6. workflow、Dependabot設定、`staticwebapp.config.json`、構成図、手順書を含むPRを作成し、PR一時環境への配信とURL通知を確認する。
7. PR URLをiPhone 15（iOS 26）のSafariおよびChromeで開き、ルートURLとアプリ内URLの直接アクセスを確認する。
8. PRをmergeし、`main`の固定F/S URLが更新されることを確認する。
9. 実装と確認結果に合わせて構成図および手順書を更新する。

Android Chromeの実機確認は端末を確保できるリリース後に行い、結果を運用記録へ追記する。

workflowの不具合は変更をrevertして直前の正常なworkflowへ戻す。配信内容の不具合は正常なcommitを再デプロイする。SWAリソースやリソースグループの削除は自動ロールバックに含めず、不要と確認してから明示的に行う。

## Open Questions

- 実サービス本番でF/S用SWAを再利用するか、別のSWAを作成するか。
- 実サービス本番を`main`の継続デプロイにするか、releaseブランチ、tag、GitHub Environmentの承認などを導入するか。
- 本番配信でSWAデプロイトークンを継続するか、利用可能な場合にOpenID Connectへ移行するか。

これらは今回のF/S環境構築を妨げないため、フェーズ6の本番配信基盤changeで決定する。

## References

- [Azure Static Web Appsのプレビュー環境](https://learn.microsoft.com/azure/static-web-apps/preview-environments)
- [Azure Static Web AppsのFreeプランと制限](https://learn.microsoft.com/azure/static-web-apps/plans)
- [Azure Static Web Appsのbuild設定](https://learn.microsoft.com/azure/static-web-apps/build-configuration)
- [Azure Static Web Appsのアプリケーション設定](https://learn.microsoft.com/azure/static-web-apps/configuration)
- [Microsoft.Web/staticSitesのBicep定義](https://learn.microsoft.com/azure/templates/microsoft.web/staticsites)
- [GitHub Actionsを安全に利用するための推奨事項](https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
- [DependabotでGitHub Actionsを更新する](https://docs.github.com/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot)
- [Azure Static Web Apps Deploy ActionのDockerfile](https://github.com/Azure/static-web-apps-deploy/blob/v1/Dockerfile)
