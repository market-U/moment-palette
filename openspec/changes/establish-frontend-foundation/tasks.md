## 1. ツールチェーンとVueプロジェクトの初期化

- [ ] 1.1 Node.js 24 LTS系列をリポジトリ内のバージョンファイルと`package.json`の`engines`へ記録し、`packageManager`へ正確なpnpmバージョンを指定する
- [ ] 1.2 リポジトリ直下へVue 3、Vite、TypeScriptの最小構成とpnpmロックファイルを追加し、`vue-router`と`vue-i18n`を導入する
- [ ] 1.3 TypeScriptのstrict設定と`vue-tsc --noEmit`によるVue SFCの型検査を構成する
- [ ] 1.4 `dev`、`build`、`preview`、`typecheck`の各スクリプトを`package.json`へ追加し、Viteの既定ブラウザ対象を変更するlegacy pluginを導入していないことを確認する

## 2. 単体テスト・静的解析・整形の基盤

- [ ] 2.1 Vite設定を共有するVitest構成を追加し、watch実行用の`test`と非対話実行用の`test:run`スクリプトを用意する
- [ ] 2.2 TypeScriptとVueを検査するESLint構成と`lint`スクリプトを追加し、`eslint-config-prettier`でPrettierと競合する規則を無効化する
- [ ] 2.3 Prettier構成と`format`、`format:check`スクリプトを追加し、`eslint-plugin-prettier`を導入していないことを確認する

## 3. アプリケーションシェル

- [ ] 3.1 `src/app/`と`src/pages/`へVueの起動処理、ルートコンポーネント、タイトル画面を追加する
- [ ] 3.2 `createWebHistory(import.meta.env.BASE_URL)`を使うルーターを追加し、`/`でタイトル画面を表示して未知のアプリ内URLを`/`へ戻す
- [ ] 3.3 ブラウザの優先言語が`ja`または`ja-*`なら日本語、それ以外は英語を返す副作用のない初期言語選択関数を実装する
- [ ] 3.4 `src/app/i18n/`へ日本語・英語の翻訳リソースとVue I18nの初期化処理を追加する
- [ ] 3.5 タイトル画面へ日本語・英語の切替操作を追加し、初期表示と切替時に`html`要素の`lang`を同期する。選択言語は永続化しない
- [ ] 3.6 動的ビューポートとセーフエリアを考慮した全画面の基本スタイルを追加し、縦向きのスマートフォン相当で通常のページスクロールが発生しないようにする

## 4. 単体テスト

- [ ] 4.1 初期言語選択関数について、`ja`、`ja-*`、英語、その他の言語が仕様どおり日本語または英語になる単体テストを追加する
- [ ] 4.2 `test`と`test:run`が同じテスト群をそれぞれwatchモードと単発実行で扱えることを確認する

## 5. 開発者向け文書とリポジトリ設定

- [ ] 5.1 READMEへNode.js・pnpmの準備、Corepackを利用できない場合の代替手順、依存関係のインストール、開発・検査・buildコマンドを記載する
- [ ] 5.2 `AGENTS.md`へ`app`、`pages`、`features`、`domain`、`infrastructure`、`shared`の配置基準と禁止する依存方向を追記する
- [ ] 5.3 `.gitignore`へ依存パッケージ、build・テスト生成物、秘密情報を含み得るローカル環境ファイルの除外設定を追加する
- [ ] 5.4 実装後のソース構成とimport方向を`docs/architecture/frontend-application.md`と照合し、ステータスを実装済みに更新して必要な差分を反映する

## 6. 完了確認

- [ ] 6.1 固定したpnpmとロックファイルで依存関係を再現できることを確認する
- [ ] 6.2 `typecheck`、`test:run`、`lint`、`format:check`、`build`を非対話で実行し、すべて成功することを確認する
- [ ] 6.3 production buildを`preview`で起動し、ルートURL、未知のアプリ内URL、初期言語、言語切替、`html`の`lang`更新を確認する
- [ ] 6.4 スマートフォン相当の縦向きビューポートで、主要表示がセーフエリア内に収まり、通常のページスクロールが発生しないことを確認する
- [ ] 6.5 未使用のport、mock、開発用実装、空の`features`・`domain`・`infrastructure`・`shared`ディレクトリ、空の`.env.example`、CI・Azureデプロイ設定を追加していないことを確認する
- [ ] 6.6 実装と検証の完了後、`docs/development-roadmap.md`のフェーズ1を完了へ更新し、次に行う作業をフェーズ2へ進める
