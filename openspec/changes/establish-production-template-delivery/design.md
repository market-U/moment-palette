## Context

既存のAzure Static Web Apps（SWA）Free、private Blob Storage、Managed Functions、GitHub Actionsは、F/Sとして実装・iPhone実機確認済みである。現在は`main`へのpushを固定F/S環境へ配信し、F/S APIは`TEMPLATE_CATALOG_BLOB`からF/S形式のcatalogを読む。一方、製品frontendは同じschema validatorを通す開発用catalog adapterをcomposition rootで結線している。

このchangeでは既存リソースを再作成せず初期本番基盤として扱い、製品API契約、frontend adapter、`release`起点の配信、運用記録へ移行する。Azureリソース名とResource Group名に残る`fs`は過去の識別子であり、可用なリソースを移設・再作成する理由にはしない。

PR previewのManaged APIはProductionと同じApplication Settingsを継承し、同じStorage Accountを使用する。ユーザーと合意したとおり、環境ごとに`TEMPLATE_CATALOG_FILE`を設定して別catalogを選択できるものとし、revision付きassetは全環境で共有する。初期リリースにはユーザーデータ・書込みAPIを含めない。

## Goals / Non-Goals

**Goals:**

- 既存SWA、private Storage、CORS、soft delete、versioningを初期本番基盤として継続利用する。
- 製品schema version 1のcatalogをprivate Blobから読み、公開中templateだけに短期間・read-only・HTTPS限定のBlob SASを発行する。
- 製品frontendをsame-originの`GET /api/templates`へ接続し、Start時の三者build照合とStart後のoffline完結性を維持する。
- `main`を統合候補、`release`を本番配信元に分け、PR previewを保ったまま任意のタイミングでリリースする。
- F/Sから昇格するコード、移設するコード、削除するコードと検証条件を明文化する。

**Non-Goals:**

- 新しいAzureリソース、専用のstaging Storage、custom domain、CDN、bring-your-own Functionsの導入。
- template catalogを生成・配布する専用ツール、管理GUI、継続的なtemplate追加の自動化。
- ユーザーアカウント、ユーザー生成データのサーバー保存、書込みAPI。
- Android Chromeの実機確認。これはフェーズ7の初期リリース候補確認で扱う。

## Decisions

### 既存F/Sリソースを初期本番へ昇格する

既存のSWA、Storage Account、private containerを継続利用する。StorageのHTTPS only、TLS 1.2、匿名Blob access無効、限定CORS、14日のBlob/container soft delete、Blob versioningは製品構成として維持する。

IaCは既存SWAを意図しないPUTから保護しつつ、Storageの望ましい状態を宣言する。Resource Group、SWA、Storageの既存名は変更しない。タグ、Bicep parameter、README、アーキテクチャ図、secret名、Application Settingsの説明からF/S専用という意味を取り除き、歴史的な名前は移行記録として説明する。

新規の本番リソースを作る案は、実機確認済みの配信・Blob・SAS経路を再検証する必要があり、URLも変わるため採用しない。

### 同一Storageを環境間で共有し、catalogだけを切り替える

APIは`TEMPLATE_CATALOG_FILE`を必須とし、ファイル名だけを受け取る。値は安全なJSONファイル名として検証し、固定prefix `catalog/`と結合する。path、URL、`..`、区切り文字、空値、不正な拡張子は設定不備として500にする。既定catalogへのfallbackは行わない。

現在のF/S環境で使用中の`TEMPLATE_CATALOG_BLOB`は、`catalog/catalog.json`のような相対Blob pathを受け取るF/S専用設定である。製品APIはこれを参照せず、二つの設定をfallbackまたは優先順位付きで併用しない。移行では先に各環境へ`TEMPLATE_CATALOG_FILE=catalog.json`を追加し、`FILE`だけを読むAPIのProduction・PR preview確認が完了してから、`TEMPLATE_CATALOG_BLOB`を削除する。この順序により、旧APIを配信中に新しい設定を追加しても動作を変えず、製品APIへの切替後に曖昧な設定を残さない。

Productionは`catalog.json`、PR previewは必要に応じて別のcatalogファイルをApplication Settingsで指定する。全catalogは同じcontainer内の`templates/<template-id>/<asset-revision>/`を参照できる。frontend response、domain state、通常logへcatalog filename、Storage接続文字列、account key、SAS query、内部Blob pathを含めない。

環境ごとにStorageを分離する案は、初期リリースにユーザーデータや書込み機能がなく、同じassetを共有する合意に対して運用量だけを増やすため採用しない。SWA Managed FunctionsがStorageアクセスにShared Keyを使う制約は残るため、デプロイを同一repositoryのPRに限定し、`main`と`release`のレビュー・保護を前提とする。

### F/S APIを製品契約へ移行する

