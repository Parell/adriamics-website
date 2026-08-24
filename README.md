# Adriamics

Static website for [adriamics.com](https://adriamics.com/).

## Build

Install the project dependencies, then generate the Cloudflare deployment files:

```bash
npm ci
npm run build
```

The build first regenerates the minified CSS and JavaScript assets, then creates `public/`, containing only the files that should be served publicly. The directory is generated and ignored by Git.

## Cloudflare deployment

For Cloudflare Pages, use:

- Build command: `npm run build`
- Build output directory: `public`

For Wrangler, the checked-in `wrangler.jsonc` already points the static assets directory at `./public`.

The source files remain at the repository root; `build.mjs` copies the required HTML, styles, scripts, assets, legal pages, and deployment metadata into `public/`.

The [Adriamics Study](https://github.com/Parell/parell.github.io/tree/master/study) project is maintained separately.
