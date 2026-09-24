## 1. Domainと合成境界

- [x] 1.1 `ArtworkFill`へ不透明な`solid` fillと、対象Areaだけを不変に上書きする`applySolidColorFill`を追加し、色形式・上書き・存在しないAreaを単体テストする。
- [x] 1.2 制作preview、カメラpreview、写真previewで使うCanvas合成を単色fill対応へ拡張し、一時色による作品全体Canvas previewをPNG／object URLを生成せず描画できるportとadapterを実装・テストする。
- [x] 1.3 完成PNG generatorを単色fill対応へ拡張し、初期色・camera・photo・単色を混在させたmask順とline artの合成を単体テストする。

## 2. 制作sessionと単色の状態管理

- [x] 2.1 画像resourceを追加せずArtworkとpreviewを原子的に置換するsession操作を追加し、単色上書き時の旧camera／photo resource、旧preview、完成PNGの解放と失敗時の保持を単体テストする。
- [x] 2.2 `SolidColorFillState`、facade、app serviceを追加し、対象Areaの初期一時色、複数回の選択、反映、キャンセル、完成PNG無効化を単体テストする。

## 3. 制作画面と色調整UI

- [x] 3.1 制作画面の選択Areaへ「気持ちからつくる」操作を追加し、選択状態を保ったまま単色調整を開始できるようにする。
- [x] 3.2 カメラ・写真と同じ不透明な全画面`SolidColorFillPanel`を実装し、ラベル付きの不透明色用`input[type="color"]`、作品全体preview、反映、キャンセルを配置する。
- [x] 3.3 色選択中の一時preview、反映後の制作preview、キャンセル時の非変更、色の再選択をcomponentおよび画面の単体テストで検証する。
- [x] 3.4 日本語・英語の単色導線、見出し、色選択、反映、キャンセル文言を追加し、両言語の表示をテストする。

## 4. 文書化と検証

- [x] 4.1 `docs/design/screen-flow.md`と`docs/design/ui-states.md`を、全画面の単色調整、標準color input、一時preview、反映・キャンセル、プリセットを置かない初期方針へ更新する。
- [ ] 4.2 `docs/development-roadmap.md`のフェーズ5完了状況と次のchangeを実装完了後の状態へ更新する。
- [x] 4.3 format、lint、型検査、単体テスト、production buildを実行する。
- [ ] 4.4 iPhone Safari・ChromeのPRプレビューで、単色の選択・再選択・反映・キャンセル・既存camera／photo上書き・完成PNGを確認し、標準pickerの操作性を記録する。
- [ ] 4.5 OpenSpecのvalidateを実行し、実装・テスト・実機確認がそろった後にverifyとmain specsへの同期・archiveの準備を行う。