`api/src/catalogReader.ts`、`serviceSasSigner.ts`、`templatesService.ts`、Functions endpointを製品APIへ昇格する。`TEMPLATE_CATALOG_BLOB`は廃止し、設定readerとcatalog readerを`TEMPLATE_CATALOG_FILE`および固定prefixへ変更する。catalog JSONは製品schema version 1として検証し、現在時刻で公開中のtemplateだけを抽出する。

`GET /api/templates`は`Cache-Control: no-store`で、frontendと同じapp version・build ID、catalog revision、server time、SAS expiry、製品の表示metadataとSAS URLを返す。各assetのSASはBlob一件・`r`権限・HTTPS限定・60分とする。構成不備は500、catalog形式不正は502、Storage到達不能は503に正規化し、SDK例外の詳細を外部へ返さない。

APIが画像bytesをproxyする案は、帯域とFunction負荷を増やし、F/Sで確認したBrowserからの直接Blob取得を捨てるため採用しない。Managed Identityを使う案はManaged FunctionsでStorageアクセスへ利用できないため採用しない。

### 製品composition rootをHTTP catalog adapterへ切り替える

`creationSessionAppService`は開発用fixture adapterではなく、製品`TemplateCatalogPort`を実装するsame-origin HTTP adapterを結線する。adapterはresponseを製品schema validatorへ渡し、network、HTTP、invalid responseを既存の公開可能なfailure分類へ変換する。

`beginCreation`はrelease情報とcatalog responseを並列取得し、frontend、release、APIのapp version・build IDが一致した場合だけsnapshotを生成する。template選択後はそのsnapshotのSAS URLからline artと全maskをdecodeし、sessionへ所有権を渡す。Start後はAPI、release、Blob、JavaScript、CSSを再取得せず、同じtabでの配信更新とSAS期限経過後も取得済みresourceで作品を完成できる。

ローカルで静的fixtureを常用する案は、実際のAPI契約・設定不備・assetのCORS/SASを検出できないため、製品composition rootでは採用しない。必要なunit test fixtureは各テストの入力として残す。

### releaseだけをProductionへ配信する

GitHubのデフォルトブランチは`main`のままにし、`release`を初回リリース時点の`main`から作成する。workflowは次のイベントを扱う。

```text
作業ブランチ → PR → main       : 一時preview
main         → PR → release    : 一時preview
release push                  : Production deployment
```

workflowのpush triggerは`release`だけとし、pull request triggerは`main`と`release`を対象にする。SWA actionのuploadには`production_branch: release`を明示し、`release`以外からのpushをProductionと判定しない。外部forkとDependabot PRでは品質検査のみを実行し、SWA tokenを渡さない。PRを閉じた場合は対応するpreviewをcloseする。

`main`へのpushをProductionへ配信し続ける案は、統合中のchangeを任意の単位でリリースできないため採用しない。長期dev branchと固定dev環境は追加しない。`main`、`release`とも直接pushを禁止し、PR・必須品質検査・レビューを要求するbranch protectionを設定する。

### catalog更新とロールバックを順序化する

新revisionのすべてのassetを先にimmutable cacheで配置・検査し、最後に`catalog/<file>`を`no-cache`で更新する。公開停止はcatalogを先に変更し、参照されなくなったassetは少なくとも24時間残してから削除する。誤削除・上書きは14日のsoft deleteとBlob versionから復旧する。

Productionのリリースは`main`から`release`へのPRとして確認し、merge後にProduction URLで行う。障害時は`release`上のrevert PRをmergeして再配信する。API/assetの障害はcatalogを直前の安全なrevisionへ戻し、必要に応じてBlob versionから復元する。

## F/S資産の移行表

