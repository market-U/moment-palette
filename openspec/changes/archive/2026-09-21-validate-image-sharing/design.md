## Context

`validate-camera-compositing`では、iPhone 15（iOS 26）のSafariとChromeで1080×1080の`image/png` Blobを約100msで生成できることを確認した。`validate-photo-import`では、写真の元形式にかかわらず共有前には統合済みの一枚のPNGになることを確認している。未検証なのは、完成PNGを画像要素から保存できるか、Web Shareへ画像・固定文・ハッシュタグ・URLを渡せるか、同じBlobを表示と共有へ再利用して安全に破棄できるかである。

ユーザーは複数の既存アプリで、PNG bytesと`.png`ファイル名を保ちながらFileのMIME typeを`text/plain`とし、画像とテキストを一回の`navigator.share()`へ渡す方式をiPhone・Android共通で3年以上継続運用している。この方式はWeb標準のPNG MIME typeとは異なるが、対象ユーザー層でAndroidの画像・テキスト同時共有問題を回避している実証済みの基準である。今回Android実機を利用できないため、既存実績を無視して標準方式の再検証を採用条件にはしない。

このchangeは製品の完成確認画面ではなく、保存・共有方式の成立性と制約を確定するF/Sである。固定の共有文、ハッシュタグ、公開URLの最終文面は後続の本実装changeで決める。

## Goals / Non-Goals

**Goals:**

- 1080×1080 PNG Blobを一度生成し、画像表示、長押し保存、複数回の共有へ再利用できることを確認する。
- 既存の`text/plain`方式を基準に、共有用File、固定文、ハッシュタグ、URLをOS共有シートへ渡す。
- `image/png`の標準方式と画像のみの経路を比較し、より良い代替になり得るかを共有先ごとに記録する。
- 非対応、`canShare()`のfalse、キャンセル、共有失敗、Clipboard失敗を区別し、長押し保存と共有文のfallbackを維持する。
- object URL、Blob、Fileの所有権と破棄時点を明確にし、再生成とroute離脱で古い完成画像を残さない。
- iPhone 15（iOS 26）のSafariとChromeで実機判定し、Androidの既存運用実績と今回の未確認事項を分けて記録する。

**Non-Goals:**

- 製品用の完成確認画面、作品状態、画面遷移、最終デザインを完成させること。
- 共有先アプリでの投稿、保存、公開の完了をWebアプリが保証すること。
- Androidの新規実機確認を完了条件にすること。
- 固定文、ハッシュタグ、URLの最終文面または言語別翻訳を確定すること。
- 独自ダウンロードボタン、サーバー保存、クラウド同期、共有履歴、外部分析ログを追加すること。
- Web Share Target、PWAインストール、ネイティブアプリ連携を検証すること。

## Decisions

### 1. 通常画面と既存F/Sから独立した共有F/Sにする

`/spikes/image-sharing`を遅延読み込みrouteとして追加し、通常画面からリンクしない。画面は`src/pages/`、F/S固有の状態とportは`src/features/image-sharing-spike/`、Canvas、Web Share、Clipboard、object URLの具体実装は`src/infrastructure/image-sharing/`へ置き、`src/app/`で結線する。カメラ・写真F/Sのfeatureへ依存せず、完成PNGという境界だけを再現する。

既存カメラF/Sへ共有機能を直接追加する案は、共有検証のために撮影を4回必要とし、失敗原因をカメラと共有のどちらかに切り分けにくいため採用しない。本実装へ昇格するportと純粋ロジックを判断できる構成にしつつ、F/S専用UIとfixtureは削除可能にする。

### 2. 識別可能な1080×1080 PNGをブラウザ内で生成する

共有F/Sは、色面、細線、文字、透明でない背景を含む識別可能な1080×1080画像をCanvas 2Dから`image/png` Blobとして生成する。生成ごとに見た目で判別できる版番号を描き、PNG寸法、MIME type、byte数、生成回数を診断欄へ返す。実在人物、位置情報、外部アセット、ネットワーク取得を使わない。

