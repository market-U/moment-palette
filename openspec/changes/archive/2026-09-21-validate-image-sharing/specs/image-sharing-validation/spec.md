## ADDED Requirements

### Requirement: F/S実装の分離と完成画像データの保護
検証実装は、製品機能と区別できる専用routeおよび専用featureへ分離し、完成PNGの生成、表示、保存、共有準備をブラウザ内だけで処理しなければならない（MUST）。完成PNG、共有用File、画像binaryをアプリのサーバーへ送信、永続保存、または外部ログへ出力してはならない（MUST NOT）。

#### Scenario: F/S画面を開く
- **WHEN** 検証者が画像保存・共有F/Sの専用URLを開く
- **THEN** 通常画面と区別できる検証画面が表示され、検証対象、対象外、画像を送信・保存しないことが示される

#### Scenario: 完成PNGを処理する
- **WHEN** 検証者が完成PNGを生成して表示または共有する
- **THEN** PNG Blobと共有用Fileはブラウザのメモリ内だけで処理され、アプリによるネットワーク送信または永続ストレージへの書き込みを発生させない

#### Scenario: 診断情報を表示する
- **WHEN** 完成PNGまたは共有処理の診断情報を表示する
- **THEN** 寸法、byte数、MIME type、生成回数、共有方式、API対応状況、処理結果、エラー名だけを対象とし、画像binaryを含めない

### Requirement: 完成PNGの生成と再利用
検証実装は、1080×1080のPNG Blobを一度生成し、完成画像の表示と複数回の共有へ同じBlobを再利用しなければならない（SHALL）。新しい完成PNGを生成した場合またはF/S画面を離れた場合は、以前のobject URLをrevokeし、Blobと共有用Fileへの参照を破棄しなければならない（MUST）。

#### Scenario: 完成PNGを生成する
- **WHEN** 検証者が完成画像生成を開始する
- **THEN** ブラウザ内で1080×1080の`image/png` Blobが一度生成され、object URLを使う画像要素へ表示される

#### Scenario: 同じ完成PNGを複数回共有する
- **WHEN** 検証者が完成画像を変更せずに複数回共有する
- **THEN** 表示中の完成PNGと同じBlobから共有用Fileが作られ、PNG生成回数は増えない

#### Scenario: 完成PNGを再生成する
- **WHEN** 検証者が作品変更に相当する操作で完成PNGを再生成する
- **THEN** 以前のobject URLがrevokeされ、以前のBlob参照が破棄された後、新しいPNGだけが表示と共有に使われる

#### Scenario: F/S画面を離れる
- **WHEN** 完成PNGを保持した状態でroute離脱またはcomponent破棄が発生する
- **THEN** object URLがrevokeされ、Blobと共有用Fileへの参照が別画面へ持ち越されない

### Requirement: 画像要素からの長押し保存
検証実装は、完成PNGを通常の画像要素として表示し、長押しメニューを抑止してはならない（MUST NOT）。独自のダウンロードボタンを追加せず、OSとブラウザが提供する長押しまたは共有シートの保存操作を検証できなければならない（MUST）。

#### Scenario: 完成画像を長押しする
- **WHEN** 検証者がiPhoneの完成画像を長押しする
- **THEN** ブラウザ標準の画像メニューが表示され、利用可能な保存操作を選べる

#### Scenario: 長押しで保存した画像を確認する
- **WHEN** 検証者が長押しメニューから完成画像を写真へ保存する
- **THEN** 保存された画像を写真アプリで開け、見た目と1080×1080の寸法が完成PNGと一致する

#### Scenario: 共有シートから画像を保存する
- **WHEN** OS共有シートが画像保存操作を提示し、検証者が選択する
- **THEN** 保存された画像を写真アプリで開け、見た目と1080×1080の寸法が完成PNGと一致する

### Requirement: 実証済み互換方式を基準にしたWeb Share検証
検証実装は、PNG bytesと`.png`ファイル名を保ちながらFileのMIME typeを`text/plain`とする既存方式を基準経路として提供し、完成画像、固定文、ハッシュタグ、HTTPS URLを一回の`navigator.share()`へ渡さなければならない（SHALL）。比較用にFileのMIME typeを`image/png`とする標準経路と、画像だけを渡す対照経路を提供し、検証者が明示的に選択できなければならない（MUST）。

#### Scenario: 基準経路の共有可否を確認する
- **WHEN** 完成PNGから`text/plain`の共有用Fileを作成する
- **THEN** `.png`のファイル名、PNG bytes、固定文、ハッシュタグ、URLを保持し、同じFileを`navigator.canShare({ files })`で確認した結果が表示される

