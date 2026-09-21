## ADDED Requirements

### Requirement: F/S境界と秘密情報の保護
検証実装は、製品機能と区別できる専用route、専用feature、専用fixtureへ分離し、Storage Accountの接続文字列、アカウントキー、SAS署名材料をクライアント成果物、リポジトリ、通常ログへ含めてはならない（MUST NOT）。ユーザーの写真、制作状態、完成PNGをAPIまたはBlobへ送信してはならない（MUST NOT）。

#### Scenario: F/S画面を開く
- **WHEN** 検証者がAzureテンプレート配信F/Sの専用URLを開く
- **THEN** 検証対象、対象外、実行中のversionとbuild ID、ユーザー作品をサーバーへ送信しないことが示される

#### Scenario: production buildを検査する
- **WHEN** 開発者がフロントエンド成果物、API package、source map、ログ出力を検査する
- **THEN** Storage Accountの接続文字列、アカウントキー、Application Settingsの値は含まれず、SAS URLのqueryも診断または通常ログへ記録されない

#### Scenario: 完成PNGを生成する
- **WHEN** 検証者がSASから取得したtemplateで完成PNGを生成、保存、共有する
- **THEN** 選択した写真、制作状態、完成PNGはブラウザ内だけで処理され、アプリのAPIまたはBlobへ送信されない

### Requirement: 再現可能なprivate Blob基盤
システムは、既存F/S用リソースグループへStorageV2 Account、Blob Service、private container、CORS、blob soft delete、versioningを宣言的IaCから作成および更新できなければならない（SHALL）。Storage Accountとcontainerは匿名Blobアクセスを許可してはならず（MUST NOT）、IaCは秘密値をparameter、output、ファイルへ含めてはならない（MUST NOT）。

#### Scenario: IaCを適用する
- **WHEN** 認証済み開発者が対象subscriptionとF/S用parameterを明示してIaCを適用する
- **THEN** Azureは既存SWAと同じF/S用途のStorage Account、Blob Service、private container、CORS、復旧設定を作成または定義状態へ更新する

#### Scenario: 匿名でBlobを要求する
- **WHEN** SASまたは認証headerを持たないclientがtemplate Blobを要求する
- **THEN** Azure StorageはBlob内容を返さない

#### Scenario: IaCとdeployment outputを確認する
- **WHEN** 開発者がBicep、parameter、what-if、deployment outputを確認する
- **THEN** Storage Accountの接続文字列、アカウントキー、SAS tokenは含まれない

### Requirement: ローカルでのフロント・API統合実行
検証環境は、Node.js 24でAzure Static Web Apps CLIとproduction build済みVue成果物を起動し、別processのNode.js 22で動くFunctions hostをSWA CLIからproxyすることで、同じoriginの`/api`配下へ公開できなければならない（SHALL）。ローカル秘密情報は追跡対象外のFunctions設定からだけ取得しなければならない（MUST）。

#### Scenario: ローカル統合環境を起動する
- **WHEN** 開発者が依存関係、production build、追跡対象外のlocal settingsを用意し、Node.js 22のFunctions hostとNode.js 24のSWA CLIを起動する
- **THEN** Vue SPAと`GET /api/templates`は一つのlocalhost originから利用できる

#### Scenario: ローカル秘密情報を検索する
- **WHEN** 開発者がtracked filesとGit差分を検査する
- **THEN** local settings、Storage接続文字列、生成済みSAS tokenは含まれない

### Requirement: カタログの検証と公開期間判定
`GET /api/templates`は、private Blob上のカタログ全体をschema version、必須項目、template id重複、安全な相対Blob pathについて検証し、公開状態と公開開始・終了日時をサーバーUTC時刻で判定しなければならない（SHALL）。不正なカタログを部分的に正常応答として返してはならない（MUST NOT）。

#### Scenario: 公開中のtemplateを取得する
- **WHEN** `published`がtrueで、公開開始以前ではなく、公開終了後でもないtemplateを含むカタログへAPIがアクセスする
- **THEN** APIはそのtemplateの表示情報、revision、署名済みasset URLを200 responseへ含める

#### Scenario: 非公開・公開前・公開終了済みを除外する
- **WHEN** カタログに`published`がfalse、公開開始前、または公開終了済みのtemplateが含まれる
- **THEN** APIは該当templateのmetadata、Blob path、SAS URLをresponseへ含めない

#### Scenario: 終了日時ちょうどに判定する
- **WHEN** サーバーUTC時刻がtemplateの公開終了日時と等しい
- **THEN** APIはそのtemplateを公開対象へ含めない

#### Scenario: カタログが不正である
- **WHEN** schema version、必須項目、日時、重複id、またはBlob pathの検証に失敗する
- **THEN** APIは成功したtemplate一覧を返さず、秘密値とSAS URLを含まない診断可能なエラーを返す

### Requirement: Blob単位・読み取り専用Service SAS
APIは、公開対象templateの各assetについて、カタログに記載された一つのBlobだけを対象とするHTTPS用Service SASを生成し、read以外の権限を与えてはならない（MUST NOT）。F/SのSAS有効期間は発行時から60分とし、responseへ共通の期限を明示しなければならない（SHALL）。

