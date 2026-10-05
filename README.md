# Adriamics

Static website for [adriamics.com](https://adriamics.com/). The repository is the source of truth for the site build and its Cloudflare configuration.

## Local build

```bash
npm ci
npm run build
```

The build removes the old `public/` directory, renders the main site from `website/` and its public project registry (`website/public.json`), copies the shared favicon and homepage carousel images from root `assets/`, then generates study pages, search data, and the combined sitemap directly in `public/`. There is no generated study-site copy inside `study/`; `study/source/` is the editable content source. Cloudflare receives only `public/`, which is ignored by Git.

The homepage hero sphere uses Three.js (`three` in `package.json`), bundled for browsers by esbuild (`esbuild` in `devDependencies`). The editable entry point is `website/hero-sphere.js`; `build.mjs` bundles it into generated `public/hero-sphere.js` and includes the Three.js license notice under `public/vendor/`.

When the build succeeds, the last line reports the full path to the generated `public/` directory. You can run `npm.cmd run build` by itself whenever you only need to refresh those files.

## Local server

```bash
npm run dev
```

`npm run dev` builds the site, serves `public/` through Wrangler at `http://localhost:8787`, and watches source files for incremental rebuilds. Open the main site at `/` and study content at `/study/`. Leave the terminal running while you browse; press `Ctrl+C` to stop the server and watcher.

The development watcher rebuilds the main website pages, styles, and assets without regenerating every study page. Changes under `study/source/` still run the full build because study pages, search data, and the sitemap are generated together. Build script changes also run the full build. Refresh the browser after the watcher reports completion.

`npm run build:website` refreshes the main site while keeping the existing generated study pages. Run `npm run build` first when the generated study output is missing or stale.

Codex and other contributors should read [AGENTS.md](AGENTS.md) first for source/output boundaries and build workflow.

## Local/deployment validation

```bash
npm run check
```

`npm run check` builds the latest sources and runs Wrangler's deployment dry-run against the generated `public/` output and `wrangler.jsonc`.

## Production deploy

```bash
npm run deploy
```

`npm run deploy` builds the latest sources before deploying the static-assets-only Worker. Production deployment is manual; the pull request workflow only builds and runs a deployment dry-run.

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
- `assets/` contains source assets; the build copies the shared favicon and the three homepage feature-carousel images to `public/assets/`.
- `study/` contains study source content and its page generator, served at `/study/`.
- `build.mjs` combines both into generated `public/` output.
- `wrangler.jsonc` configures the Cloudflare Workers Static Assets deployment.
