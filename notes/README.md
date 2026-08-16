<p align="center">
  <a href="https://adriamics.com/notes/">
    <img src="..\assets\adriamics-logo.webp" alt="Adriamics" width="480" />
  </a>
</p>

<h1 align="center"><b>Universal Education</b> by Adriamics</h1>

UE Notes is a technical study library for math, physics, engineering and hopfully more.
It is designed as a practical review workspace, with focused subject notes, practice pages, and prerequisite maps.

## What This Is

This project is not a textbook.

It is a structured study system designed to help you learn concepts in order, review individual topics, practice with focused problem sets, and follow prerequisite maps.

No filler. No empty history. Just direct learning, rigorous reasoning, and proof of understanding.

If education is truly universal, then anyone can become an expert. What matters is not where you start, but whether you can prove what you understand with rigor.


## Layout

The site is organized into four top-level areas:

```
parell.github.io/
├── notes/
│   ├── source/     One place to update the structure of notes
│   ├── subjects/   HTML generated using the power of a build script
│   ├── index.html  The main site introduction
│   └── README.md   
└── .github/
    ├── ISSUE_TEMPLATE/
    ├── PULL_REQUEST_TEMPLATE.md
    ├── CODEOWNERS
    └── FUNDING.yml
```

**How It Works**

The site is generated from the content in `source/` and the site structure defined in `source/manifest.js`.
When notes or problem sets change, rebuild the site so the generated pages, search index, and sitemap stay in sync. Everything done with markdown files.

## Build

From the repository root:

```bash
node notes/build-notes.mjs
```

That command regenerates the notes pages, practice pages, concept maps, search index, and sitemap.

To install the build dependency:


```bash
npm install
npm run build:notes
```

## Contributing

See [Contribute](/notes/subjects/hidden/contribute/) for the preferred way to help.

Good contributions are small and specific:

- Fix a typo or unclear explanation
- Add one worked example
- Add a few practice problems
- Review a page for correctness
- Improve or add an interactive visualization
- Suggest a missing topic or course mapping

## Roadmap

- Try doing advertising in light mode
- Thermodynamic tables and plots
- Do the ideal gas interactive one but have the heat added be changeable visually so that you can make a turbine a rocket engine or a car engine with the same simulator.
- Professors/TAs, Find Student orgs
  
- Instrument cantilever beam: strain gauges, circuits, DAQ, uncertainty, fatigue.
- Build temperature control system: heat transfer, sensors, embedded control, parameter estimation.
- Build two-wheel robot: dynamics, kinematics, motors, encoders, state-space control.
- Run wind-tunnel/pipe-flow study: fluids, dimensional analysis, CFD, experiment design, metrology.
- Model satellite attitude control: rigid-body dynamics, quaternions, sensors, estimation, digital control.
- Analyze component failure: materials, manufacturing, fracture, reliability, safety.