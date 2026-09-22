# テンプレートカタログとasset形式

> ステータス: 初期リリース方針
>
> 最終更新日: 2026-09-21

## 目的

この文書は、F/Sで検証したBlob上のcatalogを、製品実装で使用するschema version 1として確定する。実装時のTypeScript型とvalidationは、本実装changeのdelta specとこの形式に合わせる。

## Blob catalog

catalogの正本は、private Blobコンテナ内の`catalog/catalog.json`とする。schema version 1は次の形を持つ。

```json
{
  "schemaVersion": 1,
  "catalogRevision": "2026-09-21-01",
  "templates": [
    {
      "id": "buncho-01",
      "assetRevision": "r1",
      "name": {
        "ja": "文鳥01",
        "en": "Java sparrow 01"
      },
      "published": true,
      "publishFrom": "2026-01-01T00:00:00.000Z",
      "publishUntil": null,
      "tags": ["bird"],
      "thumbnail": {
        "path": "templates/buncho-01/r1/thumbnail.png",
        "mimeType": "image/png"
      },
      "lineArt": {
        "path": "templates/buncho-01/r1/line-art.png",
        "mimeType": "image/png"
      },
      "masks": [
        {
          "id": "background",
          "label": {
            "ja": "背景",
            "en": "Background"
          },
          "initialColor": "#F3EBDD",
          "path": "templates/buncho-01/r1/masks/background.png",
          "mimeType": "image/png"
        }
      ]
    }
  ]
}
```

F/S schemaに対して、製品要件で必要な`tags`とmaskごとの`initialColor`を追加する。`masks`の配列順は、制作画面のエリア選択順と作品の背面から前面への描画順を兼ねる。背景も特別扱いせず、一つのmaskとして定義する。

## fieldと不変条件

| field | 条件 |
| --- | --- |
| `schemaVersion` | 初期値はnumberの`1`。未対応versionを黙って読み替えない |
| `catalogRevision` | catalog内容を識別する非空文字列。更新ごとに変更する |
| `id` | template間で不変かつ一意。小文字英数字と`-`を使用する |
| `assetRevision` | asset集合のimmutable revision。内容を変えるときは新しい値とpathを使う |
| `name`、`label` | `ja`と`en`をどちらも必須とする |
| `published` | `false`は公開期間にかかわらずAPIから除外する |
| `publishFrom`、`publishUntil` | UTCのISO 8601または`null`。境界判定はAPIのserver時刻で行う |
| `tags` | schema version 1では保持するが、初期UIでの検索・絞り込みは必須としない |
| `path` | container内の安全な相対Blob path。query、absolute URL、`..`を許可しない |
| `mimeType` | 初期リリースの画像assetは`image/png`だけを許可する |
| `masks[].id` | 同一template内で一意。制作中の作品状態からmaskを参照する安定IDとする |
| `initialColor` | 不透明な`sRGB`色を`#RRGGBB`で表す |

公開対象templateはthumbnail、line art、1件以上のmaskを持たなければならない。line artとmaskは1080×1080の同一座標系、背景透過PNGとする。maskは対象部分を不透明、対象外を完全透過とし、一つのmaskに離れた複数形状を含めてよい。mask同士は重ならない。

## API response

`GET /api/templates`は、公開条件を満たすtemplateだけを返す。responseは次のmetadataを持つ。

- APIのapp versionとbuild ID。
- server時刻、catalog revision、SAS期限。
- 公開対象templateの`id`、`assetRevision`、`name`、`tags`。
- thumbnail、line art、maskの`mimeType`とBlob単位のSAS URL。
- maskの`id`、`label`、`initialColor`。

`published`、公開期間、Storage接続情報、account keyはbrowserへ返さない。内部のBlob pathはfrontendのdomain契約に含めず、必要なURLだけを外部入出力adapterで受け取る。SASは読み取り専用・HTTPS限定・発行から60分とし、永続化やlog出力を行わない。

## revisionとcache

- asset pathは`templates/<template-id>/<asset-revision>/...`とし、公開済みpathを上書きしない。
- revision付きassetは`public, max-age=31536000, immutable`とする。
- catalogは`no-cache`、API responseは`no-store`とする。
- 新revisionの全assetを配置し、寸法、MIME type、cache metadata、参照整合性を検査してからcatalogを最後に更新する。
- 公開停止またはrevision切替後の旧assetは24時間保持してから削除する。Blobとcontainerのsoft deleteは14日、Blob versioningは有効にする。

## frontendへの変換

frontendはAPI responseを直接画面状態へ保存せず、template取得adapterで次の製品domainへ変換する。

- 表示用metadata。
- 順序付きエリア定義と初期カラー。
- 取得・decode済みのthumbnail、line art、mask resource。

制作セッションへ渡した後はSAS URLを作品状態の識別子として使用しない。作品状態はtemplate ID、asset revision、mask IDと、sessionが所有するdecode済みresourceを参照する。
