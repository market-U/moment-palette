#!/usr/bin/env bash
set -euo pipefail

# 実在人物や位置情報を含まない同一原稿から、向きと品質を再現できる検証画像を作る。
fixture_dir="public/spikes/photo-import/fixtures"
source_file="$fixture_dir/orientation-source.svg"

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagickのmagickコマンドが必要です。" >&2
  exit 1
fi

magick "$source_file" -quality 92 "$fixture_dir/orientation-1.jpg"
magick "$source_file" -rotate 180 -quality 92 "$fixture_dir/orientation-3.jpg"
magick "$source_file" -rotate -90 -quality 92 "$fixture_dir/orientation-6.jpg"
magick "$source_file" -rotate 90 -quality 92 "$fixture_dir/orientation-8.jpg"

for orientation in 1 3 6 8; do
  node scripts/set-jpeg-orientation.mjs "$fixture_dir/orientation-$orientation.jpg" "$orientation"
done
magick "$fixture_dir/alpha-source.svg" "$fixture_dir/alpha.png"
magick "$fixture_dir/quality-source.svg" -quality 94 "$fixture_dir/quality.jpg"

# 正常な画像signatureを持たない固定文字列にして、常にdecode失敗を再現する。
printf 'moment-palette intentionally corrupted image fixture\n' > "$fixture_dir/corrupted.jpg"
