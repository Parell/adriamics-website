# Adriamics

Static website for [adriamics.com](https://adriamics.com/). The repository is the source of truth for the site build and its Cloudflare configuration.

## Local build

Use Bun 1.4.0 or newer for dependency installation, development, builds, and deployment checks. The checked-in lockfile uses Bun's lockfile format version 2, introduced in Bun 1.4.

```bash
bun install --frozen-lockfile
bun run build
```

The build removes the old `public/` directory, renders the main site from `website/` and its public project registry (`website/public.json`), builds the sibling `robotics-vision-shallot` app into `website/hidden/` when its source is available, copies that production bundle to `public/hidden/`, copies the shared favicon and homepage carousel images from root `assets/`, then generates study pages, search data, and the combined sitemap directly in `public/`. The production bundle is checked in so single-repository Cloudflare builds can use it without the sibling source checkout. There is no generated study-site copy inside `study/`; `study/source/` is the editable content source. Cloudflare receives only `public/`, which is ignored by Git.

The editable JavaScript implementation is TypeScript. Bun runs the build and development scripts, and TypeScript (`typescript` in `devDependencies`) checks the build tooling and study manifest with `bun run typecheck`. esbuild (`esbuild` in `devDependencies`) bundles browser TypeScript into the JavaScript files served from `public/`. KaTeX (`katex` in `devDependencies`) renders study equations to HTML during page generation; the build copies KaTeX's stylesheet and fonts into `public/study/katex/`.

When the build succeeds, the last line reports the full path to the generated `public/` directory. Run `bun run build` whenever you only need to refresh those files.

## Local server

```bash
bun run dev
```

`bun run dev` builds the site, serves `public/` with Bun at `http://localhost:8787`, and watches source files for incremental rebuilds. Open the main site at `/`, study content at `/study/`, and the Robotics Vision Lab at `/hidden/`. Leave the terminal running while you browse; press `Ctrl+C` to stop the server and watcher.

The development watcher rebuilds the main website pages, styles, and assets without regenerating every study page. Changes under `study/source/` still run the full build because study pages, search data, and the sitemap are generated together. Build script changes also run the full build. Refresh the browser after the watcher reports completion.

`bun run build:website` refreshes the main site while keeping the existing generated study pages. Run `bun run build` first when the generated study output is missing or stale.

Codex and other contributors should read [AGENTS.md](AGENTS.md) first for source/output boundaries and build workflow.

## Local/deployment validation

```bash
bun run check
```

`bun run check` builds the latest sources and runs Wrangler's deployment dry-run against the generated `public/` output and `wrangler.jsonc`.

## Production deploy

```bash
bun run deploy
```

`bun run deploy` builds the latest sources before deploying the static-assets-only Worker. Production deployment is manual; the pull request workflow only builds and runs a deployment dry-run.

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
- `website/hidden/` contains generated production files for the sibling `robotics-vision-shallot` project, served at `/hidden/` and rebuilt as part of the website build.
- `assets/` contains source assets; the build copies the shared favicon and the three homepage feature-carousel images to `public/assets/`.
- `study/` contains study source content and its page generator, served at `/study/`.
- `build.ts` combines both into generated `public/` output.
- `wrangler.jsonc` configures the Cloudflare Workers Static Assets deployment.
