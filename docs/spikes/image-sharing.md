# 完成画像の保存・共有F/S

## 対応するOpenSpec change

`validate-image-sharing`

## 検証する問い

- ブラウザ内で一度生成した1080×1080 PNG Blobを、画像表示、長押し保存、複数回のWeb Shareへ再利用できるか。
- PNG bytesと`.png`ファイル名を保ちながらFileのMIME typeを`text/plain`とする既存方式で、画像、固定文、ハッシュタグ、URLを共有できるか。
- 同じBlobを`image/png`として渡す方式、画像だけを渡す方式と比べ、共有先が受け取る内容にどのような差があるか。
- Web Share非対応、File共有不可、キャンセル、共有失敗、Clipboard失敗を区別し、長押し保存と手動コピーへ戻れるか。
- 再生成と画面離脱でobject URL、Blob、Fileへの参照を破棄し、古い画像を再表示しないか。

## 背景と既存実績

ユーザーが運用する複数の既存アプリでは、PNG bytesと`.png`ファイル名を維持したままFileのMIME typeを`text/plain`とし、画像と共有文を一回の`navigator.share()`へ渡す方式をiPhone・Android共通で3年以上使用している。現在も対象ユーザー層で問題なく運用されているため、この方式を今回の基準経路とする。

Moment Palette固有のPNG、共有文、buildをAndroid Chromeで新規確認する端末は今回確保できない。Androidの新規実機確認は合否から除外し、既存運用実績と将来の回帰確認項目を区別して記録する。

## 現行仕様の確認

