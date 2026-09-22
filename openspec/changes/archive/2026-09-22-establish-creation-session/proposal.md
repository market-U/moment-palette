## Why

フェーズ3のF/Sで画像処理と配信方式は成立したが、製品にはタイトルからテンプレートを選び、必要なresourceを所有する制作sessionを開始する導線がまだない。後続のカメラ、完成画像、写真、単色を同じ作品状態へ安全に追加できるよう、最初に製品用のsession境界とtemplate選択を確立する。

## What Changes

- Start時に読み込み済みfrontend、release情報、catalog snapshotのapp versionとbuild IDを確認し、不一致、通信失敗、再試行を区別する製品導線を追加する。
- 公開中templateの一覧、空状態、選択、線画・全maskの取得とdecode、失敗時のresource解放と再試行を実装する。
- `Template`、`Area`、`Artwork`、制作sessionのdomainと、`app`が一つのsessionを生成・所有して画面へ提供する境界を追加する。
- タイトル、template選択、初期作品を表示する制作画面までのroutingと日本語・英語文言を追加する。
- template取得とrelease確認のport、開発用catalog・asset実装、browser adapterを追加し、F/Sで検証済みのversion照合、response検証、resource所有権と単体テストを製品責務へ昇格・移設する。
- `GET /api/templates`の製品API仕様を一つの文書へまとめ、現行F/S responseと製品schemaの差分、success・error response、cache、SAS、秘密情報境界、および環境ごとにAPI設定からcatalog JSONのファイル名を選択する規則を明示する。
- カメラ、写真、単色、完成PNG、共有、およびAzure上の本番API・Blob・IaC接続は後続changeの対象とする。

## Capabilities

### New Capabilities

- `creation-session`: Start時の互換性確認、制作sessionの生成・所有・破棄、画面遷移、および開始失敗からの復帰を扱う。
- `template-selection`: 開発用catalogを介したtemplate一覧、選択、全asset準備、初期作品表示、および読込失敗からの復帰を扱う。

### Modified Capabilities

なし。

## Impact

- `src/domain/`へtemplate、area、artwork、session snapshotの型と純粋な生成規則を追加する。
- `src/features/`へsession開始とtemplate選択の状態・use case・portを追加し、`src/infrastructure/`へ開発用catalog、release確認、asset loaderの実装を置く。
- `src/app/`で依存と単一sessionを結線し、`src/pages/`とVue Routerへtemplate選択・制作画面を追加する。
- 既存のAzureテンプレート配信F/Sから、version照合、response検証、session resource所有権、browser adapterと対応テストを製品用の命名・責務へ移設または再利用する。F/S routeとAzure接続実装はフェーズ6まで保持する。
- `docs/architecture/`へSWAマネージドAPI仕様を追加し、必要に応じてfrontend architecture、画面状態、開発手順を更新する。
- 新しいruntime依存、UI component library、専用状態管理libraryは追加しない。
