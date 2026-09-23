## Context

`implement-camera-fill`までに、制作sessionはtemplate asset、Artwork、Areaごとのcamera frameと制作画面用previewをtab内で所有している。画像共有F/Sでは、1080×1080 PNG Blobを画像表示と複数回のWeb Shareへ再利用し、`text/plain`のFile MIME typeを基準経路にすること、共有キャンセル・失敗・Clipboard fallback、object URLの冪等な破棄をiPhone Safari・Chromeで確認済みである。

このchangeは、F/Sの固定fixtureではなく現在のArtwork、decode済みmask、line art、Area resourceから完成PNGを生成し、制作sessionを終了させずに完成確認と制作画面を往復できる製品導線にする。制作開始後の外部asset再取得、サーバーへの画像送信・永続保存、独自ダウンロードは許可されない。対象画面と失敗時の復帰は`docs/design/screen-flow.md`および`docs/design/ui-states.md`に従う。

## Goals / Non-Goals

**Goals:**

- 未着色Areaを含む現在のArtworkを、取得済みresourceだけで1080×1080 PNG Blobへ合成し、完成確認画面で表示する。
- 同一Blobを通常の`img`表示、繰り返しのWeb Share、長押し保存へ再利用し、作品変更・session終了でobject URLを一度だけ破棄する。
- F/Sで採用したWeb Shareの互換方式、結果分類、Clipboard fallbackを翻訳済みの製品UIへ移設する。
- 生成中・共有中の重複操作、PNG生成失敗、Web Share非対応・失敗、Clipboard失敗から安全に復帰できるようにする。

**Non-Goals:**

- 写真選択、単色塗り、カード・フレーム・画像内テキスト、サーバー保存、独自ダウンロードボタンを追加する。
- 共有先での投稿・送信・保存の完了を保証する、または共有先ごとの挙動を制御する。
- Android Chromeの新規実機確認をこのchangeの完了条件にする。
- template asset、catalog、release情報を制作開始後に再取得する。

## Decisions

### 1. 完成画像resourceは制作sessionサービスが所有する

`CompletedImageOwner`相当の所有者を`features/completed-artwork/`へ製品用として移設し、`createCreationSessionAppService`がその唯一の所有者になる。完成確認コンポーネントはfacadeから読み取り専用の表示状態と操作だけを受け取る。これにより、完成確認から制作へ戻っても同じBlobとobject URLを保持し、複数回の共有でPNGを生成し直さない。

作品を実際に更新できた時点でサービスが完成画像resourceを破棄する。camera撮影のcommit後、将来の写真・単色のcommit後にも同じ無効化境界を使う。template選択へ戻る、タイトルへ戻る、route離脱、app unmount、`pagehide`ではsessionの終了と同じ経路で破棄する。画面componentだけで所有する案は、完成画面のunmount時に制作へ戻るためのresourceまで失うので採用しない。

### 2. 完成PNGは現在の作品resourceから独立してCanvas 2Dで合成する

完成画像generator用portを`features/completed-artwork/`に置き、template、Artwork、decode済みline art・mask、Area resourceを入力として受け取る。browser adapterは1080×1080 Canvas上で、各Areaをcatalog順にmaskへ切り抜き、初期色またはcapture済みsourceを描画し、最前面にline artを描く。`canvas.toBlob(..., 'image/png')`のBlobを検証してobject URLを生成し、一時Canvas backing storeは成功・失敗の両方で解放する。

この入力は有効な制作sessionだけが所有するため、完成時にcatalog、SAS URL、CSS、DOMを再取得・参照しない。制作画面用previewのPNGを再エンコードする案は、previewが表示専用resourceであり完成出力の合成境界を不明確にするため採用しない。既存camera compositorと同じ順序・mask方式を用い、完成画像のCanvas adapterを独立したportとしてテスト可能にする。

### 3. 完成確認routeは生成成功後だけ開き、sessionと完成画像を両方要求する

制作画面の「完成」操作は、生成中状態をfacadeへ設定して同じsessionからPNGを生成する。成功時だけ`/complete`へ遷移し、失敗時は安全な説明、再試行、制作へ戻る操作を表示する。`/complete`は有効な制作sessionと完成画像resourceの両方をroute guardで要求し、直接アクセス、再読み込み、終了済みsessionでは制作画面またはタイトルへ戻す。

完成確認から制作へ戻る操作はsessionも完成resourceも維持する。完成後にArtworkが更新された場合だけresourceを無効化し、次の完成操作で新しいPNGを生成する。「もういちど遊ぶ」と制作画面以外への離脱は現在のsessionを終了し、すべてのresourceを解放してタイトルへ戻す。

