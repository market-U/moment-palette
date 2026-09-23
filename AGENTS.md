# Moment Palette 開発ガイド

## 基本ルール

- このプロジェクトはOpenSpecのワークフローに従って運用する。
- ユーザーへの応答およびアーティファクトの出力はすべて日本語で行う。
- 実装には可能な限り単体テストを追加する。
- コミットコメントはできるだけ簡潔かつ完結にする。
- コミットやPRのコメント・概要文に、コーディングAIによる投稿を示す記述を入れない。
- ユーザーの未コミット変更を保持し、依頼と無関係な変更を行わない。
- 人間がレビューやメンテナンスをする可能性があることを考慮し、ソースコードは可読性を意識する。

## ソースコードのコメント

- 製品コードでexportするクラスおよび関数には、直前に日本語のJSDocを記載する。
- `export function`だけでなく、関数を代入した`export const`もJSDocの対象とする。
- JSDocの先頭には、そのシンボルの責務、利用目的、または処理の境界が分かる完結した一文を記載する。
- 関数名や処理内容を日本語でそのまま読み上げるだけのコメントにはせず、利用者や変更者の判断に役立つ情報を記載する。
- exportする型、interface、portには、用途や責務が名前だけでは十分に伝わらない場合にJSDocを記載する。
- 非公開の関数や処理内のコメントは、設計理由、不変条件、副作用、ライフサイクル、ブラウザ固有の制約など、コードだけでは判断しにくい事項に記載する。
- テストコード、単純な再export、自己説明的な定数は、一律のJSDoc対象外とする。
- コメントは日本語の完全文とし、実装を変更するときはコメントも一致するように更新または削除する。

## 参照する文書

- プロダクトの目的と要求仕様: `docs/vision.md`
- 現在のフェーズと今後の順序: `docs/development-roadmap.md`
- 画面設計とデザイン成果物: `docs/design/README.md`
- 技術F/Sの記録: `docs/spikes/README.md`
- Azureを含むアーキテクチャ資料: `docs/architecture/README.md`
- 実装対象の正式な仕様: `openspec/specs/`
- 進行中の提案・設計・タスク・delta spec: `openspec/changes/`

新しいセッションでは、まず `docs/development-roadmap.md` と `openspec list --json` を確認し、現在のフェーズとアクティブなchangeを把握する。

## フロントエンドのソース配置

`src/`配下は次の責務で分ける。利用するコードが生じるまで空ディレクトリや将来用の抽象化を作らない。

- `app/`: ルーティング、i18n、クライアント設定、依存の組み立てなど、アプリケーション全体の起動と提供者。Vueエントリポイントの`src/main.ts`もこの責務に含める。
- `pages/`: 画面全体のレイアウトと画面遷移。複数featureの画面上の組み合わせもここで行う。
- `features/`: ユーザー操作単位のUI、状態、ユースケース、利用側が要求する外部入出力のport。
- `domain/`: `Artwork`や`Template`など中心概念の型と、副作用を持たない純粋な規則。
- `infrastructure/`: HTTP、カメラ、Canvas、Web Share、Cookieなど、アプリ外部との入出力の具体実装。
- `shared/ui/`: 複数の画面またはfeatureで実際に再利用する汎用Vue部品。
- `shared/lib/`: 複数の領域で実際に再利用する、Vueや外部入出力に依存しない純粋関数。

クライアント設定は`app/config/`、型は原則として所有するdomain、feature、portの近くへ置く。用途が明確になる前に汎用の`utils/`、`shared/config/`、`shared/types/`を作らない。

## フロントエンドの依存方向

- `domain/`は他のアプリケーションディレクトリ、Vue、HTTP、ブラウザAPIへ依存しない。
- `shared/lib/`はVue、domain、HTTP、ブラウザAPIへ依存しない。
- `shared/ui/`はVueと`shared/lib/`だけに依存でき、domain固有の知識を持たない。
- `pages/`は`features/`、`shared/ui/`、`shared/lib/`を利用できるが、`app/`や`infrastructure/`へ依存しない。
- `features/`は`domain/`、`shared/`、同じfeature内のportを利用できるが、`infrastructure/`や別のfeatureへ依存しない。
- `infrastructure/`はfeature内のport、`domain/`、`shared/lib/`を利用できるが、`app/`や`pages/`へ依存しない。
- `app/`と`src/main.ts`はcomposition rootとして、画面、feature、port、具体的なinfrastructure実装を参照し、依存を結線できる。
- 外部入出力は、利用するfeature内にportを定義し、`infrastructure/`で実装し、`app/`で結線する。利用するユースケースより先にport、mock、開発用実装を作らない。

