## ADDED Requirements

### Requirement: 最小アプリケーションシェル
システムは、Vue 3、Vite、TypeScriptで構成したSPAとして起動し、ルートURLでMoment Paletteのタイトル画面を表示しなければならない（SHALL）。

#### Scenario: ルートURLを開く
- **WHEN** ユーザーがアプリケーションのルートURLを開く
- **THEN** システムはMoment Paletteのタイトル画面を表示する

#### Scenario: 未知のアプリ内URLを開く
- **WHEN** ユーザーがルート定義に存在しないアプリ内URLを開き、SPAが起動する
- **THEN** システムはタイトル画面へ戻す

### Requirement: 日本語と英語の表示
システムは、UI文言を翻訳リソースとして管理し、日本語と英語を表示できなければならない（SHALL）。初期言語はブラウザの優先言語が`ja`または`ja-*`なら日本語、それ以外は英語とし、ユーザーはタイトル画面で表示言語を切り替えられなければならない（SHALL）。

#### Scenario: 日本語環境で初めて開く
- **WHEN** ブラウザの優先言語が日本語である状態でユーザーがアプリケーションを開く
- **THEN** システムは日本語のタイトル画面を表示し、`html`要素の`lang`を日本語に設定する

#### Scenario: 英語環境で初めて開く
- **WHEN** ブラウザの優先言語が英語である状態でユーザーがアプリケーションを開く
- **THEN** システムは英語のタイトル画面を表示し、`html`要素の`lang`を英語に設定する

#### Scenario: 日本語以外の環境で初めて開く
- **WHEN** ブラウザの優先言語が日本語と英語のどちらでもない状態でユーザーがアプリケーションを開く
- **THEN** システムは英語へフォールバックし、`html`要素の`lang`を英語に設定する

#### Scenario: 表示言語を切り替える
- **WHEN** ユーザーがタイトル画面で日本語または英語を選択する
- **THEN** システムは画面のUI文言と`html`要素の`lang`を選択した言語へ更新する

### Requirement: モバイル向けの基本レイアウト
システムは、スマートフォンの縦向き表示を基準とし、動的ビューポートとセーフエリアを考慮した全画面のアプリケーションシェルを提供しなければならない（SHALL）。

#### Scenario: 縦向きのスマートフォンで表示する
- **WHEN** ユーザーが縦向きのスマートフォン相当のビューポートでタイトル画面を開く
- **THEN** システムは主要な表示と操作をセーフエリア内に配置し、通常のページスクロールを発生させずに画面を表示する

### Requirement: ソース責務と依存方向
システムのソースは、`app`、`pages`、`features`、`domain`、`infrastructure`、`shared/ui`、`shared/lib`の責務と、`docs/architecture/frontend-application.md`に定めたimport方向に従わなければならない（MUST）。`domain`は他のアプリケーションディレクトリ、Vue、HTTP、ブラウザAPIへ依存してはならない（MUST NOT）。

#### Scenario: domainへ純粋な規則を追加する
- **WHEN** 開発者が作品やテンプレートに関する純粋な型または規則を`domain`へ追加する
- **THEN** そのコードはほかのアプリケーションディレクトリ、Vue、HTTP、ブラウザAPIをimportしない

#### Scenario: 複数featureを画面で組み合わせる
- **WHEN** 一つの画面が複数のfeatureを利用する
- **THEN** `pages`がfeatureを組み合わせ、feature同士は直接importしない

### Requirement: 必要時に追加する外部入出力境界
システムは、外部入出力を利用するfeatureが実装される時点で、利用側の要求を表すportをfeature内へ定義し、具体実装を`infrastructure`へ配置しなければならない（SHALL）。利用するユースケースが存在しない段階では、将来用のport、mock、開発用実装、空ディレクトリを追加してはならない（MUST NOT）。

#### Scenario: 利用するfeatureが存在しない
- **WHEN** ある外部入出力を利用するfeatureがまだ実装されていない
- **THEN** システムはその外部入出力のためだけのport、mock、開発用実装を先行して持たない

#### Scenario: 後続changeで外部入出力を追加する
- **WHEN** 後続changeでfeatureがブラウザAPIまたは外部データ取得を必要とする
- **THEN** feature内のport、`infrastructure`の実装、`app`の結線を組み合わせて外部入出力を追加できる

### Requirement: 公開可能なクライアント設定
システムは、クライアント設定をViteの`import.meta.env`から読み取る場合、公開可能な`VITE_`接頭辞の値だけを使用しなければならず、秘密情報をクライアント設定またはソースへ含めてはならない（MUST NOT）。

#### Scenario: クライアント設定を追加する
- **WHEN** 開発者がブラウザで参照する環境依存の設定値を追加する
- **THEN** 設定値は`VITE_`接頭辞を持ち、型、用途、秘密情報ではないこと、設定例が文書化される
