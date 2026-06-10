# 03 Dashboard and Charts

Read first:
1. `american-health/Todo.md`
2. `american-health/tasks/01-data-contracts.md`
3. `american-health/tasks/02-home-explainer.md`

- Goal: Add the data dashboard and chart surfaces that show the current system, the benchmark comparison, and the rollout sequence.
- Build: Implement chart rendering in `american-health/src/charts.mjs` using SVG and plain JavaScript, not a chart dependency.
- Build: Add the dashboard cards for U.S. health spending, GDP share, Medicare, Medicaid, out-of-pocket spending, federal share, state/local share, Singapore benchmark, reform target, and estimated savings.
- Build: Add chart surfaces for U.S. spending over time, U.S. vs Singapore health spending as a share of GDP, spending by payer, and the implementation timeline.
- Build: Drive all displayed values from the local JSON contract only.
- Build: Put source name, source URL, last checked date, and calculation method on every chart or card that needs attribution.
- Build: Use placeholders or empty states only when the local data is missing or invalid.
- Done when: The dashboard reads as a real data section, not just a layout mock.
- Done when: Every number shown is tied to local data and source metadata.
- Done when: No browser-side external API calls are introduced.
