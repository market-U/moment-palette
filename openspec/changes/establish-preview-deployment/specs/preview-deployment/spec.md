## ADDED Requirements

### Requirement: 再現可能なF/S用SWA環境
システムは、F/S専用のAzure Static Web Apps Freeリソースを宣言的IaCから作成および更新できなければならない（SHALL）。IaCはリソース名、利用可能なSWAリージョン、環境を識別するタグをパラメーターとして受け取り、デプロイトークンその他の秘密情報を含んではならない（MUST NOT）。

#### Scenario: 新しいF/S環境を作成する
- **WHEN** 開発者が対象サブスクリプションとリソースグループを明示し、F/S用パラメーターでIaCを適用する
- **THEN** AzureはF/S用途を識別できる一つのSWA Freeリソースを作成する

#### Scenario: 同じ定義を再適用する
- **WHEN** 開発者が既存のF/S環境へ同じIaCとパラメーターを再適用する
- **THEN** Azureは重複したSWAを追加せず、定義した状態へ収束する

#### Scenario: IaCを確認する
- **WHEN** 開発者がIaCとF/S用パラメーターを確認する
- **THEN** デプロイトークン、GitHubの認証情報、その他の秘密情報は含まれていない

### Requirement: mainの固定F/S環境
システムは、`main`をF/S用SWAのProductionブランチとして扱い、`main`の品質検査とproduction buildが成功した場合に限り、生成済みの静的成果物をSWAの固定HTTPS URLへデプロイしなければならない（SHALL）。SWAへのupload処理は、検査済み成果物を再buildしてはならない（MUST NOT）。

#### Scenario: mainの変更を配信する
- **WHEN** `main`へpushされた変更の品質検査とproduction buildがすべて成功する
- **THEN** システムは生成済み成果物をF/S用SWAの固定環境へデプロイする

#### Scenario: upload時の再buildを防ぐ
- **WHEN** GitHub Actionsがproduction buildで生成した成果物をSWAへuploadする
- **THEN** SWAのupload処理は依存関係の再インストールまたはフロントエンドの再buildを行わない

### Requirement: PRプレビュー環境のライフサイクル
システムは、`main`向けPRごとに一時的なSWAプレビュー環境を提供し、同じPRの更新を同じプレビューURLへ反映し、PR終了時にその環境を削除しなければならない（SHALL）。固定dev環境またはdev用長期ブランチをこのchangeで追加してはならない（MUST NOT）。

#### Scenario: PRを作成する
- **WHEN** 同一リポジトリのブランチから`main`向けPRが作成され、品質検査とproduction buildが成功する
- **THEN** システムはPR固有のHTTPSプレビュー環境へ生成済み成果物をデプロイする

#### Scenario: PRへ変更を追加する
- **WHEN** 開発者が開いている`main`向けPRへ新しいcommitをpushし、品質検査とproduction buildが成功する
- **THEN** システムはそのPRで使用中のプレビュー環境を新しい成果物へ更新する

#### Scenario: PRを再度開く
- **WHEN** 閉じた`main`向けPRが再度開かれ、品質検査とproduction buildが成功する
- **THEN** システムはそのPRを確認できる一時プレビュー環境を提供する

#### Scenario: PRを終了する
- **WHEN** `main`向けPRがmergeまたはcloseされる
- **THEN** システムはそのPRに対応する一時プレビュー環境を削除する

### Requirement: SPAの直接アクセス
システムは、F/S用SWAのルートURLおよびアプリ内URLへ直接HTTPSでアクセスした場合に、Vue SPAを`index.html`から起動できなければならない（SHALL）。実在しない静的アセットへの要求をSPAへrewriteしてはならない（MUST NOT）。

#### Scenario: ルートURLへアクセスする
- **WHEN** ユーザーがF/S用SWAのルートURLを開く
- **THEN** システムはMoment Paletteのアプリケーションシェルを表示する

#### Scenario: アプリ内URLへ直接アクセスする
- **WHEN** ユーザーがF/S用SWAのアプリ内URLを新しいブラウザセッションで直接開く
- **THEN** SWAは`index.html`を返し、Vue SPAは既存のルーティング規則に従って起動する

#### Scenario: 存在しないbuildアセットを要求する
- **WHEN** ブラウザが`/assets/`配下の存在しないファイルを要求する
- **THEN** SWAは`index.html`をbuildアセットとして返さない

### Requirement: デプロイ用秘密情報の分離
システムは、SWAデプロイトークンをGitHub Actionsのsecretとして管理し、クライアント成果物、ソース、IaC、パラメーターファイル、文書へ含めてはならない（MUST NOT）。ワークフローはデプロイに必要な最小限のGitHub権限だけを使用しなければならない（MUST）。

#### Scenario: GitHub Actionsからデプロイする
- **WHEN** GitHub ActionsがF/S用SWAへ成果物をデプロイする
- **THEN** ワークフローはrepository secretからデプロイトークンを取得し、トークンの値をログへ出力しない

#### Scenario: クライアント成果物を確認する
- **WHEN** 開発者がproduction buildの成果物を検査する
- **THEN** SWAデプロイトークンおよびAzure管理用の認証情報は含まれていない

### Requirement: 利用可能な実機からのHTTPS確認
F/S用SWAは、iPhone SafariおよびiPhone ChromeからHTTPSでアクセスでき、固定環境とPRプレビュー環境の両方でアプリケーションシェルを表示できなければならない（SHALL）。Android Chromeの実機確認は端末を確保できるリリース後のフォロー項目とし、このchangeの完了条件には含めない。

#### Scenario: iPhoneからPR環境を確認する
- **WHEN** 検証者がiPhone SafariおよびiPhone Chromeで開いているPRのプレビューHTTPS URLを開く
- **THEN** 各ブラウザは証明書エラーなしでそのPRのアプリケーションシェルを表示する

#### Scenario: iPhoneから固定環境を確認する
- **WHEN** 検証者がiPhone SafariおよびiPhone Chromeで`main`の固定HTTPS URLを開く
- **THEN** 各ブラウザは証明書エラーなしでアプリケーションシェルを表示する

### Requirement: F/Sデプロイ構成と運用手順の記録
プロジェクトは、F/S用SWAの構成、GitHub Actionsからのデプロイ経路、IaCの検査・適用、secret設定、実機確認、再デプロイによる復旧の手順をリポジトリ内へ記録しなければならない（SHALL）。構成図は編集可能な正本と確認用SVGを持ち、F/S専用の提案構成または実装済み構成であることを明示しなければならない（MUST）。

#### Scenario: 新しい開発環境からF/S基盤を再現する
- **WHEN** 認証済みの開発者がリポジトリ内の手順とIaCを使用する
- **THEN** 開発者は対象サブスクリプションを確認し、F/S用SWAを作成または更新し、GitHub Actionsのsecretを設定できる

#### Scenario: デプロイ障害から復旧する
- **WHEN** workflowまたは配信内容の変更によってF/S環境を利用できなくなる
- **THEN** 開発者は記録された手順から正常なworkflowまたはcommitを再デプロイできる