#### Scenario: 基準経路で共有する
- **WHEN** 検証者が基準経路の共有ボタンを押し、File共有が可能である
- **THEN** 追加の画像変換または非同期生成を挟まず、そのユーザー操作から`navigator.share()`が呼ばれてOS共有シートが表示される

#### Scenario: 標準経路と比較する
- **WHEN** 検証者が同じPNG Blobを`image/png`のFileとして共有する
- **THEN** 基準経路と同じファイル名、固定文、ハッシュタグ、URLが渡され、共有可能判定と共有先で認識された項目を別々に記録できる

#### Scenario: 画像だけを共有する
- **WHEN** 検証者が同じPNG BlobをテキストとURLなしで共有する
- **THEN** 複数項目の同時共有による差を切り分けられるよう、画像Fileだけが共有先へ渡される

#### Scenario: 共有先で受信内容を確認する
- **WHEN** 検証者が利用可能な共有先を選び、送信または投稿を確定する前の画面を確認する
- **THEN** 画像、固定文、ハッシュタグ、URLのうち共有先が受け取った項目と、画像として扱えたかが方式別に記録される

#### Scenario: 共有処理が完了する
- **WHEN** `navigator.share()`のPromiseがresolveする
- **THEN** アプリはOSまたは共有先への引き渡し完了として記録し、実際の投稿または保存完了を保証したとは表示しない

### Requirement: 非対応・キャンセル・失敗時のfallback
検証実装は、Web ShareまたはFile共有の非対応、`canShare()`がfalse、共有キャンセル、共有失敗を区別しなければならない（MUST）。File共有を利用できない場合も完成画像の長押し保存を残し、固定文、ハッシュタグ、URLをコピーできる操作と手動選択可能な表示を提供しなければならない（MUST）。

#### Scenario: Web Shareが利用できない
- **WHEN** `navigator.share`または`navigator.canShare`が利用できない
- **THEN** 共有ボタンを利用不能として理由を表示し、完成画像、長押し案内、共有文のコピー操作を維持する

#### Scenario: Fileを共有できない
- **WHEN** 選択した共有方式の`navigator.canShare({ files })`がfalseを返す
- **THEN** その方式を共有せず、画像Fileを共有できないことと長押し保存・共有文コピーの代替手段を表示する

#### Scenario: 共有シートをキャンセルする
- **WHEN** 検証者が共有先を選ばずに共有シートを閉じ、`navigator.share()`が`AbortError`でrejectする
- **THEN** エラーとして扱わず、キャンセルとして記録して同じ完成確認状態へ戻る

#### Scenario: 共有処理が失敗する
- **WHEN** `navigator.share()`がキャンセル以外の例外でrejectする
- **THEN** エラー名と再試行案内を表示し、同じ完成PNGで共有、長押し保存、共有文コピーを再実行できる

#### Scenario: 共有文をコピーする
- **WHEN** 検証者が共有文のコピーを実行する
- **THEN** 固定文、ハッシュタグ、URLがClipboard APIへ渡され、成功または失敗が表示される
- **AND** Clipboard APIが失敗しても同じ文字列を画面上で選択できる

### Requirement: iPhone実機での判定と結果記録
検証者は、SWAのPRプレビューをiPhone 15（iOS 26）のSafariとChromeで開き、長押し保存、共有シートからの保存、三つの共有経路、共有文コピー、キャンセル、失敗表示、Blob再利用と再生成を確認しなければならない（MUST）。Androidの新規実機確認をこのchangeの合否へ含めてはならず（MUST NOT）、複数の既存アプリで全OS共通の基準経路を3年以上継続運用している実績と、今回未確認の項目を区別して記録しなければならない（MUST）。

#### Scenario: iPhone Safariで縦断確認する
- **WHEN** 検証者がSafariで保存、共有、コピー、キャンセル、再利用、再生成を確認する
- **THEN** 各操作の成否、`canShare()`結果、共有先が認識した項目、保存画像の寸法、生成回数、制約が記録される

#### Scenario: iPhone Chromeで縦断確認する
- **WHEN** 検証者がChromeでSafariと同じ確認を行う
- **THEN** 各結果とSafariとの差異が区別して記録される

#### Scenario: Android実機を利用できない
- **WHEN** このchangeの実施期間中にAndroid Chrome実機を確保できない
- **THEN** iPhone SafariとChromeの必須条件を満たしていればchangeを完了でき、基準経路の既存運用実績とAndroidでの将来の回帰確認項目が記録される

#### Scenario: F/Sを完了する
- **WHEN** 実装と実機確認が完了する
- **THEN** `docs/spikes/`へ検証した問い、対象環境、経路別結果、共有先別結果、制約、採否、コードの昇格・再実装・削除判断、および後続changeへの反映が記録される
- **AND** delta specをmain specsへ同期せず、`--skip-specs`でarchiveする方針が記録される
