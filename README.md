# Adriamics

Static website for [adriamics.com](https://adriamics.com/).

## Build

Install the project dependencies, then generate the Cloudflare deployment files:

```bash
npm ci
npm run build
```

The build regenerates the study pages and combined sitemap, then creates `public/` with the main site and the study library under `/study/`. The directory is generated and ignored by Git.

## Cloudflare deployment

For Cloudflare Pages, use:

- Build command: `npm run build`
- Build output directory: `public`

For Wrangler, the checked-in `wrangler.jsonc` already points the static assets directory at `./public`.

Main site source files remain at the repository root. Study content and its page generator live in `study/`; edit content under `study/source/` and run the same root build command to regenerate the complete site.
