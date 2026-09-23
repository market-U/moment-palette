## Why

カメラでの塗り、作品の完成・保存・共有までの縦切りは実装済みである一方、「思い出から切り取る」写真塗りは未実装であり、初期リリースで約束した三つの入口の一つが欠けている。写真取り込みのF/SでiPhone Safari・Chromeにおける選択、実decode、正規化、編集、resource解放の方式が確認できたため、これを現在の制作sessionと作品合成へ製品品質で統合する。

## What Changes

- 制作画面の「思い出から切り取る」操作から、OSの単一画像選択UIを開き、選択画像を写真調整画面へ渡す。
- 実際のdecode結果に基づき、向きを反映して長辺4096px以下かつ12MP以下へ正規化し、元の一時resourceを解放する。
- 写真調整画面で、カメラと同じ比較slider、pan、pinch、移動範囲の制限を提供し、初期cover状態から余白を残す縮小も許可する。
- 写真を選択Areaへ反映して既存fillを原子的に上書きし、キャンセル、選び直し、decode・正規化失敗から安全に制作画面へ復帰できるようにする。
- 正規化済み写真を制作sessionが所有・置換・解放し、更新済み作品を既存previewおよび完成PNGの合成へ反映する。
- F/S専用の写真取り込みroute・UIを、製品導線への移行と回帰テストを維持したうえで削除する。

## Capabilities

### New Capabilities

- `photo-fill`: OS画像選択、写真のdecode・正規化、位置と倍率の調整、Areaへの反映、失敗からの復帰、および多言語の写真調整UIを定める。

### Modified Capabilities

- `creation-session`: 制作sessionがAreaごとの正規化済み写真resourceをcamera frameと同様に所有・置換・解放できるようにする。
- `completed-artwork`: 写真fillを含むArtworkを既存の1080×1080完成PNGへ合成できるようにする。

## Impact

- `src/domain/template.ts`のArtwork fill、`src/features/creation-session/`のfacade・session更新、制作画面とルーティング、写真選択・調整featureを変更する。
- `src/infrastructure/photo-import/`およびF/Sで検証済みの純粋な画像・gesture処理を、製品のportとresource所有権へ適合させて移設または昇格する。
- 既存の作品preview・完成PNG compositorを写真resourceに対応させ、写真の二値データは端末内でのみ扱い、network送信・永続保存・新規外部依存は追加しない。
- domain、画像正規化、resource解放、編集gesture、作品更新、UI状態の単体テストを追加し、iPhone Safari・Chromeで写真選択から完成画像までを確認する。Android Chromeは端末確保後の回帰項目とする。
