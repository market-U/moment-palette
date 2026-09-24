## MODIFIED Requirements

### Requirement: 開発用catalogの製品契約準拠

アプリケーションは、製品実行時にsame-originの`GET /api/templates`からcatalog snapshotを取得するadapterを使用し、製品schema version 1と同じdomain変換、asset準備、session生成を通らなければならない（SHALL）。製品composition rootは静的な開発用catalogを通常の制作開始へ結線してはならない（MUST NOT）。

#### Scenario: 製品環境で制作を開始する

- **WHEN** 利用者がProductionまたはPR previewでStartし、templateを選択する
- **THEN** アプリケーションは`GET /api/templates`のresponseを製品schemaとして検証し、tag、initialColor、順序付きmaskを使って制作sessionを生成する

#### Scenario: API responseを取得できない

- **WHEN** `GET /api/templates`のnetwork、HTTP応答、response validationに失敗する
- **THEN** アプリケーションは既存のcatalog取得failure分類へ変換し、古いfixtureまたは未検証responseで制作を開始しない

#### Scenario: 開発用fixtureでunit testを実行する

- **WHEN** 開発者がtemplate-selectionまたはcreation-sessionのunit testを実行する
- **THEN** testは明示的なfixtureまたはport fakeを使用でき、製品composition rootへ開発用分岐を追加しない
