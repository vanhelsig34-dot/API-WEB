resource "kubernetes_persistent_volume_claim" "db_pvc" {
  metadata {
    name      = "db-pvc"
    namespace = kubernetes_namespace.cide_app.metadata[0].name
  }

  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "1Gi"
      }
    }
  }
}
