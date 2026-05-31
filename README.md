# parell.github.io

Build the site from the repository root with:

```powershell
node notes/build-notes.mjs
```

Debating if I should use github for all these systems?
- legal/safety systems
- Github contributions?
- Add timer moveable on website
- Better explanations with diagrams and simulations generate each individually
- Interactive calculators

STEM topics need visual support:

Force diagrams
Graph animations
Circuit diagrams
Organic reaction mechanisms
Thermodynamic cycle plots
Vector field visualizations
Interactive sliders for formulas




- Dataset tab for needed practice sections

Build the static note pages, catalog, search index, practice pages, and sitemap with `node notes/build-notes.mjs` after changing Markdown notes or their manifest.

Notes live in per-topic folders under `notes/subjects/...`, and each note source file must match its folder name, for example `notes/subjects/math/algebra/algebra.md`.






Level 1 — Direct Practice

The student’s task is mostly:
“Can I perform this method?”

Examples:
Math: Solve 3x+5=17
Chemistry: Calculate molar mass of H2SO4
Physics: Use F=ma directly
Biology: Identify the organelle from a description

Level 2 — Integrated Practice

The task is:
“Can I connect related ideas?”

Examples:
Math: Solve an equation requiring fractions + distribution
Chemistry: Stoichiometry with molar mass + mole ratio
Physics: Kinematics problem requiring two equations
Biology: Connect DNA → RNA → protein

Level 3 — Applied Problems

The task is:
“Can I recognize what concept applies?”

Examples:
Math: Word problem leading to an equation
Chemistry: Lab scenario involving limiting reagent
Physics: Real object moving down a ramp
Biology: Predict outcome of a mutation

Level 4 — Challenge / Synthesis

The task is:
“Can I reason through something unfamiliar?”

Examples:
Math: Derive a formula or solve a tricky mixed problem
Chemistry: Explain competing reaction outcomes
Physics: Multi-concept problem with assumptions
Biology: Analyze an experimental result
