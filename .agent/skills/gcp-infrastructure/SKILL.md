---
name: gcp-infrastructure
description: GCPインフラ構成・デプロイ・OpenTofu管理ガイド。Cloud Run、Cloud SQL、Docker ビルド・デプロイ、OpenTofu操作、環境変数設定の手順を提供。「デプロイ」「Cloud Run」「Docker」「OpenTofu」「インフラ」「GCP」時に使用。
---

# GCP インフラストラクチャ ガイド

OpenTofu で GCP リソースを管理する AIRS プロジェクトのインフラ運用ガイド。

## 環境一覧

本番と demo の 2 環境がある。設定ファイルで切り替える。

| 項目 | 本番 (prod) | デモ (demo) |
|------|------------|-------------|
| tfvars | `infra/terraform.tfvars` | `infra/terraform-demo.tfvars` |
| backend conf | `infra/backend.conf` | `infra/backend-demo.conf` |
| GCP プロジェクト ID | `terraform.tfvars` の `project_id` | `terraform-demo.tfvars` の `project_id` |
| environment | `prod` | `demo` |
| Cloud SQL インスタンス | `airs-db-prod` | `airs-db-demo` |
| Artifact Registry | `asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs` | 同左（PROJECT_ID が異なる） |
| Cloud Run (通常) | `airs` | `airs` |
| Cloud Run (管理者) | `airs-admin` | `airs-admin` |

**重要:** demo 環境の tfvars / backend conf は `.gitignore` に含まれるため、リポジトリには含まれない。

### OpenTofu バックエンド切り替え

環境を切り替える際は `tofu init -reconfigure` が必要。**作業後は必ず元の環境に戻すこと。**

```bash
cd infra

# demo 環境に切り替え
tofu init -backend-config=backend-demo.conf -reconfigure

# ... demo 環境での作業 ...

# prod 環境に戻す（必ず実行）
tofu init -backend-config=backend.conf -reconfigure
```

## Docker ビルド・デプロイ

### 重要: 2つのイメージが必要

`NEXT_PUBLIC_ADMIN_MODE` は Next.js のビルド時にインライン化される変数（`NEXT_PUBLIC_*`）のため、**通常モードとadminモードで別々のイメージをビルドする必要がある**。Cloud Run のランタイム環境変数では上書きできない。

```bash
# 通常モード（airs 用）
docker build --platform linux/amd64 \
  -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest .

# 管理者モード（airs-admin 用）--- 必ず --build-arg を指定 ---
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_ADMIN_MODE=1 \
  -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin .
```

### よくある間違い

| 間違い | 結果 | 正しい方法 |
|--------|------|-----------|
| `--build-arg` なしで1つのイメージを両サービスにデプロイ | `airs-admin` が通常モードになる | タグ `latest`(通常) と `admin`(管理者) で別々にビルド |
| Cloud Run の環境変数 `NEXT_PUBLIC_ADMIN_MODE=1` で対応しようとする | 効果なし（ビルド時に確定済み） | Docker ビルド時に `--build-arg` で指定 |

### プッシュ

```bash
# Artifact Registry 認証（初回のみ）
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# 通常モード
docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest

# 管理者モード
docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin
```

### Cloud Run デプロイ

```bash
# 通常モード
gcloud run deploy airs \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest \
  --region asia-northeast1 \
  --project <PROJECT_ID>

# 管理者モード
gcloud run deploy airs-admin \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin \
  --region asia-northeast1 \
  --project <PROJECT_ID>
```

### 一括デプロイ手順（コード変更後）

`<PROJECT_ID>` は対象環境の tfvars から取得すること。

```bash
# 1. ビルド（2つ）
docker build --platform linux/amd64 \
  -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest .
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_ADMIN_MODE=1 \
  -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin .

# 2. プッシュ（2つ）
docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest
docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin

# 3. デプロイ（2つ）
gcloud run deploy airs \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest \
  --region asia-northeast1 --project <PROJECT_ID>
gcloud run deploy airs-admin \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin \
  --region asia-northeast1 --project <PROJECT_ID>
```

### demo 環境への一括デプロイ手順

DB スキーマ変更がある場合は、先に「DB スキーマ更新手順」を実行すること。

```bash
# 0. PROJECT_ID を terraform-demo.tfvars から取得
#    例: PROJECT_ID=airs-demo-2026

# 1. DB スキーマ変更がある場合 → 「DB スキーマ更新手順」参照

# 2. ビルド・プッシュ・デプロイ（一括デプロイ手順と同じ、PROJECT_ID を demo 用に）
docker build --platform linux/amd64 \
  -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest .
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_ADMIN_MODE=1 \
  -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin .

docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest
docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin

gcloud run deploy airs \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest \
  --region asia-northeast1 --project <PROJECT_ID>
gcloud run deploy airs-admin \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin \
  --region asia-northeast1 --project <PROJECT_ID>
```

