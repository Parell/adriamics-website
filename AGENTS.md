# Working in this repository

- Treat `website/`, `website/public.json`, root `assets/`, and `study/source/` as editable source. `public/` is generated build output; do not hand edit it. Study pages are generated directly into `public/study/`.
- Run `npm run dev` for local work. `dev.mjs` performs an initial build, serves `public/` through Wrangler, and watches source files for incremental rebuilds. Website page, style, and asset changes rebuild the main site; study source changes run the full build.
- Use `npm run build` before deployment or when changing build scripts, sitemap generation, or study generation logic.
- Use `npm run check` to run Wrangler's deployment dry-run after a successful build. This validates the generated asset bundle without deploying it.
- The project has no test suite. Use the requested build or validation command when verification is needed.
- Keep changes focused, preserve unrelated working tree edits, and inspect `git status --short` before editing generated or widely changed files.
- Read this file and the relevant package script before changing build or watch behavior. Record any new build dependency here and in `README.md` so future work has a stable entry point.
- The homepage hero sphere uses the `three` runtime dependency and `esbuild` build dependency declared in `package.json`; `build.mjs` bundles the editable `website/hero-sphere.js` into generated `public/hero-sphere.js` and includes the Three.js license notice under `public/vendor/`. Do not hand edit generated output.
