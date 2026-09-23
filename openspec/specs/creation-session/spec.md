# creation-session Specification

## Purpose

タイトル画面のStartから制作画面まで、build互換性、catalog snapshot、単一制作session、route保護、resource解放を一貫して管理する。

## Requirements

### Requirement: Start時の互換性確認

アプリケーションは、利用者がタイトル画面でStartを実行したとき、読み込み済みfrontend、release情報、template catalog responseのapp versionとbuild IDを照合しなければならない（SHALL）。照合とcatalog validationが完了するまで制作状態を生成してはならない（MUST NOT）。

#### Scenario: 三つのidentityが一致する

- **WHEN** 利用者がStartを実行し、frontend、release情報、catalog responseのapp versionとbuild IDがすべて有効かつ一致する
- **THEN** アプリケーションはその応答からimmutableなcatalog snapshotを一つ生成し、template選択画面へ遷移する

#### Scenario: identityが一致しない

- **WHEN** app versionまたはbuild IDが三者の間で一致しない
- **THEN** アプリケーションは制作状態と利用可能なcatalog snapshotを生成せず、更新が必要であることと再読み込み操作を表示する

#### Scenario: identityが欠損している

- **WHEN** frontend、release情報、catalog responseのいずれかでapp versionまたはbuild IDが欠損もしくは空である
- **THEN** アプリケーションは一致しているものとして扱わず、更新が必要な状態にする

#### Scenario: Start処理に再試行可能な失敗が発生する

- **WHEN** release情報またはcatalogの取得、HTTP応答、response validationに失敗する
- **THEN** アプリケーションは古いcatalogで制作を開始せず、タイトル画面に開始失敗と再試行操作を表示する

#### Scenario: Start処理中に再度Startする

- **WHEN** Start処理が完了する前に利用者がStartを再度操作する
- **THEN** アプリケーションは重複する開始処理を実行せず、確認中の状態を維持する

### Requirement: Catalog snapshotの境界

アプリケーションは、Start成功時に取得したcatalogとasset参照を一つのsnapshotとして保持し、template選択中に自動で別revisionへ差し替えてはならない（SHALL）。snapshotは永続化せず、そのtabの開始フローだけで利用しなければならない（MUST）。

#### Scenario: Template選択中に新しいreleaseが配信される

- **WHEN** Start成功後、利用者がtemplate選択画面にいる間に新しいreleaseが配信される
- **THEN** アプリケーションは保持中のsnapshotを自動更新せず、選択またはStartからのやり直しまで同じcatalog revisionを使う

#### Scenario: ページを再読み込みする

- **WHEN** 利用者がtemplate選択画面または制作画面でページを再読み込みする
- **THEN** アプリケーションは以前のsnapshotまたは制作sessionを復元せず、タイトル画面から新しいStartを要求する

### Requirement: 制作sessionの単一所有権

アプリケーションは、tabごとに同時に一つだけ有効な制作sessionを所有しなければならない（SHALL）。制作sessionはtemplate metadata、更新可能な現在のArtwork、decode済みline art・mask、Areaごとの撮影frame、現在の表示resource、完成確認中の完成PNG resourceを所有し、個別resourceの上書き、完成PNGの無効化、sessionの置換または終了時に不要になったresourceを一度だけ解放しなければならない（MUST）。

#### Scenario: 最初の制作sessionを設定する

- **WHEN** 選択したtemplateの全asset準備と初期Artwork生成が成功する
- **THEN** session ownerはそのsessionを有効なsessionとして保持し、制作画面から現在のArtworkと表示resourceを参照可能にする

#### Scenario: 撮影frameと表示resourceを追加する

- **WHEN** 選択Areaのcamera撮影と更新済みpreview生成が成功する
- **THEN** session ownerは更新後のArtwork、Areaに対応する撮影frame、新previewを同じsessionへcommitし、置換された旧frameと旧previewを一度だけ解放する

#### Scenario: 撮影frameの追加に失敗する

- **WHEN** 新しい撮影frameの取得後にArtworkまたはpreviewの更新が失敗する
- **THEN** session ownerは新しく生成したresourceを解放し、更新前のArtwork、撮影frame、表示resourceを有効な状態で保持する

#### Scenario: 完成PNGを生成する

- **WHEN** 有効な制作sessionから現在のArtworkの完成PNG生成が成功する
- **THEN** session ownerは完成PNG resourceを同じsessionに関連付けて保持し、制作画面と完成確認画面の往復で同じresourceを再利用可能にする

#### Scenario: 作品更新により完成PNGを無効化する

- **WHEN** 完成PNGを保持する制作sessionでAreaのfill更新が成功する
- **THEN** session ownerは更新済みArtworkをcommitした後に以前の完成PNG resourceを一度だけ解放し、新しい完成PNGを生成するまで完成確認へ遷移させない

#### Scenario: 有効なsessionを置き換える

- **WHEN** session ownerへ新しい制作sessionを設定し、既存sessionが存在する
- **THEN** session ownerは既存sessionのtemplate asset、全撮影frame、表示resource、完成PNG resourceを解放してから新しいsessionを所有する

#### Scenario: Sessionを複数経路から終了する

- **WHEN** route離脱、リセット、app unmountまたは`pagehide`により同じsessionの終了処理が複数回要求される
- **THEN** 各resourceの実際の解放処理は一度だけ実行される

### Requirement: 制作開始後の外部取得禁止

アプリケーションは、制作sessionが有効になった後、そのsessionを完了するためにrelease情報、catalog、template assetを再取得してはならない（MUST NOT）。

#### Scenario: Session開始後にSASが期限切れになる

- **WHEN** 線画と全maskのdecode後にSAS URLの期限が切れる
- **THEN** アプリケーションは取得済みresourceとArtworkを使用して制作画面を表示し続け、Blob assetを再取得しない

#### Scenario: Session開始後に新しいbuildが配信される

- **WHEN** 制作sessionが有効な間に新しいfrontendまたはAPI buildが配信される
- **THEN** アプリケーションはsessionを強制的に再読み込みせず、保持中のresourceを利用し続ける

### Requirement: Session状態に基づくroute保護

アプリケーションは、catalog snapshotを必要とするrouteと有効な制作sessionを必要とするrouteへのアクセスを、それぞれの状態に基づいて保護しなければならない（SHALL）。

#### Scenario: Snapshotなしでtemplate選択routeへ直接アクセスする

- **WHEN** catalog snapshotが存在しない状態で利用者がtemplate選択routeへアクセスする
- **THEN** アプリケーションはタイトル画面へ遷移し、Startから開始できる状態にする

#### Scenario: Sessionなしで制作routeへ直接アクセスする

- **WHEN** 有効な制作sessionが存在しない状態で利用者が制作routeへアクセスする
- **THEN** アプリケーションはタイトル画面へ遷移し、空または不完全な制作画面を表示しない

### Requirement: 開始フローの多言語表示

アプリケーションは、タイトル、互換性確認中、更新必須、開始失敗、template選択、制作開始の表示と操作を日本語と英語で提供しなければならない（SHALL）。

#### Scenario: 開始失敗中に言語を切り替える

- **WHEN** 利用者が開始失敗状態で表示言語を切り替える
- **THEN** アプリケーションは外部error本文を直接表示せず、選択した言語の安全な説明と再試行操作を表示する
