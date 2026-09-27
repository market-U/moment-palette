## ADDED Requirements

### Requirement: 制作内容を破棄する遷移の確認

アプリケーションは、有効な制作sessionを破棄してtemplate選択またはタイトルへ遷移する前に、制作内容を破棄することと、続行・キャンセル操作を選択中の言語で表示しなければならない（SHALL）。キャンセル時はArtwork、template asset、Area選択、現在のrouteを維持しなければならない（MUST）。

#### Scenario: 制作画面の戻る操作を実行する
- **WHEN** 利用者が制作画面のBackButtonを操作する
- **THEN** アプリケーションはtemplate選択へ遷移してsessionを破棄する前に、破棄確認を表示する

#### Scenario: 破棄をキャンセルする
- **WHEN** 利用者が破棄確認でキャンセルを操作する
- **THEN** アプリケーションは制作画面に留まり、制作sessionを破棄しない

#### Scenario: 破棄を続行する
- **WHEN** 利用者が破棄確認で続行を操作する
- **THEN** アプリケーションは保留していた遷移先へ移動し、既存のsession終了処理を一度だけ実行する

#### Scenario: browserの戻る操作で制作画面を離れる
- **WHEN** 利用者がbrowser historyによって制作画面からsessionを破棄するrouteへ遷移しようとする
- **THEN** アプリケーションは同じ破棄確認を表示し、続行を選ぶまでroute遷移を完了しない
