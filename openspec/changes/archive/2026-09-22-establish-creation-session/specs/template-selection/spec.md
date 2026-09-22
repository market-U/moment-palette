## ADDED Requirements

### Requirement: 製品template schemaの検証と変換

アプリケーションは、template catalogを画面または作品状態へ渡す前に製品schema version 1として検証し、配信情報と製品domainを分離して変換しなければならない（SHALL）。製品domainはSAS URL、内部Blob path、公開件数を識別子として保持してはならない（MUST NOT）。

#### Scenario: 有効なtemplateを変換する

- **WHEN** templateが一意なID、asset revision、日英名称、tag、thumbnail、line art、1件以上の順序付きmaskを持ち、各maskが一意なID、日英label、不透明な`#RRGGBB`の初期色を持つ
- **THEN** アプリケーションは表示用template metadata、順序付きArea、外部asset参照へ変換する

#### Scenario: 未対応schema versionを受信する

- **WHEN** catalog responseが対応していないschema versionを示す
- **THEN** アプリケーションは黙って読み替えず、catalog全体を無効としてStart失敗にする

#### Scenario: Templateまたはmask IDが重複する

- **WHEN** catalog内のtemplate ID、または同一template内のmask IDが重複する
- **THEN** アプリケーションはcatalog全体を無効として扱い、不安定な配列indexで代替しない

#### Scenario: 初期色が不正である

- **WHEN** maskの`initialColor`が不透明な`#RRGGBB`形式ではない
- **THEN** アプリケーションはそのresponseを無効として扱い、暗黙の既定色へ置き換えない

### Requirement: Template一覧と空状態

アプリケーションは、Start時のsnapshotに含まれる公開中templateをcatalog順に、現在の言語の名称とthumbnailで表示しなければならない（SHALL）。templateが0件の場合は空状態とStartから再確認する操作を表示しなければならない（MUST）。

#### Scenario: 公開中templateが存在する

- **WHEN** catalog snapshotに1件以上のtemplateが含まれる
- **THEN** アプリケーションは各templateをcatalog順に選択可能な項目として表示する

#### Scenario: 表示言語を切り替える

- **WHEN** 利用者がtemplate一覧で日本語と英語を切り替える
- **THEN** アプリケーションはsnapshotを再取得せず、各templateの名称を選択した言語へ切り替える

#### Scenario: 公開中templateが存在しない

- **WHEN** catalog snapshotのtemplate件数が0である
- **THEN** アプリケーションは利用可能なtemplateがないことと、タイトルへ戻って再確認する操作を表示する

### Requirement: 選択templateの全asset準備

アプリケーションは、利用者がtemplateを選択したとき、そのrevisionのline artと順序付き全maskを取得してdecodeし、すべてのresourceと寸法が有効になった場合だけ制作sessionを生成しなければならない（SHALL）。準備中は別templateの重複選択を実行してはならない（MUST NOT）。

#### Scenario: 全assetの準備に成功する

- **WHEN** 選択templateのline artとすべてのmaskが取得・decodeされ、1080×1080の同一座標系を持つ
- **THEN** アプリケーションはcatalogのmask順を維持したresource集合をsessionへ渡す

#### Scenario: Assetの寸法が不正である

- **WHEN** line artまたはmaskが1080×1080ではない、もしくは互いに異なる寸法を持つ
- **THEN** アプリケーションは制作sessionを生成せず、準備済みresourceを解放して読込失敗を表示する

#### Scenario: Assetの一部だけ取得またはdecodeできる

- **WHEN** line artまたはmaskの一部を準備した後で、残りの取得・decodeに失敗する
- **THEN** アプリケーションは成功済みの部分resourceをすべて解放し、制作sessionを生成しない

#### Scenario: 準備中に別templateを選択する

- **WHEN** 選択済みtemplateのasset準備が進行中に利用者が別templateを操作する
- **THEN** アプリケーションは二つ目の準備処理を開始せず、進行中のtemplateを明示する

### Requirement: 読込失敗からの復帰

