## Context

制作画面は、完成したArtworkをobject URLの`img`として表示する。一方で、templateのline art・maskとArtworkの合成はCanvas 2D compositorが担当しており、制作sessionがdecode済みmaskを所有している。現在はこのmaskを静的preview上の選択表示やArea selectorへ再利用していない。

また、制作sessionを終了するroute遷移はrouterのglobal guardがresourceを破棄するため、確認は遷移を開始する前に完了させる必要がある。

## Goals / Non-Goals

**Goals:**

- 破棄される遷移をキャンセル可能な確認dialogで保護する。
- 静的previewを保存可能な`img`のまま維持し、選択中maskを重ねて表示する。
- Area selectorの視覚表現をmaskサムネイルへ置き換え、文字列の補助情報へ依存しない。
- maskを追加取得せず、sessionが所有するdecode済みassetだけを使う。

**Non-Goals:**

- 完成画像、template catalog、Artworkデータ形式、mask asset形式の変更。
- 個別Areaの輪郭asset生成やnetworkからの追加読み込み。
- tabを閉じる・再読み込みする際のbrowser標準確認の置換。

## Decisions

### Canvasを静的なmask済みoverlayとthumbnail専用に再利用する

Canvas compositorは`src/app/assets/selected-area.png`の斜線patternと選択中Areaのdecode済みmaskを合成し、透明Canvasへ一度だけ描く。制作pageは既存`img`の上にpointer eventsを受けないCanvasを置き、そのCanvasの`opacity`だけをCSS animationで点滅させる。選択Areaまたは作品previewの表示サイズが変わったときだけCanvasを描き直す。

patternのblend modeとasset自体は視認性を見ながら調整可能な表示パラメータとして扱い、Artworkや完成PNGへ反映しない。blinkはJavaScript timerや`requestAnimationFrame`を使わないため、画面離脱後の描画loopを持たない。`prefers-reduced-motion`ではCSS animationを止め、静的なopacityで表示する。

CSS `mask-image`へasset URLを渡す方式は、decode済みImageBitmapを再利用できず、制作開始後のasset再取得禁止にも反するため採用しない。

### selector itemはCanvasサムネイルを表示する

Area itemはaccessible nameとして翻訳済みArea名を持つbuttonを維持するが、可視の名前、initial color swatch、fill状態テキストは削除する。item内のCanvasに初期色でmask形状を描き、中央固定枠と`aria-pressed`は既存の選択UIを保つ。

### route leave guardを確認の入口にする

CreationPageのcomponent-level route leave guardが、制作または完成確認以外への遷移を一旦止めて確認dialogを開く。承認後だけ同じ遷移先を再実行し、既存router guardがsessionを破棄する。BackButton、Start over、browser historyによるroute遷移で同じ処理を共有できる。

## Risks / Trade-offs

- [Canvas表示と`img`の表示位置がずれる] → 両方を同じaspect ratioの親要素にabsolute配置し、CanvasはResizeObserverで画像表示サイズへ追従する。
- [下地によって斜線patternの色が見えにくい] → assetまたはblend modeを表示パラメータとして調整し、実機で写真・カメラ・単色の各fillを確認する。
- [motionが不快または読みにくい] → 点滅はCSSだけで実装し、`prefers-reduced-motion`では静的表示へ切り替える。
- [確認後の再遷移が再びdialogを開く] → 一度だけ通過する承認フラグと保留先routeをpage内に保持する。
- [mask描画の失敗で制作が操作不能になる] → overlay・thumbnailの描画は表示補助に限定し、失敗してもArtwork本体とArea選択は維持する。
