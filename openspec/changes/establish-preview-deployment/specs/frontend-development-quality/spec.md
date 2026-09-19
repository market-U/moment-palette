## ADDED Requirements

### Requirement: GitHub Actions依存の検証と固定
プロジェクトは、GitHub Actionsワークフローで利用する外部Actionについて公式の提供元と実装時点の入力仕様を確認し、正規リポジトリの完全長commit SHAへ固定しなければならない（MUST）。各SHA参照には、対応するリリースを識別できるバージョンコメントを同じ行へ記載しなければならない（MUST）。プロジェクトはDependabotでGitHub Actionsを週次監視し、ActionのSHAとバージョンコメントを更新するPRを作成できなければならない（SHALL）。Portalが生成した古い可能性のあるSWAワークフローテンプレートをそのまま管理対象へ追加してはならない（MUST NOT）。

#### Scenario: workflowのAction参照を確認する
- **WHEN** 開発者がGitHub Actionsワークフロー内の外部`uses`参照を検査する
- **THEN** 各Actionは確認済みの正規リポジトリにある完全長commit SHAを参照し、同じ行に対応バージョンのコメントを持つ

#### Scenario: Actionの新しいバージョンが公開される
- **WHEN** 利用中のGitHub ActionにDependabotが解決可能な新しいバージョンが公開され、週次確認が実行される
- **THEN** Dependabotは参照するSHAと対応バージョンのコメントを更新するPRを作成する

#### Scenario: Action更新PRを確認する
- **WHEN** 開発者がDependabotによるGitHub Action更新PRをmergeしようとする
- **THEN** 更新PRは通常の品質検査を通過し、開発者はActionの提供元、リリース内容、SWA Actionの場合は現行の公式入力仕様を確認できる

#### Scenario: SWAのworkflowを実装または更新する
- **WHEN** 開発者がSWA Actionまたはその入力値を追加もしくは更新する
- **THEN** 開発者はAzure公式ドキュメントと公式Action定義に照らして、採用する入力と挙動を確認する

## MODIFIED Requirements

### Requirement: CIから再利用できる品質検査
プロジェクトは、`typecheck`、`test:run`、`lint`、`format:check`、`build`を対話操作なしで実行できなければならない（SHALL）。GitHub Actionsは、`main`へのpushおよび`main`向けPRの作成・更新・再開時に、リポジトリが指定するNode.jsとpnpmを使用し、lockfileを変更せずに依存関係をインストールして、これらすべてのスクリプトを実行しなければならない（SHALL）。いずれかの処理が失敗した成果物をデプロイしてはならない（MUST NOT）。

#### Scenario: ローカルと同じ品質検査をCIで実行する
- **WHEN** GitHub Actionsが`main`へのpushまたは`main`向けPRの変更を検査する
- **THEN** CIはローカルと同じ`typecheck`、`test:run`、`lint`、`format:check`、`build`スクリプトを変更せずに実行する

#### Scenario: lockfileから依存関係を再現する
- **WHEN** GitHub Actionsが品質検査を開始する
- **THEN** CIはリポジトリ指定のNode.js系列と正確なpnpmバージョンを使用し、lockfileの変更を許可せずに依存関係をインストールする

#### Scenario: すべての品質検査が成功する
- **WHEN** `typecheck`、`test:run`、`lint`、`format:check`、`build`がすべて成功する
- **THEN** workflowはその実行で生成したproduction build成果物を後続のデプロイ処理へ渡せる

#### Scenario: 品質検査が失敗する
- **WHEN** 依存関係のインストール、`typecheck`、`test:run`、`lint`、`format:check`、`build`のいずれかが失敗する
- **THEN** workflowは失敗終了し、その変更の成果物をSWAへデプロイしない