- [W3C Web Share API](https://www.w3.org/TR/web-share/)は、`ShareData`として`files`、`text`、`title`、`url`を定義する。一方、OSと共有先は受け取った項目を破棄または統合でき、Promiseのresolveは投稿・保存の完了を保証しない。
- [MDN Navigator.share()](https://developer.mozilla.org/docs/Web/API/Navigator/share)は、File共有前に`navigator.canShare({ files })`で確認し、ユーザー操作からshareを呼ぶ必要があることを示している。`canShare()`は共有先が全項目を保持することまでは保証しない。
- [W3C web-share issue #279](https://github.com/w3c/web-share/issues/279)には、Fileを含む共有でtextなどが共有先へ渡らない事例が報告されている。共有先での受信内容は実機で確認する。
- `navigator.share()`はtransient activationを必要とする。完成PNGは共有操作前に生成・保持し、共有ボタンからData URL変換、追加の画像生成、`nextTick()`を挟まず呼び出す。

## F/S用の固定値

以下は共有経路の検証用であり、製品の最終文面ではない。

- File名: `moment-palette-share-fs.png`
- 固定文: `Moment Palette 共有F/Sで生成した画像です。`
- ハッシュタグ: `#MomentPalette`
- URL: `https://icy-mushroom-0c0e42e00.5.azurestaticapps.net/`

固定文、ハッシュタグ、URLは一つの`text`へ結合し、既存アプリと同じpayload構造で共有する。

## 対象環境

- 必須: iPhone 15 / iOS 26 / Safari
- 必須: iPhone 15 / iOS 26 / Chrome
- 補助: 開発端末で利用可能なデスクトップブラウザ
- 対象外: Android Chromeの新規実機確認

## 成功条件

- 生成したBlobが`image/png`かつ1080×1080で、通常の`img`として表示される。
- 長押しまたは共有シートから保存した画像が、見た目と1080×1080の寸法を維持する。
- 基準経路でOS共有シートが開き、画像として扱える。
- 基準、標準、画像のみの各経路について`canShare()`と共有先の受信項目を記録できる。
- 共有キャンセルをエラー扱いせず、失敗後も同じPNGで再試行できる。
- 完成PNGを変更しない複数回の共有でPNG生成回数が増えない。
- 再生成と画面離脱で古いobject URLとresourceを解放する。
- 画像binaryをアプリのサーバー、永続ストレージ、外部ログへ出力しない。

## 対象外

- 製品用の完成確認画面、作品状態、最終デザイン。
- 固定文、ハッシュタグ、公開URLの最終決定と翻訳。
- 共有先での投稿、送信、保存完了の保証。
- 独自ダウンロードボタン、クラウド保存、共有履歴、分析ログ。
- Androidの新規実機確認、Web Share Target、PWA、ネイティブアプリ連携。

## 共通チェックリスト

- [ ] PNGが`image/png`、1080×1080で表示される。
- [ ] 画像を長押しして写真へ保存でき、見た目と寸法が一致する。
- [ ] 基準`text/plain`方式で共有シートが開き、画像として認識される。
- [ ] 標準`image/png`方式で共有シートが開き、基準方式との差を確認できる。
- [ ] 画像のみ方式で、同時共有項目による差を切り分けられる。
- [ ] 共有シートから写真へ保存でき、見た目と寸法が一致する。
- [ ] 共有先の下書きで画像、固定文、ハッシュタグ、URLの受信有無を確認できる。
- [ ] 共有シートを閉じてもエラー表示にならず、同じ画面へ戻る。
- [ ] 共有文をClipboardへコピーでき、失敗時も手動選択できる。
- [ ] 同じPNGを複数回共有してもgeneration idと生成回数が変わらない。
- [ ] 再生成後は版番号が変わり、古い画像が表示・共有されない。
- [ ] 10回以上の共有・キャンセル・再共有で操作不能や継続的な劣化がない。

## ローカル確認結果

2026-09-21にproduction buildをSWA CLI 2.0.10で起動し、Codexのin-app browserで補助確認した。

- `/`と`/spikes/image-sharing`は直接200で応答し、既存のカメラ・写真F/Sは末尾スラッシュへのリダイレクト後に200で応答した。
- 未知の画面routeはSPAへフォールバックし、存在しない静的assetは404になった。
- 1080×1080の`image/png`を生成・再生成でき、版番号、generation id、生成回数、byte数が更新された。
- 三経路はいずれも`canShare({ files })`が`true`になり、基準経路からOS共有シートへ引き渡せた。デスクトップの共有シートはブラウザ内からキャンセル結果を観測できなかったため、キャンセル分類の画面確認はiPhone実機で行う。
- 共有文のClipboard成功表示、route離脱後に未生成状態へ戻ること、390×844のviewportで画像から診断欄までスクロールして操作できることを確認した。
- 読み込まれた画面resourceは同一originのJavaScript/CSSだけで、生成画像の`img`は`blob:` URLを参照した。consoleのwarning/errorは0件だった。
- F/S codeの検索では、`fetch`、XHR、`sendBeacon`、Web Storage、IndexedDB、外部ログ処理を検出しなかった。外部HTTPS URLは共有文へ含める固定URLだけだった。

## PRプレビュー確認結果

- PR: [#8 画像共有F/Sを追加](https://github.com/market-U/moment-palette/pull/8)
- プレビュー: `https://icy-mushroom-0c0e42e00-8.eastasia.5.azurestaticapps.net/`
- GitHub Actionsの品質検査とSWAプレビューデプロイは成功した。
- HTTPSの直接アクセスで通常画面、カメラF/S、写真F/S、画像共有F/Sがすべて200で応答した。固定F/S環境の通常画面も200で応答した。
- プレビュー上で1080×1080の`image/png`を生成でき、三経路はいずれも`canShare({ files })`が`true`、consoleのwarning/errorは0件だった。

## Androidの扱い

| 項目 | 記録 |
| --- | --- |
| 既存の根拠 | 複数の既存アプリで基準の`text/plain`方式をiPhone・Android共通に3年以上継続運用中 |
| 今回の確認 | Android端末を確保できないため、Moment Palette固有のbuild、PNG、共有文では未確認。今回の合否から除外する |
| 将来の回帰確認 | Android Chromeで三経路の`canShare()`、画像認識、文・ハッシュタグ・URLの受信、保存寸法を同じF/S routeから比較する |

## 経路・ブラウザ別結果

| ブラウザ | 経路 | File type | `canShare()` | 画像認識 | 固定文 | ハッシュタグ | URL | 結果・制約 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Safari | 基準 | `text/plain` | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 |
| Safari | 標準 | `image/png` | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 |
| Safari | 画像のみ | `image/png` | 未確認 | 未確認 | 対象外 | 対象外 | 対象外 | 未確認 |
| Chrome | 基準 | `text/plain` | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 |
| Chrome | 標準 | `image/png` | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 |
| Chrome | 画像のみ | `image/png` | 未確認 | 未確認 | 対象外 | 対象外 | 対象外 | 未確認 |

## 共有先別結果

| ブラウザ | 経路 | 共有先 | 画像 | 文・タグ・URL | 投稿・送信前に確認 | 備考 |
| --- | --- | --- | --- | --- | --- | --- |
| 未確認 | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 |

## 保存・resource結果

| ブラウザ | 長押し保存 | 共有シート保存 | 保存寸法 | Blob再利用 | 再生成 | 10回操作 |
| --- | --- | --- | --- | --- | --- | --- |
| Safari | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 |
| Chrome | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 | 未確認 |

## 採否

実機確認後に記録する。

## コードの扱い

実装と実機確認後に、ファイルまたはmodule単位で本実装へ昇格、設計を保って再実装、削除を判断する。

## 制約と未解決事項

- Androidでは既存アプリの継続運用実績があるが、Moment Palette固有の新規実機確認は行わない。
- 共有先はShareDataの一部を破棄または統合できるため、Webアプリは各項目の受信を保証できない。
- 固定の共有文、ハッシュタグ、公開URLの最終値は本実装changeで決める。

## 完了方針

このF/Sのdelta specは製品の正式要件ではないためmain specsへ同期しない。後続の完成確認・共有本実装changeで採用事項を正式なspecへ記述し、このchangeは`openspec archive validate-image-sharing --skip-specs`でarchiveする。