#### Scenario: 公開assetのSASを発行する
- **WHEN** APIが公開対象templateのthumbnail、line art、area maskをresponseへ変換する
- **THEN** 各URLは対応する個別Blobをreadでき、write、create、add、delete、list権限を持たず、60分後に失効する

#### Scenario: SASなしと期限切れSASを使用する
- **WHEN** browserがSASなし、または期限切れSASでprivate Blobを要求する
- **THEN** Azure Storageはasset bytesを返さない

#### Scenario: Application Settingsから接続する
- **WHEN** Azure上のAPIがカタログ読取とSAS発行を行う
- **THEN** APIはApplication Settingsの接続文字列を使用し、その値をresponse、client bundle、通常ログへ出さない

### Requirement: BrowserからのSAS asset取得とCanvas安全性
フロントエンドは、APIから受け取ったSAS URLを使ってtemplate assetをBlobから直接取得し、取得したbytesをCanvasへ描画して1080×1080 PNGを生成できなければならない（SHALL）。Blob CORSは動的なPRプレビューを含むbrowser originからの`GET`、`HEAD`、`OPTIONS`だけを許可しなければならない（MUST）。

#### Scenario: SAS画像を取得する
- **WHEN** iPhone SafariまたはChromeのPRプレビューが有効なSAS URLでtemplate assetを要求する
- **THEN** browserはCORSに拒否されず画像bytesを取得し、assetの寸法とMIME typeを診断表示できる

#### Scenario: CanvasからPNGを生成する
- **WHEN** browserがSASから取得してdecodeしたline artとmaskをCanvasへ描画しPNG Blobを生成する
- **THEN** Canvasはsecurity errorでtaintされず、1080×1080の`image/png`を生成できる

#### Scenario: CORSで書込methodを要求する
- **WHEN** browser originがBlobへ`PUT`、`POST`、`PATCH`または`DELETE`のpreflightを行う
- **THEN** F/S用Blob CORSはそのmethodを許可しない

### Requirement: app versionとbuild IDの一貫性
システムは、rootとAPIの`package.json` versionが一致することをdeploy前に検査し、フロントbundle、API response、`release.json`へ同じデプロイ固有build IDを埋め込まなければならない（SHALL）。versionまたはbuild IDがStart時に一致しない場合、制作状態を作る前にユーザー操作によるreloadを案内しなければならない（MUST）。

#### Scenario: versionとbuild IDが一致する
- **WHEN** Start時にフロント自身、`GET /api/templates`、`release.json`のversionとbuild IDがすべて一致する
- **THEN** フロントは選択templateの事前読込へ進める

#### Scenario: package versionが一致しない
- **WHEN** rootとAPIの`package.json` versionが異なる状態で品質検査を実行する
- **THEN** 検査は失敗し、SWAへのdeployを開始しない

#### Scenario: 配信中のbuildが混在する
- **WHEN** Start時にフロント、API、`release.json`のversionまたはbuild IDが一つでも異なる
- **THEN** フロントは制作状態を作らず、現在の作品がない状態でreloadを促す案内を表示する

#### Scenario: version確認に失敗する
- **WHEN** `release.json`またはAPIを通信エラーで取得できない
- **THEN** フロントは新versionがあると断定せず、制作開始を保留して再試行可能な通信エラーを表示する

### Requirement: Start前の資源取得と制作中の固定
フロントエンドは、選択templateの線画と全mask、および完成、保存、共有に必要なJavaScriptをStart完了前に取得し、session snapshotへapp version、build ID、catalog revision、template revisionを固定しなければならない（SHALL）。Start後は`release.json`、template API、SAS URL、template Blobを再取得してはならず（MUST NOT）、更新を理由に自動reloadしてはならない（MUST NOT）。

#### Scenario: Startを完了する
- **WHEN** version整合と全session assetのfetch・decodeが成功する
- **THEN** フロントはsession snapshotと取得済み資源を保持して制作中状態へ遷移する

#### Scenario: 事前取得に失敗する
- **WHEN** Start前のline art、mask、または必要moduleの取得・decodeが一つでも失敗する
- **THEN** フロントは不完全な制作状態へ進まず、取得済み一時資源を解放して再試行を案内する

#### Scenario: SASが制作中に失効する
- **WHEN** Start後に保持中のSAS有効期限を過ぎてから完成PNGを生成する
- **THEN** フロントはSAS URLを更新または再取得せず、取得済みasset bytesからPNGを生成できる

#### Scenario: 新しいreleaseを制作中に検出し得る
- **WHEN** 制作中に同じSWA環境へ新しいbuildがdeployされる
- **THEN** 開いているsessionは自動reloadせず、開始時のversion、build ID、template revisionを維持する

### Requirement: 更新確認用resourceと不変assetのcache分離
システムは、`index.html`を再検証可能にし、`release.json`と`GET /api/templates`を保存cacheから再利用してはならない（MUST NOT）。content hash付きJavaScript・CSSとrevision付きtemplate Blobは不変resourceとして扱い、同じpathの内容を上書きしてはならない（MUST NOT）。

