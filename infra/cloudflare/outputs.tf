output "zone_id" {
  description = "Configured Cloudflare zone ID (empty until supplied)."
  value       = var.zone_id
}

output "zone_name" {
  description = "Configured Cloudflare zone name."
  value       = var.zone_name
}
