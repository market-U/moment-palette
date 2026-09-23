# photo-fill Specification

## Purpose

端末内の写真を安全にdecode・正規化・調整し、選択したAreaへ反映して作品の完成PNGへ合成する。元画像と個人情報になり得るmetadataは端末内だけで扱い、不要になった一時resourceを解放する。

## Requirements

### Requirement: OS画像選択と安全な写真取り込み

アプリケーションは、制作画面で利用者が「思い出から切り取る」を操作したとき、単一画像を選べるOSの画像選択UIを開かなければならない（SHALL）。入力は画像形式をOSへ示すヒントだけを使用し、拡張子またはMIME typeだけで選択前に拒否してはならない（MUST NOT）。選択された画像、OSのカメラで撮影して返された画像、写真ライブラリまたはファイルから返された画像は、同じdecode・調整経路で扱わなければならない（MUST）。

#### Scenario: 写真を選択する

- **WHEN** 利用者が選択Areaで「思い出から切り取る」を操作し、OSのpickerから一枚の画像を選ぶ
- **THEN** アプリケーションはその画像をdecode・正規化中として扱い、成功時に同じAreaの写真調整画面を表示する

#### Scenario: OS pickerを表示している間は制作画面を維持する

- **WHEN** 利用者が「思い出から切り取る」を操作してから、OSのpickerが閉じるまで
- **THEN** アプリケーションは制作画面の上に写真調整または説明用のdialogを表示せず、OSが表示するpickerだけを前面の選択UIとして扱う

#### Scenario: OSのカメラで撮影した画像を選択する

- **WHEN** OSの画像選択UIからカメラを起動し、通常の撮影を完了する
- **THEN** アプリケーションは撮影済みFileを写真ライブラリまたはファイルから選んだFileと同じ処理経路へ渡す

#### Scenario: Pickerをキャンセルする

- **WHEN** 利用者が画像を選ばずにOSのpickerを閉じる
- **THEN** アプリケーションはArtworkと既存のArea resourceを変更せず、選択中Areaを保った制作画面へ戻る

#### Scenario: 同じ画像を選び直す

- **WHEN** 利用者が同じFileを連続して選択する
- **THEN** アプリケーションは二回目も選択イベントとして受け取り、新しいdecode処理を開始できる

### Requirement: 写真の実decode、正規化、データ保護

アプリケーションは、選択画像をブラウザ標準APIで実際にdecodeし、向きを反映した画像を長辺4096px以下かつ12MP以下へ正規化しなければならない（SHALL）。decode後は正規化済みの編集sourceだけを保持し、元File、Object URL、ImageBitmapその他の一時resourceを不要になった時点で解放しなければならない（MUST）。画像binary、完全なファイル名、EXIF、位置情報をnetworkへ送信、永続保存、または画面・外部logへ出力してはならない（MUST NOT）。

#### Scenario: 向き情報を持つ写真を取り込む

- **WHEN** EXIF Orientationを持つ画像の実decodeに成功する
- **THEN** アプリケーションは向きを反映した正規化済みsourceを写真調整と作品合成に使用する

#### Scenario: 上限を超える写真を取り込む

- **WHEN** decode後の画像が長辺4096pxまたは12MPを超える
- **THEN** アプリケーションは拡大せずに両上限を満たす寸法へ縮小したsourceだけを保持する

#### Scenario: 画像をdecodeできない

- **WHEN** 選択画像を利用可能な標準decode経路で読み込めない
- **THEN** アプリケーションは外部例外本文や形式名だけの断定を表示せず、選び直しと制作へ戻る操作を提供する

#### Scenario: 正規化中にresource不足が起きる

- **WHEN** Canvas確保または正規化描画に失敗する
- **THEN** アプリケーションは部分的な一時resourceを解放し、より小さい画像の選択または制作への復帰を案内する

### Requirement: 写真調整とAreaへの反映

アプリケーションは、写真調整画面でカメラと同じ意味の作品比較slider、編集領域内から開始した1本指drag、2本指pinch、pointer captureを提供しなければならない（SHALL）。写真は初期cover状態から縮小して画像外の余白を残せるが、選択Areaに写真がまったく残らない位置または倍率へは移動させてはならない（MUST NOT）。透明画素および画像外の余白には選択Areaの初期色を表示し、他Areaの画像を透けさせてはならない（MUST NOT）。

#### Scenario: 写真を移動・拡大縮小する

- **WHEN** 利用者が写真の編集領域でdragまたはpinchを開始し、指を領域外へ移動する
- **THEN** アプリケーションはpointer captureで操作を継続し、許容範囲へ制限した位置と倍率でpreviewを更新する

#### Scenario: 余白を残す

- **WHEN** 利用者がcover状態から写真を縮小する
- **THEN** アプリケーションは画像外の選択AreaをそのAreaの初期色で表示し、重なっている別Areaのfillを露出させない

#### Scenario: 比較sliderを中間値にする

- **WHEN** 利用者が作品比較sliderを0と100の間へ移動する
- **THEN** アプリケーションは写真全体と現在の作品を比較可能に重ね、選択Area内の写真を薄くしない

#### Scenario: 調整済み写真を反映する

- **WHEN** 利用者が写真調整画面で反映を操作し、photo resourceと更新済みpreviewの準備に成功する
- **THEN** アプリケーションは選択Areaだけをphoto fillへ原子的に更新し、制作画面へ戻る

#### Scenario: 写真調整をキャンセルする

- **WHEN** 利用者が写真調整画面でキャンセルを操作する
- **THEN** アプリケーションは未反映のphoto resourceを解放し、Artworkと既存Area resourceを変更せず制作画面へ戻る

#### Scenario: 写真調整でキャンセル操作を表示する

- **WHEN** 利用者が写真調整画面を表示する
- **THEN** アプリケーションは同じキャンセル処理を実行する操作を一つだけ表示する

### Requirement: 写真導線の多言語状態と失敗復帰

アプリケーションは、写真選択、decode・正規化中、decode・正規化失敗、写真調整、反映、キャンセル、選び直し、制作への復帰を日本語と英語で提供しなければならない（SHALL）。選択、decode、正規化、preview更新のいずれで失敗しても、外部例外本文を表示せず、利用者が選び直すかArtworkを保ったまま制作へ戻れる状態にしなければならない（MUST）。

#### Scenario: 選択中の言語で写真導線を表示する

- **WHEN** 利用者が日本語または英語を選択した状態で写真塗りを開始する
- **THEN** アプリケーションは選択した言語で写真導線の案内、処理中、失敗、操作を表示する

#### Scenario: preview更新に失敗する

- **WHEN** 写真のdecodeと正規化後に更新済み作品previewを生成できない
- **THEN** アプリケーションは新しいphoto resourceを解放し、更新前のArtwork、Area resource、previewを保持して選び直しまたは制作への復帰を提供する
