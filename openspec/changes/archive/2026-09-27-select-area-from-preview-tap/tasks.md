## 1. Session所有のhit test基盤

- [x] 1.1 template-selection featureにArea hit testerのportとresource型を追加し、`prepareTemplate`がdecode済みmaskから作成・session終了時に一度だけ解放するようにする
- [x] 1.2 1080×1080の色付きhit mapをArea描画順で一度だけ構築し、alpha値128以上の座標1ピクセルからArea IDを返すCanvas実装と単体テストを追加する

## 2. Preview tap操作

- [x] 2.1 CSS座標からArtwork座標への変換と8 CSS pxのtap判定を純粋関数として実装し、表示倍率・高DPR・drag・cancelを単体テストする
- [x] 2.2 `ArtworkAreaHighlight`へpointer操作とArea選択emitを追加し、mask外・重なり・scroll時に選択を変更しないことをテストする
- [x] 2.3 CreationPageとsession facadeをhit testerへ結線し、preview tapと既存Area selectorが同じ選択状態を更新するようにする

## 3. 検証

- [x] 3.1 関連する単体テスト、format、lint、型検査、production buildを実行する
- [x] 3.2 iPhone Safari・Chromeを含む実機またはPR previewで、preview tap、mask外、重なり、scrollの挙動を確認する