アプリケーションは、template assetの取得、decode、validation、初期作品生成に失敗したとき、部分resourceを解放し、同じtemplateの再試行、一覧へ戻る操作、Startからsnapshotを取り直す操作を提供しなければならない（SHALL）。

#### Scenario: 同じsnapshotで再試行する

- **WHEN** 利用者が読込失敗後に再試行を選び、snapshotのasset参照が引き続き有効である
- **THEN** アプリケーションは選択したtemplateの全asset準備を最初から実行する

#### Scenario: Snapshotを取り直す

- **WHEN** 利用者が読込失敗後にStartからやり直す操作を選ぶ
- **THEN** アプリケーションは保持中のsnapshotを破棄してタイトルへ戻り、次のStartでreleaseとcatalogを再取得する

#### Scenario: 一覧へ戻る

- **WHEN** 利用者が読込失敗後に一覧へ戻る
- **THEN** アプリケーションは同じcatalog snapshotのtemplate一覧を再表示し、有効な制作sessionを残さない

### Requirement: 初期Artworkの生成と表示

アプリケーションは、asset準備に成功したtemplateから、全Areaが未編集で初期色を持つArtworkを生成しなければならない（SHALL）。制作画面はmaskをcatalog順に初期色で合成し、line artを前面に重ねた作品を表示しなければならない（MUST）。

#### Scenario: 初期Artworkを生成する

- **WHEN** 選択templateの全asset準備が成功する
- **THEN** アプリケーションはtemplate ID、asset revision、各mask IDと初期色を保持したArtworkを生成する

#### Scenario: 制作画面を開く

- **WHEN** 初期Artworkと表示resourceの生成が成功する
- **THEN** アプリケーションは制作画面へ遷移し、1080×1080座標系で初期色の各Areaと前面のline artを表示する

#### Scenario: 未編集Areaが残る

- **WHEN** ArtworkのAreaがまだカメラ、写真または単色で更新されていない
- **THEN** アプリケーションは初期色を表示し、そのAreaを作品から欠落させない

### Requirement: 開発用catalogの製品契約準拠

アプリケーションは、本番API接続前の開発環境でも製品schema version 1と同じdomain変換、asset準備、session生成を通るcatalog adapterを使用しなければならない（SHALL）。

#### Scenario: 開発環境で制作を開始する

- **WHEN** 開発用catalog adapterを使用してStartし、templateを選択する
- **THEN** アプリケーションは本番用featureに開発専用分岐を追加せず、製品schemaのtag、initialColor、順序付きmaskを使って制作sessionを生成する

### Requirement: Template API契約の文書化

プロジェクトは、`GET /api/templates`の製品契約を一つのarchitecture文書で管理し、success・error response、cache、SAS、秘密情報境界、現行F/S responseとの差分を明示しなければならない（SHALL）。

#### Scenario: 製品API adapterを実装する

- **WHEN** 開発者がフェーズ6で本番用template APIとfrontend adapterを実装する
- **THEN** 開発者は一元化された契約から必須field、status、cache header、公開してよい情報、F/Sからのschema変更を確認できる

#### Scenario: 環境ごとにcatalogを選択する

- **WHEN** 開発者が開発、検証、本番の各API環境へ読み込むcatalogを設定する
- **THEN** 文書はAPIの`TEMPLATE_CATALOG_FILE`へ安全なJSONファイル名だけを設定し、APIが固定の`catalog/`配下から取得して、そのファイル名をfrontendのresponseやdomainへ含めない規則を示す

#### Scenario: 複数環境でtemplate画像を共有する

- **WHEN** 開発、検証、本番のcatalogが同じrevision付きtemplate assetを参照する
- **THEN** 文書は環境別catalog JSONだけを分け、共通の`templates/`配下のassetを参照できることと、全catalogから参照がなくなるまで共有assetを削除しない規則を示す

#### Scenario: 秘密情報境界を確認する

- **WHEN** 開発者が製品APIのsuccessまたはerror responseを確認する
- **THEN** 文書はStorage接続文字列、account key、非公開template、公開期間、内部Blob path、SAS queryのlog出力を禁止する境界を示す
