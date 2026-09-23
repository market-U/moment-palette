## MODIFIED Requirements

### Requirement: 完成PNGの生成
アプリケーションは、利用者が制作画面で完成操作をしたとき、有効な制作sessionが所有する現在のArtwork、decode済みtemplate asset、Area resourceだけを使用して、各Areaとline artを1080×1080の一枚のPNG Blobへ合成しなければならない（SHALL）。この処理はブラウザ内で完結し、catalog、template asset、release情報、CSSを追加取得せず、画像をserverまたは外部serviceへ送信・永続保存してはならない（MUST NOT）。

#### Scenario: 未着色Areaを残して完成する
- **WHEN** 利用者が初期色のAreaを一つ以上残したArtworkで完成操作をする
- **THEN** アプリケーションは未着色Areaを初期色で描画した1080×1080のPNGを生成し、完成確認へ進める

#### Scenario: Camera fillを含む作品を完成する
- **WHEN** Artworkにcapture済みのArea resourceを持つ利用者が完成操作をする
- **THEN** アプリケーションはcatalog順のmaskで各resourceを切り抜き、line artを最前面へ描画したPNGを生成する

#### Scenario: Photo fillを含む作品を完成する
- **WHEN** Artworkに正規化済み写真と調整済みtransformを持つArea resourceを含む利用者が完成操作をする
- **THEN** アプリケーションは選択Areaの初期色を写真の下に描き、catalog順のmaskで写真を切り抜き、line artを最前面へ描画したPNGを生成する

#### Scenario: PNG生成中に完成操作を重ねる
- **WHEN** PNG生成が完了する前に利用者が完成操作を再度行う
- **THEN** アプリケーションは二つ目の生成を開始せず、生成中状態を維持する

#### Scenario: PNG生成に失敗する
- **WHEN** Canvas context、PNG Blob生成、または完成画像resourceの準備に失敗する
- **THEN** アプリケーションはArtworkと制作sessionを保持し、外部例外本文を表示せず、翻訳済みの再試行および制作へ戻る操作を表示する