## OpenTofu 操作

### 基本コマンド

```bash
cd infra

# 初期化（prod）
tofu init -backend-config=backend.conf

# 初期化（demo）— 環境切り替え時は -reconfigure が必要
tofu init -backend-config=backend-demo.conf -reconfigure

# 差分確認（-var-file で環境指定）
tofu plan                                    # prod
tofu plan -var-file=terraform-demo.tfvars    # demo

# 適用
tofu apply                                   # prod
tofu apply -var-file=terraform-demo.tfvars   # demo

# 特定リソースのみ適用
tofu apply -target=google_secret_manager_secret_version.secrets

# 状態確認
tofu state list
tofu state show <resource>
```

### インフラ変数（terraform.tfvars）

| 変数 | 説明 | 必須 |
|------|------|------|
| `project_id` | GCP プロジェクト ID | Yes |
| `region` | GCP リージョン | Yes |
| `gemini_api_key` | Google Gemini API キー | Yes |
| `report_token_secret` | JWT 秘密鍵 | Yes |
| `line_channel_access_token` | LINE Channel Access Token | Yes |
| `line_channel_secret` | LINE Channel Secret | Yes |
| `google_maps_api_key` | Google Maps API キー | Yes |
| `custom_domain` | カスタムドメイン（空文字でスキップ） | No |
| `admin_custom_domain` | 管理者カスタムドメイン（空文字でスキップ） | No |

### ファイル構成

| ファイル | 役割 |
|---------|------|
| `backend.tf` | OpenTofu バージョン制約・バックエンド設定 |
| `providers.tf` | Google プロバイダ設定 |
| `variables.tf` | 入力変数定義 |
| `locals.tf` | 計算値（DATABASE_URL、env_vars、secret_env_vars） |
| `apis.tf` | GCP API 有効化 |
| `network.tf` | VPC、サブネット、VPC コネクタ |
| `database.tf` | Cloud SQL PostgreSQL 15 |
| `storage.tf` | GCS 画像バケット |
| `registry.tf` | Artifact Registry |
| `secrets.tf` | Secret Manager |
| `iam.tf` | サービスアカウント・IAM |
| `cloudrun.tf` | Cloud Run v2 サービス |
| `dns.tf` | カスタムドメインマッピング |

## Cloud Run 環境変数

### 平文環境変数（locals.tf で定義）

| 変数 | 値 | 備考 |
|------|-----|------|
| `NODE_ENV` | `production` | 共通 |
| `IMAGE_STORAGE_PROVIDER` | `gcs` | 共通 |
| `GCS_BUCKET_NAME` | (自動) | 共通 |
| `GCS_PROJECT_ID` | (自動) | 共通 |
| `NEXT_PUBLIC_ADMIN_MODE` | `0` or `1` | **ランタイムでは効果なし**（ビルド時に確定） |

### Secret Manager 経由の環境変数

| 変数 | Secret ID |
|------|-----------|
| `DATABASE_URL` | `airs-DATABASE_URL` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `airs-GOOGLE_GENERATIVE_AI_API_KEY` |
| `REPORT_TOKEN_SECRET` | `airs-REPORT_TOKEN_SECRET` |
| `LINE_CHANNEL_ACCESS_TOKEN` | `airs-LINE_CHANNEL_ACCESS_TOKEN` |
| `LINE_CHANNEL_SECRET` | `airs-LINE_CHANNEL_SECRET` |
| `APP_URL` | `airs-APP_URL` |

## GCP API 一覧（apis.tf で有効化）

- `run.googleapis.com` — Cloud Run
- `sqladmin.googleapis.com` — Cloud SQL Admin
- `secretmanager.googleapis.com` — Secret Manager
- `vpcaccess.googleapis.com` — VPC Access
- `servicenetworking.googleapis.com` — Service Networking
- `artifactregistry.googleapis.com` — Artifact Registry

## トラブルシューティング

### Cloud Run が起動しない

スタートアッププローブが `/api/health` を確認する。`src/app/api/health/route.ts` が存在すること。

### 「システム設定が見つかりません」エラー (500)

`system_settings` テーブルが空の場合に発生する。新規 DB や DB リセット後に起きやすい。

```bash
# Cloud SQL に接続し（上記「Cloud SQL への直接接続」参照）、シード投入
DATABASE_URL="postgresql://airs:${DB_PASSWORD}@127.0.0.1:5434/airs" pnpm run db:seed:setting
```

