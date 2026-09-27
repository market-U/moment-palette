## MODIFIED Requirements

### Requirement: Web Shareと共有文fallback

アプリケーションは、対応環境で完成PNG、固定の紹介文、`#MomentPalette`、アプリのタイトルURL、`package.json`由来のフロントエンド版を`v<version>`形式でOS共有シートへ渡さなければならない（SHALL）。共有用FileはPNG bytesと`.png`拡張子を保持した`text/plain` typeとして作成し、実際に渡すFileを`navigator.canShare({ files })`で確認しなければならない（MUST）。アプリケーションは、OS共有へ渡す文面と、コピーまたは手動選択用に表示する文面で同じフロントエンド版を含めなければならない（MUST）。

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

#### Scenario: フロントエンド版を共有する

- **WHEN** 利用者が完成確認画面で共有または共有文コピーを操作する
- **THEN** アプリケーションはタイトル画面と同じ`v<version>`形式のフロントエンド版を、共有・コピーの両方の文面へ含める
