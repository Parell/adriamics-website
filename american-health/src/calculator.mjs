const DEFAULT_TARGET_GOVERNMENT_SHARES = [0.03, 0.04, 0.05, 0.06];
const DEFAULT_IMPLEMENTATION_EFFICIENCIES = [0.25, 0.5, 0.75, 1];

function safeNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

function roundPeople(value) {
  return Math.round(safeNumber(value));
}

function toScenarioId(targetGovernmentShareGDP, implementationEfficiency, transitionCostOffset) {
  const targetTag = Math.round(targetGovernmentShareGDP * 100);
  const efficiencyTag = Math.round(implementationEfficiency * 100);
  const transitionTag = Math.round(transitionCostOffset * 100);

  return `target_gov_${targetTag}pct_eff_${efficiencyTag}pct_offset_${transitionTag}pct`;
}

export function computeImpliedGDP(totalHealthSpending, healthSpendingGdpShare) {
  const total = safeNumber(totalHealthSpending);
  const share = safeNumber(healthSpendingGdpShare);

  if (share <= 0) {
    return 0;
  }

  return total / share;
}

export function computeCurrentGovernmentHealthSpending(totalHealthSpending, federalSponsorShare, stateLocalSponsorShare) {
  return safeNumber(totalHealthSpending) * (safeNumber(federalSponsorShare) + safeNumber(stateLocalSponsorShare));
}

export function computeScenario({
  impliedGdp,
  currentGovernmentHealthSpending,
  currentNationalHealthSpending,
  targetGovernmentHealthShareGdp,
  targetTotalHealthShareGdp,
  implementationEfficiency,
  transitionCostOffset,
}) {
  const safeImpliedGdp = safeNumber(impliedGdp);
  const safeCurrentGovernmentHealthSpending = safeNumber(currentGovernmentHealthSpending);
  const safeCurrentNationalHealthSpending = safeNumber(currentNationalHealthSpending);
  const safeTargetGovernmentHealthShareGdp = safeNumber(targetGovernmentHealthShareGdp);
  const safeTargetTotalHealthShareGdp = safeNumber(targetTotalHealthShareGdp);
  const safeImplementationEfficiency = safeNumber(implementationEfficiency);
  const safeTransitionCostOffset = safeNumber(transitionCostOffset);

  const targetGovernmentHealthSpending = safeImpliedGdp * safeTargetGovernmentHealthShareGdp;
  const grossGovernmentSavings = safeCurrentGovernmentHealthSpending - targetGovernmentHealthSpending;
  const transitionCostDeduction = grossGovernmentSavings * safeTransitionCostOffset;
  const adjustedGovernmentSavings = Math.max(
    0,
    grossGovernmentSavings * safeImplementationEfficiency - transitionCostDeduction,
  );
  const nationalSpendingAtTarget = safeImpliedGdp * safeTargetTotalHealthShareGdp;
  const nationalSavings = safeCurrentNationalHealthSpending - nationalSpendingAtTarget;

  return {
    id: toScenarioId(safeTargetGovernmentHealthShareGdp, safeImplementationEfficiency, safeTransitionCostOffset),
    target_government_health_share_gdp: safeTargetGovernmentHealthShareGdp,
    target_total_health_share_gdp: safeTargetTotalHealthShareGdp,
    implementation_efficiency: safeImplementationEfficiency,
    transition_cost_offset: safeTransitionCostOffset,
    target_government_health_spending: targetGovernmentHealthSpending,
    gross_government_savings: grossGovernmentSavings,
    transition_cost_deduction: transitionCostDeduction,
    adjusted_government_savings: adjustedGovernmentSavings,
    national_spending_at_target: nationalSpendingAtTarget,
    national_savings: nationalSavings,
    model_label: "model estimate",
  };
}

export function buildDefaultScenarioGrid({
  impliedGdp,
  currentGovernmentHealthSpending,
  currentNationalHealthSpending,
  targetTotalHealthShareGdp,
  implementationEfficiency,
  transitionCostOffset,
  targetGovernmentShares = DEFAULT_TARGET_GOVERNMENT_SHARES,
  efficiencies = DEFAULT_IMPLEMENTATION_EFFICIENCIES,
}) {
  const scenarios = [];

  for (const targetGovernmentShareGDP of targetGovernmentShares) {
    for (const efficiency of efficiencies) {
      scenarios.push(
        computeScenario({
          impliedGdp,
          currentGovernmentHealthSpending,
          currentNationalHealthSpending,
          targetGovernmentHealthShareGdp: targetGovernmentShareGDP,
          targetTotalHealthShareGdp,
          implementationEfficiency: efficiency,
          transitionCostOffset,
        }),
      );
    }
  }

  return scenarios;
}

