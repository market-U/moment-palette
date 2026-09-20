# 写真取り込みF/S fixture

すべて人工的なSVG原稿から生成し、実在人物、実機写真、位置情報を含めない。

- `orientation-1.jpg`: 480×320、EXIF Orientation 1。格納画素も表示方向も上向き。
- `orientation-3.jpg`: 480×320、EXIF Orientation 3。格納画素を180度回転し、補正後は上向き。
- `orientation-6.jpg`: 320×480、EXIF Orientation 6。格納画素を反時計回り90度回転し、補正後は480×320の上向き。
- `orientation-8.jpg`: 320×480、EXIF Orientation 8。格納画素を時計回り90度回転し、補正後は480×320の上向き。
- `alpha.png`: 480×320。完全透過、半透明、不透明画素のCanvas表示確認用。
- `corrupted.jpg`: JPEGではない固定文字列。decode失敗と再試行の確認用。
- `quality.jpg`: 2400×1600。細線、文字、斜線、大小の円で縮小品質を比較する。

再生成はリポジトリルートで `bash scripts/generate-photo-import-fixtures.sh` を実行する。生成にはImageMagick 7の`magick`が必要である。
