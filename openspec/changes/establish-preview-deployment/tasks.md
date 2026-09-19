## 1. SWA向けSPA設定

- [x] 1.1 `public/staticwebapp.config.json`を追加し、`navigationFallback`でアプリ内URLを`/index.html`へrewriteする
- [x] 1.2 `/assets/*`をnavigation fallbackから除外し、存在しないbuildアセットへ`index.html`を返さない設定にする
- [x] 1.3 production build後に`dist/staticwebapp.config.json`が存在し、ルートURL、アプリ内URL、存在しないアセットの期待動作をローカルで確認する

## 2. F/S用SWAのIaC

- [x] 2.1 実装時点の`Microsoft.Web/staticSites`公式Bicep定義を確認し、採用する安定APIバージョンとFree SKUを記録する
- [x] 2.2 `infra/main.bicep`へ、リソース名、SWAリージョン、F/S識別タグをパラメーター化した一つのSWA Freeリソースとdefault hostnameのoutputを定義する
- [x] 2.3 秘密情報を含まないF/S用`.bicepparam`を追加し、グローバルに重複しないSWA名、選択リージョン、`project`・`environment=fs`・`managed-by=bicep`タグを記録する
- [x] 2.4 BicepがGitHub連携やworkflow自動生成を行わず、デプロイトークン、GitHub認証情報、その他の秘密情報をinputまたはoutputへ含まないことを確認する

## 3. GitHub Actionsと依存更新

- [x] 3.1 Azure公式ドキュメントと`Azure/static-web-apps-deploy`の公式Action定義を確認し、upload、close、GitHubイベントによる配信先、`skip_app_build`、`app_location`、`output_location`の現行仕様を記録する
- [x] 3.2 checkout、Node.js、pnpm、SWA deployの各Actionについて正規リポジトリと現行リリースを確認し、完全長commit SHAと同一行のバージョンコメントを決定する
- [x] 3.3 `.github/workflows/preview-deployment.yml`を追加し、`main`へのpushと`main`向けPRの作成・更新・再開・終了をtriggerにする
- [x] 3.4 workflowでリポジトリ指定のNode.jsとpnpmを準備し、pnpm storeをcacheして`pnpm install --frozen-lockfile`を実行する
- [x] 3.5 workflowで`typecheck`、`test:run`、`lint`、`format:check`、`build`を実行し、いずれかが失敗した場合はdeployへ進まない構成にする
- [x] 3.6 品質検査成功後に生成済み`dist`を、`skip_app_build: true`、空の`output_location`でSWAへuploadし、push triggerを`main`だけに限定してAPI buildを設定しない
- [x] 3.7 PR終了時はbuildせずSWA Actionのclose処理を実行し、PRまたはブランチ単位のconcurrencyと`cancel-in-progress`で古い成果物の競合を防ぐ
- [x] 3.8 workflowへ`contents: read`を基本とする最小権限だけを設定し、デプロイトークンをF/S用repository secretから参照して値をログへ出力しない
- [x] 3.9 `.github/dependabot.yml`へ`github-actions` ecosystemの週次更新を追加し、Action更新PRを自動mergeしない運用にする
- [x] 3.10 すべての外部`uses`が確認済みの完全長SHAと対応バージョンコメントを持ち、Portal生成テンプレートをそのまま含んでいないことを確認する

## 4. アーキテクチャ図と運用文書

- [x] 4.1 Microsoft公式Azure Architecture IconsとAzure Well-Architected Frameworkの作図方針を確認し、追加レンダラーや補助ライブラリを必要としないMermaidを今回の形式として記録する
- [x] 4.2 GitHub Actions、`main`の固定F/S環境、PR一時環境、モバイル実機、HTTPS経路、対象外のBlob・APIを示す暫定構成図をMarkdown内のMermaidで作成する
- [x] 4.3 Mermaid図と同じ文書へ対象環境、更新日、構成状態が「提案」であることを明記し、GitHub上で追加の派生成果物なしに表示できる形にする
- [x] 4.4 `docs/architecture/README.md`へF/S専用構成、図の参照、実サービス本番構成ではないこと、SWA Freeのアプリ数・プレビュー数制限を追記する
- [x] 4.5 `README.md`へAzure CLIとGitHub CLIの前提、サブスクリプション確認、リソースグループ作成、Bicepのbuild・what-if・適用・再適用、secret設定、再デプロイによる復旧手順を追記する
- [x] 4.6 PRプレビューが公開URLであること、外部forkを対象外とすること、トークンをログ・IaC・文書・クライアント成果物へ保存しないことを文書化する

## 5. ローカル検証

