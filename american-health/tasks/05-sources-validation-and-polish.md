# 05 Sources, Validation, and Polish

Read first:
1. `american-health/Todo.md`
2. `american-health/tasks/00-shell.md`
3. `american-health/tasks/01-data-contracts.md`
4. `american-health/tasks/02-home-explainer.md`
5. `american-health/tasks/03-dashboard-and-charts.md`
6. `american-health/tasks/04-calculator.md`

- Goal: Finish the site with source transparency, validation, and accessibility polish.
- Build: Add a `/sources` page, likely at `american-health/sources/index.html`, that lists every source and field used by the site.
- Build: Surface the assumptions manifest in a readable way so policy assumptions and model assumptions are obvious to the user.
- Build: Add build-time and render-time validation for invalid values, stale years, missing source URLs, and any mismatch between charted data and source metadata.
- Build: Add visible error states and empty states instead of silent failures.
- Build: Polish responsive behavior, keyboard navigation, focus states, and reduced-motion behavior across the site.
- Build: Make sure the final site keeps the civic/data tone: clear, technical, and not campaign-style.
- Done when: Every charted or calculated value has a source and a labeled assumption where needed.
- Done when: The `/sources` page is complete and discoverable from the site.
- Done when: The final site behaves correctly on desktop and mobile and remains fully local-data driven.
