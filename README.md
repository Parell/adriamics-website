# Adriamics

Static website for [adriamics.com](https://adriamics.com/). The repository is the source of truth for the site build and its Cloudflare configuration.

## Local build

```bash
npm ci
npm run build
```

The build regenerates the study pages and combined `sitemap.xml`, then creates `public/` with the main website at `/` and the study library at `/study/`. Cloudflare receives only this generated output. `public/` is ignored by Git.

## Local/deployment validation

```bash
npm run check
```

This builds the site and runs Wrangler's deployment dry-run using `wrangler.jsonc`.

## Production deploy

```bash
npm run deploy
```

This builds and deploys the static-assets-only Worker. The GitHub Actions deploy workflow runs on pushes to `master` and can also be started manually. Configure these repository secrets before using it:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The token should have only the permissions needed to deploy Workers and manage the Worker custom domains for the target account and zone.

## Cloudflare ownership

Wrangler owns the Workers Static Assets deployment, application configuration, and the `adriamics.com` and `www.adriamics.com` Worker custom domains. Terraform/OpenTofu is reserved for other Cloudflare infrastructure, such as DNS records not owned by those custom domains, DNSSEC, redirects, cache rules, and security rulesets. Do not declare the Worker custom-domain DNS records a second time in Terraform.

Infrastructure changes are planned and applied deliberately:

```bash
cd infra/cloudflare
terraform init
terraform plan
terraform apply
```

OpenTofu is also supported by the configuration (`tofu init`, `tofu plan`, `tofu apply`). Review [infra/cloudflare/README.md](infra/cloudflare/README.md) before managing existing Cloudflare resources.

## Source layout

- `website/` contains the main website served at `/`.
- `study/` contains study source content and its page generator, served at `/study/`.
- `build.mjs` combines both into generated `public/` output.
- `wrangler.jsonc` configures the Cloudflare Workers Static Assets deployment.
