# Adriamics

Static website for [adriamics.com](https://adriamics.com/). The repository is the source of truth for the site build and its Cloudflare configuration.

## Local build

```bash
npm ci
npm run build
```

The build removes the old `public/` directory, renders the main site from `website/` and its public project registry (`website/public.json`), copies shared assets from root `assets/`, then generates study pages, search data, and the combined sitemap directly in `public/`. There is no generated study-site copy inside `study/`; `study/source/` is the editable content source. Cloudflare receives only `public/`, which is ignored by Git.

When the build succeeds, the last line reports the full path to the generated `public/` directory. You can run `npm.cmd run build` by itself whenever you only need to refresh those files.

## Local server

```bash
npm run dev
```

`npm run dev` builds the site, serves `public/` through Wrangler at `http://localhost:8787`, and watches source files for incremental rebuilds. Open the main site at `/` and study content at `/study/`. Leave the terminal running while you browse; press `Ctrl+C` to stop the server and watcher.

The development watcher rebuilds the main website pages, styles, and assets without regenerating every study page. Changes under `study/source/` still run the full build because study pages, search data, and the sitemap are generated together. Build script changes also run the full build. Refresh the browser after the watcher reports completion.

Codex and other contributors should read [AGENTS.md](AGENTS.md) first for source/output boundaries and build workflow.

## Local/deployment validation

```bash
npm run build
npm run check
```

`npm run check` runs Wrangler's deployment dry-run using the existing `public/` output and `wrangler.jsonc`.

## Production deploy

```bash
npm run build
npm run deploy
```

`npm run deploy` deploys the existing `public/` output as the static-assets-only Worker. Build first whenever you want to deploy updated source. The GitHub Actions deploy workflow runs on pushes to `master` and can also be started manually. Configure these repository secrets before using it:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The token should have only the permissions needed to deploy Workers and manage the Worker custom domains for the target account and zone.

## Cloudflare ownership

Wrangler owns the Workers Static Assets deployment, application configuration, and the `adriamics.com` and `www.adriamics.com` Worker custom domains. Terraform/OpenTofu is reserved for other Cloudflare infrastructure, such as DNS records not owned by those custom domains, DNSSEC, redirects, cache rules, and security rulesets. Do not declare the Worker custom-domain DNS records a second time in Terraform.

Infrastructure changes are planned and applied deliberately:

```bash
cd cloudflare
terraform init
terraform plan
terraform apply
```

OpenTofu is also supported by the configuration (`tofu init`, `tofu plan`, `tofu apply`). Review [cloudflare/README.md](cloudflare/README.md) before managing existing Cloudflare resources.

## Source layout

- `website/` contains the main website served at `/`; `website/public.json` is the deliberately curated public project registry used to render its navigation, project sequence, and status strip.
- `assets/` contains shared website and study assets copied to `/assets/`.
- `study/` contains study source content and its page generator, served at `/study/`.
- `build.mjs` combines both into generated `public/` output.
- `wrangler.jsonc` configures the Cloudflare Workers Static Assets deployment.
