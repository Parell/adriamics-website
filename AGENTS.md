# Working in this repository

- Treat `website/` (except generated `website/hidden/robotic-arm/`), `website/hidden/diffusion/`, `website/public.json`, root `assets/`, and `study/source/` as editable source. `website/hidden/robotic-arm/` and `public/` are generated build output; do not hand edit them. Study pages are generated directly into `public/study/`.
- Run `bun run dev` for local work. `dev.ts` performs an initial build, serves `public/` with Bun, and watches source files for incremental rebuilds. Website page, style, and asset changes rebuild the main site; study source changes run the full build.
- Use `bun run build` before deployment or when changing build scripts, sitemap generation, or study generation logic.
- Use `bun run check` to run Wrangler's deployment dry-run after a successful build. This validates the generated asset bundle without deploying it.
- The project has no test suite. Use the requested build or validation command when verification is needed.
- Keep changes focused, preserve unrelated working tree edits, and inspect `git status --short` before editing generated or widely changed files.
- Read this file and the relevant package script before changing build or watch behavior. Record any new build dependency here and in `README.md` so future work has a stable entry point.
- Project JavaScript source uses TypeScript. `typescript` and `@types/bun` are development dependencies; Bun runs project TypeScript directly; esbuild bundles browser TypeScript into generated JavaScript. KaTeX (`katex` in `devDependencies`) renders study equations at build time; the build copies its stylesheet and fonts to generated study assets. Do not hand edit generated output.
- `website/hidden/diffusion/` contains the editable browser source and page for the diffusion demo. The build bundles its TypeScript and copies the page and stylesheet to `public/hidden/diffusion/`; it never serves TypeScript source.
- `website/hidden/wave-dipole/` contains the editable Shallot 3D half-wave dipole simulation. The build uses root Vite and Shallot's `shallot()` plugin to transform and bundle it into `public/hidden/wave-dipole/`; it never serves TypeScript source. The TypeGPU transform is required for Shallot shaders. Shallot requires WebGPU in the visitor's browser.
- When `../robotics-vision-shallot` is available, the website build runs Vite into a temporary staging directory and refreshes `website/hidden/robotic-arm/`; single-repository deployment builds use the checked-in production snapshot there. The build stages both hidden projects in `public/hidden/`.