このシードは `prisma/seedSetting.ts` で定義されており、クラスタリング設定・地図のデフォルト座標・AIチャットの提案質問などの初期値を投入する。

### DB パスワードの取得

対象環境のバックエンドに切り替えてから実行すること（demo の場合は先に `tofu init -backend-config=backend-demo.conf -reconfigure`）。

```bash
cd infra
tofu state pull | python3 -c "
import sys, json
state = json.load(sys.stdin)
for r in state.get('resources', []):
    if r.get('type') == 'random_password' and r.get('name') == 'db_password':
        for inst in r.get('instances', []):
            print(inst['attributes']['result'])
"
```

### Cloud SQL への直接接続

Cloud SQL インスタンスはプライベート IP のみ（`ipv4_enabled = false`）のため、ローカルから接続するには**公開 IP の一時有効化**が必要。

```bash
# 1. Public IP を一時的に有効化
gcloud sql instances patch <INSTANCE_NAME> --assign-ip --project <PROJECT_ID> --quiet

# 2. Cloud SQL Auth Proxy 起動（別ターミナルまたはバックグラウンド）
cloud-sql-proxy "<PROJECT_ID>:asia-northeast1:<INSTANCE_NAME>" --port 5434

# 3. 接続（psql は /opt/homebrew/opt/libpq/bin/psql を使用）
PGPASSWORD='<DB_PASSWORD>' /opt/homebrew/opt/libpq/bin/psql -h 127.0.0.1 -p 5434 -U airs -d airs

# 4. 終了後、Public IP を無効化
gcloud sql instances patch <INSTANCE_NAME> --no-assign-ip --project <PROJECT_ID> --quiet
```

**注意:**
- `--private-ip` フラグは付けない（VPC 外からプライベート IP に到達できない）
- `gcloud sql connect` は IPv6 エラーで使えない場合がある
- psql が PATH にない場合は `/opt/homebrew/opt/libpq/bin/psql` を直接指定（`brew install libpq` で導入）
- ポート 5432/5433 が使用中の場合は 5434 等の空きポートを使用

### DB スキーマ更新手順（PostGIS + Prisma）

`prisma/schema.prisma` を変更した後、Cloud SQL に反映する手順。

**インスタンス名の規則:** `airs-db-<environment>` （prod: `airs-db-prod`, demo: `airs-db-demo`）

**重要:** demo 環境の場合は、先に `tofu init -backend-config=backend-demo.conf -reconfigure` でバックエンドを切り替えること。作業後は `tofu init -backend-config=backend.conf -reconfigure` で prod に戻すこと。

```bash
# 1. DB パスワードを取得（対象環境のバックエンドに切り替え済みであること）
cd infra
DB_PASSWORD=$(tofu state pull | python3 -c "
import sys, json
state = json.load(sys.stdin)
for r in state.get('resources', []):
    if r.get('type') == 'random_password' and r.get('name') == 'db_password':
        for inst in r.get('instances', []):
            print(inst['attributes']['result'])
")

# 2. Public IP を一時的に有効化
gcloud sql instances patch <INSTANCE_NAME> --assign-ip --project <PROJECT_ID> --quiet

# 3. Cloud SQL Auth Proxy 起動（別ターミナルまたはバックグラウンド）
cloud-sql-proxy "<PROJECT_ID>:asia-northeast1:<INSTANCE_NAME>" --port 5434

# 4. PostGIS 拡張が必要な場合（初回のみ）
PGPASSWORD="$DB_PASSWORD" /opt/homebrew/opt/libpq/bin/psql \
  -h 127.0.0.1 -p 5434 -U airs -d airs \
  -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 5. Prisma スキーマを適用
cd /path/to/project
DATABASE_URL="postgresql://airs:${DB_PASSWORD}@127.0.0.1:5434/airs" pnpm run db:push

# 6. シードデータ投入（新規 DB や system_settings が空の場合に必要）
DATABASE_URL="postgresql://airs:${DB_PASSWORD}@127.0.0.1:5434/airs" pnpm run db:seed:setting

# 7. Proxy を停止し、Public IP を無効化
pkill -f "cloud-sql-proxy.*<INSTANCE_NAME>"
gcloud sql instances patch <INSTANCE_NAME> --no-assign-ip --project <PROJECT_ID> --quiet

# 8. demo 環境の場合は prod バックエンドに戻す
cd infra
tofu init -backend-config=backend.conf -reconfigure
```

### リソース削除

```bash
# Cloud SQL の deletion_protection を false に変更してから
tofu destroy
```
