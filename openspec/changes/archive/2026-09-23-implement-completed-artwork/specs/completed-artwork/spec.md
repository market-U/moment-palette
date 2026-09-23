## ADDED Requirements

### Requirement: 完成PNGの生成

アプリケーションは、利用者が制作画面で完成操作をしたとき、有効な制作sessionが所有する現在のArtwork、decode済みtemplate asset、Area resourceだけを使用して、各Areaとline artを1080×1080の一枚のPNG Blobへ合成しなければならない（SHALL）。この処理はブラウザ内で完結し、catalog、template asset、release情報、CSSを追加取得せず、画像をserverまたは外部serviceへ送信・永続保存してはならない（MUST NOT）。

#### Scenario: 未着色Areaを残して完成する

- **WHEN** 利用者が初期色のAreaを一つ以上残したArtworkで完成操作をする
- **THEN** アプリケーションは未着色Areaを初期色で描画した1080×1080のPNGを生成し、完成確認へ進める

#### Scenario: Camera fillを含む作品を完成する

- **WHEN** Artworkにcapture済みのArea resourceを持つ利用者が完成操作をする
- **THEN** アプリケーションはcatalog順のmaskで各resourceを切り抜き、line artを最前面へ描画したPNGを生成する

#### Scenario: PNG生成中に完成操作を重ねる

- **WHEN** PNG生成が完了する前に利用者が完成操作を再度行う
- **THEN** アプリケーションは二つ目の生成を開始せず、生成中状態を維持する

#### Scenario: PNG生成に失敗する

- **WHEN** Canvas context、PNG Blob生成、または完成画像resourceの準備に失敗する
- **THEN** アプリケーションはArtworkと制作sessionを保持し、外部例外本文を表示せず、翻訳済みの再試行および制作へ戻る操作を表示する

### Requirement: 完成確認と完成画像resourceの再利用

アプリケーションは、生成済みの完成PNG Blobとobject URLを完成確認中の表示および複数回の共有で再利用しなければならない（SHALL）。完成画像は保存可能な通常の画像要素として表示し、長押しメニューを抑止してはならない（MUST NOT）。独自のダウンロード操作を追加してはならない（MUST NOT）。

#### Scenario: 完成画像を表示する

- **WHEN** PNG生成が成功して完成確認画面を表示する
- **THEN** アプリケーションは同じPNGを通常の画像要素として表示し、画像を長押しして保存できる翻訳済みの案内を表示する

#### Scenario: 完成確認から制作へ戻る

- **WHEN** 利用者が完成確認から制作へ戻る
- **THEN** アプリケーションは制作sessionと完成PNGを保持し、再び完成確認へ進んだときに同じPNGを再生成せず表示できる

#### Scenario: 作品を変更した後に再び完成する

- **WHEN** 完成確認から制作へ戻った利用者がAreaのfillを正常に更新してから完成操作をする
- **THEN** アプリケーションは以前のobject URLを一度だけ破棄し、更新後のArtworkから新しいPNGを生成する

#### Scenario: 制作sessionを終了する

- **WHEN** 利用者が「もういちど遊ぶ」を操作する、制作画面以外へ離脱する、appをunmountする、またはpagehideが発生する
- **THEN** アプリケーションは完成PNGのobject URLと他の制作session resourceをそれぞれ一度だけ解放し、次のStartで以前の完成画像を復元しない

### Requirement: Web Shareと共有文fallback

アプリケーションは、対応環境で完成PNG、固定の紹介文、`#MomentPalette`、アプリのタイトルURLをOS共有シートへ渡せなければならない（SHALL）。共有用FileはPNG bytesと`.png`拡張子を保持した`text/plain` typeとして作成し、実際に渡すFileを`navigator.canShare({ files })`で確認しなければならない（MUST）。

#### Scenario: File共有を開始する

- **WHEN** 完成画像を共有可能な利用者が共有ボタンを直接操作する
- **THEN** アプリケーションは保持済みBlobから同期的に共有用FileとShareDataを組み立て、追加の画像生成や非同期処理を挟まずOS共有シートを開く

#### Scenario: OSまたは共有先へ引き渡す

- **WHEN** `navigator.share()`がresolveする
- **THEN** アプリケーションはOSまたは共有先への引き渡し完了として通常状態へ戻り、投稿、送信、保存の完了を保証する表示をしない

#### Scenario: 共有をキャンセルする

- **WHEN** 利用者がOS共有シートを閉じ、`navigator.share()`が`AbortError`で終了する
- **THEN** アプリケーションはエラーを表示せず、同じ完成PNGを表示した通常状態へ戻る

#### Scenario: File共有を利用できない

- **WHEN** Web Shareが未対応である、または共有用Fileに対する`navigator.canShare()`がfalseを返す
- **THEN** アプリケーションは長押し保存と共有文のコピーまたは手動選択を案内し、完成PNGを維持する

#### Scenario: 共有が失敗する

- **WHEN** `navigator.share()`がキャンセル以外の失敗を返す
- **THEN** アプリケーションは外部例外本文を表示せず、翻訳済みの再試行または長押し保存の案内を表示し、同じ完成PNGで再共有できる

#### Scenario: 共有文をコピーできない

- **WHEN** Clipboard APIが未対応または共有文の書き込みに失敗する
- **THEN** アプリケーションは共有文を選択可能な表示で維持し、翻訳済みの手動コピー案内を表示する

### Requirement: 完成確認の多言語表示

アプリケーションは、PNG生成中、生成失敗、完成確認、長押し保存案内、共有、共有キャンセル・失敗、共有文コピー・手動コピー案内、制作へ戻る、もういちど遊ぶを日本語と英語で提供しなければならない（SHALL）。

#### Scenario: 選択中の表示言語で完成確認を表示する

- **WHEN** 利用者がタイトル画面で表示言語を選択してから完成確認画面を表示する
- **THEN** アプリケーションは保持済みの完成PNGを再生成せず、選択した言語の案内と操作を表示する
