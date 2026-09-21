## 1. F/S境界・公式仕様・結果記録の準備

- [x] 1.1 `docs/spikes/azure-template-delivery.md`を追加し、検証する問い、対象環境、成功条件、対象外、公開条件、SAS、cache、version/build、Build A/B、browser別の結果表を用意する
- [x] 1.2 Microsoft Learn、Azure公式GitHub、npmの一次情報から、SWA Freeのmanaged API、Node.js runtime、Application Settings、Action inputs、SWA CLI、Service SAS、Blob CORS、Bicep resource versionを再確認し、確認日と採用値を結果文書へ記録する
- [x] 1.3 `Azure/static-web-apps-deploy`の公式`v1`参照先を実装時点で確認し、採用する完全長commit SHAとAction定義を記録する
- [x] 1.4 既存の文鳥01からサムネイル、線画、4マスクをF/S用fixtureとして選定し、Blob上のtemplate id、asset revision、path、MIME type、cache metadataを決める
- [x] 1.5 公開中、非公開、公開前、公開終了済みを含むF/S用catalog JSONを用意し、SASや絶対URLを保存しないschemaを文書化する
- [x] 1.6 F/S route、fixture、diagnostic UIを削除可能にし、API契約、純粋ロジック、IaC、workflowを昇格候補にする境界を記録する

## 2. Node.js 22マネージドAPIの基盤

- [x] 2.1 `api/`へNode.js 22、TypeScript、Azure Functions v4の独立npm packageを作成し、`host.json`、`package-lock.json`、build・typecheck・test scriptを追加する
- [x] 2.2 `@azure/functions`、`@azure/storage-blob`など必要最小限のAPI依存を、実装時点の公式互換性を確認して固定する
- [x] 2.3 `api/local.settings.json`と生成物を追跡対象外にし、秘密値を含まないexampleまたは設定名だけの手順を用意する
- [x] 2.4 catalog schema、template、asset path、API response、設定値、診断用errorの型をAPI所有のmoduleへ定義する
- [x] 2.5 schema version、必須項目、日時、重複template id、安全な相対Blob pathを検証し、不正catalog全体を拒否する純粋ロジックを実装する
- [x] 2.6 `published`、公開開始、公開終了を注入したUTC時刻で判定し、終了日時ちょうどを非公開にする純粋ロジックを実装する
- [x] 2.7 公開中、非公開、公開前、公開終了済み、境界時刻、不正日時、重複id、path traversalを単体テストする
- [x] 2.8 catalog Blobを接続文字列とcontainer設定から読み、構文・schema errorとStorage障害を秘密値なしで分類するadapterを実装する
- [x] 2.9 公開対象の各Blobだけへread-only・HTTPS・60分のService SASを発行し、write・create・add・delete・listを与えないsignerを実装する
- [x] 2.10 SASのresource範囲、permission、protocol、expiryと、response・error・logに接続文字列やアカウントキーを含めないことを単体テストする
- [x] 2.11 `GET /api/templates`を実装し、server time、catalog revision、SAS expiry、version/build metadata、公開中templateだけを`Cache-Control: no-store`で返す
- [x] 2.12 API source全体を確認し、公開判定、SAS最小権限、秘密値非露出、error境界の理由が伝わる日本語コメントを配置する

## 3. app version・build ID・release情報

- [x] 3.1 rootと`api/package.json`のversion一致を検査し、不一致で終了するscriptと単体テストを追加する
- [x] 3.2 一つのapp versionとbuild ID入力から、フロント用metadata、API用generated module、`release.json`を生成するscriptを実装する
- [x] 3.3 GitHub Actionsではcommit SHA、ローカルでは明示的な開発用値をbuild IDとして使用し、未指定または不正な値を曖昧なproduction buildへ混入させない
- [x] 3.4 `release.json`へapp versionとbuild IDだけを出力し、秘密値、branch名、SAS、個人情報を含めないことを単体テストする
- [x] 3.5 フロント自身、API response、`release.json`のversion/build IDを比較する純粋ロジックを実装し、一致、version差、build差、欠損を単体テストする
- [x] 3.6 `release.json`を`cache: 'no-store'`で取得し、更新不一致と通信失敗を区別するportとbrowser adapterを実装する
- [x] 3.7 version/build不一致では制作状態を作らずreload案内へ遷移し、通信失敗では再試行できる状態遷移を実装・単体テストする
- [x] 3.8 制作開始後はrelease確認と自動reloadを行わない契約を状態管理と単体テストで固定する

