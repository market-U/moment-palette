## 1. F/S境界と検証記録の準備

- [x] 1.1 `docs/spikes/image-sharing.md`を追加し、検証する問い、対象環境、成功条件、対象外、経路別・ブラウザ別・共有先別の結果表を用意する
- [x] 1.2 W3C Web Share仕様、MDN、関連する標準化issueを一次情報として再確認し、画像とテキストの同時共有、`canShare()`、transient activation、Promise resolveの意味を結果文書へ記録する
- [x] 1.3 複数の既存アプリで`text/plain`方式をiPhone・Android共通に3年以上継続運用している実績と、Moment PaletteではAndroidを新規確認できない制約を分けて記録する
- [x] 1.4 F/S用の固定文、ハッシュタグ、HTTPS URL、`.png`ファイル名を定め、製品用の最終文面ではないことを明記する
- [x] 1.5 F/S専用routeとfeatureが通常画面、カメラF/S、写真F/Sから独立し、完成PNGをアプリのサーバーへ送信・保存しない境界を文書化する

## 2. 共有payloadと結果分類

- [x] 2.1 基準の`text/plain`、比較用`image/png`、対照用の画像のみを表す共有方式と、共有用File・ShareData・診断値の型をfeature内へ定義する
- [x] 2.2 同じPNG Blobから`.png`名のFileを同期的に作り、方式ごとのMIME type、固定文、ハッシュタグ、URLを組み立てる純粋ロジックを実装する
- [x] 2.3 基準方式と標準方式では画像・文・ハッシュタグ・URLを、画像のみ方式ではFileだけを渡すことを単体テストする
- [x] 2.4 Fileの名前、type、size、元Blobとのbytes一致を方式別に単体テストし、`text/plain`方式でもPNG bytesを変換しないことを固定する
- [x] 2.5 Web Share非対応、File共有不可、引き渡し完了、`AbortError`によるキャンセル、既知DOMException、未知の失敗を区別する結果分類を実装する
- [x] 2.6 キャンセルをエラーにしないこと、その他の失敗でエラー名と再試行案内を返すことを単体テストする
- [x] 2.7 MIME type不一致、共有先依存、Promise resolveの意味など判断理由が伝わる完結な日本語コメントを配置する

## 3. 完成PNG resourceの所有権とライフサイクル

- [x] 3.1 PNG Blob、object URL、寸法、byte数、generation id、生成時間を持つ完成画像resourceと生成portをfeature内へ定義する
- [x] 3.2 現在のresourceを一つだけ保持し、新規生成時に古いresourceをdisposeしてから交換する所有権管理を実装する
- [x] 3.3 同じresourceを表示と複数回共有へ渡してもgeneration idと生成回数が変わらないことを単体テストする
- [x] 3.4 再生成、明示的破棄、component破棄でobject URLを一度だけrevokeし、複数回disposeしても安全なことをfake URL APIで単体テストする
- [x] 3.5 共有中は再生成と二重共有を開始できず、共有終了後に同じresourceを再利用できる状態管理と単体テストを追加する
- [x] 3.6 Blob、File、object URLの所有者、再利用範囲、破棄時点を日本語コメントで説明する

## 4. Canvas・Web Share・Clipboardのbrowser adapter

- [x] 4.1 色面、細線、文字、生成版番号を含む識別可能な1080×1080画像をCanvas 2Dで描くF/S用PNG generatorを実装する
- [x] 4.2 Canvasを`image/png` Blobへ一度だけ変換し、MIME type、寸法、byte数、生成時間とobject URLを返す
- [x] 4.3 Blob生成失敗と画像寸法検証失敗で一時canvasのbacking storeとobject URLを解放する
- [x] 4.4 `navigator.share`と`navigator.canShare`の存在、選択方式の実Fileを使った`canShare({ files })`、同期的なShareData組み立てを提供するbrowser adapterを実装する
- [x] 4.5 共有ボタンのユーザー操作から追加の画像生成、Data URL変換、`nextTick`を挟まず`navigator.share()`を呼ぶ契約をfake Navigator APIで単体テストする
- [x] 4.6 `navigator.share()`のresolve、`AbortError`、各DOMException、未知の例外をfeatureの結果型へ変換するadapterテストを追加する
- [x] 4.7 `navigator.clipboard.writeText()`へ共有文全体を渡し、非対応・成功・拒否を区別するClipboard adapterと単体テストを追加する
- [x] 4.8 transient activation、`canShare()`の限界、OSへの引き渡し、Canvas解放の判断理由を日本語コメントで説明する

## 5. F/S画面とrouteの結線

