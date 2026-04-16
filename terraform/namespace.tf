resource "kubernetes_namespace" "cide_app" {
  metadata {
    name = "cide-app"
  }
}
