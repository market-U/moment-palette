# Moment Palette 開発ガイド

## 基本ルール

- このプロジェクトはOpenSpecのワークフローに従って運用する。
- ユーザーへの応答およびアーティファクトの出力はすべて日本語で行う。
- 実装には可能な限り単体テストを追加する。
- コミットコメントはできるだけ簡潔かつ完結にする。
- コミットやPRのコメント・概要文に、コーディングAIによる投稿を示す記述を入れない。
- ユーザーの未コミット変更を保持し、依頼と無関係な変更を行わない。

## 参照する文書

- プロダクトの目的と要求仕様: `docs/vision.md`
- 現在のフェーズと今後の順序: `docs/development-roadmap.md`
- 画面設計とデザイン成果物: `docs/design/README.md`
- 技術F/Sの記録: `docs/spikes/README.md`
- Azureを含むアーキテクチャ資料: `docs/architecture/README.md`
- 実装対象の正式な仕様: `openspec/specs/`
- 進行中の提案・設計・タスク・delta spec: `openspec/changes/`

新しいセッションでは、まず `docs/development-roadmap.md` と `openspec list --json` を確認し、現在のフェーズとアクティブなchangeを把握する。

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
