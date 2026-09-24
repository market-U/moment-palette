## 1. リリース境界と既存Azure基盤を準備する

- [x] 1.1 現在の`main`先頭から`release`ブランチを作成し、GitHubのデフォルトブランチは`main`のまま維持する。
- [x] 1.2 `main`と`release`へ、直接pushを禁止し、PR、必須品質検査、レビューを要求するbranch protectionを設定する。
- [x] 1.3 既存SWA、Storage、container、Application Settingsを秘密値を出力せずに読取確認し、production parameter・タグ・運用上の名称への移行対象を確定する。
- [x] 1.4 `infra/`を本番用途へ整理し、既存SWAを変更・重複作成しないことをBicep validateとwhat-ifで検査できるproduction parameterと手順を整備する。
- [x] 1.5 StorageのHTTPS only、TLS 1.2、private container、限定CORS、soft delete、versioningが本番構成でも維持されることを確認する。

## 2. 製品catalogとManaged APIを移行する

- [x] 2.1 製品schema version 1に準拠する初期catalog JSONと、参照するrevision付きtemplate assetをprivate Blobへ配置する準備・検証手順を実装する。
- [x] 2.2 API設定を`TEMPLATE_CATALOG_FILE`と固定`catalog/` prefixへ変更し、安全なJSONファイル名だけを受け付けるvalidationとunit testを追加する。
- [x] 2.3 F/S設定`TEMPLATE_CATALOG_BLOB`を製品APIから除去し、fallbackしないこと、構成不備が秘密値なしの500になることをtestする。
- [x] 2.4 catalog reader、catalog validator、公開判定、templates service、Functions endpointを製品`GET /api/templates`契約へ移行し、schema、HTTP status、`no-store`、version/build、SAS制約のunit testを更新する。
- [x] 2.5 Productionと必要なPR preview環境へ`TEMPLATE_CATALOG_FILE`を追加し、同一Storageで環境ごとにcatalogを切り替えられることを確認する。この時点では旧`TEMPLATE_CATALOG_BLOB`を残す。
- [x] 2.6 private Blobへの匿名アクセス拒否、公開中templateだけへのread-only・HTTPS限定・60分SAS、CORS、cache headerを実環境で確認する。

## 3. 製品frontendをtemplate APIへ接続する

- [x] 3.1 F/S browser catalog adapterを製品`TemplateCatalogPort`とcatalog validatorを使う`src/infrastructure/template-selection/`へ移設し、network・HTTP・invalid responseのunit testを移行する。
- [x] 3.2 `creationSessionAppService`を開発用catalog adapterではなくsame-originの製品`GET /api/templates` adapterへ結線し、明示的なfixtureを使うunit test以外で静的catalogへfallbackしないようにする。
- [x] 3.3 release情報・frontend・APIの三者identity照合、assetの全件decode、失敗時のresource解放、Start後のsession継続に関する既存testを製品経路で維持・追加する。配信更新後に完成画面への遷移で旧buildの遅延chunkを取得しないことを回帰testで保証する。
- [ ] 3.4 production buildとSWA CLIで、`/api/templates`、SPA直接アクセス、template選択から完成・保存・共有までの製品経路を確認する。

## 4. release起点のデプロイを実装する

- [x] 4.1 GitHub Actionsのpush triggerを`release`だけ、pull request triggerを`main`と`release`へ変更し、SWA actionのuploadに`production_branch: release`を設定する。
- [x] 4.2 本番用途のSWA deployment secretへ移行し、外部forkとDependabot PRには品質検査だけを行いsecretを渡さない既存境界を維持する。
- [x] 4.3 `main`向けPR、`main`から`release`へのPR、`release`へのmergeで、それぞれ一時preview、リリース候補preview、Production配信になることを実環境で確認する。
- [x] 4.4 ProductionとPR previewでAPIの環境別catalog、frontend・release・APIのbuild ID、CORS/SAS、Start済みtabの配信更新後・SAS期限後の継続をiPhone SafariとChromeで確認する。
- [x] 4.5 `TEMPLATE_CATALOG_FILE`だけを読む製品APIのProduction・PR preview確認後に、各環境から旧`TEMPLATE_CATALOG_BLOB`を削除する。

## 5. F/S資産を整理し、運用記録を更新する

- [x] 5.1 製品経路のunit test、全自動品質検査、ProductionとPR previewの実機確認証跡がそろったことを確認してから、F/S専用route、page、UI、diagnostic、port、adapterと関連testを削除する。
- [ ] 5.2 製品実装が利用しないF/S catalog/fixtureとApplication Settingsを削除するか、運用fixtureとして残すかを判定し、削除する場合は24時間のasset削除猶予と復旧可能性を確認する。
- [ ] 5.3 `docs/architecture/`のMermaid図、template API契約、`infra/README.md`、ルートREADME、F/S結果記録を、既存リソースを昇格したProduction構成、catalog切替、release配信、secret、asset更新、ロールバックへ更新する。
- [ ] 5.4 `docs/development-roadmap.md`のフェーズ6状態と次の作業を更新し、全品質検査、Bicep検査、OpenSpec validation、実環境・実機確認の結果を記録する。
