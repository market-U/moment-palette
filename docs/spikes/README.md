# 技術F/S記録

## 目的

このディレクトリには、技術F/Sで検証した問い、条件、結果、採否判断を残す。後続のセッションが同じ検証を繰り返したり、検証専用コードを本番仕様と誤認したりすることを防ぐ。

## OpenSpecとの関係

- 実行可能なF/Sコードを作る前にOpenSpec changeを作成する。
- F/Sのdelta specは検証条件として扱い、製品のmain specsへ同期しない。
- F/S changeは原則として `openspec archive <change-name> --skip-specs` でarchiveする。
- 本採用する要求は、後続の本実装changeへ正式に記述し、そのchangeからmain specsへ同期する。
- archive済みchangeは検証過程の記録、このディレクトリは結果と判断の要約として扱う。

## 完了したF/S

| F/S | 主な採用判断 | 後続文書 |
| --- | --- | --- |
| [`camera-compositing.md`](camera-compositing.md) | Canvas 2D、PNG mask、Pointer Events、前面鏡像、1080×1080 PNG | `docs/vision.md`、`docs/design/figma.md`、`docs/architecture/frontend-application.md` |
| [`photo-import.md`](photo-import.md) | 標準decode、4096px・12MP上限、共通gesture、描画集約と前後cache | `docs/vision.md`、`docs/design/ui-states.md`、`docs/architecture/frontend-application.md` |
| [`image-sharing.md`](image-sharing.md) | 長押し保存、`text/plain` File共有、Clipboard fallback、PNG resource再利用 | `docs/vision.md`、`docs/design/ui-states.md`、`docs/design/screen-flow.md` |
| [`azure-template-delivery.md`](azure-template-delivery.md) | private Blob、60分SAS、CORS、cache、24時間削除猶予、release継続 | `docs/architecture/azure-template-delivery.md`、`docs/architecture/template-format.md` |

四つのF/SはいずれもiPhone 15（iOS 26）のSafari・Chromeで完了した。Android Chromeは端末確保後の回帰確認として残し、未確認の結果を推定で補わない。

横断的な採用判断は`docs/architecture/README.md`、画面遷移とresource所有権は`docs/design/screen-flow.md`へ反映済みである。本実装へ移すときは、各F/Sの「コードの扱い」に従い、採用する要求を対象changeのdelta specへ記述する。

## F/S完了時のコードの扱い

- 本実装へ昇格する場合は、本番品質の責務分割、エラー処理、対応環境、単体テストを追加する。
- 検証専用コードの場合は削除する。
- どちらの場合も、結果レポートと採否理由は残す。

## レポートの形式

F/Sごとに `docs/spikes/<topic>.md` を作成し、次の内容を記録する。

```markdown
# F/S名

## 対応するOpenSpec change

## 検証する問い

## 対象環境

## 成功条件

## 実施内容

## 結果

## 制約と未解決事項

## 採否判断

## コードの扱い

## vision・design・本実装changeへの反映
```

中核画像処理F/Sでは、カメラ権限、前面・背面切替、画像マスク、ピンチ操作、Canvas合成、PNG生成を検証済みである。

アルバム・ファイルからの画像選択では、次を確認済みである。

- iPhoneの画像選択でOSが提示する選択肢と、アプリ側から選択元を制限できないことの実機確認。
- OSメニューからカメラを選んだ場合の、ネイティブ撮影からアプリへの復帰フロー。
- アルバム画像とOSカメラで撮影した画像を、同じ位置・倍率調整処理へ渡せること。
- HEIC・HEIF・JPEG・PNGの読み込みとCanvas描画。
- EXIF Orientation、色空間、透過情報の扱い。
- 高解像度画像の縮小方法、処理時間、ピークメモリ、リソース解放。
- 選択キャンセル、未対応形式、破損画像、デコード失敗時の挙動。

アプリ独自カメラは、エリアの形を見ながらライブ映像から撮影する経路とする。画像選択内のOSカメラは、通常の撮影後に静止画像の位置・倍率を調整する経路とし、両者の違いがユーザーに混乱を与えないかもUX上の検証項目とする。
