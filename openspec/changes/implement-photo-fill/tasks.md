## 0. F/S移行の保護

- [x] 0.1 Git履歴のphoto F/Sを基準に、移設・再実装・削除の対応表、同等性の自動検証、削除の完了条件をdesignへ固定する

## 1. 写真domainとresource境界

- [x] 1.1 `ArtworkFill`、Area表示情報、写真resourceを拡張し、写真fillの生成・上書き規則を単体テストで固定する
- [x] 1.2 F/Sから正規化寸法、写真変換、pan・pinch、mask合成に必要な純粋処理を製品の責務へ移し、camera導線の既存挙動を含む回帰テストを追加する
- [x] 1.3 `CreationSession` のresource所有権を写真とtransformへ拡張し、上書き失敗、完成PNG無効化、session終了での一度だけの解放をテストする

## 2. 写真選択と正規化

- [x] 2.1 `photo-fill` featureに画像選択・decode・失敗分類のportと状態機械を実装し、キャンセル、選び直し、非同期処理の世代競合をテストする
- [x] 2.2 browser adapterで`accept="image/*"`の単一選択、`createImageBitmap()`とHTML image fallback、EXIF Orientation、4096px・12MP正規化、temporary resource解放を実装・テストする
- [x] 2.3 F/S専用の写真decoder・normalization実装を製品境界へ移設または置換し、個人情報・画像binaryを外部出力しないことを確認する

## 3. 写真調整と作品への統合

- [x] 3.1 写真調整用のpreview compositorを実装し、初期cover、余白を残す縮小、初期色の下地、比較slider、mask順序を単体テストで検証する
- [x] 3.2 制作session facadeと作品preview更新を写真反映へ対応させ、既存cameraまたはphotoを原子的に上書きできるようにする
- [x] 3.3 完成PNG compositorをphoto resourceとtransformへ対応させ、未編集・camera・photoを混在したArtworkの1080×1080合成をテストする

## 4. 製品UIと画面遷移

- [x] 4.1 制作画面の「思い出から切り取る」操作、写真選択中・失敗・調整の画面遷移を実装する
- [x] 4.2 写真調整UIに編集領域限定のgesture、比較slider、反映・キャンセル・選び直しを実装し、日本語・英語の表示を追加する
- [ ] 4.3 F/S専用route、固定UI、診断表示を削除し、対応する製品実装、回帰test、全自動品質検査、iPhone Safari・Chrome実機確認の証跡がそろったことを確認する

## 5. 検証と実機確認

- [x] 5.1 format、lint、typecheck、単体テスト、production buildを実行し、失敗を解消する
- [ ] 5.2 iPhone Safari・ChromeのPRプレビューで、写真ライブラリ・OSカメラ・ファイル選択、JPEG・HEIC・PNG、pan・pinch、余白、上書き、完成・保存・共有を確認する
- [ ] 5.3 Android Chromeの実機確認を端末確保後の回帰項目として記録し、OpenSpec verifyで仕様・設計・実装の整合性を確認する
