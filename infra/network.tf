# =============================================================================
# VPC ネットワーク
# =============================================================================

resource "google_compute_network" "main" {
  name                    = "${local.app_name}-vpc"
  auto_create_subnetworks = false
  project                 = var.project_id

  depends_on = [google_project_service.apis["compute.googleapis.com"]]
}

resource "google_compute_subnetwork" "main" {
  name          = "${local.app_name}-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.main.id
}

# =============================================================================
# Private Services Access（Cloud SQL プライベート IP 用）
# =============================================================================

resource "google_compute_global_address" "private_ip_range" {
  name          = "${local.app_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "private_vpc" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]

  depends_on = [google_project_service.apis["servicenetworking.googleapis.com"]]
}

# =============================================================================
# Serverless VPC Access コネクタ（Cloud Run → VPC）
# =============================================================================

resource "google_vpc_access_connector" "main" {
  name          = "${local.app_name}-vpc-cx"
  region        = var.region
  network       = google_compute_network.main.name
  ip_cidr_range = "10.8.0.0/28"
  min_instances = 2
  max_instances = 3

  depends_on = [google_project_service.apis["vpcaccess.googleapis.com"]]
}