## 4. F/S用private Blob IaC

- [x] 4.1 既存Bicepへ一意なStorage Account名parameterとStandard_LRS・StorageV2 resourceを追加し、HTTPS only、TLS 1.2以上、匿名Blobアクセス無効を宣言する
- [x] 4.2 Blob Serviceへbrowser read用CORSを追加し、origin `*`、`GET`・`HEAD`・`OPTIONS`だけを許可して書込methodを含めない
- [x] 4.3 blob soft deleteとversioningを有効化し、F/S用private containerを匿名accessなしで作成する
- [x] 4.4 Bicep、parameter、outputへ接続文字列、アカウントキー、SAS、Application Settingsの値を含めないことを検査する
- [x] 4.5 `infra/README.md`とarchitecture文書へSWA、managed API、private Blob、SAS直取得、CORS、秘密値設定、復旧設定をMermaid図と説明で追加する
- [x] 4.6 template assetをrevision付きpathへ先に配置しcatalogを最後に更新する手順と、公開停止、削除猶予、soft delete復旧、key rotationの手順を文書化する
- [x] 4.7 Bicepのformat、lint、build、対象subscription/resource groupを明示したvalidateとwhat-ifを実行し、意図しないSWA再作成や秘密値outputがないことを確認する

## 5. フロントのtemplate取得・事前読込・session所有権

- [x] 5.1 template一覧、asset参照、catalog revision、SAS expiry、API version/buildを所有するfeature型と取得portを定義する
- [x] 5.2 same-originの`GET /api/templates`を`no-store`で呼び、HTTP・schema・通信errorを区別するbrowser adapterを実装する
- [x] 5.3 診断表示とlogではSAS URLのqueryを除去し、完全なSASを永続化またはconsole出力しないsanitize処理と単体テストを追加する
- [x] 5.4 選択templateの線画と全maskをSAS URLからBlobとして並列取得し、Canvas用画像へdecodeするasset loaderを実装する
- [x] 5.5 部分失敗時に取得済みImageBitmap、object URL、response参照を解放し、不完全なsessionを返さないresource所有権を実装する
- [x] 5.6 app version/build照合後に全assetと必要moduleを読み終えてからsessionを開始し、app version、build ID、catalog revision、template revisionをsnapshotへ固定するuse caseを実装する
- [x] 5.7 同じsessionでAPI、release、SAS URL、template Blobを再取得せず、SAS期限後も取得済みbytesをCanvasへ渡せることをfake portで単体テストする
- [x] 5.8 session開始失敗、再試行、完了、route離脱でresourceを一度だけ解放し、制作中のversion更新では破棄しないことを単体テストする
- [x] 5.9 Start前後の自前fetchとResource Timingを記録し、queryなしURL、resource種別、件数、時刻だけを返すF/S診断collectorを実装する
- [x] 5.10 template取得、事前読込、snapshot、資源破棄、SAS query保護の判断理由が伝わる日本語コメントを配置する

## 6. Canvas・保存・共有を含むF/S画面

- [x] 6.1 `/spikes/azure-template-delivery`の遅延route、composition root、page、feature UIを追加し、routeへ入った時点で制作完遂に必要なmoduleを読み込む
- [x] 6.2 F/S専用であること、対象環境、Android対象外、Service SAS構成、ユーザー作品を送信しないこと、app version/build IDを画面へ表示する
- [x] 6.3 APIから得た公開中template一覧とthumbnailを表示し、template選択、Start、再試行、reload案内を明確に区別する
- [x] 6.4 公開中・非公開・公開前・公開終了済み件数、server time、catalog revision、SAS expiry、API version/build IDを秘密値なしで診断表示する
- [x] 6.5 Start中はversion照合と全asset decodeを完了するまで制作操作を許可せず、失敗時は一時resourceを解放して再試行できるUIを実装する
- [x] 6.6 取得済み線画とmaskをCanvasへ描画し、CORS taintなしで1080×1080 `image/png`を生成するF/S用compositorを実装する
- [x] 6.7 完成PNGをalt付き通常画像として表示して長押し保存を妨げず、実証済み共有adapterから画像をOS共有シートへ渡せるよう結線する
- [x] 6.8 PNG生成時にDOM screenshot、`html2canvas`、server CSS、template URL、完成時dynamic importを参照しないことをテストと検索で固定する
- [x] 6.9 Start後のAPI・release・Blob・JS・CSS request件数とsession snapshotを表示し、SAS queryや画像binaryを画面・consoleへ出さない
- [x] 6.10 iPhoneのsafe areaと縦画面でtemplate選択、Start、Canvas、保存・共有、診断へ到達できるF/Sレイアウトにする
- [x] 6.11 新規・変更source全体を確認し、version境界、Start境界、Canvas独立性、request診断の理由が伝わる日本語コメントを配置する

