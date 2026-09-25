# production-template-delivery Specification

## Purpose

既存Azure基盤を初期本番用途へ昇格し、環境別catalog、private Blobからのtemplate API、asset運用、および配信更新後も継続する制作sessionを定める。

## Requirements

### Requirement: 既存Azure基盤を初期本番基盤として継続利用する

システムは、実機確認済みの既存Azure Static Web Apps Free、private Blob Storage、private template containerを、重複resourceを作成または再作成せず初期本番基盤として継続利用しなければならない（SHALL）。IaC、タグ、運用文書は本番用途を識別し、デプロイトークン、Storage接続文字列、account key、SASをソース、parameter、output、文書へ含めてはならない（MUST NOT）。

#### Scenario: 既存基盤を本番構成として検査する

- **WHEN** 開発者が対象subscriptionとResource Groupを明示して本番用IaCをvalidateおよびwhat-ifする
- **THEN** 結果は既存SWAの意図しない変更または重複resourceの作成を含まず、Storageとcontainerの定義した状態だけを示す

#### Scenario: 過去のF/S名を持つresourceを運用する

- **WHEN** 本番用の手順またはアーキテクチャ記録が既存resourceを参照する
- **THEN** 文書は過去のF/S識別子を履歴として説明し、現行の用途を初期本番環境として明記する

### Requirement: 環境別catalogと共有template assetを選択する

APIは、必須Application Setting `TEMPLATE_CATALOG_FILE`に設定された安全なJSONファイル名だけを使用し、固定prefix `catalog/`配下のcatalogを読み込まなければならない（SHALL）。APIはpath、URL、空値、区切り文字、`..`、JSON以外の拡張子を含む設定を拒否し、既定catalogへfallbackしてはならない（MUST NOT）。複数環境は同じprivate Storageとrevision付きtemplate assetを共有できなければならない（SHALL）。

#### Scenario: Productionのcatalogを選択する

- **WHEN** Production環境の`TEMPLATE_CATALOG_FILE`に有効なcatalogファイル名が設定される
- **THEN** APIは`catalog/`配下のそのJSONだけを読み、responseまたはfrontend stateへ設定値と内部Blob pathを含めない

#### Scenario: PR previewのcatalogを切り替える

- **WHEN** PR preview環境にProductionと異なる有効な`TEMPLATE_CATALOG_FILE`が設定される
- **THEN** APIは同じStorage内のそのcatalogを読み、そのcatalogが参照する共通revisionのtemplate assetへSASを発行する

#### Scenario: catalog設定が不正である

- **WHEN** `TEMPLATE_CATALOG_FILE`が未設定または安全なJSONファイル名でない
- **THEN** APIはcatalogを推測せず、秘密値を含まない設定不備の500 responseを返す

#### Scenario: F/S設定から製品設定へ移行する

- **WHEN** 各環境に`TEMPLATE_CATALOG_FILE`を追加し、製品APIがProductionとPR previewで正常にcatalogを返すことを確認する
- **THEN** 運用者は旧`TEMPLATE_CATALOG_BLOB`を削除し、製品APIはその設定を参照またはfallbackに使用しない

### Requirement: 製品template APIをprivate Blobから提供する

システムは、`GET /api/templates`で製品schema version 1のcatalogを検証し、現在時刻で公開中のtemplateだけを返さなければならない（SHALL）。各responseは`Cache-Control: no-store`、APIのapp version・build ID、catalog revision、server time、SAS expiryを含み、各assetには一つのBlobだけへ読み取り専用、HTTPS限定、最大60分のSAS URLを渡さなければならない（MUST）。

#### Scenario: 公開中templateを取得する

- **WHEN** 有効なcatalogに公開期間内のtemplateが存在する
- **THEN** APIは非公開、公開前、公開終了済みのtemplateと内部Blob pathを除外し、公開中templateの表示metadataとSAS付きasset参照を返す

#### Scenario: catalogが不正である

- **WHEN** catalog JSONが解析不能または製品schema version 1として無効である
- **THEN** APIはSDK例外、接続文字列、SAS queryを露出せず、catalog不正を示す502 responseを返す

#### Scenario: Storageを利用できない

- **WHEN** APIがprivate Storageからcatalogを取得できない
- **THEN** APIはrequest固有のStorage詳細を露出せず、再試行可能なStorage障害を示す503 responseを返す

### Requirement: template assetを復旧可能な順序で運用する

システムは、新revisionのtemplate assetをすべて検査してからcatalogを更新しなければならない（SHALL）。revision付きassetは`public, max-age=31536000, immutable`、catalogは`no-cache`とし、公開停止後の未参照assetは最低24時間削除してはならない（MUST NOT）。containerはprivateを維持し、匿名Blob accessを許可してはならない（MUST NOT）。

#### Scenario: 新revisionを公開する

- **WHEN** 運用者がtemplateの新revisionを公開する
- **THEN** 運用者は全assetのContent-Type、寸法、cache headerを確認してからcatalogを最後に更新する

#### Scenario: templateを公開停止する

- **WHEN** 運用者が公開中templateを停止する
- **THEN** 運用者は先にcatalogの公開状態または期間を変更し、旧assetを少なくとも24時間残す

#### Scenario: assetを誤って変更または削除する

- **WHEN** assetまたはcontainerの内容を復旧する必要が生じる
- **THEN** 運用者は14日のsoft deleteまたはBlob versionから復元できる

### Requirement: Production配信後も制作sessionを継続する

システムは、ProductionおよびPR previewでfrontend、release情報、template API responseのapp versionとbuild IDを照合し、三者が一致した場合だけ制作を開始しなければならない（SHALL）。制作開始時に選択templateの全assetを取得・decodeした後は、配信更新またはSAS期限経過によって制作中sessionのAPI、release、Blob、JavaScript、CSSを再取得してはならない（MUST NOT）。

#### Scenario: 配信中identityが一致する

- **WHEN** 利用者がProductionまたはPR previewでStartを操作し、frontend、release、APIのidentityが一致する
- **THEN** アプリケーションはcatalog snapshotを作成し、選択したtemplateの全assetをsessionへ固定する

#### Scenario: 制作中に新しい配信がある

- **WHEN** Start済みsessionを持つtabに新しいfrontendまたはAPIが配信される
- **THEN** アプリケーションは保持済みresourceだけで作品の生成、保存、共有を継続する
