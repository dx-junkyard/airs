# =============================================================================
# データベースパスワード
# =============================================================================

resource "random_password" "db_password" {
  length  = 32
  special = false
}

# =============================================================================
# Cloud SQL PostgreSQL 15
# =============================================================================

resource "google_sql_database_instance" "main" {
  name             = "${local.app_name}-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_autoresize   = true
    disk_size         = 10
    disk_type         = "PD_SSD"

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.main.id
      enable_private_path_for_google_cloud_services = true
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 7
      }
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = true

  depends_on = [
    google_service_networking_connection.private_vpc,
    google_project_service.apis["sqladmin.googleapis.com"],
  ]
}

# =============================================================================
# データベース・ユーザー
# =============================================================================

resource "google_sql_database" "app" {
  name     = local.app_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "app" {
  name     = local.app_name
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}
