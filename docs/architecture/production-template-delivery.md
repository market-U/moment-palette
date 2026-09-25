# 初期Productionテンプレート配信構成

> 状態: 実装・実環境確認済み
>
> 最終更新日: 2026-09-24

既存のSWAとprivate Blob Storageは、名称に残る`fs`を歴史的識別子として維持したまま、初期Production環境へ昇格した。新規resourceの作成や既存SWAの再作成は行わない。

```mermaid
flowchart LR
  developer["開発者"]
  browser["利用者のブラウザ"]

  subgraph github["GitHub"]
    main["main<br/>統合候補"]
    release["release<br/>本番配信元"]
    actions["GitHub Actions<br/>品質検査 → build → deploy"]
    main -->|"PR"| release
  end

  subgraph azure["Azure / 初期Production環境"]
    subgraph swa["Azure Static Web Apps Free"]
      production["Production<br/>releaseのみ"]
      preview["PR preview<br/>main / release向け"]
      api["Managed Functions<br/>GET /api/templates"]
    end
    storage["private Blob Storage<br/>catalog / revision付きasset"]
  end

  developer -->|"PR / merge"| main
  release -->|"push"| actions
  main -->|"PR"| actions
  actions -->|"release: Production"| production
  actions -->|"PR: preview"| preview
  api -->|"Shared Keyで読み取り / SAS発行"| storage
  production --> browser
  preview --> browser
  browser -->|"same-origin API"| api
  browser -->|"read-only HTTPS SAS"| storage
```

Productionは`TEMPLATE_CATALOG_FILE=catalog.json`を使う。PR previewは同じStorageとrevision付きassetを共有し、必要時だけApplication Settingsで別の安全なcatalogファイル名へ切り替える。`TEMPLATE_CATALOG_BLOB`は廃止済みで、製品APIは参照しない。

開始時にfrontend、`release.json`、API responseのapp versionとbuild IDを照合する。選択templateの全assetをdecodeした後は、API、Blob、JavaScript、CSSを再取得せず、配信更新および60分SAS期限後も完成・保存・共有を継続する。

## 運用

- assetは`templates/<template-id>/<revision>/`へ先に配置し、Content-Typeと`public, max-age=31536000, immutable`を確認する。
- catalogは最後に`no-cache`で更新する。公開停止時はcatalogを先に変更し、参照されなくなったassetを24時間以上残す。
- 配信障害は`release`へのrevert PRで復旧する。catalog障害は直前revisionへ戻し、誤削除・上書きは14日のsoft deleteまたはBlob versionから復元する。
- secret、Storage接続文字列、account key、SAS queryはrepository、文書、通常ログへ残さない。
