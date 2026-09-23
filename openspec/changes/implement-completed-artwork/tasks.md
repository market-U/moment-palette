## 1. 完成画像と共有の製品境界

- [x] 1.1 `features/completed-artwork/`に完成PNG resource、所有権、生成・共有・Clipboard port、生成中・共有中・失敗の表示状態を追加し、交換・無効化・冪等な破棄を単体テストする
- [x] 1.2 画像共有F/Sの共有payload構築、`text/plain`互換File、共有結果分類を製品用へ移設し、PNG bytes・拡張子・固定文・ハッシュタグ・タイトルURL、`canShare()`、キャンセル・既知/未知失敗を単体テストする
- [x] 1.3 製品用Clipboard adapterとfallback状態を実装し、成功、非対応、拒否時も手動選択用の共有文を維持することを単体テストする
- [x] 1.4 現在のArtwork、template、decode済みasset、Area resourceを1080×1080 PNG Blobへ合成するCanvas adapterを実装し、Area順・mask・初期色・camera frame・line art・PNG検証・一時Canvasとobject URLの解放を単体テストする
- [x] 1.5 Web Share browser adapterを製品featureへ移設し、実Fileによる共有可否、クリックから直接のshare呼び出し、OSへの引き渡し、キャンセル、非対応、失敗分類を単体テストする

## 2. 制作sessionと画面遷移

- [x] 2.1 制作session serviceとfacadeを完成PNGの生成、生成失敗からの再試行、完成確認への遷移、制作への復帰、共有、共有文コピーへ拡張し、session世代と非同期生成の競合を安全に処理する
- [x] 2.2 Areaの更新成功後に完成PNGを無効化し、session置換・reset・route離脱・app unmount・pagehideで完成画像を含むresourceを一度だけ解放するよう、creation sessionの単体テストを更新する
- [x] 2.3 sessionと完成PNGの両方を必要とする完成確認routeを追加し、直接アクセス・再読み込み・終了済みsessionを安全な画面へ戻すrouter guardとテストを実装する
- [x] 2.4 制作画面へ完成操作と生成中・生成失敗状態を追加し、完成確認画面へ通常画像、長押し保存案内、共有、共有文コピー、手動コピーfallback、制作へ戻る、もういちど遊ぶを実装する
- [x] 2.5 完成確認画面と制作画面の操作を日本語・英語の翻訳リソースへ追加し、共有先の完了を保証しない文言と外部例外本文を出さない表示を確認するコンポーネントテストを追加する

## 3. F/Sコードの移行と整理

- [x] 3.1 製品コードが`image-sharing-spike`へ依存しないことを確認して、F/S専用route、route wrapper、比較UI、fixture generator、診断用のmodeと不要adapterを削除する
- [x] 3.2 F/Sから移設した単体テストを製品のfeature・infrastructure配置へ移し、camera fill、creation session、既存画面の回帰テストを更新する

## 4. 品質確認と文書化

- [x] 4.1 format、lint、型検査、単体テスト、production buildを実行し、失敗を解消する
- [ ] 4.2 iPhone Safari・Chromeで未着色を含むPNG生成、長押し保存、共有、共有キャンセル、共有非対応/失敗fallback、Artwork更新後の再生成、制作session終了時の動作を確認する
- [x] 4.3 実装結果とAndroid Chromeの未確認回帰項目を`docs/development-roadmap.md`へ反映し、OpenSpec verifyに備えて手動確認結果を記録する
