# F/S用SWAデプロイ仕様と実装確認記録

この文書は、`establish-preview-deployment`で採用した外部仕様、GitHub Action、実装・検証結果を記録する。外部仕様の確認日は2026-09-18、実装結果の更新日は2026-09-19である。2026-09-21の`validate-azure-template-delivery`でmanaged APIとprivate Blobを追加した現在構成は[`azure-template-delivery.md`](azure-template-delivery.md)を正本とし、この文書の「API対象外」という初期状態を置き換える。

## 実装済み構成図

- 対象環境: 技術F/S専用
- 更新日: 2026-09-19
- 構成状態: **実装済み**

```mermaid
flowchart LR
  developer["開発者"]
  verifiedDevices["確認済み実機<br/>iPhone 15 / iOS 26<br/>Safari / Chrome"]
  pendingDevice["リリース後に確認<br/>Android Chrome"]
  excluded["今回の対象外<br/>Blob Storage / マネージドAPI / 固定dev環境"]

  subgraph github["GitHub"]
    repository["リポジトリ<br/>main / pull request"]
    actions["GitHub Actions<br/>品質検査 → build → deploy"]
  end

  subgraph azure["Azure / F/S専用"]
    subgraph swa["Azure Static Web Apps Free"]
      production["mainの固定F/S環境<br/>SWA上のProduction環境"]
      preview["PR固有の一時環境<br/>同時に最大3環境"]
    end
  end

  developer -->|"commit / PR"| repository
  repository -->|"main push / PRイベント"| actions
  actions -->|"main push: 生成済みdistを配信"| production
  actions -->|"通常PR: 配信・終了"| preview
  production -->|"公開HTTPS URL / 確認済み"| verifiedDevices
  preview -->|"公開HTTPS URL / 確認済み"| verifiedDevices
  production -.->|"端末確保後に確認"| pendingDevice
  production -.->|"構築しない"| excluded

  classDef azureService fill:#e6f6ff,stroke:#0078d4,color:#102a43
  classDef client fill:#fffbea,stroke:#b7791f,color:#102a43
  classDef outOfScope fill:#f5f5f5,stroke:#829ab1,color:#486581,stroke-dasharray:5 5
  class production,preview azureService
  class verifiedDevices client
  class pendingDevice outOfScope
  class excluded outOfScope
```

SWA上のProduction環境は、実サービス本番ではなくマージ済み状態を配信するF/S用固定環境である。外部forkとDependabot PRは品質検査だけを行い、SWAへはデプロイしない。

## 実装・検証結果

| 項目 | 結果 |
|---|---|
| リソースグループ | `rg-moment-palette-fs` |
| SWA | `moment-palette-fs-market-u-20260918` / Free / East Asia |
| 固定F/S URL | <https://icy-mushroom-0c0e42e00.5.azurestaticapps.net/> |
| `main`デプロイ | PR #3のmerge commit `ad9c9fc`で品質検査、production build、生成済み`dist`のデプロイに成功 |
| PRライフサイクル | PR #3で同じプレビューURLの更新とclose処理に成功。close後はAzureの`default`環境だけが残り、旧プレビューURLは404を返した |
| SPA直接アクセス | ルートと任意のアプリ内URLが同じアプリシェルを返し、存在しない`/assets/*`は404を返すことを確認 |
| 実機 | iPhone 15（iOS 26）のSafariとChromeでPR環境・固定環境とも証明書エラーなし。アプリ内URLは起動後に現在のルーティング規則で固定URLへ戻る |
| Android | 利用できる実機がないため、端末を確保できるリリース後にChromeで確認する |
| Dependabot | `github-actions`の週次監視を認識し、2026-09-19の初回version update jobは更新対象なしで完了 |

