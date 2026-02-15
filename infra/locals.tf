locals {
  app_name       = "airs"
  app_name_admin = "airs-admin"

  # Cloud SQL Auth Proxy 形式の接続文字列
  database_url = "postgresql://${google_sql_user.app.name}:${random_password.db_password.result}@localhost/${google_sql_database.app.name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}&connection_limit=10&pool_timeout=20"

  # 共通の平文環境変数
  common_env_vars = {
    NODE_ENV                = "production"
    IMAGE_STORAGE_PROVIDER  = "gcs"
    GCS_BUCKET_NAME         = google_storage_bucket.images.name
    GCS_PROJECT_ID          = var.project_id
    GEO_PROVIDER            = var.geo_provider
    NOMINATIM_USER_AGENT    = var.nominatim_user_agent
    NEXT_PUBLIC_DEMO_MODE   = var.demo_mode ? "1" : "0"
    DEMO_MODE               = var.demo_mode ? "1" : "0"
    GOOGLE_VERTEX_PROJECT   = var.project_id
    GOOGLE_VERTEX_LOCATION  = "global"
  }

  # 通常モード用（NEXT_PUBLIC_ADMIN_MODE=0）
  env_vars = merge(local.common_env_vars, {
    NEXT_PUBLIC_ADMIN_MODE = "0"
  })

  # adminモード用（NEXT_PUBLIC_ADMIN_MODE=1）
  admin_env_vars = merge(local.common_env_vars, {
    NEXT_PUBLIC_ADMIN_MODE = "1"
  })

  # Cloud Run シークレット環境変数（Secret Manager 参照）
  secret_env_vars = {
    DATABASE_URL                 = google_secret_manager_secret.secrets["DATABASE_URL"].secret_id
    REPORT_TOKEN_SECRET          = google_secret_manager_secret.secrets["REPORT_TOKEN_SECRET"].secret_id
    LINE_CHANNEL_ACCESS_TOKEN    = google_secret_manager_secret.secrets["LINE_CHANNEL_ACCESS_TOKEN"].secret_id
    LINE_CHANNEL_SECRET          = google_secret_manager_secret.secrets["LINE_CHANNEL_SECRET"].secret_id
    YAHOO_GEOCODING_APP_ID       = google_secret_manager_secret.secrets["YAHOO_GEOCODING_APP_ID"].secret_id
    APP_URL                      = google_secret_manager_secret.secrets["APP_URL"].secret_id
    LINE_FRIEND_QR_URL           = google_secret_manager_secret.secrets["LINE_FRIEND_QR_URL"].secret_id
    LINE_FRIEND_ADD_URL          = google_secret_manager_secret.secrets["LINE_FRIEND_ADD_URL"].secret_id
  }
}
