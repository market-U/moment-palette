## Context

フェーズ3のF/Sでは、SWAマネージドAPIから公開中templateを取得し、release情報との互換性を確認したうえで、線画と全maskを取得・decodeすれば、その後のSAS期限や新releaseの配信に依存せず制作を継続できることを確認した。一方、現在の製品routeはタイトル画面だけであり、F/Sの型、状態、adapter、resource所有権は`azure-template-delivery-spike`に閉じている。Blob catalogの製品schemaにはF/Sになかった`tags`と`initialColor`も追加されている。

このchangeでは、タイトルのStartからtemplate選択、初期作品を表示する制作画面までを、製品コードとして縦に接続する。フェーズ6で本番Azure接続を実装するまでは、同じport契約を満たす開発用catalogを標準のcomposition rootへ結線する。ただし、Start時のrelease・API identity照合、製品API responseのvalidation、browser asset loaderは本番接続でそのまま利用できる境界にする。

制約は次のとおりである。

- `domain`はVue、HTTP、Canvas、SAS URL、decode済み画像resourceを知らない。
- `features`は利用側のportを所有し、`infrastructure`の具体実装へ依存しない。
- decode済みresourceはtab内の一つの制作sessionだけが所有し、失敗、置換、終了時に一度だけ解放する。
- 制作画面へ進んだ後はrelease、catalog、assetを再取得しない。
- F/Sコードは動作を維持しつつ、採用する純粋ロジックとbrowser adapterを製品責務へ移し、F/S固有UIや診断を製品へ混ぜない。
- UIは今後人が変更しやすいよう、domain・use case・外部入出力から分離し、現時点ではFigmaの基本導線を満たす最小構成にする。

## Goals / Non-Goals

**Goals:**

- Start時に読み込み済みfrontend、release情報、catalog responseのapp versionとbuild IDを照合し、成功、更新必須、再試行可能な失敗を区別する。
- Start成功時のcatalog snapshotを保持し、公開中templateの一覧、空状態、選択、線画・全maskの準備を提供する。
- `Template`、順序付き`Area`、初期`Artwork`を純粋なdomainとして定義し、一つの制作sessionにdecode済みresourceとともに所有させる。
- templateの全asset準備が完了した場合だけ初期作品を生成し、制作画面へ遷移する。
- F/Sで検証した互換性判定、response validation、部分取得失敗時のresource解放、session ownerを単体テストとともに製品コードへ昇格する。
- `GET /api/templates`の製品契約を一つのアーキテクチャ文書へまとめ、F/S実装との差分、成功・error response、cache、SAS、秘密情報境界を明記する。
- pageとfeature UIを交換しやすくし、後からUIデザインだけを変更してもdomain、use case、adapterへ影響しない構造にする。

**Non-Goals:**

- カメラ、写真、単色によるエリア更新、完成PNG、保存、共有を実装すること。
- 本番のBlob catalog、SAS発行、マネージドAPI、IaC、workflowを製品schemaへ移行すること。
- templateの検索、tag絞り込み、永続保存、tabを閉じた後のsession復元を実装すること。
- UI component libraryまたは専用の状態管理libraryを導入すること。
- F/S routeとAzure検証環境を削除すること。
- template運用用JSON生成scriptまたはそのUI・Skillを実装すること。これは初期リリース要件の後に別changeで扱う。

## Decisions

### 1. Startとtemplate準備を二段階のuse caseに分ける

Start時の`beginCreation`はrelease情報とcatalogを取得し、読み込み済みfrontendを含む3者のidentityを照合する。releaseとcatalogは互いに依存しないため並列取得できるが、両方のvalidationと互換性判定が成功するまではsnapshotを公開しない。成功後は、そのStartで取得したimmutableな`CatalogSnapshot`をtemplate選択状態へ渡す。

template選択後の`prepareTemplate`はsnapshot内の参照だけを使い、線画と全maskを取得・decodeする。全件成功した時点で初期`Artwork`と制作sessionを生成する。ここではreleaseやcatalogを再取得しない。失敗時は取得済みresourceをすべて解放し、同じsnapshotでの再試行またはStartからのやり直しを選べるようにする。

