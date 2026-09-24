## Context

現在の制作画面は、選択Areaにカメラまたは写真を適用できる。`ArtworkFill`は`initial`、`camera`、`photo`だけを表し、制作sessionは各Areaの画像resourceとPNG previewを原子的に置換する。カメラと写真の調整UIは、制作画面を背後に見せない不透明な全画面パネルであり、調整中の値は反映までArtworkへcommitしない。

単色は外部画像resourceを必要としないが、既存のAreaを上書きし、制作previewと完成PNGを更新する。初期リリースの対象環境はiPhone Safari・Chromeであり、色を選ぶ体験はブラウザ標準の`input[type="color"]`へ委ねる。

## Goals / Non-Goals

**Goals:**

- 「気持ちからつくる」から、カメラ・写真と同じ全画面調整導線でAreaへ不透明な単色を適用する。
- 色の選択中は現在のArtworkを変更せず、選択Areaへ一時色を描いた作品全体を表示する。
- 反映時にだけArtwork、制作preview、完成PNGの有効性を原子的に更新し、既存Areaのcameraまたはphoto resourceを正しく解放する。
- 色選択、反映、キャンセルを日本語・英語で利用可能にする。

**Non-Goals:**

- 推奨色、プリセットパレット、色履歴、透明度、Display P3、任意のCSS色形式は扱わない。
- 独自カラーピッカーまたは外部UIライブラリを追加しない。
- 色の選択、Artwork、画像をnetworkへ送信または永続保存しない。

## Decisions

### 全画面の色調整状態を追加する

`CreationPage`の「気持ちからつくる」は、制作画面の上に不透明な`SolidColorFillPanel`を表示する。パネルはカメラ・写真と同じように制作sessionと選択Areaを保持したまま、キャンセルまたは反映で制作画面へ戻る。

色選択画面をボトムシートや半透明モーダルにする案は採用しない。制作画面との視覚的な二重表示を避け、既存のカメラ・写真調整と遷移モデルを揃えるためである。URL routeは増やさず、画面上の状態として管理する。

### 標準color inputを画面内の明示的な操作として使う

色調整画面にはラベル付きの可視な`input[type="color"]`を置く。画面への遷移直後にJavaScriptからpickerを自動起動せず、利用者がその入力を操作したときだけOSまたはbrowserのpickerを開く。`alpha`と`colorspace`属性は指定せず、値は不透明な大文字`#RRGGBB`へ正規化する。

OSごとの見た目を制御する独自pickerやライブラリは、操作性の実機確認前に導入しない。プリセット色は、標準pickerが著しく使いにくいと実機確認で判明した場合の後続changeで検討する。

### 一時色を独立した色調整状態として保持する

`SolidColorFillState`は`closed`または`editing`とし、editingでは`areaId`と一時色を保持する。開くときの一時色は、対象Areaが`solid`ならその色、それ以外ならtemplateの`initialColor`とする。`input`イベントごとに一時色だけを更新し、何度でも選び直せるようにする。

色調整パネルは、temporary ArtworkをCanvasへ直接描画して作品全体のpreviewを更新する。選択中のAreaだけを一時色として描き、他Areaは現在の確定Artworkを描く。カメラ・写真と異なり比較対象のsourceがないため、表示比率slider、pan、pinchは追加しない。

一時色の変更ごとにPNG Blobやobject URLを生成する案は採用しない。連続する`input`イベントで不要なresourceを増やさず、確定済み制作previewの所有権を保つためである。

### 単色をArtworkのfillとして扱い、Area resourceを持たせない

domainの`ArtworkFill`に`{ kind: 'solid', color: '#RRGGBB' }`を追加し、指定Areaだけを置換する純粋な`applySolidColorFill`を提供する。色はtemplate初期色と同じ不透明な`#RRGGBB`形式で検証する。

制作sessionには、画像resourceを追加しないArtwork置換操作を追加する。この操作は候補Artworkから新previewを生成して成功した後にArtworkとpreviewをcommitし、同じAreaに残るcameraまたはphoto resourceを一度だけ解放する。失敗時は候補をcommitせず、既存Artwork・resource・previewを保持する。

### 既存のCanvas合成経路を単色へ拡張する

制作preview、カメラpreview、写真preview、完成PNGが共有するfill描画処理で、`solid`はその色をmask内へ塗る。単色は画像resourceを参照しない。これにより単色がcameraまたはphotoを上書きした後も、他Area、mask順、line artの最前面合成を既存どおり維持する。

## Risks / Trade-offs

- [標準pickerの見た目・操作がOSとbrowserで異なる] → iPhone Safari・Chromeで実機確認し、著しい問題があればプリセットまたは専用pickerを後続changeで評価する。
- [一時色の連続変更が描画負荷を増やす] → Canvas描画は表示中の一枚だけに限定し、requestAnimationFrameで描画を集約してPNGやobject URLを生成しない。
- [単色上書きで以前の画像resourceが残る] → sessionのcommit成功後だけ対象Areaの旧resourceを一度だけ解放する単体テストを置く。
- [標準inputが想定外の形式を返す] → domain境界で不透明`#RRGGBB`を検証・正規化し、無効値をArtworkへcommitしない。

## Migration Plan

既存sessionに永続データはなく、移行やバックフィルは不要である。通常の静的配信としてリリースし、失敗時は前のfrontend buildへ戻せば単色導線だけが除かれる。制作sessionはtab内だけのため、更新をまたいだ状態の互換性は保持しない。

## Open Questions

実装開始時点で未解決の製品判断はない。標準pickerの実機操作性は、初期実装のiPhone Safari・Chrome確認で記録し、プリセットまたはライブラリ導入の要否を後続changeで判断する。