| F/S対象 | 判断 | 移行先または削除条件 | 維持・追加する検証 |
| --- | --- | --- | --- |
| `api/src/catalogReader.ts`、`serviceSasSigner.ts`、`templatesService.ts`、`functions/templates.ts` | 昇格 | `api/src/`に残し、製品schemaと`TEMPLATE_CATALOG_FILE`へ変更。`TEMPLATE_CATALOG_BLOB`は移行確認後に廃止 | 既存unit testを更新し、設定検証、公開判定、SAS制約、HTTP errorのtestを追加 |
| `api/src/catalog.ts`、`types.ts`、`generated/buildMetadata.ts` | 昇格 | `api/src/`に残し、製品catalog契約へ適合 | catalog schema、version/build、公開条件のtestを維持 |
| `scripts/generate-build-metadata.mjs`、metadata三者一致・成果物秘密値検査、`staticwebapp.config.json` | 昇格 | 現在の配置を維持 | CIとproduction/preview実機確認で維持 |
| `src/infrastructure/azure-template-delivery/browserTemplateCatalogAdapter.ts` | 設計を保った移設 | `src/infrastructure/template-selection/`へ移し、製品`TemplateCatalogPort`とvalidatorを使用 | HTTP/invalid response分類のtestを移設・更新 |
| `src/infrastructure/azure-template-delivery/loadDecodedAsset.ts` | 昇格済みの共有利用 | 現在のtemplate-selection loaderから継続利用 | decode失敗時のresource解放testを維持 |
| `src/features/azure-template-delivery-spike/templateResponse.ts`、`types.ts`、`templateCatalogPort.ts` | 削除 | 製品`template-selection`のcatalog型・validator・portへ置換後 | production adapterのschema validation testが通ること |
| `src/features/azure-template-delivery-spike/templateSession.ts`、`versionCompatibility.ts`、`assetLoaderPort.ts` | 削除 | `creation-session`、`template-selection`の既存実装へ統合済みのため削除 | build三者照合、asset準備、session継続のtestが通ること |
| `src/features/azure-template-delivery-spike/AzureTemplateDeliverySpike.vue`、`startState.ts`、`compositorPort.ts`、`imageSharePort.ts`、`releasePort.ts`、`requestDiagnostics.ts`、`src/pages/AzureTemplateDeliverySpikePage.vue`、`src/app/spikes/`、F/S route | 削除 | 製品タイトルから完成・共有までが同じAPI/asset経路で実機確認済みとなった後 | E2E相当の手動実機checklist、全自動品質検査、関連unit test |
| `src/infrastructure/azure-template-delivery/browserTemplateAssetLoader.ts`、`canvasTemplateCompositor.ts`、`browserTemplateImageShare.ts`、`browserReleaseAdapter.ts` | 削除または既存製品実装へ統合 | 同等責務を持つ製品infrastructureの利用を確認してから削除 | product asset loader、preview、完成PNG、share、release adapterのtestを維持 |
| `infra/main.bicep`、`infra/environments/fs.bicepparam`、F/S Azure文書・asset fixture | 昇格または整理 | 既存resourceを継続管理するproduction parameterと運用文書へ移行。F/S catalog/assetは製品catalogの配信・確認後に削除判断 | Bicep validate/what-if、production・PR previewのAPI/asset実機確認 |

## Risks / Trade-offs

- [PR previewのAPIが共有Storage接続情報を持つ] → 同一repositoryのPRだけをデプロイし、外部fork・Dependabotへsecretを渡さない。`main`と`release`はreviewと必須検査を伴う保護ブランチにする。
- [既存resource名がF/Sを示す] → 名前変更のために再作成せず、タグ・文書・運用上の環境名をProductionへ更新し、旧名を履歴として明記する。
- [SWA previewは公開URLである] → 非公開素材やユーザーデータを配置しない。private Blobと短期SASを維持する。
- [catalog更新とasset削除が競合する] → asset先行・catalog後更新、24時間の削除猶予、soft deleteとversioningを守る。
- [workflow切替直後にProductionが古いreleaseを配信する] → `release`を現在の`main`から作り、workflow変更を含む`main`→`release` PRを初回リリースとして確認してからmergeする。
- [F/S専用コードを早く削除して回帰する] → 製品経路のunit test、全自動検査、Production/PR preview実機確認がそろうまで削除しない。

## Migration Plan

1. 現在の`main`から`release`を作成し、GitHubのデフォルトブランチは`main`のままにする。両branchのPR必須・品質検査・レビュー設定を有効にする。
2. production parameter、タグ、secret名、Application Settings、catalogを準備する。Productionと必要なPR環境へ`TEMPLATE_CATALOG_FILE`を追加し、旧`TEMPLATE_CATALOG_BLOB`はこの時点では残す。Bicep validateとwhat-ifで既存SWAの意図しない変更や新規重複resourceがないことを確認する。
3. APIを製品schemaと`TEMPLATE_CATALOG_FILE`へ移行し、製品catalogとassetをprivate Blobへ配置する。local/SWA previewでAPI response、CORS、SAS、version/build照合を確認する。
4. frontend composition rootを製品HTTP adapterへ切り替え、production build、unit test、SWA CLIを確認する。
5. workflowを`release` Productionへ切り替え、`main`向けPRと`main`→`release` PRのpreviewを確認する。`release`へmergeしてProduction URLで製品の主要導線を実機確認する。
6. `FILE`だけを読むAPIがProductionとPR previewで正常に動くことを確認してから、各環境の`TEMPLATE_CATALOG_BLOB`を削除する。
7. すべての検証証跡がそろってからF/S route、UI、diagnostic、obsolete catalog/fixtureを削除し、F/S結果と本番構成を文書化する。

ロールバックは、配信コードなら`release`へのrevert PR、catalogなら直前revisionへのcatalog復元、assetならBlob versionまたはsoft deleteからの復元を使う。Azureリソース自体は削除しない。

## Open Questions

- なし。初期Productionは既存resourceの昇格、同一Storageの共有、環境別catalog、`release`起点の本番配信として合意済みである。
