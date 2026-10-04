<p align="center">
  <a href="https://adriamics.com/study/">
    <img src="assets\adriamics-logo.webp" alt="Adriamics" width="480" />
  </a>
</p>

<h1 align="center"><b>Adriamics Study</b></h1>

Adriamics Study is a technical study library for math, physics, engineering and hopefully more.
It is designed as a practical review workspace, with focused subject notes, practice pages, and prerequisite maps.

## What This Is

This project is not a textbook.

It is a structured study system designed to help you learn concepts in order, review individual topics, practice with focused problem sets, and follow prerequisite maps.

No filler. No empty history. Just direct learning, rigorous reasoning, and proof of understanding.

If education is truly universal, then anyone can become an expert. What matters is not where you start, but whether you can prove what you understand with rigor.


## Layout

The site is organized into four top-level areas:

```
adriamics-study/
├── source/       One place to update the structure of study content
├── math/         Generated mathematics pages
├── physics/      Generated physics pages
├── engineering/  Generated engineering pages
├── public/study/ Cloudflare deployment output (generated, ignored)
└── index.html    The main study introduction
```

**How It Works**

The site is generated from the content in `source/`, the site structure in
`source/manifest.js`, and the prerequisite graph in `source/paths.json`.
When notes, problem sets, or site structure change, rebuild the site so the
generated pages, search index, and sitemap stay in sync. Markdown files hold
the lesson and practice content; JavaScript and JSON files define the site
structure and prerequisite relationships.

## Build

Run these commands from the `adriamics-website/` repository root:

```bash
npm install
npm run build
```

`npm run build` is the complete site build. It regenerates the study pages and combined sitemap, then stages the main site and study library in `public/`:

| Command               | Purpose                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build:notes` | Reads `study/source/`, validates the manifest, and regenerates lesson pages, practice pages, landing pages, concept maps, and `search-index.json`.                 |
| `npm run build`       | Regenerates the study library and stages the complete site in `public/`; use this after normal content or code changes.                                          |

If only lesson content, practice problems, the manifest, or prerequisite
paths changed, regenerate the study pages directly:

```bash
node study/build-notes.mjs
```

The build scripts do not provide command-line flags. They overwrite generated
files in the repository, so edit files under `study/source/` rather than
editing generated HTML by hand.

## Contributing

See [Contribute](/study/hidden/contribute/) for the preferred way to help.

Good contributions are small and specific:

- Fix a typo or unclear explanation
- Add one worked example
- Add a few practice problems
- Review a page for correctness
- Improve or add an interactive visualization
- Suggest a missing topic or course mapping

## Roadmap
- Instrument cantilever beam: strain gauges, circuits, DAQ, uncertainty, fatigue.
- Build temperature control system: heat transfer, sensors, embedded control, parameter estimation.
- Build two-wheel robot: dynamics, kinematics, motors, encoders, state-space control.
- Run wind-tunnel/pipe-flow study: fluids, dimensional analysis, CFD, experiment design, metrology.
- Model satellite attitude control: rigid-body dynamics, quaternions, sensors, estimation, digital control.
- Analyze component failure: materials, manufacturing, fracture, reliability, safety.
---
- Professors/TAs, Find Student orgs
