## MODIFIED Requirements

### Requirement: 再現可能な本番SWA基盤
システムは、初期本番用途のAzure Static Web Apps Free環境を宣言的IaCから検査および更新できなければならない（SHALL）。IaCは既存SWAを意図しない更新から保護し、既存resourceを再作成してはならない（MUST NOT）。IaCは本番用途を識別するタグと環境パラメーターを受け取り、デプロイトークンその他の秘密情報を含んではならない（MUST NOT）。

#### Scenario: 既存の初期本番環境を検査する
- **WHEN** 開発者が対象subscriptionとResource Groupを明示し、本番用パラメーターでIaCをvalidateおよびwhat-ifする
- **THEN** Azureは既存SWAを変更または重複作成せず、宣言したStorage関連の状態だけを検査対象にする

#### Scenario: 同じ定義を再適用する
- **WHEN** 開発者が既存の初期本番環境へ同じIaCとパラメーターを再適用する
- **THEN** Azureは重複resourceを追加せず、宣言したStorage関連の状態へ収束する

#### Scenario: IaCを確認する
- **WHEN** 開発者がIaCと本番用パラメーターを確認する
- **THEN** デプロイトークン、GitHubの認証情報、Storage接続文字列、account key、SASは含まれていない

### Requirement: releaseのProduction環境
システムは、`release`をSWAのProductionブランチとして扱い、`release`の品質検査とproduction buildが成功した場合に限り、生成済みの静的成果物とManaged APIを固定HTTPS URLへデプロイしなければならない（SHALL）。`main`へのpushはProduction環境を更新してはならない（MUST NOT）。SWAへのupload処理は、検査済み成果物を再buildしてはならない（MUST NOT）。

#### Scenario: releaseの変更を配信する
- **WHEN** `release`へpushされた変更の品質検査とproduction buildがすべて成功する
- **THEN** システムは生成済み成果物とAPIをSWAのProduction環境へデプロイする

#### Scenario: mainの変更を統合する
- **WHEN** `main`へ変更がmergeまたはpushされる
- **THEN** システムはその変更だけを理由にProduction環境を更新しない

#### Scenario: upload時の再buildを防ぐ
- **WHEN** GitHub Actionsがproduction buildで生成した成果物をSWAへuploadする
- **THEN** SWAのupload処理はフロントエンドの依存関係を再インストールまたは再buildしない

### Requirement: mainとrelease向けPRプレビュー環境のライフサイクル
システムは、同一repositoryから`main`または`release`へ向かうPRごとに一時的なSWAプレビュー環境を提供し、同じPRの更新を同じプレビューURLへ反映し、PR終了時にその環境を削除しなければならない（SHALL）。外部forkとDependabot PRをSWAへ配信してはならない（MUST NOT）。

#### Scenario: main向けPRを作成する
- **WHEN** 同一repositoryのブランチから`main`向けPRが作成され、品質検査とproduction buildが成功する
- **THEN** システムはPR固有のHTTPSプレビュー環境へ生成済み成果物とAPIをデプロイする

#### Scenario: release向けPRを作成する
- **WHEN** 同一repositoryの`main`から`release`向けPRが作成され、品質検査とproduction buildが成功する
- **THEN** システムは本番配信前に確認できるPR固有のHTTPSプレビュー環境を提供する

#### Scenario: PRへ変更を追加する
- **WHEN** 開いている`main`または`release`向けPRへ新しいcommitをpushし、品質検査とproduction buildが成功する
- **THEN** システムはそのPRで使用中のプレビュー環境を新しい成果物へ更新する

#### Scenario: PRを終了する
- **WHEN** `main`または`release`向けPRがmergeまたはcloseされる
- **THEN** システムはそのPRに対応する一時プレビュー環境を削除する

### Requirement: SPAの直接アクセス
システムは、ProductionおよびPR previewのルートURLとアプリ内URLへ直接HTTPSでアクセスした場合に、Vue SPAを`index.html`から起動できなければならない（SHALL）。実在しない静的アセットへの要求をSPAへrewriteしてはならない（MUST NOT）。

#### Scenario: ProductionのルートURLへアクセスする
- **WHEN** ユーザーがProduction環境のルートURLを開く
- **THEN** システムはMoment Paletteのアプリケーションシェルを表示する

#### Scenario: PR previewのアプリ内URLへ直接アクセスする
- **WHEN** ユーザーがPR previewのアプリ内URLを新しいブラウザセッションで直接開く
- **THEN** SWAは`index.html`を返し、Vue SPAは既存のルーティング規則に従って起動する

#### Scenario: 存在しないbuildアセットを要求する
- **WHEN** ブラウザが`/assets/`配下の存在しないファイルを要求する
- **THEN** SWAは`index.html`をbuildアセットとして返さない

### Requirement: 本番デプロイ用秘密情報の分離
システムは、SWAデプロイトークンを本番用途のGitHub Actions secretとして管理し、クライアント成果物、ソース、IaC、パラメーターファイル、文書へ含めてはならない（MUST NOT）。ワークフローはデプロイに必要な最小限のGitHub権限だけを使用し、外部forkとDependabot PRへデプロイトークンを渡してはならない（MUST NOT）。

#### Scenario: GitHub ActionsからProductionまたはpreviewへデプロイする
- **WHEN** GitHub ActionsがSWAへ成果物をデプロイする
- **THEN** ワークフローはrepository secretからデプロイトークンを取得し、トークンの値をログへ出力しない

#### Scenario: クライアント成果物を確認する
- **WHEN** 開発者がproduction buildの成果物を検査する
- **THEN** SWAデプロイトークンおよびAzure管理用の認証情報は含まれていない

### Requirement: 初期本番配信構成と運用手順の記録
プロジェクトは、初期本番SWA、private Blob、Managed API、環境別catalog、GitHub Actionsからの`release`配信、IaCの検査・適用、secret設定、PR preview、ロールバックの手順をリポジトリ内へ記録しなければならない（SHALL）。構成図はMarkdown内のMermaidを正本兼表示形式とし、ProductionとPR previewの境界を明示しなければならない（MUST）。

#### Scenario: 新しい開発環境から本番基盤を運用する
- **WHEN** 認証済みの開発者がリポジトリ内の手順とIaCを使用する
- **THEN** 開発者は対象subscriptionを確認し、既存resourceを破壊せずに検査・更新し、GitHub ActionsのsecretとApplication Settingsを設定できる

#### Scenario: 配信障害から復旧する
- **WHEN** workflow、配信コード、catalogの変更によってProduction環境を利用できなくなる
- **THEN** 開発者は記録された手順から`release`へのrevert PRまたは直前catalog revisionの復元を実行できる