- [x] 5.1 `/spikes/image-sharing`を遅延読み込みrouteとして追加し、app composition rootでPNG generator、share、Clipboardの各adapterをpageへ注入する
- [x] 5.2 F/S専用pageとfeature UIを追加し、検証専用であること、画像を送信・保存しないこと、Android新規実機と製品UIが対象外であることを表示する
- [x] 5.3 完成PNG生成・再生成、generation id、MIME type、寸法、byte数、生成時間を結線し、生成中と共有中の競合操作を無効化する
- [x] 5.4 完成PNGをalt付きの通常の`img`へobject URLで表示し、長押しメニューを妨げるCSS・pointer処理・download属性を追加しない
- [x] 5.5 基準方式、標準方式、画像のみ方式の目的とMIME typeを明示した共有ボタンを用意し、方式ごとの`canShare()`結果を表示する
- [x] 5.6 共有開始、OSへの引き渡し、キャンセル、非対応、失敗、再試行を同じ完成画像状態へ結線し、Promise resolveを投稿成功と表示しない
- [x] 5.7 共有文を常時読めるreadonlyのテキスト領域へ表示し、コピー操作の成功・失敗後も手動選択できるようにする
- [x] 5.8 PNG生成回数、直近の共有方式、File名・type・size、`canShare()`、結果、エラー名だけを診断表示し、画像binaryを表示・console出力しない
- [x] 5.9 component破棄とroute離脱で共有処理の状態を閉じ、保持する完成画像resourceをdisposeする
- [x] 5.10 iPhoneのsafe areaと縦画面で画像、共有ボタン、共有文、診断欄をスクロールして操作できるF/S用レイアウトにする
- [x] 5.11 新しく追加・変更したソース全体を確認し、状態遷移、所有権、ブラウザ差、既存方式を採用する理由が伝わる日本語コメントを配置する

## 6. 自動検査とローカル確認

- [x] 6.1 payload、File bytes、結果分類、resource交換、冪等なdispose、Canvas生成、Web Share、Clipboardの単体テストを通し、既存テストを含めて`pnpm test:run`を成功させる
- [x] 6.2 `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build`、`openspec validate validate-image-sharing`を実行して成功を確認する
- [x] 6.3 選択画像や生成PNGを送信するfetch、永続ストレージ、外部ログ処理がF/S codeへ含まれないことを検索とブラウザnetwork・consoleで確認する
- [x] 6.4 SWA CLIでproduction buildを起動し、通常タイトル、既存カメラF/S、既存写真F/S、画像共有F/Sの直接アクセス、SPA fallbackを確認する
- [x] 6.5 利用可能なデスクトップブラウザでPNG生成、三経路の対応表示、共有文コピー、キャンセル可能な範囲、再生成、route離脱の基本動作を確認する
- [x] 6.6 狭いviewportで長押し対象を覆う要素がなく、全操作へスクロールでき、共有中の連打が抑止されることを確認する

## 7. PRプレビュー配信

- [ ] 7.1 作業ブランチをpushして`main`向けPRを作成し、GitHub Actionsの全品質検査とSWAプレビューデプロイが成功することを確認する
- [ ] 7.2 PRプレビューURLの`/spikes/image-sharing`へHTTPSで直接アクセスでき、通常画面、既存カメラF/S、既存写真F/S、固定F/S環境に回帰がないことを確認する
- [x] 7.3 Safari・Chrome共通チェックリストと、方式・File type・`canShare()`・共有先・画像・文・ハッシュタグ・URL・保存寸法を記録する表を`docs/spikes/image-sharing.md`へ整える

## 8. iPhone Safari・Chrome実機確認

- [ ] 8.1 iPhone 15（iOS 26）のSafariで完成PNGを生成し、`image/png`、1080×1080、generation id、生成回数、画像表示を確認する
- [ ] 8.2 Safariで画像を長押しして写真へ保存し、写真アプリで見た目と1080×1080の寸法を確認する
- [ ] 8.3 Safariで基準の`text/plain`方式を共有し、共有シート表示、画像としての認識、利用可能な共有先で受信した画像・文・ハッシュタグ・URLを送信確定前に確認する
- [ ] 8.4 Safariで`image/png`方式と画像のみ方式を同じBlobから共有し、`canShare()`、画像認識、受信項目を基準方式と比較する
- [ ] 8.5 Safariで共有シートからの画像保存、共有キャンセル、共有文コピー、連続する複数回共有を確認し、キャンセルがエラーにならずPNG生成回数が増えないことを確認する
- [ ] 8.6 Safariで完成PNGを再生成し、版番号が変わり、以前の画像ではなく新しいBlobだけが表示・共有されることを確認する
- [ ] 8.7 iPhone 15（iOS 26）のChromeで8.1〜8.6と同じ確認を行い、Safariとの差異を記録する
- [ ] 8.8 Safari・Chromeで少なくとも10回の共有・キャンセル・再共有を行い、操作不能、古い画像の再表示、継続的な劣化がないことを確認する
- [ ] 8.9 Androidの新規実機確認を今回の合否から除外し、既存運用実績と、Moment Palette固有の将来回帰項目を結果表へ分けて記録する

## 9. 結果・採否・完了

- [ ] 9.1 `docs/spikes/image-sharing.md`へ検証した問い、対象環境、成功条件、定量値、経路別・ブラウザ別・共有先別結果、制約、未解決事項を記録する
- [ ] 9.2 基準の`text/plain`方式、`image/png`方式、画像のみ方式、長押し保存、共有シート保存、Clipboard fallback、resource破棄方式の採否と理由を記録する
- [ ] 9.3 Fileまたはmodule単位で本実装へ昇格、設計を保って再実装、削除のいずれにするかを決め、F/S route、fixture、比較UI、診断表示の扱いを記録する
- [ ] 9.4 F/S結果に合わせて`docs/vision.md`、`docs/design/`、`docs/development-roadmap.md`の更新要否と、完成確認画面の本実装changeへの反映を判断する
- [ ] 9.5 `openspec validate validate-image-sharing`と全品質検査を再実行し、proposal・spec・design・tasks・実装・日本語コメント・結果記録の整合を確認する
- [ ] 9.6 F/Sのdelta specをmain specsへ同期しないことを確認し、完了後は`openspec archive validate-image-sharing --skip-specs`でarchiveする方針を結果へ記録する
