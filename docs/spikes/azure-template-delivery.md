# Azureテンプレート配信F/S

## 対応するOpenSpec change

`validate-azure-template-delivery`

## 検証する問い

- SWA FreeのマネージドAPIがprivate Blobのカタログを読み、公開中assetだけへBlob単位・read-only・60分のService SASを発行できるか。
- 動的なPRプレビューoriginからSAS付きBlobを直接取得し、Canvasを汚染せず1080×1080 PNGを生成、保存、共有できるか。
- フロント、API、`release.json`のapp versionとbuild IDを制作開始前に照合し、混在buildを安全に止められるか。
- 制作開始時に必要なassetとcodeを読み切れば、同じPR環境がBuild AからBuild Bへ更新された後も旧tabで制作を完遂できるか。
- catalog、API、HTML、release情報、hash付きcode、revision付きtemplateに適したcacheと削除猶予は何か。

## 対象環境

- Azure Static Web Apps Free: `moment-palette-fs-market-u-20260918` / East Asia
- Azure Storage: 同じF/S用resource groupへこのchangeで追加
- ローカルfrontend: Node.js 24 / pnpm 12.4.2 / SWA CLI 2.0.10
- ローカルAPI: Node.js 22 / npm / Azure Functions Core Tools 4.14.0
- 必須実機: iPhone 15 / iOS 26 / Safari、Chrome
- 対象外: Android Chrome。端末確保後に同じchecklistを実施する

## 成功条件

- private containerは匿名取得を拒否し、APIは公開中templateの個別assetだけへread-only・HTTPS・60分SASを返す。
- API response、browser成果物、通常log、診断表示へ接続文字列、account key、SAS queryを残さない。
- Blob CORSは`GET`、`HEAD`、`OPTIONS`だけを許可し、iPhone Safari・Chromeでasset取得とCanvas PNG生成が成功する。
- rootとAPIのversionがbuild前に一致し、フロント、API、`release.json`のbuild IDがStart時に一致する。
- version/build不一致では制作状態を作らずreloadを案内し、通信失敗では再試行できる。
- Start後はAPI、`release.json`、template Blob、未取得のJS/CSSを要求せず、Build B配信後も旧tabでPNG生成、保存、共有を完遂する。

## 対象外

- 製品用のtemplate選択画面、制作画面、管理画面を完成させること。
- Cosmos DB、template upload API、管理者認証を追加すること。
- ユーザー写真、制作状態、完成PNGをAzureへ送信・保存すること。
- User Delegation SAS、Managed Identity、Key Vault、SWA Standard、独立Functionsを採用すること。
- browserによるpage破棄後の制作状態復元を保証すること。
- `html2canvas`の導入、またはhash付きCSS/JavaScriptをhashなしへ変更すること。

## 公式仕様の確認（2026-09-21）

Portal生成テンプレートは使用せず、Microsoft Learn、Azure公式GitHub、npm registryの一次情報を確認した。

| 項目 | 確認内容 | 採用値 |
| --- | --- | --- |
| SWA managed API | HTTP trigger、`/api`統合、Managed Identity非対応 | SWA Freeのmanaged Functions |
| API runtime | `staticwebapp.config.json`の対応表はNode.js 22を掲載し、Node.js 24は未掲載 | `node:22` |
| Application Settings | APIの環境変数として使用でき、保存時暗号化。環境ごとに設定可能 | `AZURE_STORAGE_CONNECTION_STRING`等を保存 |
| frontend runtime | 既存toolchainのNode.js 24を維持 | Node.js 24 |
| local integration | SWA CLIは別起動APIを`--api-devserver-url`でproxy可能 | Node 22 Functions host + Node 24 SWA CLI |
| API build | `skip_app_build`はfrontendだけ。`api_location`のAPIはActionがbuildする | `app_location: dist`、`api_location: api` |
| Service SAS | account keyで個別BlobのSASを生成できる | `r`、HTTPS、発行から60分、`startsOn`なし |
| Blob CORS | CORSは認可ではなく、private Blobは有効なSAS等を必要とする | origin `*`、`GET/HEAD/OPTIONS`だけ |
| Storage Bicep | `Microsoft.Storage`に安定版`2025-06-01`がある | account/blob service/containerを`2025-06-01`で統一 |
| SWA CLI | npmの現行版とNode.js要件を確認 | 2.0.10 / Node.js 18以上 |
| Functions Core Tools | npmの現行版とNode.js要件を確認 | 4.14.0 / Node.js 22以上 |
| `@azure/functions` | npmの現行版はNode.js 20以上 | 4.16.5 |
| `@azure/storage-blob` | npmの現行版はNode.js 22以上 | 12.33.0 |

