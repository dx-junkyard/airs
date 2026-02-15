# =============================================================================
# Cloud Run ドメインマッピング
# =============================================================================

resource "google_cloud_run_domain_mapping" "app" {
  count    = var.custom_domain != "" ? 1 : 0
  provider = google-beta

  name     = var.custom_domain
  location = var.region

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.app.name
  }

  depends_on = [
    google_cloud_run_v2_service.app,
    google_cloud_run_v2_service_iam_member.public,
  ]
}

resource "google_cloud_run_domain_mapping" "admin" {
  count    = var.admin_custom_domain != "" ? 1 : 0
  provider = google-beta

  name     = var.admin_custom_domain
  location = var.region

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.admin.name
  }

  depends_on = [
    google_cloud_run_v2_service.admin,
    google_cloud_run_v2_service_iam_member.admin_public,
  ]
}
