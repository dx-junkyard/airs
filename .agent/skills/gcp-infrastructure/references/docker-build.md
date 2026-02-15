# Docker ビルド リファレンス

## Dockerfile 構成（マルチステージ）

```
Stage 1: deps     — pnpm install
Stage 2: builder  — Prisma 生成 → Next.js ビルド（ARG で NEXT_PUBLIC_ADMIN_MODE を受け取る）
Stage 3: runner   — standalone 出力をコピーして実行
```

## ビルド引数

| ARG | デフォルト | 説明 |
|-----|-----------|------|
| `NEXT_PUBLIC_ADMIN_MODE` | `0` | `0`=通常モード, `1`=管理者モード |

## NEXT_PUBLIC_* 変数の仕組み

Next.js は `NEXT_PUBLIC_` プレフィックスの環境変数をビルド時に JavaScript バンドルにインライン化する。

```
ビルド時: process.env.NEXT_PUBLIC_ADMIN_MODE → "0" or "1" にリテラル置換
ランタイム: Cloud Run 環境変数を設定しても、バンドル済みコードは変わらない
```

### 参照箇所

- `src/config/admin-mode.ts` — `process.env.NEXT_PUBLIC_ADMIN_MODE === '1'` をチェック
- `src/features/common/utils/isAdmin.ts` — 同上

### つまり

- **ビルド時に `--build-arg NEXT_PUBLIC_ADMIN_MODE=1` を渡さないと admin にならない**
- Cloud Run の環境変数として `NEXT_PUBLIC_ADMIN_MODE=1` を設定しても意味がない
- 通常モードと管理者モードで**別のイメージ**が必要

## イメージタグ規約

| タグ | 用途 | ビルドコマンド |
|------|------|---------------|
| `latest` | 通常モード（airs） | `docker build --platform linux/amd64 -t ...airs:latest .` |
| `admin` | 管理者モード（airs-admin） | `docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_ADMIN_MODE=1 -t ...airs:admin .` |

## プラットフォーム

Cloud Run は `linux/amd64` アーキテクチャを要求するため、Apple Silicon Mac では `--platform linux/amd64` が必須。

## ベースイメージ

`node:24.12.0-slim` — `.node-version` と一致させること。