参照:

- [SWAのアプリケーション構成と対応runtime](https://learn.microsoft.com/azure/static-web-apps/configuration)
- [SWA managed Functionsの機能と制約](https://learn.microsoft.com/azure/static-web-apps/apis-functions)
- [SWA Application Settings](https://learn.microsoft.com/azure/static-web-apps/application-settings)
- [SWA build設定](https://learn.microsoft.com/azure/static-web-apps/build-configuration)
- [SWA CLI `swa start`](https://azure.github.io/static-web-apps-cli/docs/cli/swa-start/)
- [JavaScriptでService SASを作成する](https://learn.microsoft.com/azure/storage/blobs/sas-service-create-javascript)
- [Azure Storage CORS](https://learn.microsoft.com/rest/api/storageservices/Cross-Origin-Resource-Sharing--CORS--Support-for-the-Azure-Storage-Services)
- [`Microsoft.Storage` Bicep API version一覧](https://learn.microsoft.com/azure/templates/microsoft.storage/allversions)

## 固定するGitHub Action

2026-09-21にAzure公式repositoryの`refs/heads/v1`を再確認した。uploadとcloseの両方で次の完全長commit SHAを使用する。

| Action | 参照 | 完全長commit SHA |
| --- | --- | --- |
| [`Azure/static-web-apps-deploy`](https://github.com/Azure/static-web-apps-deploy) | `v1` branch | `4d27395796ac319302594769cfe812bd207490b1` |

採用inputは`action`、`azure_static_web_apps_api_token`、`repo_token`、`app_location: dist`、`api_location: api`、`output_location: ''`、`skip_app_build: true`である。tagやPortalが過去に生成した定義を転記しない。Action自体をSHAで固定しても、内部の配信clientやSWA serviceまでは固定されないため、実際のPR deployを最終確認とする。

## F/S fixtureとBlob metadata

既存の文鳥01を`buncho-01`、asset revisionを`r1`として使用する。Blob pathは変更せず、内容変更時は`r2`のような新しいrevisionへ先に配置する。

| 用途 | 元ファイル | Blob path | Content-Type | Cache-Control |
| --- | --- | --- | --- | --- |
| thumbnail | `サムネイル.png` | `templates/buncho-01/r1/thumbnail.png` | `image/png` | `public, max-age=31536000, immutable` |
| line art | `線画.png` | `templates/buncho-01/r1/line-art.png` | `image/png` | `public, max-age=31536000, immutable` |
| background mask | `背景.png` | `templates/buncho-01/r1/masks/background.png` | `image/png` | `public, max-age=31536000, immutable` |
| body mask | `ボディ.png` | `templates/buncho-01/r1/masks/body.png` | `image/png` | `public, max-age=31536000, immutable` |
| beak mask | `くちばし.png` | `templates/buncho-01/r1/masks/beak.png` | `image/png` | `public, max-age=31536000, immutable` |
| mouth mask | `口の中.png` | `templates/buncho-01/r1/masks/mouth.png` | `image/png` | `public, max-age=31536000, immutable` |

カタログは`catalog/catalog.json`、`application/json`、`no-cache`としてassetの後に更新する。F/S catalogには公開中、非公開、公開前、公開終了済みを一件ずつ含める。catalogへ保存するのはschema version、revision、表示情報、公開条件、安全な相対Blob path、MIME typeだけであり、SAS、query、絶対URL、接続情報は保存しない。

## cache仮説

| resource | 方針 |
| --- | --- |
| `index.html` | `no-cache` |
| `release.json` | `no-store` |
| `GET /api/templates` | `no-store` |
| hash付きJS/CSS | `public, max-age=31536000, immutable` |
| revision付きtemplate asset | `public, max-age=31536000, immutable` |
| `catalog/catalog.json` | server側で毎回再検証。Blob metadataは`no-cache` |

## Build A/B確認手順

1. Build AをPRプレビューへ配信し、app/API/releaseのversionとbuild IDを記録する。
2. iPhone Safari・Chromeでtemplateを選び、Startを完了してsession snapshotとrequest件数を記録する。
3. 同じPR branchへBuild Bをpushし、同じプレビューURLが更新されたことを別tabで確認する。
4. Build Aの旧tabでPNG生成、長押し保存、共有を完了する。
5. Start後のAPI、release、Blob、JS、CSSの追加requestが0であることを確認する。
6. 新しいtabではBuild Bの三者が新しい同一build IDを示すことを確認する。

## 結果表

| 項目 | Safari | Chrome | 備考 |
| --- | --- | --- | --- |
| 公開中templateだけを表示 | 成功 | 成功 | 文鳥01だけを表示 |
| SAS assetのCORS取得 | 成功 | 成功 | Startで全asset decode完了 |
| 1080×1080 PNG生成 | 成功 | 成功 | `image/png` |
| 長押し保存 | 成功 | 成功 | |
| Web Share | 成功 | 成功 | |
| version/build三者一致 | 成功 | 成功 | Build A |
| 不一致時のreload案内 | 未実施 | 未実施 | |
| Build A旧tabの完遂 | 未実施 | 未実施 | |
| Start後の対象request | すべて0件 | すべて0件 | API/release/Blob/JS/CSS |
| SAS期限後の取得済みbytes利用 | 未実施 | 未実施 | |

## 定量値

| browser/build | API時間 | asset総bytes | asset取得時間 | decode時間 | PNG生成時間 | Start後対象request |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Safari / Build A | 未実施 | 未実施 | 未実施 | 未実施 | 未実施 | 未実施 |
| Chrome / Build A | 未実施 | 未実施 | 未実施 | 未実施 | 未実施 | 未実施 |

## Azure基盤の適用結果

2026-09-21にsubscription `Azure サブスクリプション 1`、resource group `rg-moment-palette-fs`へBicepを適用した。deployment `validate-azure-template-delivery-20260921`は成功し、既存SWAを変更せずStorage Account `mpfsmarketu20260921`、Blob Service、private container `moment-palette-templates`を作成した。

- HTTPS only: 有効
- TLS: 1.2
- anonymous Blob access: 無効
- CORS: origin `*`、`GET`・`HEAD`・`OPTIONS`だけ
- blob/container soft delete: 14日
- Blob versioning: 有効
- anonymous HTTP: `409 Public access is not permitted on this storage account.`で拒否

Azure認証ユーザーには作成直後のStorage data plane roleがなく、`--auth-mode login`によるfixture uploadは権限不足で拒否された。account keyへ迂回せず、Storage Account scopeの`Storage Blob Data Contributor`付与後に再開する。

その後、対象ユーザーへStorage Account scopeの`Storage Blob Data Contributor`を付与して再開した。文鳥01の6 assetを`templates/buncho-01/r1/`へ先に配置し、すべて`image/png`、`public, max-age=31536000, immutable`であることを確認した後、`catalog/catalog.json`を`application/json`、`no-cache`で最後に配置した。Azure認証ではcatalogとassetを読み取れ、匿名要求は引き続き409で拒否された。SAS付きassetは200、SASなしは409、同じSASによるPUTは403となった。

SWA ProductionのApplication Settingsへ`AZURE_STORAGE_CONNECTION_STRING`、`TEMPLATE_CONTAINER_NAME`、`TEMPLATE_CATALOG_BLOB`を値を表示せず設定し、設定名だけを確認した。PR previewのManaged APIでも同じ設定からcatalogを読み、SASを発行できることを確認した。

## ローカル統合結果

Node.js 22のFunctions hostを`localhost:7071`、Node.js 24のSWA CLIを`localhost:4280`で別processとして起動し、SWA CLIからAPIをproxyした。

- 通常タイトル、既存のカメラ・写真取込・画像共有F/S、Azure配信F/S、`GET /api/templates`へ同一originから到達できた。末尾slashへ正規化される既存F/Sも最終応答は200だった。
- APIは公開中1件だけを返し、非公開・公開前・公開終了済みを除外した。SASはBlob単位、`r`、HTTPS限定、60分だった。
- SAS assetはCORS付きで200、SASなしは409、PUTは403だった。
- Start後に線画と全maskをdecodeし、通常の`img`要素へ1080×1080 `image/png`を表示した。PNG再生成後もAPI、release、Blob、JavaScript、CSSの追加requestはすべて0件だった。
- build ID差とapp version差では制作状態を作らず再読み込みを案内した。`release.json`通信失敗、catalog不正、asset部分失敗では再試行案内へ遷移した。asset部分失敗時に成功済みImageBitmapを解放することは単体テストでも確認した。
- JavaScriptとCSSはViteのcontent hash付きファイル名を維持しており、PNG生成はDOM screenshotやserver CSSを再取得しない。
- 共有adapterは前回の画像共有F/Sで採用した互換File方式を再利用し、単体テストとローカル画面の`canShare`有効化まで確認した。OS共有先への実引渡しはiPhoneのBuild A確認で判定する。

API packageの`npm audit`では、開発時だけ使用する現行`azure-functions-core-tools` 4.14.0が内包する`extract-zip` 2.0.1についてhigh 2件が報告された。npmが提示する自動修正はFunctions v3への非互換なdowngradeであり、Node.js 22の検証条件を満たさない。production依存からは到達せず、現行Core Toolsの配布物取得時だけに関係するため、F/Sでは公式現行版を固定したまま既知制約として記録し、上流更新を追跡する。

## PRプレビュー 初回デプロイ（Build A候補）

| 項目 | 結果 |
| --- | --- |
| PR | [#9](https://github.com/market-U/moment-palette/pull/9) |
| preview URL | `https://icy-mushroom-0c0e42e00-9.eastasia.5.azurestaticapps.net` |
| source commit | `59a1624804c16a546c0686daeac264812e97516d` |
| deployed build ID | `8d4808cd81c18dac08dfb736816dc041b2b62a24` |
| workflow | `F/S preview deployment` / 成功 / 2分1秒 |

PRの`pull_request`実行では、GitHub Actionsの`GITHUB_SHA`がhead commitではなく検証用merge commitを指すため、source commitとdeployed build IDは異なる。フロント、API、`release.json`は同じdeployed build IDを持ち、Start時の三者照合は成功した。

- 通常タイトル、3つの既存F/S、Azure配信F/S、`GET /api/templates`、`release.json`はHTTPSで200を返した。
- Productionへ登録したApplication SettingsをPR previewのManaged APIから利用でき、APIは公開中1件だけを返した。
- APIは`Cache-Control: no-store`、`release.json`は`no-store`、`index.html`は`no-cache`だった。hash付きJS/CSSとrevision付きtemplate assetは`public, max-age=31536000, immutable`だった。
- Blob単位SASはread-only、HTTPS限定、60分で、asset GETはCORS付き200、SASなしは409、PUTは403、別途生成した期限切れSASは403だった。
- preview画面で全asset decodeとStartが完了し、1080×1080 `image/png`を27.3msで生成した。生成後のAPI、release、Blob、JS、CSS追加requestは0件だった。
- GitHub Actions logとbuild成果物に接続文字列、account key、完全なSAS署名は見つからなかった。
- iPhone Safari・Chromeの保存・共有とBuild A/B継続性は次の実機確認で判定する。

iPhoneでは固定高page内のF/S rootがscroll containerになっておらず、初期表示より下へ移動できなかった。このデプロイはBuild A/B継続確認の基準から除外し、F/S rootへ`height: 100%`を追加した次のデプロイをBuild Aとして扱う。

## PRプレビュー Build A実機結果

| 項目 | 結果 |
| --- | --- |
| source commit | `8187cb2e635254f57e9aba86b185ac004904a177` |
| deployed build ID | `ceddb02903291448382bca149b882ae773a1cabc` |
| Safari / Chrome | iPhone 15 / iOS 26 |
| session snapshot | app `0.0.0` / build `ceddb02903291448382bca149b882ae773a1cabc` / catalog `fs-2026-09-21-r1` / template `r1` |
| Start後request | Safari・ChromeともAPI / release / Blob / JS / CSSが0件 |

Safari・Chromeとも、スクロール、公開中template表示、Start、全asset decode、1080×1080 PNG生成、長押し保存、Web Shareに成功した。操作後もStart後requestはすべて0件で、browser間の差異はなかった。両browserのStart済みBuild A tabを残した状態で、同じPRへこの結果をpushしてBuild Bへ更新する。

## 秘密値・asset運用

- localは追跡対象外の`api/local.settings.json`だけに接続文字列を置く。
- AzureではSWA Application Settingsへ設定し、command output、文書、shell historyへ値を表示しない。
- assetは新revisionへ全件配置し、Content-TypeとCache-Controlを確認してからcatalogを最後に更新する。
- 公開停止はcatalogの`published`または公開期間を先に変更し、制作中sessionの猶予期間中は旧assetを削除しない。
- 誤削除・上書きはversioningとsoft deleteから復旧する。保持期間と削除猶予の最終値は実機結果を踏まえて決める。
- key rotationは未使用keyを再生成し、Application Settingsをそのkeyへ切替・確認してから旧keyを再生成する。発行済みSASは署名keyの再生成または期限到達まで有効性が変わり得るため、実施時に影響を確認する。

## F/Sコードの境界

| 区分 | 対象 |
| --- | --- |
| 後続で削除 | 専用route、Build A/B表示、公開条件fixture、診断UI、手動検証用Canvas |
| 昇格候補 | API契約、catalog検証、公開判定、SAS signer、version/build生成・照合、template取得port、resource所有権、IaC、workflow |
| 結果後に判断 | CORS origin、SAS 60分、soft delete保持期間、旧asset削除猶予 |

## Androidの扱い

Android Chromeは今回の合否へ含めず、端末確保後に公開条件、CORS、SAS期限、Canvas PNG、保存、共有、Build A/B継続性を同じchecklistで確認する。未確認を確認済みとして記録しない。

## 制約と未解決事項

- 60分SASとStart時全取得が通常制作とbackground復帰に十分かは実機確認待ち。
- PRプレビューに必要なCORS origin `*`を本番でも維持するかはF/S結果後に判断する。
- iOSがbackground中にpageを破棄した場合の復元は初期リリース対象外。
- template assetの削除猶予とsoft delete保持期間は未確定。

## 完了方針

このF/Sのdelta specは製品の正式要件ではないためmain specsへ同期しない。検証結果、採否、codeの扱い、roadmapを更新し、`openspec archive validate-azure-template-delivery --skip-specs`でarchiveする。
