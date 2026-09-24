# Template API製品契約

> ステータス: 実装・ProductionおよびPR preview確認済み
>
> 最終更新日: 2026-09-22

## 目的

この文書は、Moment Paletteのfrontendが公開中templateを取得する`GET /api/templates`の製品契約を一元化する。Blob catalog自体のschemaと画像不変条件は[`template-format.md`](template-format.md)、F/Sで実装した配信構成は[`azure-template-delivery.md`](azure-template-delivery.md)を参照する。

frontend、Azure上の製品API、private Blob、Application Settings、IaCへの反映は完了している。現行の配信構成は[`production-template-delivery.md`](production-template-delivery.md)を参照する。

## Request

| 項目 | 値 |
| --- | --- |
| endpoint | `GET /api/templates` |
| origin | frontendと同じorigin |
| Azure Functions auth level | `anonymous` |
| request body | なし |
| query parameter | なし |
| response cache | `Cache-Control: no-store` |
| content type | `application/json; charset=utf-8` |

認証なしで呼び出せるのは、公開対象の表示情報と短期間の読み取り用URLだけを返すためである。Storage containerの匿名アクセスは無効のままとする。

## Success response

成功時は`200 OK`と次のschema version 1を返す。

```json
{
  "schemaVersion": 1,
  "apiVersion": "0.0.0",
  "buildId": "0123456789abcdef0123456789abcdef01234567",
  "serverTime": "2026-09-22T00:00:00.000Z",
  "catalogRevision": "production-2026-09-22-01",
  "sasExpiresAt": "2026-09-22T01:00:00.000Z",
  "templates": [
    {
      "id": "buncho-01",
      "assetRevision": "r1",
      "name": {
        "ja": "文鳥01",
        "en": "Java sparrow 01"
      },
      "tags": ["bird"],
      "thumbnail": {
        "mimeType": "image/png",
        "url": "https://example.blob.core.windows.net/templates/templates/buncho-01/r1/thumbnail.png?..."
      },
      "lineArt": {
        "mimeType": "image/png",
        "url": "https://example.blob.core.windows.net/templates/templates/buncho-01/r1/line-art.png?..."
      },
      "masks": [
        {
          "id": "background",
          "label": {
            "ja": "背景",
            "en": "Background"
          },
          "initialColor": "#F3EBDD",
          "mimeType": "image/png",
          "url": "https://example.blob.core.windows.net/templates/templates/buncho-01/r1/masks/background.png?..."
        }
      ]
    }
  ]
}
```

### metadata

| field | 規則 |
| --- | --- |
| `schemaVersion` | numberの`1`。未対応versionをfrontendが黙って読み替えない |
| `apiVersion` | 読み込み済みfrontendおよび`release.json`のapp versionと一致する |
| `buildId` | 読み込み済みfrontendおよび`release.json`のbuild IDと一致する |
| `serverTime` | API serverで判定に使用したUTC ISO 8601時刻 |
| `catalogRevision` | 選択した環境別catalogの内容を識別する非空文字列 |
| `sasExpiresAt` | response内のasset URLに共通するSAS期限 |
| `templates` | server時刻で公開条件を満たすtemplateだけをcatalog順で返す |

templateとassetのfield、不変条件、mask順、初期色は[`template-format.md`](template-format.md)を正本とする。`templates`は0件でもよい。

## Error response

公開用errorは次の共通形式とし、内部例外や設定値を本文へ含めない。

```json
{
  "error": {
    "code": "storage-unavailable",
    "message": "テンプレートカタログを取得できません。"
  }
}
```

| HTTP status | code | 条件 |
| --- | --- | --- |
| `500` | `configuration-invalid` | 必須Application Settingsが未設定または不正 |
| `502` | `catalog-invalid` | catalog JSONの解析、schema、参照規則が不正 |
| `503` | `storage-unavailable` | Blobの取得またはSAS発行を一時的に完了できない |
| `500` | `unexpected-error` | 上記に安全に分類できない失敗 |

