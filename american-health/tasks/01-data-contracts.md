# 01 Data Contracts

Read first:
1. `american-health/Todo.md`
2. `american-health/tasks/00-shell.md`
3. `README.md`

- Goal: Lock the local data model and build pipeline before any feature work depends on it.
- Build: Define the local JSON files under `american-health/public/data/`: `latest.json`, `history.json`, `calculated.json`, `sources.json`, and `assumptions.json`.
- Build: Define normalized raw inputs and cached source files under `american-health/data/`.
- Build: Add or shape build scripts under `american-health/scripts/` so raw source data is fetched, normalized, validated, and written into local JSON only.
- Build: Standardize the loader shape in `american-health/src/main.mjs` so the browser reads only local files.
- Build: Keep all browser data access local: the client may `fetch()` only files under `/data/`.
- Build: Include the validation rules from the todo note: positive spending, GDP share within range, sponsor shares near 1, no year regression, source metadata on charted values, and explicit model labels on estimates.
- Done when: The site has a clear local data schema and pipeline.
- Done when: There is a documented assumptions manifest and source manifest.
- Done when: No browser-side external API calls are required.