### 4. Web ShareはF/Sの互換方式を製品の唯一の共有経路として移設する

共有用Fileは、保持済みPNG Blobからクリックhandler内で同期的に`new File([blob], filename, { type: 'text/plain' })`として作る。PNG bytesと`.png`拡張子は保持し、固定の紹介文、`#MomentPalette`、現在のアプリのタイトルURLを一つの`text`にして`navigator.share()`へ渡す。F/SでiPhone Safari・Chromeと既存アプリのAndroid運用実績に基づき、この方式を基準経路とする。現在のoriginとbase pathからタイトルURLを組み立て、共有時の制作route、query、hashを含めない。

実際に渡すFileで`navigator.canShare({ files })`を確認する。画像は完成前に生成済みのため、共有クリックから非同期の画像生成・Data URL変換・Vue更新を挟まず共有を呼び、transient activationを保つ。標準PNG MIME typeとの比較UIはF/S専用のため製品には移設しない。

### 5. shareとClipboardの結果は外部例外を出さない製品状態へ変換する

共有adapterはOSまたは共有先への引き渡しだけを成功とし、投稿・保存の完了とは扱わない。`AbortError`はキャンセルとして同じ完成画像の通常表示へ戻す。Web Share非対応、File共有不可、既知DOMException、未知の失敗は翻訳キーに対応する分類へ変換し、外部例外本文、画像内容、SAS queryをUI・外部logへ出さない。共有中は二重共有とPNG再生成を禁止する。

通常の`img`には長押し保存案内を表示し、context menuやtouch calloutを抑止しない。File共有が不可能または共有に失敗したときにも、画像、読み取り専用かつ選択可能な共有文、コピー操作を維持する。Clipboard adapterの非対応・拒否では手動選択の案内へ変換し、共有文を隠さない。

### 6. F/Sの製品適合コードを移設し、専用コードは同じchangeで削除する

`image-sharing-spike`のpayload構築、share結果分類、owner、Web Share adapter、Clipboard adapterとテストを製品feature・infrastructureへ移し、固定文面とF/S固有のmodeを製品の一方式へ置き換える。完成画像generatorはfixtureを描く実装ではなく現在の作品を合成する製品adapterに置き換える。F/S route、route wrapper、診断UI、三経路比較、fixture generatorを削除し、productionコードがspikeへ依存しない状態にする。

## Risks / Trade-offs

- [CanvasのPNG生成が失敗し、完成確認へ進めない] → 生成中の重複を防ぎ、Artworkとsessionを変更せず再試行・制作へ戻る状態を提供する。
- [完成画像を早く破棄して長押し保存または再共有ができなくなる] → resourceは作品更新またはsession終了までサービスが保持し、共有完了・完成画面から制作への戻りだけではdisposeしない。
- [共有クリック前の非同期処理でtransient activationを失う] → Blobは事前生成し、File作成とShareData構築を同期的に行う。
- [互換MIME typeが将来のbrowserまたは共有先で扱えなくなる] → 実Fileで`canShare()`を確認し、失敗時も長押し保存と共有文fallbackを提供する。Android ChromeでのMoment Palette固有の回帰は端末確保後に確認する。
- [session終了と生成完了が競合して解放済みresourceを表示する] → 生成要求をsessionの世代と結び、終了・置換後に到着した生成結果は直ちにdisposeし、画面状態を更新しない。
- [共有先が文やURLを無視する] → UIは引き渡し完了だけを示し、共有先の受信内容をアプリの失敗と断定しない。

## Migration Plan

1. 製品用completed-artwork featureにresource所有権、payload、share/Clipboard port、状態遷移と単体テストを移設する。
2. Canvas完成画像generator、Web Share、Clipboard browser adapterを実装し、Artwork合成、PNG検証、object URL解放、例外分類をテストする。
3. 制作session facadeとrouterへ完成・再試行・制作へ戻る・開始し直す操作を結線し、制作・完成確認画面と日英翻訳を追加する。
4. F/S専用のroute、UI、fixture、adapterを製品コードへの移設後に削除し、既存camera・creation sessionの回帰テストを更新する。
5. 静的検査と単体テストを通し、iPhone Safari・ChromeでPNG生成、長押し保存、共有、キャンセル、非対応fallback、作品変更後の再生成を確認する。

フロントエンドだけの変更であり、backend、template catalog、Azureリソースのmigrationは不要である。不具合時は、このchangeのfrontendコードを戻せば完成確認routeを除く既存の制作導線へ復帰できる。

## Open Questions

なし。Android ChromeでのMoment Palette固有の実機確認は、端末を確保した後の回帰項目として扱う。
