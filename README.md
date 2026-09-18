# Moment Palette

Moment Paletteは、カメラ、端末内の写真、単色を組み合わせて作品を作るモバイル向けWebアプリケーションです。

## 必要な環境

- Node.js 24 LTS系列（`.node-version`では`24.14.0`を指定）
- pnpm `12.4.2`

## セットアップ

Node.jsを準備した後、リポジトリが指定するpnpmを有効にします。

Corepackを利用できる場合:

```sh
corepack enable
corepack install
```

Corepackを利用できない場合:

```sh
npm install --global pnpm@12.4.2
```

pnpmのバージョンを確認し、ロックファイルに基づいて依存関係をインストールします。

```sh
pnpm --version
pnpm install --frozen-lockfile
```

## 開発コマンド

| コマンド            | 用途                                     |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | ローカル開発サーバーを起動する           |
| `pnpm build`        | 型検査後にproduction buildを生成する     |
| `pnpm preview`      | production buildをローカルで確認する     |
| `pnpm typecheck`    | TypeScriptとVue SFCの型を検査する        |
| `pnpm test`         | 単体テストをwatchモードで実行する        |
| `pnpm test:run`     | 単体テストを一度実行して終了する         |
| `pnpm lint`         | ESLintでソースを検査する                 |
| `pnpm format`       | Prettierで対応ファイルを整形する         |
| `pnpm format:check` | ファイルを書き換えずに整形差分を検査する |

CIなどの非対話環境では、`typecheck`、`test:run`、`lint`、`format:check`、`build`を使用します。
