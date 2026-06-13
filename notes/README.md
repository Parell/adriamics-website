<p align="center">
  <a href="https://adriamics.com/notes/">
    <img src="..\assets\adriamics-logo.png" alt="Adriamics" width="480" />
  </a>
</p>

<h1 align="center">The <b>Universal Education System</b></h1>

UES Notes is a technical study library for math, physics, engineering and hopfully more.
It is designed as a practical review workspace, with focused subject notes, practice pages, and guided learning paths.

## What This Is

This project is not a textbook and it is not a general blog.
It is a structured set of study pages that help you:

- **If Education is truly Universal then everyone can be a expert, even you, what matter is if you can prove it with rigor or not.**
- No history or empty words just straight learning
- Move from fundamentals to more advanced topics in a predictable order
- Review a single concept without digging through a full site
- Practice with topic-specific problem sets
- Follow learning paths when you want a guided sequence instead of browsing randomly

## Layout

The site is organized into four top-level areas:

```
parell.github.io/
├── notes/
│   ├── paths/      
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
node build-notes.mjs
```

That command regenerates the notes pages, practice pages, learning paths, search index, and sitemap.

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

<!-- - Reddit study/STEM communities, Professors/TAs, Find Student orgs -->
- Turn your paths into your main differentiator. Add progress, “next lesson,” and prerequisite links on every note.
- Add PhET simulations for gas laws, its under CC and about 175,Worked examples with Full answer key in notes Students trust resources that show process, not just formulas, beter labeling of variables in functions 
    - Do the ideal gas interactive one but have the heat added be changeable visually so that you can make a turbine a rocket engine or a car engine with the same simulator.

- Directed Acyclic Graph?
  - Prerequisites: fractions, decimals
  You are learning: percent increase
  Used later in: interest, error analysis, thermodynamics efficiency
  Practice: 6 problems
  - title: Limits
    - prerequisites:
      - Functions
      - Algebra
      - Trigonometry
    - leads_to:
      - Derivatives
      - Integrals

- Better homepage hero.
    - Subject cards with progress/path indicators.
    - “Popular starting points.”
    - “What can I learn here today?”
    - Featured interactive tools.
    - Featured practice sets.
    - Cleaner typography spacing around tables and formulas.
    - More visual hierarchy between H1, H2, H3, examples, formulas, warnings, and practice links.

  - Paths should be generated based on a search like DAG structure maybe with meta data?
  - Contribute should be moved to a CONTRIBUTIONS file under .github and be linked to
    - "The Problem Knowledge has been organized for a long time. Just not for you. "