- [x] 5.1 `pnpm typecheck`、`pnpm test:run`、`pnpm lint`、`pnpm format:check`、`pnpm build`をローカルで実行して成功を確認する
- [x] 5.2 build成果物に`staticwebapp.config.json`が含まれ、SWAデプロイトークンやAzure管理用認証情報が含まれないことを確認する
- [x] 5.3 workflowとDependabot設定のYAML構文、trigger、権限、job条件、完全長SHA、バージョンコメントをレビューする
- [x] 5.4 Mermaid構文を検証し、READMEと構成図のリンクが有効であることを確認する

## 6. 認証とAzureリソース構築

- [x] 6.1 ユーザーが`gh auth login -h github.com`でGitHub CLIを再認証し、公式手順でAzure CLIを導入して`az login`を完了する
- [x] 6.2 Azure CLIで対象サブスクリプションを明示し、既存SWA数、Free上限、利用可能なSWAリージョンを確認してF/S用パラメーターを確定する
- [x] 6.3 Azure CLIのBicepで`infra/main.bicep`をbuildし、対象リソースグループへの`what-if`がF/S用SWA以外を変更しないことを確認する
- [x] 6.4 文書化した`az group create`でF/S用リソースグループを作成し、Bicepを適用して一つのSWA Freeリソースを構築する
- [x] 6.5 同じBicepとパラメーターを再適用して重複リソースが作成されず、SKU、リージョン、タグ、default hostnameが定義どおりであることを確認する
- [x] 6.6 SWAデプロイトークンを画面・ログ・ファイルへ表示または保存せずGitHubのF/S用repository secretへ登録し、secret名がworkflowの参照と一致することを確認する

## 7. GitHub ActionsとSWAプレビューの確認

- [x] 7.1 作業ブランチをpushして`main`向けPRを作成し、品質検査とproduction buildがGitHub Actionsで成功することを確認する
- [x] 7.2 PR固有のSWA HTTPS URLが通知され、生成済み`dist`が再buildなしでプレビュー環境へ配信されたことをworkflowログで確認する
- [x] 7.3 同じPRへ追加commitをpushし、同じプレビューURLが新しい成果物へ更新され、古いworkflow実行が競合しないことを確認する
- [x] 7.4 一時的な検証commitで品質検査を失敗させ、SWA uploadが実行されないことを確認した後、そのcommitを安全に取り消す
- [x] 7.5 PRプレビューでルートURLとアプリ内URLが表示でき、`/assets/`配下の存在しないファイルが`index.html`へrewriteされないことを確認する
- [x] 7.6 GitHub公式仕様と設定を照合し、`github-actions`の週次更新がデフォルトブランチへのmerge後に有効になることと、Dependabot PRでは通常の品質検査だけを行いSWAデプロイをskipする条件を静的に確認する。Action更新の実デプロイは通常ブランチの確認PRで行う

## 8. 実機確認と完了記録

- [x] 8.1 PRプレビューURLをiPhone 15（iOS 26）のSafariおよびChromeで開き、証明書エラーなしでアプリケーションシェルとアプリ内URLを表示できることを確認する。Android Chromeは端末を確保できるリリース後のフォロー項目とする
- [ ] 8.2 PRをmergeして`main`の固定F/S URLへデプロイされ、PR一時環境が削除されることを確認する。最初のPRでclose処理を検証できない場合は、workflowが`main`へ入った後に確認用PRを作成して検証する
- [ ] 8.3 `main`の固定F/S URLをiPhone 15（iOS 26）のSafariおよびChromeで開き、証明書エラーなしでアプリケーションシェルとアプリ内URLを表示できることを確認する
- [ ] 8.4 実装済みリソース、固定URL、PRライフサイクル、iPhone実機確認結果、Android実機確認をリリース後に行う方針、復旧手順に合わせてREADMEと構成図を更新し、構成状態を「実装済み」に変更する
- [ ] 8.5 Blob Storage、マネージドAPI、SAS URL、固定dev環境、長期devブランチ、カスタムドメインが追加されていないことを確認する
- [ ] 8.6 mainへのmerge後、Dependabotが`github-actions`の週次更新設定を認識していることを確認する。更新PRが作成された場合は通常の品質検査だけが行われ、SWAデプロイがskipされることを確認する
- [ ] 8.7 `openspec validate establish-preview-deployment`と実装全体の品質検査を実行し、proposal・design・specs・tasks・実装の整合を確認する
- [ ] 8.8 `docs/development-roadmap.md`のフェーズ2の状態、現在地、「次のセッションで行うこと」を実際の完了結果に合わせて更新する
