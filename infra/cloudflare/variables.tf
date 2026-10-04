variable "account_id" {
  description = "Cloudflare account ID containing the managed zone."
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID for adriamics.com. Set this only when adding zone-scoped resources."
  type        = string
  default     = ""
}

variable "zone_name" {
  description = "DNS zone name."
  type        = string
  default     = "adriamics.com"
}