error responseにも`Cache-Control: no-store`と`Content-Type: application/json; charset=utf-8`を付ける。frontendは外部messageを直接表示せず、安全な日英の案内と再試行を表示する。

## 環境別catalogの選択

APIのApplication Settingsには`TEMPLATE_CATALOG_FILE`を必須設定する。値にはpathではなく、次のようなJSONファイル名だけを指定する。

| 環境例 | 設定値 | APIが読むBlob名 |
| --- | --- | --- |
| 開発 | `catalog-dev.json` | `catalog/catalog-dev.json` |
| 検証 | `catalog-staging.json` | `catalog/catalog-staging.json` |
| 本番 | `catalog.json` | `catalog/catalog.json` |

APIは固定prefixの`catalog/`と設定値を結合する。値は小文字英数字と`-`から成るbasenameおよび`.json`拡張子だけを許可する。未設定、空文字、`/`または`\`、絶対URL、query、fragment、`..`を含む値は`configuration-invalid`として拒否する。

APIは環境名からファイル名を推測せず、不正設定時に既定catalogへfallbackしない。catalogのファイル名と組み立て後のBlob名はsuccess・error response、frontendの型、作品状態へ含めない。frontendが保持する配信識別子は`catalogRevision`である。

旧F/S設定`TEMPLATE_CATALOG_BLOB`は削除済みである。製品APIは`TEMPLATE_CATALOG_FILE`だけを受け付け、旧設定へのfallbackを行わない。

## 画像assetの共有

複数のAPI環境が同じStorage containerを参照する場合、環境ごとにcatalog JSONだけを分け、各catalogから共通の`templates/<template-id>/<asset-revision>/...`を参照できる。revision付きassetは上書きしないため、同じ画像bytesを複製せずに流用できる。

共有assetを削除するときは、単一環境のcatalogから参照が外れただけで削除してはならない。運用対象となるすべてのcatalogから参照がなくなったことを確認し、最後の参照を外してから24時間の削除猶予を開始する。soft delete 14日とBlob versioningも維持する。

## SASとcache

- APIは公開対象のassetごとにBlob単位のService SASを生成する。
- SASは読み取り専用、HTTPS限定、発行から60分とする。
- frontendは選択したtemplateのline artと全maskを制作画面へ進む前に取得・decodeする。
- SAS URLを作品識別子、永続データ、analytics、外部logへ保存しない。
- API responseと`release.json`は`no-store`、catalog Blobは`no-cache`とする。
- revision付きassetは`public, max-age=31536000, immutable`とする。

制作session開始後はSAS期限、catalog更新、新build配信にかかわらず、取得済みresourceだけで制作を続ける。

## 公開しない情報

APIのsuccess・error responseとlogへ次を出さない。

- Storage接続文字列、account key、container credential。
- 非公開templateの名称、件数、公開期間。
- catalogのファイル名、内部Blob path。
- SAS queryを含む完全URLのlog。
- frontendが生成した作品、撮影画像、選択写真。

SAS URL自体はasset取得に必要なためsuccess responseへ含めるが、frontendのdomainへ変換するときは外部asset参照に隔離し、`Template`や`Artwork`へ含めない。

## F/S responseからの変更

| 対象 | F/S response | 製品response |
| --- | --- | --- |
| schema識別 | なし | `schemaVersion: 1`を追加 |
| tag | なし | `templates[].tags`を追加 |
| 初期色 | 固定色compositor | `masks[].initialColor`を追加 |
| 公開件数 | `publicationCounts`を返す | frontendに不要なため除外 |
| 内部path | 各assetの`path`を返す | frontendの契約から除外 |
| catalog選択 | `TEMPLATE_CATALOG_BLOB`へ相対Blob名 | `TEMPLATE_CATALOG_FILE`へファイル名だけを指定 |

F/S routeは製品経路の実機確認後に削除した。製品frontendはsame-origin API responseをこの文書のschemaとして検証する。
