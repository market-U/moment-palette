## Context

制作画面の`ArtworkAreaHighlight`は1080×1080のArtwork preview、選択Areaの斜線Canvas、最前面のline art Canvasを重ねているが、Area selector以外から選択状態を変更できない。templateのmaskはすでに制作session開始時にdecode済みで、Artworkの描画順もtemplateのArea順として確定している。

preview上のpointer座標はCSS pixelで渡される一方、maskは1080×1080の作品座標にある。device pixel ratioや表示サイズに関わらず同じAreaを選ぶため、両者を明示的に変換する必要がある。

## Goals / Non-Goals

**Goals:**

- Artwork previewのtapから、対応するAreaを現在の編集対象として選択する。
- decode済みmaskだけからsessionごとに一度だけヒットマップを構築し、tapごとのmask全走査を避ける。
- mask外、重なり、scroll・dragを一貫して扱う。
- 既存のArea selectorを選択・キーボード・支援技術の経路として維持する。

**Non-Goals:**

- template asset、Artwork、完成PNG、Areaの描画順の変更。
- 新しいtemplate assetの取得、maskのnetwork再取得、hit mapの永続化。
- preview上のdrag、pinch、塗り操作、Area selectorの廃止。
- `requestAnimationFrame`または常時実行するtimerによるhit test。

## Decisions

### template-selectionのportでsession所有のArea hit testerを作る

`ActiveCreationSession`を生成する`prepareTemplate`へ、templateとdecode済みassetから`AreaHitTester`を作るportを追加する。testerは`findAreaAt(x, y)`と`release()`を公開し、sessionのreleaseと同時に一度だけ解放する。

template-selection featureがsessionとdecode済みassetを所有しているため、creation-session featureが別featureの状態へ依存するよりも、ここをportの境界とする。app composition rootがCanvas実装を結線する。

### 1080×1080の色付きhit mapを一度だけ構築する

Canvas実装は透明な1080×1080 Canvasと一時Canvasを作る。Areaごとに固有の識別色をmaskで切り抜き、Artworkの描画順でhit mapへ重ねる。pointer時は正規化済み座標の1ピクセルだけを読み、識別色からArea IDを取得する。後から描かれたAreaが重なり領域の結果を上書きするため、作品上の最前面Areaを選べる。

maskの中間alphaは、alpha値128以上をArea内、127以下をArea外として扱う。maskごとにpointer時の`getImageData()`や全画素走査を行う方式は、操作のたびに処理量が増えるため採用しない。

### Pointer操作をtapだけに限定する

`ArtworkAreaHighlight`はpointerdown時のpointer IDとCSS座標を記録し、同じpointerのpointerup時に移動距離が8 CSS px以下ならtapとする。pointercancel、異なるpointer、またはしきい値を超える移動では選択を変えない。ブラウザのscrollを抑止せず、previewから出たpointerupも選択しない。

対象要素の`getBoundingClientRect()`を基準に、CSS座標を0〜1079のArtwork座標へ変換する。previewとArtworkがともに正方形である現在の制約を利用し、device pixel ratioはこの変換へ含めない。Canvasの内部解像度や表示倍率が変わっても同じ正規化座標をhit testerへ渡せる。

### Area選択は既存のページ状態へemitする

`ArtworkAreaHighlight`は判定したArea IDをemitし、`CreationPage`が既存の`selectedAreaId`を更新する。Area selectorとpreview tapは同じ選択状態を共有するため、既存の強調表示、camera、photo、solid color操作は追加の分岐なしで追従する。

## Risks / Trade-offs

- [mask境界の中間alphaで意図しないAreaを選ぶ] → alphaしきい値を明示し、境界・mask外の単体テストを追加する。
- [maskが重なる位置の選択が曖昧] → Artworkと同じ描画順でhit mapを重ね、最前面Areaを正本とする。
- [scroll時にAreaが切り替わる] → pointer ID、pointercancel、8 CSS pxの移動しきい値でtapだけを受け付ける。
- [表示倍率や高DPR端末で座標がずれる] → CSS pixelから1080座標への純粋な変換を単体テストし、Canvasのbacking store座標を使わない。
- [session終了後にhit map Canvasが残る] → sessionの既存resource解放経路へtesterの`release()`を含める。