export function computePolicyPopulationModel({
  population,
  age65PlusShare,
  under65DisabilityShare,
  under65UninsuredShare,
  veteransTotal,
  veteransAge75PlusShare,
  currentNationalHealthSpending,
  savingsEfficiencies = [],
  targetTotalSpending,
  serviceEnvelope,
}) {
  const safePopulation = safeNumber(population);
  const safeAge65PlusShare = safeNumber(age65PlusShare);
  const safeUnder65DisabilityShare = safeNumber(under65DisabilityShare);
  const safeUnder65UninsuredShare = safeNumber(under65UninsuredShare);
  const safeVeteransTotal = safeNumber(veteransTotal);
  const safeVeteransAge75PlusShare = safeNumber(veteransAge75PlusShare);
  const safeCurrentNationalHealthSpending = safeNumber(currentNationalHealthSpending);
  const safeTargetTotalSpending = safeNumber(targetTotalSpending);
  const safeServiceEnvelope = serviceEnvelope ?? {};

  const age65Plus = roundPeople(safePopulation * safeAge65PlusShare);
  const under65 = Math.max(0, roundPeople(safePopulation - age65Plus));
  const under65Disabled = roundPeople(under65 * safeUnder65DisabilityShare);
  const under65Uninsured = roundPeople(under65 * safeUnder65UninsuredShare);
  const veteransAge75Plus = roundPeople(safeVeteransTotal * safeVeteransAge75PlusShare);
  const otherUnder65Population = Math.max(0, under65 - under65Disabled);

  const currentPerPersonSpending = safePopulation > 0 ? safeCurrentNationalHealthSpending / safePopulation : 0;
  const targetPerPersonSpending = safePopulation > 0 ? safeTargetTotalSpending / safePopulation : 0;
  const grossNationalSavings = safeCurrentNationalHealthSpending - safeTargetTotalSpending;

  const savingsCases = savingsEfficiencies.map((entry) => ({
    ...entry,
    annual_savings: grossNationalSavings * safeNumber(entry.efficiency),
    model_label: "model estimate",
  }));

  const age65AverageEnvelope = safeNumber(safeServiceEnvelope.age65AverageEnvelope);
  const under65DisabledAverageEnvelope = safeNumber(safeServiceEnvelope.under65DisabledAverageEnvelope);
  const otherUnder65AverageEnvelope = safeNumber(safeServiceEnvelope.otherUnder65AverageEnvelope);
  const veteranAdditiveEnvelope = safeNumber(safeServiceEnvelope.veteranAdditiveEnvelope);
  const adminReserveShare = safeNumber(safeServiceEnvelope.adminReserveShare);

  const age65Total = age65Plus * age65AverageEnvelope;
  const under65DisabledTotal = under65Disabled * under65DisabledAverageEnvelope;
  const otherUnder65Total = otherUnder65Population * otherUnder65AverageEnvelope;
  const veteranAdditiveTotal = safeVeteransTotal * veteranAdditiveEnvelope;
  const adminReserveTotal = safeTargetTotalSpending * adminReserveShare;
  const modeledEnvelopeTotal =
    age65Total + under65DisabledTotal + otherUnder65Total + veteranAdditiveTotal + adminReserveTotal;
  const remainingReserve = safeTargetTotalSpending - modeledEnvelopeTotal;

  return {
    population_groups: {
      total_population: safePopulation,
      age_65_plus: age65Plus,
      under_65: under65,
      under_65_disabled: under65Disabled,
      under_65_uninsured: under65Uninsured,
      veterans_total: safeVeteransTotal,
      veterans_age_75_plus: veteransAge75Plus,
      other_under_65_population: otherUnder65Population,
    },
    spending: {
      current_total_spending: safeCurrentNationalHealthSpending,
      current_per_person_spending: currentPerPersonSpending,
      target_total_spending: safeTargetTotalSpending,
      target_per_person_spending: targetPerPersonSpending,
      gross_national_savings: grossNationalSavings,
      model_label: "model estimate",
    },
    savings_cases: savingsCases,
    service_envelope: {
      age_65_plus_total: age65Total,
      under_65_disabled_total: under65DisabledTotal,
      other_under_65_population_total: otherUnder65Total,
      veteran_additive_total: veteranAdditiveTotal,
      admin_audit_reserve_total: adminReserveTotal,
      modeled_total: modeledEnvelopeTotal,
      remaining_reserve: remainingReserve,
      model_label: "model estimate",
    },
  };
}
