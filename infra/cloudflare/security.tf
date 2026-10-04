# DNSSEC can be managed with cloudflare_zone_dnssec after confirming the current
# registrar DS state and importing the existing zone DNSSEC resource if present.
# resource "cloudflare_zone_dnssec" "zone" {
#   zone_id = var.zone_id
#   status  = "active"
# }

# Do not add a ruleset here if Terraform does not own that phase's existing
# Cloudflare ruleset. Use import/state adoption before changing ownership.