F/Sの`startTemplateSession`は互換性確認とasset準備を一つの関数で行うが、製品画面の二段階遷移には合わないため、そのまま移動せず、互換性判定とsession所有権を再利用して二つのuse caseへ分割する。

代替案として、template選択後に互換性確認もまとめて行う構成がある。しかし一覧を表示して選択した後で更新必須になること、Startの意味が画面仕様とずれることから採用しない。

### 2. domain metadataと外部asset参照・decode済みresourceを分離する

`domain`には次を置く。

- `Template`: 安定したtemplate ID、asset revision、日英名称、tag、順序付き`Area`。
- `Area`: 安定したmask ID、日英label、不透明な`#RRGGBB`の初期色。
- `Artwork`: template ID、asset revision、area順序と各areaの初期状態。
- 初期作品を生成し、重複ID、空のarea、色形式などの不変条件を検証する純粋関数。

SAS URLや開発用URLはcatalog portが返すfeature内のsnapshotにだけ保持する。`ImageBitmap`相当のdecode済みresourceと`release()`はasset loader portの結果に含め、sessionのresource部分が所有する。domain IDはURLや配列indexではなく、template ID、asset revision、mask IDを使う。

代替案としてAPI response型をそのまま`Template`にする構成は、期限付きURL、公開件数、内部配信方式が作品状態へ漏れるため採用しない。

### 3. featureが状態遷移とportを所有し、appが一つのsessionを結線する

`features/creation-session`はStartの状態、互換性判定、`ReleasePort`、`CreationSessionOwner`を所有する。`features/template-selection`は製品catalog schema、`TemplateCatalogPort`、一覧表示用状態、選択中状態、`TemplateAssetLoaderPort`、template準備use caseを所有する。`beginCreation`は取得するcatalogの具体型を知らない最小のloader契約を受け取り、`app`が`TemplateCatalogPort`を注入する。両featureが共有するdomain値は`domain`を介し、互いの内部実装へ直接依存しない。

`app`はfrontend identity、browser release adapter、開発用catalog adapter、browser asset loaderを生成し、tabにつき一つのsession facadeをVueのprovide/injectでpageへ渡す。pageはfacadeが公開するserializableなview stateと操作だけを使い、`infrastructure`をimportしない。

Piniaなどのglobal storeは導入しない。今回の状態は一つの開始フローに閉じ、所有者が明確であるため、明示的なfacadeの方が依存とresource解放を追いやすい。

### 4. routeをsession状態で保護する

製品routeはタイトル、template選択、制作の三つとする。Start成功後だけtemplate選択へ進み、template準備成功後だけ制作へ進む。直接URL、再読み込み、履歴操作などで必要なsnapshotまたは制作sessionがない場合はタイトルへ戻す。

制作sessionの置換、「もういちど遊ぶ」に相当するリセット、app unmount、`pagehide`ではownerをclearし、所有resourceを冪等に解放する。このchangeでは作品変更機能がないため破棄確認を表示しないが、後続changeが編集済み判定を追加できるroute離脱境界をfacadeに用意する。

### 5. 開発用catalogも製品schemaと同じ契約を通す

フェーズ5では、標準の製品導線へ`DevelopmentTemplateCatalogAdapter`を結線する。fixtureは`tags`、`initialColor`、順序付きmask、製品identityを持ち、API responseと同じvalidation・domain変換を通す。asset loaderはURLの取得元に依存せず、開発用静的assetと将来のSAS URLの両方を同じ方法で取得・decodeする。

開発用adapterにだけ許される特別なdomain型や分岐は作らない。これによりフェーズ6ではcomposition rootのcatalog adapterを本番API実装へ差し替え、featureとpageを維持できる。

現行F/S APIは`tags`と`initialColor`を返さず、運用診断用`publicationCounts`を返す。このchangeでは既存APIを変更せず、製品API response validatorと契約文書を先に確定する。本番APIのschema移行とadapter結線はフェーズ6で同時に行う。