公開済みPNG fixtureをfetchする案はWeb Share自体の確認には足りるが、製品要件である「完成時に一度生成し、表示と共有へ再利用する」ライフサイクルを検証できないため採用しない。既存カメラcompositorの再利用もfeature間依存になるため避ける。

### 3. 完成画像resourceがBlobとobject URLを所有する

生成結果はBlob、object URL、寸法、byte数、generation id、生成時間を持つresourceとして扱う。画像要素はobject URLを参照し、共有時は同じBlobからその場でFileを作る。共有完了後も完成画面を表示する間はBlobとURLを維持し、再共有でPNGを生成し直さない。

再生成前、route離脱、component破棄ではobject URLを一度だけrevokeし、BlobとFileへの参照を落とす。共有開始後にURLをrevokeしてもFileのbytesとは独立するが、所有権を単純にするため共有中の再生成を無効化する。resourceの置換と冪等な`dispose()`は純粋な状態管理とfake URL APIで単体テストする。

### 4. 既存の全OS共通方式を基準経路にする

基準経路は、完成PNG Blobから`new File([blob], filename, { type: 'text/plain' })`を作り、固定文・ハッシュタグ・HTTPS URLとともに`navigator.share()`へ渡す。PNG bytesと`.png`拡張子は変えない。これは一般的なPNG MIME typeとは異なるが、複数アプリでiPhone・Androidの対象ユーザーへ3年以上提供され、現在も運用中であるため、未検証の標準経路より優先する。

比較経路として同じBlobを`image/png`のFileにする方式、対照経路として画像Fileだけを渡す方式を用意する。比較経路は基準経路を置き換える前提ではなく、iPhoneでの差と将来Android端末を確保した際の比較をコード変更なしで行うための診断機能である。本実装の最終方式はF/S結果へ記録し、標準方式がより良いと確認できなければ基準経路を維持する。

### 5. 共有準備を先に完了し、クリックから直接shareを呼ぶ

PNG Blobは共有ボタンを押す前から保持し、File作成とshare data組み立ては同期的に行う。共有ボタンのhandlerから`nextTick()`、Data URLからBlobへの変換、追加の画像生成を挟まず`navigator.share()`を呼び、ユーザー操作に必要なtransient activationを失うリスクを避ける。

各方式で実際に渡すFileを`navigator.canShare({ files: [file] })`へ渡す。`canShare()`は共有先が画像・テキスト・URLを実際に保持することまでは保証しないため、診断値とし、共有先の下書きまたは保存結果を実機で確認する。

### 6. share portはOSへの引き渡し結果だけを返す

feature側に、共有方式、共有data、成功、キャンセル、非対応、失敗を表す型とportを定義する。browser adapterは`navigator.share()`のresolveを「OSまたは共有先への引き渡し完了」として返し、投稿・送信・保存の完了とは表現しない。`AbortError`はキャンセルとして正常状態へ戻し、`InvalidStateError`、`NotAllowedError`、`TypeError`、`DataError`と未知の例外は診断名と再試行案内へ分類する。

共有中は全共有ボタンと再生成を無効化し、二重呼び出しを防ぐ。共有先が受け取る項目はOSと共有先の裁量であるため、画像、文、ハッシュタグ、URLの各項目を方式・ブラウザ・共有先別に人手で記録する。

### 7. 長押し保存を主fallbackとして常に残す

完成PNGは装飾用backgroundではなくaltを持つ通常の`img`として表示し、`user-select`、`-webkit-touch-callout`、pointer eventで長押しメニューを抑止しない。独自のdownloadリンクは追加しない。長押し保存と共有シートの「画像を保存」をそれぞれ確認し、写真アプリで見た目と1080×1080の寸法を照合する。

