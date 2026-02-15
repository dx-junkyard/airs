# AIRS インフラストラクチャ

OpenTofu で GCP リソースを管理する。

## 前提条件

- [OpenTofu](https://opentofu.org/) >= 1.6.0
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- [Docker](https://www.docker.com/)
- GCP プロジェクトが作成済みであること
- GCP の課金が有効であること

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `bootstrap.sh` | tfstate バケット作成スクリプト |
| `backend.tf` | OpenTofu バージョン制約・バックエンド設定 |
| `backend.conf` | バックエンド設定値（gitignore） |
| `providers.tf` | Google プロバイダ設定 |
| `variables.tf` | 入力変数定義 |
| `locals.tf` | 計算値（DATABASE_URL、env_vars 等） |
| `apis.tf` | GCP API 有効化 |
| `network.tf` | VPC、サブネット、VPC コネクタ |
| `database.tf` | Cloud SQL PostgreSQL 15 |
| `storage.tf` | GCS 画像バケット |
| `registry.tf` | Artifact Registry |
| `secrets.tf` | Secret Manager |
| `iam.tf` | サービスアカウント・IAM |
| `cloudrun.tf` | Cloud Run v2 サービス |
| `dns.tf` | カスタムドメインマッピング |
| `outputs.tf` | 出力値 |

## クイックスタート

### 1. GCP 認証

```bash
gcloud auth login
gcloud auth application-default login
gcloud auth application-default set-quota-project <PROJECT_ID>
```

### 2. tfstate バケット作成

```bash
cd infra
chmod +x bootstrap.sh
./bootstrap.sh <PROJECT_ID>
```

### 3. 設定ファイル準備

```bash
cp backend.conf.example backend.conf   # バックエンド設定
cp terraform.tfvars.example terraform.tfvars  # 変数設定
```

各ファイルを環境に合わせて編集する。`terraform.tfvars` の必須変数:

| 変数 | 説明 |
|------|------|
| `project_id` | GCP プロジェクト ID |
| `gemini_api_key` | Google Gemini API キー |
| `yahoo_geocoding_app_id` | Yahoo!ジオコーディングAPI APP ID |
| `report_token_secret` | JWT 秘密鍵（任意の文字列） |
| `line_channel_access_token` | LINE Channel Access Token |
| `line_channel_secret` | LINE Channel Secret |
| `geo_provider` | 逆ジオコーディングプロバイダ（`yahoo` \| `nominatim`） |
| `nominatim_user_agent` | Nominatim利用時のUser-Agent（任意） |
| `custom_domain` | カスタムドメイン（任意、空文字でスキップ） |

### 4. インフラ構築

```bash
tofu init -backend-config=backend.conf
tofu plan
tofu apply
```

### 5. Docker イメージのビルド・デプロイ

`NEXT_PUBLIC_ADMIN_MODE` は Next.js のビルド時にインライン化されるため、通常モードと管理者モードで**別々のイメージをビルド**する必要がある。

```bash
# Artifact Registry 認証（初回のみ）
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# 通常モード（airs:latest）
docker build --platform linux/amd64 \
  -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest .

# 管理者モード（airs:admin）--- 必ず --build-arg を指定 ---
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_ADMIN_MODE=1 \
  -t asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin .

# プッシュ
docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest
docker push asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin

# Cloud Run デプロイ
gcloud run deploy airs \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:latest \
  --region asia-northeast1 --project <PROJECT_ID>
gcloud run deploy airs-admin \
  --image asia-northeast1-docker.pkg.dev/<PROJECT_ID>/airs/airs:admin \
  --region asia-northeast1 --project <PROJECT_ID>
```

### 6. 初期セットアップ（初回のみ）

PostGIS 拡張、Prisma スキーマ、APP_URL シークレット、LINE Webhook URL 等の設定は [.claude/skills/gcp-infrastructure/SKILL.md](../.claude/skills/gcp-infrastructure/SKILL.md) を参照。

## リソースの削除

Cloud SQL は `deletion_protection = true` のため、削除前に `database.tf` で `false` に変更して `tofu apply` してから実行:

```bash
tofu destroy
```
