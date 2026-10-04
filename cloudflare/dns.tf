# Add only DNS records that are not created and owned by a Wrangler Worker
# custom domain. Import an existing record before managing it here.
# Provider v5 resource example:
# resource "cloudflare_dns_record" "mail_example" {
#   zone_id = var.zone_id
#   name    = "mail.${var.zone_name}"
#   type    = "CNAME"
#   content = "<existing-target-from-authoritative-dns>"
#   ttl     = 1
#   proxied = false
# }
