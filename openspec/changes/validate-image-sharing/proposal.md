## Why

完成した1080×1080 PNGを、iPhoneのブラウザから長押し保存し、画像・固定文・ハッシュタグ・URLとともにOS共有シートへ渡せるかを、本実装へ進む前に実機で確定する必要がある。複数の既存アプリで3年以上運用中のAndroid互換方式を基準に、同じPNG Blobの再利用、共有先ごとの差、失敗と破棄までを独立した技術F/Sとして検証する。

## What Changes

- 通常画面から分離した画像保存・共有F/S routeを追加し、ブラウザ内で生成した1080×1080 PNGを画像要素へ表示する。
- 完成PNG Blobを表示、長押し保存、Web Shareへ再利用し、再生成または画面離脱時にobject URLと参照を破棄する。
- `navigator.canShare()`と`navigator.share()`を使い、PNGの内容を`.png`ファイル名かつ`text/plain`として渡す既存の全OS共通方式を基準経路として検証する。
- `image/png`として渡す標準方式も比較用に用意し、基準経路より確実な代替になり得るかを共有先ごとに記録する。ただし、Android実機での再確認をこのchangeの完了条件にはしない。
- 固定文、ハッシュタグ、URLを画像と同時に共有し、共有先が受け取った項目、共有シートのキャンセル、API非対応、共有失敗を区別して確認する。
- ファイル共有を利用できない場合にも長押し保存を残し、共有文をコピーまたは手動選択できるfallbackを検証する。
- iPhone 15（iOS 26）のSafariとChromeでPRプレビューを確認し、Androidは既存アプリでの継続運用実績と未確認事項を分けて結果へ記録する。
- 検証結果、採否、制約、F/Sコードの昇格・再実装・削除判断を`docs/spikes/`へ残し、delta specはmain specsへ同期しない。

## Capabilities

### New Capabilities

- `image-sharing-validation`: 完成PNGの長押し保存、Web Share payload、共有文fallback、Blob再利用と破棄、iPhone実機判定を検証する手順と合格条件。

### Modified Capabilities

なし。

## Impact

- `src/app/`、`src/pages/`、`src/features/`、`src/infrastructure/`へF/S専用route、UI、port、ブラウザadapterを追加する。
- 既存のカメラ・写真F/Sから独立した共有用PNG生成fixtureと診断表示を追加する。
- `navigator.share()`、`navigator.canShare()`、Clipboard API、File、Blob、object URLを利用する。新しい外部依存、バックエンドAPI、Azureリソース、secret、作品の送信・永続保存は追加しない。
- `docs/spikes/`、必要に応じて`docs/vision.md`、`docs/design/`、`docs/development-roadmap.md`を検証結果に合わせて更新する。
