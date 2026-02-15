# =============================================================================
# Secret Manager
# =============================================================================

locals {
  secrets = {
    DATABASE_URL = {
      data = local.database_url
    }
    REPORT_TOKEN_SECRET = {
      data = var.report_token_secret
    }
    LINE_CHANNEL_ACCESS_TOKEN = {
      data = var.line_channel_access_token
    }
    LINE_CHANNEL_SECRET = {
      data = var.line_channel_secret
    }
    YAHOO_GEOCODING_APP_ID = {
      data = var.yahoo_geocoding_app_id
    }
    APP_URL = {
      data = "https://${var.custom_domain}"
    }
    LINE_FRIEND_QR_URL = {
      data = var.line_friend_qr_url
    }
    LINE_FRIEND_ADD_URL = {
      data = var.line_friend_add_url
    }
  }
}

resource "google_secret_manager_secret" "secrets" {
  for_each = local.secrets

  secret_id = "${local.app_name}-${each.key}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis["secretmanager.googleapis.com"]]
}

resource "google_secret_manager_secret_version" "secrets" {
  for_each = local.secrets

  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = each.value.data
}
