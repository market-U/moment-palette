## 1. 製品domainとcatalog契約

- [x] 1.1 `Template`、順序付き`Area`、`Artwork`の型と初期作品生成規則を`src/domain/`へ追加し、重複ID、空のarea、不正な初期色を拒否する単体テストを追加する
- [x] 1.2 製品schema version 1のtemplate catalog response型、validation、domain・asset参照への変換を実装し、必須field、未対応schema、重複ID、日時、URL、`tags`、`initialColor`の単体テストを追加する
- [x] 1.3 F/Sのidentity互換性判定を`creation-session`の製品moduleへ昇格し、app version・build IDの一致、不一致、欠損を網羅する単体テストを移設する

## 2. 開始フローとsession所有権

- [x] 2.1 `ReleasePort`と`TemplateCatalogPort`、Startのview state、`beginCreation` use caseを追加し、release・catalogの成功、取得失敗、validation失敗、更新必須、重複Startを単体テストする
- [x] 2.2 Start成功時のimmutableな`CatalogSnapshot`と、そのtab内だけでsnapshotを保持・破棄するcreation session facadeを実装する
- [x] 2.3 F/Sの`TemplateSessionOwner`を製品用`CreationSessionOwner`へ昇格し、設定、置換、複数回clearでresourceが一度だけ解放されることを単体テストする
- [x] 2.4 制作session有効化後はrelease、catalog、assetのportを呼ばず、保持済みresourceだけを参照する境界を単体テストする

## 3. Template選択とasset準備

- [x] 3.1 template一覧、空、準備中、読込失敗のview stateと、選択・再試行・一覧へ戻る・Startからやり直すcommandを実装する
- [x] 3.2 `TemplateAssetLoaderPort`とtemplate準備use caseを追加し、line artと全maskをcatalog順に取得・decodeしてからsessionを生成する
- [x] 3.3 assetの1080×1080寸法と同一座標系を検証し、部分取得、decode失敗、寸法不正、初期作品生成失敗で準備済みresourceをすべて解放する単体テストを追加する
- [x] 3.4 開発用catalog fixtureとadapterを製品schema version 1で追加し、`tags`、全maskの`initialColor`、日英表示、製品identityを同じvalidation経路へ通す
- [x] 3.5 F/Sのbrowser release adapterとbrowser template asset loaderを製品portへ合わせて昇格し、HTTP失敗、decode失敗、部分resource解放の既存test caseを維持する

## 4. 初期作品の表示

- [x] 4.1 `Artwork`、decode済みmask、line artから表示resourceを生成するportを追加し、Canvas adapterで各Areaの初期色をcatalog順に合成してline artを前面へ描画する
- [x] 4.2 F/S compositorの固定色に依存せず1080×1080の初期作品を生成することと、生成したobject URL等を冪等に解放することを単体テストする
- [x] 4.3 表示resourceの生成成功後だけ制作sessionを有効化し、生成失敗時はassetを含む部分resourceを解放する処理を追加する

## 5. App結線と製品画面

- [x] 5.1 `src/app/`のcomposition rootでfrontend identity、release adapter、開発用catalog adapter、asset loader、preview adapter、単一session facadeを生成し、Vueのprovide/injectでpageへ提供する
- [x] 5.2 タイトル画面のStartを開始use caseへ接続し、通常、確認中、更新必須、開始失敗、再試行、再読み込みを日本語・英語で表示する
- [x] 5.3 template選択routeとpageを追加し、catalog順の名称・thumbnail、言語切替、空状態、準備中、読込失敗と復帰操作を実装する
- [x] 5.4 制作routeとpageを追加し、初期作品、順序付きArea名称、現在選択中のAreaを表示する最小の製品UIを実装する
- [x] 5.5 snapshotなしのtemplate選択routeとsessionなしの制作routeをタイトルへ戻すguardを追加し、直接URL、再読み込み、履歴操作を確認する
- [x] 5.6 sessionのリセット、app unmount、`pagehide`でownerをclearし、同じresourceを複数回解放しないようにする
- [x] 5.7 pageとfeature UIをview state・commandから描画する構造にし、後続のデザイン変更がdomain、use case、adapterへ波及しないことをソース構成とcomponent境界で確認する

## 6. F/Sコードの昇格整理

- [x] 6.1 製品へ昇格した互換性判定、release adapter、asset loader、session所有権について、F/S側のimportを安全に付け替えるか、残す理由を明示して不要な重複を除く
- [x] 6.2 F/S専用route、診断UI、現行API response型、固定色compositorを製品導線へ混ぜず、既存F/S routeが引き続きbuildできることを確認する

## 7. API・アーキテクチャ文書

- [x] 7.1 `docs/architecture/template-api.md`を追加し、`GET /api/templates`のrequest、200 response、公開error responseとstatus、cache header、SAS条件、秘密情報境界をresponse例とともに一元化する
- [x] 7.2 API文書に、製品schemaで追加する`tags`・`initialColor`、除外する`publicationCounts`、内部Blob pathをdomainへ渡さないことなど現行F/S responseとの差分を記載する
- [x] 7.3 API文書に、環境ごとの`TEMPLATE_CATALOG_FILE`へ安全なJSONファイル名だけを必須設定し、APIが固定の`catalog/`と結合すること、未設定や不正値を拒否すること、ファイル名をfrontendへ返さないことを記載する
- [x] 7.4 API文書とtemplate運用手順に、環境別catalogから共通のrevision付き画像assetを参照でき、運用対象の全catalogから参照がなくなるまで共有assetを削除しない規則を記載する
- [x] 7.5 `docs/architecture/frontend-application.md`と関連READMEを、二段階の開始フロー、単一session owner、route guard、開発用catalogから将来の本番adapterへの差し替えに合わせて更新する

## 8. 検証

- [x] 8.1 domain、response validation、開始状態、template準備、resource所有権、Canvas previewの単体テストを実行し、追加した正常系・異常系が通ることを確認する
- [x] 8.2 型検査、lint、format検査、production buildを実行し、製品routeと既存F/S routeの両方が成功することを確認する
- [x] 8.3 開発環境のbrowserで、Start成功、更新必須、開始失敗、catalog空、asset準備成功、準備失敗、直接route、日英切替、session終了時のresource解放を確認する
- [x] 8.4 実装とproposal・design・delta spec・tasksの整合性を`openspec verify`相当のレビューで確認し、完了したtaskへチェックを付ける