## テストコードの配置

- 単一のモジュールやVueコンポーネントを対象とする単体テストは、対象ファイルと同じディレクトリへ配置する。
- テストファイル名は対象と同じベース名の`<対象名>.test.ts`とする。
- 複数モジュールをまたぐ統合テストやE2Eテストの配置は、そのテスト基盤を導入するchangeで定める。

## OpenSpecを開始する境界

### OpenSpec changeを作らずに行ってよい作業

- `docs/vision.md`による要求整理。
- 手描きラフ、Figma、静的画像による画面検討。
- 画面遷移、状態、操作、エラー表示の文書化。
- 実行可能なコードを伴わない技術調査。
- 開発ロードマップなど、実装開始前の運用文書の整備。

### OpenSpec changeが必要な作業

- Vue、HTML、CSS、JavaScript、TypeScriptなどの実行可能なコードの追加・変更。
- 依存パッケージ、ビルド、テスト、lint、formatの設定変更。
- 操作可能な画面プロトタイプの作成。
- カメラ、Canvas、画像マスク、共有APIなどの技術F/Sコードの作成。
- Azureリソース、IaC、デプロイ処理の追加・変更。
- 本実装、リファクタリング、不具合修正。

`docs/vision.md`を実装開始の基準版として合意した後は、最初のOpenSpec changeでフロントエンド基盤を構築する。画面の細部や技術方式は、F/Sの結果に応じて後から更新してよい。

## 技術F/S changeの運用

- F/Sも実行可能なコードを伴うため、OpenSpec changeとして扱う。
- proposalに「本実装ではなく技術検証であること」「検証する問い」「成功条件」「終了時のコードの扱い」を明記する。
- delta specは製品の正式要件ではなく、検証手順と判定条件として記述する。
- F/S changeのarchiveでは、原則として `openspec archive <change-name> --skip-specs` を使用し、delta specをmain specsへ同期しない。
- F/Sによって採用する製品要件や設計が確定した場合は、後続の本実装changeへ正式に記述し、そのchangeをarchiveするときにmain specsへ同期する。
- F/Sコードは完了時に、本実装へ昇格するか削除するかを明示的に判断する。
- 本実装へ昇格する場合は、責務分割、命名、エラー処理、対応環境、単体テストを本番品質へ整える。
- 検証専用コードを削除する場合も、検証結果と採否理由は `docs/spikes/` とarchive済みchangeへ残す。
- F/Sで実機確認または単体テストが成立したコードは、後続の本実装changeにおける既定の移行元とする。製品責務への適合に必要な場合を除き、同等の処理を新規に書き直してはならない。
- 後続changeのproposalまたはdesignには、F/Sの対象ファイルごとに「昇格・設計を保った移設または再実装・削除」のいずれか、移行先、維持するテスト、削除条件を対応表として記載する。apply中にこの分類を新たに判断または変更してはならない。変更が必要になった場合は、先にアーティファクトを更新する。
- F/S専用route、UI、fixture、診断表示を削除できるのは、対応する製品実装がF/Sの採用済み挙動を満たし、対応テスト、全自動品質検査、要求された実機確認の証跡がそろった後だけとする。未完了の検証タスクが一つでもある間は削除タスクを完了にしてはならない。

## 本実装changeの運用

- `docs/vision.md`とmain specsを参照し、changeの対象を一つの検証可能な成果へ絞る。
- proposal、specs、design、tasksの整合性を保つ。
- 実装完了後は可能な範囲で単体テストと実機・ブラウザ確認を行う。
- 完了確認後にarchiveし、製品要件のdelta specはmain specsへ同期する。
- インフラやツール設定だけのchangeなど、製品要件を変更しない場合は `--skip-specs` の使用を検討する。

## 文書の更新

- プロダクトのゴールや対象範囲が変わった場合は `docs/vision.md` を更新する。
- 開発段階やchangeの予定順が変わった場合は `docs/development-roadmap.md` を更新する。
- 画面フローやビジュアル方針が変わった場合は `docs/design/` を更新する。
- 技術F/Sを完了した場合は `docs/spikes/` に結果を残す。
- Azure構成を提案・変更した場合は、同じchange内で `docs/architecture/` の図と説明を更新する。