Web ShareまたはFile共有が使えない場合も画像と案内を維持する。共有文は常に読めるreadonlyのテキスト領域へ表示し、Clipboard APIによるコピーボタンを提供する。Clipboardが失敗しても、ユーザーが手動選択できる表示を消さない。

### 8. iPhoneを今回の合否、Androidを実績と将来確認に分ける

PRプレビューをiPhone 15（iOS 26）のSafariとChromeで開き、基準・標準・画像のみの三経路、長押し保存、共有シート保存、コピー、キャンセル、連続共有、再生成、route離脱を確認する。共有先への実送信を必須にせず、投稿確定前の下書きまたは共有シートで受信項目を確認してよい。

Androidは今回の合否から外す。結果文書には、基準経路が複数の既存アプリでiPhone・Android共通に3年以上運用中であることと、Moment Paletteの今回のbuild・共有文・PNGでAndroid Chromeを新規確認していないことを別々に記録する。将来Android端末を確保した際は同じF/S routeの三経路を比較する。

### 9. F/S結果を本実装へ選択的に昇格する

共有dataの構築、結果分類、resource所有権、portとbrowser adapterは本実装への昇格候補とする。F/S専用route、合成fixture、三経路比較UI、診断欄、テスト用文面は削除対象とする。採否とファイル単位の扱いを`docs/spikes/image-sharing.md`へ記録し、このdelta specは`--skip-specs`でarchiveする。

## Risks / Trade-offs

- [PNG bytesを`text/plain`と宣言するため、将来のブラウザまたは共有先が拒否・誤認する可能性がある] → `.png`名とbytesを維持し、`canShare()`結果と共有先の認識を記録する。標準経路を比較可能なまま残し、より確実と実証できた場合だけ置き換える。
- [shareのPromiseがresolveしても共有先で画像・文・URLのすべてが使われたとは限らない] → UIでは引き渡し完了とだけ表示し、共有先別の下書き内容を人手で確認する。
- [共有前の非同期処理によりtransient activationを失う] → PNGを事前保持し、クリックhandlerから同期的にFileとdataを作って直ちにshareする。
- [object URLを早くrevokeして長押し画像が消える] → resourceの再生成または破棄までURLを維持し、共有完了だけではrevokeしない。
- [共有中の再生成・連打でresource所有権が競合する] → 共有中は操作を無効化し、resource交換とdisposeを一箇所で管理する。
- [Clipboard APIが拒否される] → 共有文を常時表示し、手動選択をfallbackにする。
- [利用可能な共有先によって結果が変わる] → 特定アプリの存在を完了条件にせず、利用できた共有先名と受信項目を記録する。
- [Androidの今回の回帰を検出できない] → 既存の継続運用実績を採用根拠として明記し、Moment Palette固有の新規確認は将来のフォロー項目として残す。

## Migration Plan

1. F/S専用の型、純粋ロジック、port、fakeを追加し、payload、結果分類、resource lifecycleを単体テストする。
2. Canvas PNG生成、Web Share、Clipboard、object URLのbrowser adapterを追加する。
3. 専用routeと画面を結線し、ローカルとSWA PRプレビューで確認する。
4. iPhone Safari・Chromeの結果を記録し、基準経路、標準経路、fallbackの採否を決める。
5. 本実装へ昇格・再実装・削除するファイルを決め、F/Sを`--skip-specs`でarchiveする。

F/S routeの追加だけで既存routeやサーバー状態を変更しない。通常画面または既存F/Sへ回帰が生じた場合は、新しいrouteと画像共有F/Sコードをrevertすれば元へ戻せる。

## Open Questions

- 固定の共有文、ハッシュタグ、公開URLの最終値と言語別文面は、本実装changeで決める。
- 基準経路を将来Androidで再確認できた時点で、標準経路または別方式へ置き換える根拠が得られるか。
- 利用可能なiPhone共有先のうち、画像と共有文の両方を送信確定前に確認できる対象はどれか。