## 7. static config・SWA CLI・GitHub Actions

- [x] 7.1 `staticwebapp.config.json`へ`node:22`の`apiRuntime`を追加し、`index.html`、`release.json`、hash付きassetのcache headerを要件どおり設定する
- [x] 7.2 Node.js 22のFunctions hostとNode.js 24のSWA CLIを別processで起動し、`--api-devserver-url`でproduction buildと`api/`を同一originへ統合できるscriptを追加する。必要なAzure Functions Core Toolsも再現可能な依存として用意する
- [x] 7.3 rootの品質検査からAPIの凍結install、typecheck、test、buildとpackage version一致検査を実行できるscriptを追加する
- [x] 7.4 frontend build前に共通build metadataを生成し、`dist/release.json`とAPI generated moduleが同じbuild IDを持つことをCIで検査する
- [x] 7.5 GitHub ActionsへAPI品質検査と`api_location: api`を追加し、フロントは`skip_app_build: true`のまま検査済み`dist`を再buildせず配信する
- [x] 7.6 `Azure/static-web-apps-deploy`のupload・closeを確認済みの現行公式完全長commit SHAへ更新し、tagや古いportal templateへ依存しない
- [x] 7.7 外部forkとDependabotにはSWA deployment tokenを渡さず品質検査だけを行う既存境界を、API追加後も維持する
- [x] 7.8 build成果物、workflow log、PR commentにStorage接続文字列、SAS query、ローカル設定が含まれないことを検査する

## 8. 自動検査とローカル統合確認

- [x] 8.1 APIのcatalog検証、公開期間、SAS最小権限、error変換、秘密値非露出の単体テストを成功させる
- [x] 8.2 フロントのversion/build照合、release取得、template取得、事前読込、resource解放、request診断、Canvas生成の単体テストを成功させる
- [x] 8.3 rootとAPIのtypecheck、lint、format、test、production build、package version一致検査をすべて成功させる
- [x] 8.4 production buildに接続文字列、アカウントキー、完全なSAS query、ユーザー画像送信処理が含まれないことを検索で確認する
- [x] 8.5 Node.js 22のFunctions hostとNode.js 24のSWA CLIを別processで起動し、VueとAPIが同一originになること、通常タイトル、既存F/S、Azure配信F/S、`GET /api/templates`へ直接アクセスできることを確認する
- [x] 8.6 ローカルで公開中だけが返ること、read-only SAS取得、画像decode、1080×1080 PNG、長押し対象、共有、version一致を確認する
- [x] 8.7 version差、build ID差、release通信失敗、catalog不正、asset部分失敗を起こし、制作開始前のreload・再試行・resource解放を確認する
- [x] 8.8 Start後にrelease、API、Blobを再取得せずCanvas PNGと共有まで完了し、CSSとJavaScriptのcontent hashが維持されることを確認する
- [x] 8.9 Bicep検査、全品質検査、`openspec validate validate-azure-template-delivery`を実行して成功を確認する

## 9. Azure Storage・Application Settingsの準備

- [x] 9.1 `az`認証、対象subscription、既存F/S resource group、既存SWA名を確認し、対象を明示してBicepを適用する
- [x] 9.2 Storage Account、Blob Service、private container、CORS、soft delete、versioningがIaCどおりで、匿名Blob要求が拒否されることを確認する
- [x] 9.3 文鳥01assetをrevision付きpathへ先にアップロードし、Content-Typeとimmutable cache metadataを設定してからcatalogを最後にアップロードする
- [x] 9.4 catalogとassetをAzure認証で読み取れ、匿名では読めず、CORSに書込methodが含まれないことをCLIとservice設定で確認する
- [x] 9.5 Storage接続文字列を値を表示・保存せずにSWA production Application Settingsへ設定し、PR previewへ適用される環境設定を確認する
- [x] 9.6 Azure上のAPIがcatalogを読み、公開中templateだけへread-only・60分SASを返し、SASなし・期限切れ・書込要求を拒否することを確認する
- [x] 9.7 Application Settings更新、Storage key rotation、asset更新・公開停止・削除・復旧の実行手順を秘密値なしで結果文書へ確定する

