# 04 Calculator

Read first:
1. `american-health/Todo.md`
2. `american-health/tasks/01-data-contracts.md`
3. `american-health/tasks/03-dashboard-and-charts.md`

- Goal: Add the interactive savings calculator with deterministic formulas and clear model labeling.
- Build: Add sliders for target government health spending as a share of GDP, target total health spending as a share of GDP, implementation efficiency, and transition cost offset.
- Build: Use the formulas from the todo note for implied GDP, current government health spending, target government health spending, gross annual savings, adjusted annual savings, national spending at target, and national savings.
- Build: Treat `transition cost offset` as a percentage of gross annual government savings. Compute the net result as:

```ts
const transitionCostDeduction = grossGovernmentSavings * transitionCostOffset;
const adjustedGovernmentSavings = Math.max(
  0,
  grossGovernmentSavings * implementationEfficiency - transitionCostDeduction
);
```

- Build: Use a sensible default of 10% for the transition-cost slider unless the data contract provides a better seeded assumption.
- Build: Precompute the default scenario grid in build output, then let the UI recompute the selected scenario client-side from local JSON.
- Build: Use the existing format helpers for currency, percentages, and large numbers.
- Build: Show the model disclaimer plainly: this is an explanatory model, not a formal budget score.
- Done when: A user can change the sliders and immediately see updated savings outputs.
- Done when: The math stays deterministic and local.
- Done when: The display clearly separates published data from model assumptions.
