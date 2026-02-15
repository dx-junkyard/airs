# =============================================================================
# 出力値
# =============================================================================

output "cloud_run_url" {
  description = "Cloud Run サービス URL"
  value       = google_cloud_run_v2_service.app.uri
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL 接続名（Auth Proxy 用）"
  value       = google_sql_database_instance.main.connection_name
}

output "artifact_registry_url" {
  description = "Artifact Registry リポジトリ URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}"
}

output "gcs_images_bucket" {
  description = "画像ストレージバケット名"
  value       = google_storage_bucket.images.name
}

output "service_account_email" {
  description = "Cloud Run サービスアカウント"
  value       = google_service_account.cloudrun.email
}

output "cloud_run_admin_url" {
  description = "Cloud Run admin サービス URL"
  value       = google_cloud_run_v2_service.admin.uri
}

output "custom_domain_dns_records" {
  description = "カスタムドメインに必要な DNS レコード"
  value = var.custom_domain != "" ? [
    for record in google_cloud_run_domain_mapping.app[0].status[0].resource_records :
    {
      type  = record.type
      name  = record.name
      value = record.rrdata
    }
  ] : []
}

output "admin_custom_domain_dns_records" {
  description = "admin カスタムドメインに必要な DNS レコード"
  value = var.admin_custom_domain != "" ? [
    for record in google_cloud_run_domain_mapping.admin[0].status[0].resource_records :
    {
      type  = record.type
      name  = record.name
      value = record.rrdata
    }
  ] : []
}
