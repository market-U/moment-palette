## MODIFIED Requirements

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
