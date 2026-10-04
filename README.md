# Adriamics

Static website for [adriamics.com](https://adriamics.com/).

## Build

Install the project dependencies, then generate the Cloudflare deployment files:

```bash
npm ci
npm run build
```

The build regenerates the study pages and combined sitemap, then creates `public/` with the corporate site and the study library under `/study/`. The directory is generated and ignored by Git.

## Cloudflare deployment

For Cloudflare Pages, use:

- Build command: `npm run build`
- Build output directory: `public`

For Wrangler, the checked-in `wrangler.jsonc` already points the static assets directory at `./public`.

Corporate site source files live in `website/`. Study content and its page generator live in `study/`; edit content under `study/source/` and run the root build command to regenerate the complete site. The root `package.json`, `build.mjs`, `wrangler.jsonc`, and generated `sitemap.xml` coordinate the shared deployment output.
