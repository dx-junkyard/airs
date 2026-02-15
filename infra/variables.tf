# =============================================================================
# 必須変数
# =============================================================================

variable "project_id" {
  description = "GCP プロジェクト ID"
  type        = string
}

# =============================================================================
# オプション変数（デフォルト値あり）
# =============================================================================

variable "region" {
  description = "GCP リージョン"
  type        = string
  default     = "asia-northeast1"
}

variable "environment" {
  description = "環境名（リソース命名に使用）"
  type        = string
  default     = "prod"
}

variable "demo_mode" {
  description = "デモモード有効化フラグ（true: 有効, false: 無効）"
  type        = bool
  default     = false
}

# --- Cloud SQL ---

variable "db_tier" {
  description = "Cloud SQL インスタンスティア（本番は db-custom-1-3840 推奨）"
  type        = string
  default     = "db-f1-micro"
}

# --- Cloud Run ---

variable "cloudrun_min_instances" {
  description = "Cloud Run 最小インスタンス数"
  type        = number
  default     = 0
}

variable "cloudrun_max_instances" {
  description = "Cloud Run 最大インスタンス数"
  type        = number
  default     = 10
}

variable "cloudrun_cpu" {
  description = "Cloud Run CPU 割り当て"
  type        = string
  default     = "1"
}

variable "cloudrun_memory" {
  description = "Cloud Run メモリ割り当て"
  type        = string
  default     = "512Mi"
}

variable "cloudrun_request_timeout" {
  description = "Cloud Run リクエストタイムアウト（秒）"
  type        = number
  default     = 300
}

variable "geo_provider" {
  description = "逆ジオコーディングプロバイダ（yahoo | nominatim）"
  type        = string
  default     = "yahoo"

  validation {
    condition     = contains(["yahoo", "nominatim"], var.geo_provider)
    error_message = "geo_provider は yahoo または nominatim を指定してください。"
  }
}

variable "nominatim_user_agent" {
  description = "Nominatim利用時のUser-Agent"
  type        = string
  default     = "AIRS/1.0 (wildlife-report-system)"
}

# =============================================================================
# シークレット変数（sensitive）
# =============================================================================

variable "report_token_secret" {
  description = "通報編集ページのアクセス制御用 JWT 秘密鍵"
  type        = string
  sensitive   = true
}

variable "line_channel_access_token" {
  description = "LINE Channel Access Token"
  type        = string
  sensitive   = true
}

variable "line_channel_secret" {
  description = "LINE Channel Secret"
  type        = string
  sensitive   = true
}

variable "yahoo_geocoding_app_id" {
  description = "Yahoo!ジオコーディングAPI APP ID"
  type        = string
  sensitive   = true
}

# --- LINE公式アカウント ---

variable "line_friend_qr_url" {
  description = "LINE公式アカウント友だち追加QRコード画像のURL（空文字でフォールバック表示）"
  type        = string
  sensitive   = true
}

variable "line_friend_add_url" {
  description = "LINE公式アカウント友だち追加リンク（空文字でフォールバック表示）"
  type        = string
  sensitive   = true
}

# --- カスタムドメイン ---

variable "custom_domain" {
  description = "Cloud Run にマッピングするカスタムドメイン（空文字でスキップ）"
  type        = string
  default     = ""
}

variable "admin_custom_domain" {
  description = "Cloud Run admin サービスにマッピングするカスタムドメイン（空文字でスキップ）"
  type        = string
  default     = ""
}
