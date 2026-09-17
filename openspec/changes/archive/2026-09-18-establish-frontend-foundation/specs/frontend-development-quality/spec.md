## ADDED Requirements

### Requirement: 再現可能な開発ツールチェーン
プロジェクトは、Node.js 24 LTS系列を開発ランタイムとし、対応するNode.js系列と正確なpnpmバージョンをリポジトリ内に記録しなければならない（SHALL）。依存パッケージの解決結果はpnpmのロックファイルへ保存しなければならない（SHALL）。

#### Scenario: 新しい開発環境を準備する
- **WHEN** 開発者がREADMEに従い、記録されたNode.js系列とpnpmバージョンで依存パッケージをインストールする
- **THEN** プロジェクトはロックファイルに基づいて依存パッケージを再現できる

#### Scenario: Corepackが同梱されていない
- **WHEN** 開発者のNode.js環境にCorepackが同梱されていない
- **THEN** READMEに記載した代替手順で、プロジェクトが指定するpnpmバージョンを準備できる

### Requirement: TypeScriptとVue SFCの型検査
プロジェクトはTypeScriptのstrict設定を有効にし、`vue-tsc --noEmit`を使用してTypeScriptとVue SFCを検査する`typecheck`スクリプトを提供しなければならない（SHALL）。

#### Scenario: 型エラーがないソースを検査する
- **WHEN** 開発者が`typecheck`スクリプトを実行し、TypeScriptとVue SFCに型エラーがない
- **THEN** スクリプトは非対話で成功終了する

#### Scenario: Vue SFCに型エラーがある
- **WHEN** 開発者が`typecheck`スクリプトを実行し、Vue SFCに型エラーがある
- **THEN** スクリプトは対象を報告して失敗終了する

### Requirement: 単体テスト
プロジェクトはVitestを使用してブラウザ非依存ロジックを単体テストできなければならない（SHALL）。このchangeでは、日本語判定と日本語以外を英語へフォールバックする初期言語選択の純粋関数へ単体テストを追加しなければならない（MUST）。

#### Scenario: 単体テストを一度実行する
- **WHEN** 開発者またはCIが`test:run`スクリプトを実行する
- **THEN** Vitestはwatchモードへ入らずにすべての単体テストを実行し、結果に応じた終了コードを返す

#### Scenario: 開発中に単体テストを監視実行する
- **WHEN** 開発者が`test`スクリプトを実行する
- **THEN** Vitestは変更を監視して関連する単体テストを再実行できる

### Requirement: 静的解析と整形の分離
プロジェクトはESLintでTypeScriptとVueの品質規則を検査し、Prettierで対応ファイルを整形しなければならない（SHALL）。ESLintはPrettierと競合する整形規則を無効化し、PrettierをESLintプラグインとして実行してはならない（MUST NOT）。

#### Scenario: 静的解析を実行する
- **WHEN** 開発者またはCIが`lint`スクリプトを実行する
- **THEN** ESLintは対象ソースを検査し、違反の有無に応じた終了コードを返す

#### Scenario: 整形差分を確認する
- **WHEN** 開発者またはCIが`format:check`スクリプトを実行する
- **THEN** Prettierはファイルを書き換えず、整形差分の有無に応じた終了コードを返す

#### Scenario: ファイルを整形する
- **WHEN** 開発者が`format`スクリプトを実行する
- **THEN** Prettierは対象ファイルを既定の形式へ書き換える

### Requirement: 開発とビルドの標準コマンド
プロジェクトは、ローカル開発サーバー、production build、production buildのプレビューを行う`dev`、`build`、`preview`スクリプトを提供しなければならない（SHALL）。

#### Scenario: ローカル開発サーバーを起動する
- **WHEN** 開発者が`dev`スクリプトを実行する
- **THEN** Viteのローカル開発サーバーが起動し、アプリケーションシェルへアクセスできる

#### Scenario: production buildを生成する
- **WHEN** 開発者またはCIが`build`スクリプトを実行する
- **THEN** Viteはproduction用の静的成果物を生成し、処理結果に応じた終了コードを返す

### Requirement: CIから再利用できる品質検査
プロジェクトは、`typecheck`、`test:run`、`lint`、`format:check`、`build`を対話操作なしで実行できなければならない（SHALL）。

#### Scenario: 後続のCIから品質検査を実行する
- **WHEN** 後続changeでCIワークフローが追加される
- **THEN** CIはローカルと同じ`typecheck`、`test:run`、`lint`、`format:check`、`build`スクリプトを変更せずに呼び出せる

### Requirement: 開発者向け文書と除外設定
プロジェクトは、セットアップ、標準コマンド、ソース責務、依存規則をREADMEと`AGENTS.md`へ記録し、生成物、依存パッケージ、ローカル環境ファイルを`.gitignore`で除外しなければならない（SHALL）。

#### Scenario: 開発者がプロジェクトへ参加する
- **WHEN** 開発者がREADMEと`AGENTS.md`を読む
- **THEN** 開発環境の準備、標準コマンド、ソースの配置先、禁止する依存方向を確認できる

#### Scenario: ローカル生成物を確認する
- **WHEN** 開発者が依存パッケージのインストール、build、ローカル環境設定を行う
- **THEN** 生成物、依存パッケージ、秘密情報を含み得るローカル環境ファイルはGitの追跡対象にならない
