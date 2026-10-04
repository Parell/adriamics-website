# Adriamics Study

Adriamics Study is a structured library of mathematics, physics, and engineering lessons and practice problems. It is intended as a practical review workspace, not a substitute for course instruction or professional engineering review.

## Source and generated pages

- `source/` contains lesson and problem Markdown, the topic manifest, and prerequisite graph.
- `study.css` and `study.js` contain the shared study interface.
- `webmeji/` contains the locally hosted optional companion.
- `vendor/mathjax/` contains the local MathJax runtime used to typeset equations.
- `../public/study/` is generated deployment output. Edit source files instead of generated HTML.

## Build

Run commands from the repository root:

```bash
npm ci
npm run build:study
```

`npm run build:study` validates that manifest entries point to source notes, generates lesson and practice pages, builds the search index, and updates the combined sitemap in `public/`. `npm run build` also stages the main website and shared assets for deployment.

The full build is also available while developing:

```bash
npm run dev
```

The local server watches source files and rebuilds the affected output. See the repository [AGENTS.md](../AGENTS.md) for source/output boundaries and workflow details.

## Contributing

Keep changes focused and edit files under `source/`. Good contributions include correcting unclear explanations, adding a worked example or practice problem, checking a page against cited sources, or improving an interactive visualization. Avoid editing generated HTML by hand.