#### Scenario: Start時にreleaseを確認する
- **WHEN** browser cacheに以前の`release.json`が存在する状態でStartする
- **THEN** browserは保存済みresponseだけで判定せず、現在のSWA配信内容を再取得する

#### Scenario: template APIを再取得する
- **WHEN** 公開期間またはカタログrevisionが変更された後に新しい制作を開始する
- **THEN** browserは期限付きSASを含む過去のAPI responseを再利用せず、現在の公開判定結果を取得する

#### Scenario: template assetを更新する
- **WHEN** 開発者が既存templateの画像内容を変更する
- **THEN** 新しいasset revisionを持つBlob pathへ先に配置し、最後にcatalog参照を新revisionへ変更する

#### Scenario: templateを公開停止する
- **WHEN** 開発者がtemplateをカタログから除外する
- **THEN** 開発者は制作中sessionが参照し得る旧assetを即時削除せず、定めた猶予期間後に削除する

### Requirement: 同一PR環境への再デプロイをまたぐ制作継続性
検証実装は、同じPRプレビューURLをBuild AからBuild Bへ更新した場合に、Build AでStart済みのpageが旧ハッシュ付きJavaScript・CSS、`release.json`、API、template Blobを追加取得せず、Canvas PNG生成、保存、共有まで完遂できることを確認可能にしなければならない（SHALL）。CSSのcontent hashを外すことを成立条件にしてはならない（MUST NOT）。

#### Scenario: Build Aの制作中にBuild Bをdeployする
- **WHEN** iPhoneでBuild AのtemplateをStartした後、同じPRへBuild Bをpushして同じプレビューURLを更新する
- **THEN** Build Aの開いたpageは状態を失わず、取得済み資源を使って編集、PNG生成、保存、共有を継続できる

#### Scenario: 制作開始後のrequestを確認する
- **WHEN** 検証者がBuild B配信後にBuild Aの旧pageで完成、保存、共有を行う
- **THEN** 診断値とnetwork確認では、Start後に旧buildのJavaScript・CSS、`release.json`、`/api/templates`、template Blobへの追加requestが発生しない

#### Scenario: 新しいpageを開く
- **WHEN** Build B配信完了後に同じPRプレビューURLを新しいtabで開く
- **THEN** 新しいpageはBuild Bのapp versionとbuild IDを表示し、Build BのAPIおよび`release.json`と整合する

#### Scenario: 完成PNGを生成する
- **WHEN** Build B配信後のBuild A pageが完成PNGを生成する
- **THEN** 生成処理はDOM screenshotまたはserver上のCSS再読込に依存せず、取得済み画像とCanvas描画から有効なPNGを返す

### Requirement: iPhone実機判定と結果記録
F/Sは、iPhone 15（iOS 26）のSafari・Chromeを完了条件とし、SAS取得、Canvas PNG、version不一致、cache、Build A/B継続性の結果をbrowser別に記録しなければならない（SHALL）。Android Chromeは今回の完了条件へ含めず、リリース後のフォロー項目として明示しなければならない（MUST）。

#### Scenario: iPhone Safariで検証する
- **WHEN** 検証者がSafariで公開条件、SAS取得、Canvas、Start、Build A/B、保存、共有のchecklistを実行する
- **THEN** 各結果、version/build ID、SAS期限、request診断、差異がF/S結果文書へ記録される

#### Scenario: iPhone Chromeで検証する
- **WHEN** 検証者がChromeでSafariと同じchecklistを実行する
- **THEN** 各結果とSafariとの差異がF/S結果文書へ記録される

#### Scenario: Androidの確認状況を記録する
- **WHEN** F/S結果と完了条件をまとめる
- **THEN** Androidを確認済みと記録せず、端末確保後に同じchecklistを実行するフォロー項目として残す

### Requirement: F/S結果と運用手順の保存
プロジェクトは、検証した問い、構成、公式仕様の確認日、対象環境、定量値、合否、制約、未解決事項、Application Settings設定、Storage key rotation、asset更新・公開停止・削除、rollback、F/Sコードの扱いをリポジトリ内へ記録しなければならない（SHALL）。delta specはmain specsへ同期してはならない（MUST NOT）。

#### Scenario: F/Sを完了する
- **WHEN** 自動検査とiPhone実機確認が完了する
- **THEN** 結果文書はService SAS、CORS、60分expiry、cache、version/build照合、session継続性の採否と根拠を記録する

#### Scenario: コードの扱いを判断する
- **WHEN** F/Sをarchiveする前に追加・変更ファイルを確認する
- **THEN** ファイルまたはmodule単位で、本実装へ昇格、設計を保って再実装、削除のいずれかが記録される

#### Scenario: F/S changeをarchiveする
- **WHEN** 検証結果とroadmapを更新してchangeをarchiveする
- **THEN** `--skip-specs`を使用し、この検証用delta specを製品のmain specsへ同期しない
