# =============================================================================
# Artifact Registry（Docker イメージ）
# =============================================================================

resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = local.app_name
  format        = "DOCKER"
  description   = "AIRS アプリケーション Docker イメージ"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"

    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [google_project_service.apis["artifactregistry.googleapis.com"]]
}
