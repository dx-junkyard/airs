# =============================================================================
# Cloud Run v2 サービス
# =============================================================================

resource "google_cloud_run_v2_service" "app" {
  provider = google-beta

  name                = local.app_name
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.cloudrun.email
    timeout         = "${var.cloudrun_request_timeout}s"

    scaling {
      min_instance_count = var.cloudrun_min_instances
      max_instance_count = var.cloudrun_max_instances
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}/${local.app_name}:latest"

      resources {
        limits = {
          cpu    = var.cloudrun_cpu
          memory = var.cloudrun_memory
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      # 平文環境変数
      dynamic "env" {
        for_each = local.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      # Secret Manager 環境変数
      dynamic "env" {
        for_each = local.secret_env_vars
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      ports {
        container_port = 3000
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      startup_probe {
        http_get {
          path = "/api/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/api/health"
        }
        period_seconds = 30
      }
    }
  }

  depends_on = [
    google_project_service.apis["run.googleapis.com"],
    google_secret_manager_secret_version.secrets,
  ]
}

# =============================================================================
# Cloud Run v2 admin サービス
# =============================================================================

resource "google_cloud_run_v2_service" "admin" {
  provider = google-beta

  name                = local.app_name_admin
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.cloudrun.email
    timeout         = "${var.cloudrun_request_timeout}s"

    scaling {
      min_instance_count = var.cloudrun_min_instances
      max_instance_count = var.cloudrun_max_instances
    }

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}/${local.app_name_admin}:latest"

      resources {
        limits = {
          cpu    = var.cloudrun_cpu
          memory = var.cloudrun_memory
        }
        cpu_idle          = true
        startup_cpu_boost = true
      }

      # 平文環境変数
      dynamic "env" {
        for_each = local.admin_env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      # Secret Manager 環境変数
      dynamic "env" {
        for_each = local.secret_env_vars
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }

      ports {
        container_port = 3000
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      startup_probe {
        http_get {
          path = "/api/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/api/health"
        }
        period_seconds = 30
      }
    }
  }

  depends_on = [
    google_project_service.apis["run.googleapis.com"],
    google_secret_manager_secret_version.secrets,
  ]
}

# =============================================================================
# 公開アクセス（Web UI + LINE Webhook）
# =============================================================================

resource "google_cloud_run_v2_service_iam_member" "public" {
  provider = google-beta

  name     = google_cloud_run_v2_service.app.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "admin_public" {
  provider = google-beta

  name     = google_cloud_run_v2_service.admin.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