### 6. F/Sコードは責務単位で昇格する

次を製品側へ移設または一般化し、単体テストを維持する。

- `versionCompatibility`: identity値と比較規則を`creation-session`へ昇格する。
- `TemplateSessionOwner`: 一度だけ解放する所有権規則を製品session ownerへ昇格する。
- `browserReleaseAdapter`: 製品`ReleasePort`の実装へ移す。
- `browserTemplateAssetLoader`: 製品schemaとresource型へ合わせて一般化し、部分成功時の解放テストを維持する。
- `templateResponse`のvalidation方針: 製品schemaへ再実装し、`tags`、`initialColor`、重複ID、日時、URLを検証する。

F/S専用画面、request diagnostics、手動compositor、公開件数表示、F/S response型はそのrouteが参照する間は残す。共通化のためだけの曖昧な`shared` moduleは作らず、F/S側から製品の純粋な互換性判定を参照できる場合だけimportを付け替える。

### 7. 初期作品はCanvas adapterで表示するが、編集UIから分離する

制作画面は、各areaをcatalogの`initialColor`でmask合成し、最後に線画を重ねた1080×1080の初期作品を表示する。描画は`infrastructure`のCanvas adapterへ置き、featureが要求する表示resource生成portを実装する。F/S compositorの固定色配列は使わず、`Artwork`と`Area.initialColor`を入力にする。

生成した表示resourceもsessionが所有し、作品変更時に再生成できる形にする。今回の制作pageは作品表示とarea名称までを担当し、カメラ・写真・単色の操作は無効な仮ボタンで先取りしない。

SVGやCSS maskだけで表示する案もあるが、後続のカメラ、写真、完成PNGでCanvas座標系を使い、F/S済みの合成処理を昇格できるためCanvasを採用する。

### 8. UIをview stateと局所的なstyleに閉じ込める

page componentはfeatureのview state、翻訳key、commandを受け取り、domain生成やHTTP処理を行わない。template card、状態表示、作品previewの部品は実際に再利用される範囲だけ同じfeature内または`shared/ui`へ置く。CSSはcomponentに局所化し、色・余白など既存app shellのtokenを再利用する。

見た目の修正はpage/componentと翻訳resourceに限定できる。Figmaとの完全一致や最終的なmotionはこのchangeの完了条件にせず、Start、空、準備中、失敗、成功の操作が確認できることを優先する。

### 9. 製品API契約はarchitecture文書で一元管理する

`docs/architecture/template-api.md`を作成し、`GET /api/templates`について次を記述する。

- anonymousなsame-origin GET、`200` success schema、公開用error schemaとstatus。
- `apiVersion`、`buildId`、`serverTime`、`catalogRevision`、`sasExpiresAt`、公開templateの製品field。
- `tags`と`initialColor`の追加、`publicationCounts`の製品responseからの除外などF/Sとの差分。
- `Cache-Control: no-store`、SASのread-only・HTTPS-only・60分、assetのimmutable cache。
- account key、接続文字列、非公開template、公開期間、内部Blob pathを返さない境界。
- APIのApplication Settingsに`TEMPLATE_CATALOG_FILE`を必須設定し、環境ごとに読み込むcatalog JSONのファイル名を選択する規則。
- frontendがresponseを検証してdomainとasset参照へ変換する責務。

response例を実行可能なfixtureと同じfieldに保ち、文書とvalidatorのずれを単体テストで検出できるようにする。OpenAPIの導入は、APIが製品schemaへ移行するフェーズ6で必要性を再評価する。

`TEMPLATE_CATALOG_FILE`には`catalog-dev.json`、`catalog-staging.json`、`catalog.json`のようなファイル名だけを設定する。APIは固定prefixの`catalog/`と結合してBlob名を生成し、設定された一つのJSON Blobを正本として読む。値は小文字英数字と`-`から成るbasenameおよび`.json`拡張子だけを許可し、未設定、空文字、path separator、絶対URL、query、fragment、`..`を含む値は起動時またはrequest処理前の設定検証で拒否する。環境名からファイル名を暗黙的に推測せず、既定catalogへのfallbackも行わない。

