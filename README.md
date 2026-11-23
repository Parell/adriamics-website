# Adriamics

Static website for [adriamics.com](https://adriamics.com/). The repository is the source of truth for the site build and its Cloudflare configuration.

## Local build

Use Bun 1.4.0 or newer for dependency installation, development, builds, and deployment checks. The checked-in lockfile uses Bun's lockfile format version 2, introduced in Bun 1.4.

```bash
bun install --frozen-lockfile
bun run build
```

The build removes the old `public/` directory, renders the main site from `website/` and its public project registry (`website/public.json`), builds the sibling `robotics-vision-shallot` app into a temporary staging directory when its source is available, then refreshes `website/hidden/robotic-arm/` without disturbing other hidden projects. It copies those hidden projects to `public/hidden/`, bundles the editable diffusion and 3D wave-dipole TypeScript into their served JavaScript files, copies the shared favicon and homepage carousel images from root `assets/`, then generates study pages, search data, and the combined sitemap directly in `public/`. The arm production bundle is checked in so single-repository Cloudflare builds can use it without the sibling source checkout. There is no generated study-site copy inside `study/`; `study/source/` is the editable content source. Cloudflare receives only `public/`, which is ignored by Git.

The editable JavaScript implementation is TypeScript. Bun runs the build and development scripts, and TypeScript (`typescript` in `devDependencies`) checks the build tooling and study manifest with `bun run typecheck`. esbuild (`esbuild` in `devDependencies`) bundles browser TypeScript into the JavaScript files served from `public/`. The 3D dipole page uses `@dylanebert/shallot` 0.10.3 and Vite (`vite` in `devDependencies`); its build uses Shallot's `shallot()` plugin so the required TypeGPU shader transform runs. The browser simulation requires WebGPU. KaTeX (`katex` in `devDependencies`) renders study equations to HTML during page generation; the build copies KaTeX's stylesheet and fonts into `public/study/katex/`.

When the build succeeds, the last line reports the full path to the generated `public/` directory. Run `bun run build` whenever you only need to refresh those files.

## Local server

```bash
bun run dev
```

`bun run dev` builds the site, serves `public/` with Bun at `http://localhost:8787`, and watches source files for incremental rebuilds. Open the main site at `/`, study content at `/study/`, the Robotics Vision Lab at `/hidden/robotic-arm/`, the interactive diffusion demo at `/hidden/diffusion/`, and the 3D dipole simulation at `/hidden/wave-dipole/`. Leave the terminal running while you browse; press `Ctrl+C` to stop the server and watcher.

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
- `website/hidden/robotic-arm/` contains generated production files for the sibling `robotics-vision-shallot` project, served at `/hidden/robotic-arm/` and rebuilt in isolated staging as part of the website build.
- `website/hidden/diffusion/` contains editable HTML, CSS, and TypeScript for the browser based heat diffusion demo, served at `/hidden/diffusion/`; the build bundles TypeScript and excludes it from served files.
- `website/hidden/wave-dipole/` contains editable HTML, CSS, and TypeScript for the Shallot based half-wave dipole simulation, served at `/hidden/wave-dipole/`; the website build bundles it with Vite and Shallot's TypeGPU transform plugin, and the simulation requires WebGPU.
- `assets/` contains source assets; the build copies the shared favicon and the three homepage feature-carousel images to `public/assets/`.
- `study/` contains study source content and its page generator, served at `/study/`.
- `build.ts` combines both into generated `public/` output.
- `wrangler.jsonc` configures the Cloudflare Workers Static Assets deployment.