復旧手順はリポジトリルートの[`README.md`](../../README.md#復旧)に記載している。

図はGitHubがMarkdown内でネイティブ描画するMermaidを正本兼表示形式とする。[Architecture design diagrams](https://learn.microsoft.com/azure/well-architected/architect-role/design-diagrams)の方針を確認し、正式なAzureサービス名、方向付きでラベルのある経路、対象範囲、更新日、状態を明示した。追加レンダラー、アイコンライブラリ、派生画像を必要としない再現性を優先し、本番構成でも同じ方針を維持する。

## ローカルSWAエミュレーター

2026-09-21時点の公式[`@azure/static-web-apps-cli`](https://www.npmjs.com/package/@azure/static-web-apps-cli) `2.0.10`を開発依存へ固定した。[SWA CLIの公式リファレンス](https://learn.microsoft.com/azure/static-web-apps/static-web-apps-cli)と[runtime configの探索規則](https://azure.github.io/static-web-apps-cli/docs/use/config/)に基づき、`swa start dist --swa-config-location dist --api-devserver-url http://localhost:7071`でbuild成果物と別processのFunctions hostを同一originへ束ねる。

SWA CLIはルーティング設定のローカル確認だけに使用し、Azureへのログインやデプロイには使用しない。Vite PreviewはSWA固有設定を解釈しないため、この確認の代替にはしない。

## Azure Static Web Apps Actionの入力

[Azure Static Web Appsのbuild設定](https://learn.microsoft.com/azure/static-web-apps/build-configuration)、[構成ファイルの配置要件](https://learn.microsoft.com/azure/static-web-apps/configuration)、[`Azure/static-web-apps-deploy`のAction定義](https://github.com/Azure/static-web-apps-deploy/blob/1a947af9992250f3bc2e68ad0754c0b0c11566c9/action.yml)に基づき、次のように設定する。

| 用途 | 設定 |
|---|---|
| 生成済み成果物の配信 | `action: upload` |
| PR一時環境の終了 | `action: close` |
| F/S用固定環境のブランチ | workflowのpush triggerを`main`だけに限定 |
| Action内部のbuild | `skip_app_build: true` |
| 配信する生成済み成果物 | `app_location: dist` |
| `skip_app_build`時の出力先 | `output_location: ''` |
| API | `api_location: api`を指定し、ActionがNode.js 22 packageをbuild |

`skip_app_build: true`の場合、`app_location`はソースではなく配信対象のbuild出力を指し、`output_location`は空にする。`staticwebapp.config.json`はbuild出力のルートに置く。

実行ログで公式Actionの`action.yml`が`production_branch`を入力として公開していないことを確認したため、この無効な入力は指定しない。固定環境への配信元はworkflowのpush triggerを`main`だけに限定して保証し、`main`向けPRはGitHubのpull requestイベント情報から一時環境へ配信する。

## 固定したGitHub Action

| Action | リリース | 完全長commit SHA |
|---|---|---|
| [`actions/checkout`](https://github.com/actions/checkout/releases/tag/v7.0.1) | `v7.0.1` | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [`actions/setup-node`](https://github.com/actions/setup-node/releases/tag/v7.0.0) | `v7.0.0` | `820762786026740c76f36085b0efc47a31fe5020` |
| [`pnpm/setup`](https://github.com/pnpm/setup/releases/tag/v2.1.0) | `v2.1.0` | `703c52620218391530e48b9e8870d5c0082e1b9b` |
| [`Azure/static-web-apps-deploy`](https://github.com/Azure/static-web-apps-deploy) | `v1` branch（2026-09-21再確認） | `4d27395796ac319302594769cfe812bd207490b1` |

workflow内では完全長SHAと同じ行にリリース名をコメントで残す。`.github/dependabot.yml`がGitHub Actionsを週次監視するが、更新PRは自動mergeしない。

`Azure/static-web-apps-deploy`の固定SHAはActionリポジトリの定義を固定する。ただし、[同ActionのDockerfile](https://github.com/Azure/static-web-apps-deploy/blob/1a947af9992250f3bc2e68ad0754c0b0c11566c9/Dockerfile)が参照する`staticappsclient:stable`やSWAサービス自体までは固定しないため、更新後は実際のデプロイでも互換性を確認する。

## Dependabot PRの扱い

GitHubではDependabotが作成したPRのworkflowをfork由来と同等に扱い、Actionsのrepository secretを渡さない。したがってDependabot PRでは通常の品質検査だけを実行し、SWAへの自動プレビューは行わない。Action更新をレビューして通常の作業ブランチへ取り込んだ確認PRで、実デプロイを検証する。`pull_request_target`の利用やDependabot専用secretへのトークン複製は行わない。
