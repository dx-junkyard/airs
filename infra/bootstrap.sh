#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# OpenTofu tfstate バケット作成スクリプト
# 使い方: ./bootstrap.sh <PROJECT_ID>
# =============================================================================

if [ $# -lt 1 ]; then
  echo "Usage: $0 <PROJECT_ID>"
  exit 1
fi

PROJECT_ID="$1"
REGION="asia-northeast1"
BUCKET_NAME="${PROJECT_ID}-tfstate"

echo "==> プロジェクト: ${PROJECT_ID}"
echo "==> バケット名:   ${BUCKET_NAME}"

# プロジェクト設定
gcloud config set project "${PROJECT_ID}"

# tfstate バケット作成
if gcloud storage buckets describe "gs://${BUCKET_NAME}" > /dev/null 2>&1; then
  echo "==> バケット gs://${BUCKET_NAME} は既に存在します"
else
  echo "==> バケット gs://${BUCKET_NAME} を作成中..."
  gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --uniform-bucket-level-access \
    --public-access-prevention
fi

# バージョニング有効化
echo "==> バージョニングを有効化..."
gcloud storage buckets update "gs://${BUCKET_NAME}" --versioning

echo ""
echo "=== 完了 ==="
echo "backend.tf の bucket を以下に設定してください:"
echo "  bucket = \"${BUCKET_NAME}\""