catalogのファイル名と組み立て後のBlob名は配信基盤の内部情報であり、success・error response、frontendの型、作品状態へ含めない。frontendが知るのはcatalogの内容を識別する`catalogRevision`だけとする。このchangeでは契約と設定境界を確定し、製品API、IaC、各環境のApplication Settingsへの反映はフェーズ6で行う。現行F/S APIの`readApiConfig`と`createAzureCatalogReader`が持つ設定注入の構造は再利用するが、`TEMPLATE_CATALOG_BLOB`へ相対Blob名を渡すF/S契約は、製品移行時に`TEMPLATE_CATALOG_FILE`と固定prefixへ変更する。

複数環境が同じStorage containerを参照する場合、catalog JSONだけを環境別にし、各catalogから共通の`templates/<template-id>/<asset-revision>/...`を参照できる。assetはrevision付きで上書きしないため、画像bytesを複製せずに流用できる。共有assetを削除するときは、特定環境のcatalogから外れただけでは削除せず、運用対象となるすべてのcatalogから参照がなくなったことを確認してから削除猶予を開始する。

## Risks / Trade-offs

- **開発用catalogと本番APIの差分が残る**: 製品schema validatorを共通入口にし、開発fixtureもresponse shapeから変換する。フェーズ6では同じcontract testをAPIへ適用する。
- **環境設定の誤りで別catalogを読む**: `TEMPLATE_CATALOG_FILE`を必須かつ安全なJSONファイル名として検証し、環境名からの暗黙的な推測や既定catalogへのfallbackを行わない。各環境のdeployment検証で設定値と取得した`catalogRevision`を確認する。
- **共有画像を一つの環境の都合で削除する**: 削除判定は単一catalogではなく、運用対象の全catalogからの参照を確認して行い、最後の参照を外した後も既定の削除猶予を適用する。
- **F/S routeと製品moduleの一時的な重複**: 無理な一括移設でF/S回帰を起こさず、純粋関数とadapterから段階的に昇格する。重複の残存箇所をtasksとarchitecture文書に記録する。
- **decode済み画像の解放漏れが端末memoryを圧迫する**: loaderの部分失敗、ownerのreplace/clear、route離脱を単体テストし、`release()`を冪等にする。
- **template一覧を長時間開くとSASが期限切れになる**: asset失敗時は部分resourceを解放して再試行を示し、期限切れが疑われる場合はStartからsnapshotを取り直せるようにする。自動更新で選択中の一覧を差し替えない。
- **Canvas preview追加が後続の編集実装と重複する**: 描画をport/adapterへ隔離し、F/Sの1080座標系と初期色規則を使う。後続changeは同じsession resourceとArtworkを入力にして置換できる。
- **route guardとresource解放の競合**: navigationそのものではなくsession ownerを解放の正本にし、複数経路からclearされても一度だけ解放する。
- **UIの早期固定**: visual polishを完了条件にせず、view stateとcommandの契約を安定させる。後からcomponent templateとstyleだけを変更できるようにする。

## Migration Plan

1. 製品domainと純粋な不変条件、identity互換性判定を追加し、F/Sのtest caseを製品testへ移す。
2. creation sessionとtemplate selectionのport、use case、state、ownerを追加する。
3. 開発用catalog、browser release、asset loader、Canvas preview adapterを追加し、fixtureを製品schemaへ合わせる。
4. app composition root、provide/inject、route guard、タイトル・template選択・制作pageを接続する。
5. API契約とfrontend architecture、必要な開発手順を更新する。
6. 単体テスト、型検査、lint、format、production build、ブラウザ確認を行う。
7. F/S routeが引き続き動作することを確認し、残したF/S固有コードはフェーズ6の移行対象として記録する。

rollback時は製品routeとcomposition rootの変更を戻し、既存タイトルとF/S routeを維持する。Azure resource、Blob catalog、公開APIはこのchangeで変更しないため、cloud側のrollbackは不要である。