## 10. PRプレビューとBuild Aの確認

- [x] 10.1 作業branchをpushして`main`向けPRを作成し、フロント・API・IaCを含む全品質検査とSWA PRプレビューデプロイを成功させる
- [x] 10.2 PR previewの`/spikes/azure-template-delivery`と`/api/templates`へHTTPSで直接アクセスでき、通常画面と既存F/Sに回帰がないことを確認する
- [x] 10.3 Build Aのフロント、API、`release.json`のapp version/build IDが一致し、公開中template、server time、catalog revision、60分SASが表示されることを確認する
- [x] 10.4 Azure Blobへの直接requestがCORSに成功し、匿名requestは拒否され、Canvas PNGが1080×1080 `image/png`として生成されることを確認する
- [x] 10.5 Build AのURL、commit、build ID、workflow結果、API response header、cache header、秘密値非露出を結果文書へ記録する

## 11. iPhone Safari・ChromeとBuild A/B継続性

- [x] 11.1 iPhone 15（iOS 26）のSafariでBuild Aを開き、template一覧、SAS画像、Start、全asset decode、Canvas PNG、長押し保存、共有を確認する
- [x] 11.2 SafariでStart後のsession snapshotとrequest基準値を記録し、操作とbackground復帰の可能な範囲でAPI、release、Blobの再取得がないことを確認する
- [x] 11.3 iPhone 15（iOS 26）のChromeで11.1〜11.2と同じ確認を行い、Safariとの差異を記録する
- [x] 11.4 Build Aの確認結果を結果文書へ追加して同じPR branchへpushし、同じプレビューURLをBuild Bへ更新する
- [ ] 11.5 SafariのBuild A旧tabでBuild B配信後も状態を保持し、旧JS・CSS・release・API・Blobへの追加requestなしで編集、PNG生成、保存、共有まで完遂する
- [ ] 11.6 ChromeのBuild A旧tabでも11.5と同じ確認を行い、browser差とbackground中のpage破棄有無を記録する
- [ ] 11.7 Build B配信後に新しいtabで同じURLを開き、Build Bのフロント、API、`release.json`が新しい同一build IDで一致することをSafari・Chromeで確認する
- [ ] 11.8 version/buildを意図的に不一致にした確認用状態ではStart前にreload案内が出て、制作中sessionへ強制reloadが発生しないことを可能な範囲で実機確認する
- [ ] 11.9 SAS発行から60分を超える、または同等の期限切れ条件を再現したStart済みsessionで、SAS更新なしに取得済みbytesからPNG生成・保存・共有できることを確認する
- [ ] 11.10 Android Chromeを今回の合否から除外し、端末確保後に11章相当を実施するリリース後フォロー項目として記録する

## 12. 結果・採否・完了

- [ ] 12.1 `docs/spikes/azure-template-delivery.md`へ対象環境、定量値、API・SAS・CORS・cache・version/build・Build A/B・browser別結果、制約、未解決事項を記録する
- [ ] 12.2 Service SAS、60分expiry、CORS origin `*`、private Blob、version/build三者照合、Start時全取得、content hash維持、削除猶予の採否と理由を記録する
- [ ] 12.3 API、IaC、workflow、フロントport、resource所有権、F/S route、fixture、diagnostic UIをファイルまたはmodule単位で昇格、再実装、削除に分類する
- [ ] 12.4 `docs/architecture/`へ検証済み構成と秘密値・asset運用を反映し、`docs/development-roadmap.md`のステップ3とAndroidフォロー項目を結果に合わせて更新する
- [ ] 12.5 `docs/vision.md`のSAS有効期間、cache、削除猶予、session継続性に確定結果を反映する必要があるか判断し、必要な変更だけを行う
- [ ] 12.6 全品質検査、Bicep検査、secret検索、`openspec validate validate-azure-template-delivery`を再実行し、proposal・spec・design・tasks・実装・日本語コメント・結果記録の整合を確認する
- [ ] 12.7 F/S delta specをmain specsへ同期しないことを確認し、完了後は`openspec archive validate-azure-template-delivery --skip-specs`でarchiveする方針を結果へ記録する
