# Cloudflare infrastructure

This directory is a Terraform/OpenTofu starting point for Cloudflare resources outside the application deployment. It currently declares no production DNS, DNSSEC, redirect, cache, or security resources because the repository does not contain authoritative values or current account state.

## Prerequisites

- Terraform 1.5+ or a compatible OpenTofu release.
- A Cloudflare account and the `adriamics.com` zone already present in it.
- The target account ID and zone ID, obtained from the Cloudflare account.
- A Cloudflare API token with only the permissions needed for the resources you intentionally add. DNS work needs Zone / DNS / Edit; DNSSEC needs Zone / DNS / Edit; rulesets need the relevant Zone / Rulesets permissions (read and edit). Restrict the token to the target zone/account where Cloudflare permits it.

## Authentication and variables

Set the provider token through the environment rather than committing it:

```powershell
$env:CLOUDFLARE_API_TOKEN = "<token>"
```

The provider reads `CLOUDFLARE_API_TOKEN` directly from the environment. The required Terraform input is `account_id`; supply it with `TF_VAR_account_id` or a local, untracked `.tfvars` file. `zone_id` is needed by zone-level resources; `zone_name` defaults to `adriamics.com`. Never commit tokens, `.tfvars` containing secrets, or state files.

## Plan and apply

```bash
terraform init
terraform plan -var="account_id=<account-id>" -var="zone_id=<zone-id>"
terraform apply -var="account_id=<account-id>" -var="zone_id=<zone-id>"
```

OpenTofu can use the same files and commands by substituting `tofu` for `terraform`.

Review every plan before applying. Add concrete resources only after verifying the live zone configuration and deciding the intended ownership.

## Existing resources and ownership

Before bringing an existing DNS record, DNSSEC setting, or ruleset under IaC, import it into state using the provider's documented import identifier, then run `plan` and reconcile configuration until the plan reflects only intended changes. Back up state and review imports carefully.

Wrangler owns the Workers Static Assets application deployment and Worker custom domains `adriamics.com` and `www.adriamics.com`; Cloudflare creates/manages the corresponding application routing records. Do not recreate or import those custom-domain records into Terraform. Terraform/OpenTofu should own only separately selected DNS and zone/account resources, such as unrelated DNS records, DNSSEC, redirects, cache rules, and security rulesets.

The `.tf` files include commented provider 5.x examples, not active production resources. Replace placeholders only with verified values and reviewed desired behavior.
