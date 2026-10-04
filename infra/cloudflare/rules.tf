# Add rulesets only after reviewing existing zone/account rulesets and importing
# any existing ruleset that should become Terraform-owned.
# Example Cloudflare provider 5.x zone ruleset:
# resource "cloudflare_ruleset" "example_redirects" {
#   zone_id     = var.zone_id
#   name        = "Example redirects"
#   description = "Placeholder only; replace with reviewed production rules."
#   kind        = "zone"
#   phase       = "http_request_dynamic_redirect"
#   rules       = []
# }

# Cache rules use the http_request_cache_settings phase; security rules commonly
# use http_request_firewall_custom. Define concrete expressions/actions only
# after the desired behavior and current Cloudflare configuration are known.
