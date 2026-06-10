import {
  formatCurrency,
  formatCompactCurrency,
  formatCompactNumber,
  formatDate,
  formatNumber,
  formatPercent,
} from "./format.mjs";
import {
  computePolicyPopulationModel,
  computeCurrentGovernmentHealthSpending,
  computeImpliedGDP,
  computeScenario,
} from "./calculator.mjs";
import {
  renderComparisonChartSvg,
  renderEmptyChartSvg,
  renderLineChartSvg,
  renderStackedShareSvg,
  renderTimelineSvg,
} from "./charts.mjs";

const DEFAULT_SCENARIO_ID = "target_gov_4pct_eff_50pct_offset_10pct";
const CALCULATOR_CONTROL_CONFIGS = [
  {
    key: "targetGovernmentHealthShareGdp",
    id: "calculator-target-government-share",
    label: "Target government health spending",
    description: "Sets the government's target share of GDP.",
    min: 0.02,
    max: 0.08,
    step: 0.001,
    formatValue: formatPercent,
  },
  {
    key: "targetTotalHealthShareGdp",
    id: "calculator-target-total-share",
    label: "Target total health spending",
    description: "Sets the total national health spending target.",
    min: 0.1,
    max: 0.16,
    step: 0.001,
    formatValue: formatPercent,
  },
  {
    key: "implementationEfficiency",
    id: "calculator-implementation-efficiency",
    label: "Implementation efficiency",
    description: "How much of the theoretical savings the model retains.",
    min: 0,
    max: 1,
    step: 0.01,
    formatValue: formatPercent,
  },
  {
    key: "transitionCostOffset",
    id: "calculator-transition-cost-offset",
    label: "Transition cost offset",
    description: "Transition cost deduction as a share of gross annual government savings.",
    min: 0,
    max: 0.25,
    step: 0.005,
    formatValue: formatPercent,
  },
];
const REQUIRED_LATEST_IDS = [
  "national_health_expenditures",
  "health_spending_gdp_share",
  "medicare_spending",
  "medicaid_spending",
  "out_of_pocket_spending",
  "federal_sponsor_share",
  "state_local_sponsor_share",
  "household_sponsor_share",
  "private_business_sponsor_share",
  "singapore_health_spending_gdp_share",
  "us_population_estimate",
  "age_65_plus_share",
  "under_65_disability_share",
  "under_65_uninsured_share",
  "veterans_total",
  "veterans_age_75_plus_share",
];

const REQUIRED_HISTORY_SERIES_IDS = [
  "national_health_expenditures",
  "health_spending_gdp_share",
  "singapore_health_spending_gdp_share",
];

function createElement(tagName, className, attributes = {}) {
  const node = document.createElement(tagName);
  if (className) {
    node.className = className;
  }

  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) {
      node.setAttribute(key, String(value));
    }
  }

  return node;
}

function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRecordById(collection, id) {
  return collection?.by_id?.[id] ?? null;
}

function getSeriesById(history, id) {
  return history?.by_id?.[id] ?? null;
}

function getSelectedScenario(calculated) {
  if (!isObject(calculated)) {
    return null;
  }

  return calculated.by_id?.[DEFAULT_SCENARIO_ID] ?? calculated.scenarios?.[0] ?? null;
}

function getCalculatorDefaultState(calculated) {
  const scenario = getSelectedScenario(calculated);
  const inputs = calculated?.inputs ?? {};

  return {
    targetGovernmentHealthShareGdp:
      scenario?.target_government_health_share_gdp ??
      inputs.target_government_health_share_gdp ??
      0.04,
    targetTotalHealthShareGdp:
      scenario?.target_total_health_share_gdp ?? inputs.target_total_health_share_gdp ?? 0.12,
    implementationEfficiency:
      scenario?.implementation_efficiency ?? inputs.implementation_efficiency ?? 0.5,
    transitionCostOffset:
      scenario?.transition_cost_offset ?? inputs.transition_cost_offset ?? 0.1,
  };
}

function getPolicyModel(data) {
  const latest = data?.latest;
  const assumptions = data?.assumptions;
  const dashboardModel = assumptions?.dashboard_model ?? {};
  const envelope = dashboardModel.service_envelope ?? {};

  return computePolicyPopulationModel({
    population: getRecordById(latest, "us_population_estimate")?.value,
    age65PlusShare: getRecordById(latest, "age_65_plus_share")?.value,
    under65DisabilityShare: getRecordById(latest, "under_65_disability_share")?.value,
    under65UninsuredShare: getRecordById(latest, "under_65_uninsured_share")?.value,
    veteransTotal: getRecordById(latest, "veterans_total")?.value,
    veteransAge75PlusShare: getRecordById(latest, "veterans_age_75_plus_share")?.value,
    currentNationalHealthSpending: getRecordById(latest, "national_health_expenditures")?.value,
    savingsEfficiencies: dashboardModel.savings_scenarios ?? [],
    targetTotalSpending: envelope.target_total_spending,
    serviceEnvelope: {
      age65AverageEnvelope: envelope.group_benchmarks?.find((entry) => entry.id === "age_65_plus")?.average_envelope,
      under65DisabledAverageEnvelope:
        envelope.group_benchmarks?.find((entry) => entry.id === "under_65_disabled")?.average_envelope,
      otherUnder65AverageEnvelope:
        envelope.group_benchmarks?.find((entry) => entry.id === "other_under_65_population")?.average_envelope,
      veteranAdditiveEnvelope:
        envelope.group_benchmarks?.find((entry) => entry.id === "veteran_additive_boost")?.average_envelope,
      adminReserveShare: envelope.admin_reserve_share,
    },
  });
}

function formatSourceLine(label, value, href) {
  const line = createElement("p", "source-meta__line");
  const strong = createElement("span", "source-meta__label");
  strong.textContent = `${label}: `;
  line.appendChild(strong);

  if (href) {
    const link = createElement("a", "source-meta__link", {
      href,
      target: "_blank",
      rel: "noreferrer",
    });
    link.textContent = value;
    line.appendChild(link);
  } else {
    const span = createElement("span", "source-meta__value");
    span.textContent = value;
    line.appendChild(span);
  }

  return line;
}

function buildAttributionBlock({
  sourceName,
  sourceUrl,
  lastChecked,
  method,
  extraLines = [],
}) {
  const block = createElement("div", "source-meta");
  block.appendChild(formatSourceLine("Source", sourceName ?? "Local data", sourceUrl));

  if (sourceUrl) {
    block.appendChild(formatSourceLine("Source URL", sourceUrl, sourceUrl));
  }

  if (lastChecked) {
    block.appendChild(formatSourceLine("Last checked", formatDate(lastChecked)));
  }

  if (method) {
    block.appendChild(formatSourceLine("Calculation method", method));
  }

  for (const line of extraLines) {
    const row = createElement("p", "source-meta__line");
    row.textContent = line;
    block.appendChild(row);
  }

  return block;
}

function createMetricCard({ label, value, subvalue, attribution, tone = "default" }) {
  const card = createElement("article", `metric-card metric-card--${tone}`);
  card.appendChild(createElement("p", "metric-card__label")).textContent = label;
  card.appendChild(createElement("div", "metric-card__value")).textContent = value;

  if (subvalue) {
    card.appendChild(createElement("p", "metric-card__subvalue")).textContent = subvalue;
  }

  if (attribution) {
    card.appendChild(attribution);
  }

  return card;
}

function createCalculatorControl({
  id,
  label,
  description,
  min,
  max,
  step,
  value,
  formatValue,
}) {
  const control = createElement("div", "calculator-control");
  const head = createElement("div", "calculator-control__head");
  const title = createElement("label", "calculator-control__label", { for: id });
  title.textContent = label;

  const valueNode = createElement("span", "calculator-control__value");
  valueNode.textContent = formatValue(value);

  head.appendChild(title);
  head.appendChild(valueNode);
  control.appendChild(head);

  const input = createElement("input", "calculator-control__range", {
    id,
    type: "range",
    min,
    max,
    step,
    value,
  });
  input.setAttribute("aria-describedby", `${id}-description ${id}-scale`);
  input.setAttribute("aria-valuetext", formatValue(value));
  control.appendChild(input);

  const descriptionNode = createElement("p", "calculator-control__description", {
    id: `${id}-description`,
  });
  descriptionNode.textContent = description;
  control.appendChild(descriptionNode);

  const scale = createElement("div", "calculator-control__scale", { id: `${id}-scale` });
  scale.appendChild(createElement("span", "calculator-control__scale-min")).textContent =
    `Min ${formatValue(min)}`;
  scale.appendChild(createElement("span", "calculator-control__scale-max")).textContent =
    `Max ${formatValue(max)}`;
  control.appendChild(scale);

  return { control, input, valueNode };
}

function createCalculatorResultCard({ label, value, subvalue, tone = "default" }) {
  const card = createMetricCard({ label, value, subvalue, tone });
  card.classList.add("calculator-result-card");
  return card;
}

function createChartCard({ title, eyebrow, note, attribution, svg, legend }) {
  const card = createElement("article", "chart-card");
  const head = createElement("div", "chart-card__head");

  if (eyebrow) {
    head.appendChild(createElement("p", "chart-card__eyebrow")).textContent = eyebrow;
  }

  head.appendChild(createElement("h3", "chart-card__title")).textContent = title;
  card.appendChild(head);

  const figure = createElement("div", "chart-card__figure");
  figure.appendChild(svg);
  card.appendChild(figure);

  if (legend) {
    card.appendChild(legend);
  }

  if (note) {
    card.appendChild(createElement("p", "chart-card__note")).textContent = note;
  }

  if (attribution) {
    card.appendChild(attribution);
  }

  return card;
}

function createLegendList(items) {
  const list = createElement("div", "chart-legend");

  for (const item of items) {
    const row = createElement("div", "chart-legend__item");
    const swatch = createElement("span", "chart-legend__swatch");
    if (item.color) {
      swatch.style.background = item.color;
    }
    row.appendChild(swatch);

    const text = createElement("span", "chart-legend__text");
    text.textContent = item.label;
    row.appendChild(text);

    const value = createElement("span", "chart-legend__value");
    value.textContent = item.value;
    row.appendChild(value);

    list.appendChild(row);
  }

  return list;
}

function createDataTable({ columns, rows, caption }) {
  const wrap = createElement("div", "data-table");
  const table = createElement("table", "data-table__table");

  if (caption) {
    table.appendChild(createElement("caption", "data-table__caption")).textContent = caption;
  }

  const thead = createElement("thead", "data-table__head");
  const headRow = createElement("tr");
  for (const column of columns) {
    headRow.appendChild(createElement("th", "data-table__heading", { scope: "col" })).textContent = column.label;
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = createElement("tbody", "data-table__body");
  for (const row of rows) {
    const tr = createElement("tr", "data-table__row");
    for (const [index, cell] of row.entries()) {
      const tagName = index === 0 ? "th" : "td";
      const cellNode = createElement(tagName, "data-table__cell", index === 0 ? { scope: "row" } : {});
      cellNode.textContent = cell;
      tr.appendChild(cellNode);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  wrap.appendChild(table);

  return wrap;
}

function createBulletList(items, className = "policy-list") {
  const list = createElement("ul", className);

  for (const item of items) {
    const row = createElement("li");
    row.textContent = item;
    list.appendChild(row);
  }

  return list;
}

function createFormulaBlock({ label, expression }) {
  const block = createElement("div", "formula-block");
  block.appendChild(createElement("p", "formula-block__label")).textContent = label;
  block.appendChild(createElement("code", "formula-block__expression")).textContent = expression;
  return block;
}

function createNarrativeSection({ eyebrow, title, lede, note }) {
  const section = createElement("article", "dashboard-panel narrative-panel");
  const head = createElement("div", "narrative-panel__head");

  if (eyebrow) {
    head.appendChild(createElement("p", "chart-card__eyebrow")).textContent = eyebrow;
  }

  head.appendChild(createElement("h3", "narrative-panel__title")).textContent = title;
  if (lede) {
    head.appendChild(createElement("p", "narrative-panel__lede")).textContent = lede;
  }
  if (note) {
    head.appendChild(createElement("p", "narrative-panel__note")).textContent = note;
  }

  section.appendChild(head);
  return section;
}

function createEmptyState(message, detail) {
  const state = createElement("div", "dashboard-state dashboard-state--empty");
  state.appendChild(createElement("h3", "dashboard-state__title")).textContent = "Dashboard unavailable";
  state.appendChild(createElement("p", "dashboard-state__message")).textContent = message;
  if (detail) {
    state.appendChild(createElement("p", "dashboard-state__detail")).textContent = detail;
  }
  return state;
}

function createErrorState(issues) {
  const state = createElement("div", "dashboard-state dashboard-state--error");
  state.appendChild(createElement("h3", "dashboard-state__title")).textContent = "Local data error";
  state.appendChild(
    createElement("p", "dashboard-state__message"),
  ).textContent = "The dashboard could not load because one or more local JSON files are missing or invalid.";

  if (issues.length > 0) {
    const list = createElement("ul", "dashboard-state__issues");
    for (const issue of issues) {
      list.appendChild(createElement("li")).textContent = issue;
    }
    state.appendChild(list);
  }

  return state;
}

function validateDashboardData(data) {
  const issues = [];

  if (!isObject(data)) {
    issues.push("The dashboard data object is missing.");
    return issues;
  }

  if (!isObject(data.latest)) {
    issues.push("latest.json could not be loaded.");
  } else if (!Array.isArray(data.latest.records)) {
    issues.push("latest.json must contain a records array.");
  } else {
    for (const id of REQUIRED_LATEST_IDS) {
      if (!data.latest.records.some((record) => record?.id === id)) {
        issues.push(`latest.json is missing the required record ${id}.`);
      }
    }
  }

  if (!isObject(data.history)) {
    issues.push("history.json could not be loaded.");
  } else if (!Array.isArray(data.history.series)) {
    issues.push("history.json must contain a series array.");
  } else {
    for (const id of REQUIRED_HISTORY_SERIES_IDS) {
      if (!data.history.series.some((series) => series?.id === id)) {
        issues.push(`history.json is missing the required series ${id}.`);
      }
    }
  }

  if (!isObject(data.calculated) || !Array.isArray(data.calculated.scenarios)) {
    issues.push("calculated.json could not be loaded.");
  } else if (data.calculated.scenarios.length === 0) {
    issues.push("calculated.json must contain at least one scenario.");
  }

  if (!isObject(data.assumptions)) {
    issues.push("assumptions.json could not be loaded.");
  } else if (!Array.isArray(data.assumptions.rollout_sequence)) {
    issues.push("assumptions.json must contain a rollout_sequence array.");
  } else if (data.assumptions.rollout_sequence.length === 0) {
    issues.push("assumptions.json must contain at least one rollout step.");
  }

  if (!isObject(data.assumptions?.safeguards_model)) {
    issues.push("assumptions.json must contain safeguards_model.");
  }

  if (!isObject(data.assumptions?.dashboard_model)) {
    issues.push("assumptions.json must contain dashboard_model.");
  }

  return issues;
}

export function summarizeLatest(latest) {
  const records = Array.isArray(latest?.records) ? latest.records : [];
  const baselineYear = Number.isFinite(latest?.baseline_year) ? latest.baseline_year : null;
  const singaporeRecord = records.find((record) => record?.id === "singapore_health_spending_gdp_share");

  return {
    baseline_year: baselineYear,
    record_count: records.length,
    has_data: records.length > 0,
    benchmark_year: Number.isFinite(singaporeRecord?.year) ? singaporeRecord.year : null,
  };
}

function buildMetricCards(data) {
  const latest = data.latest;
  const nhe = getRecordById(latest, "national_health_expenditures");
  const gdpShare = getRecordById(latest, "health_spending_gdp_share");
  const medicare = getRecordById(latest, "medicare_spending");
  const medicaid = getRecordById(latest, "medicaid_spending");
  const outOfPocket = getRecordById(latest, "out_of_pocket_spending");
  const federalShare = getRecordById(latest, "federal_sponsor_share");
  const stateLocalShare = getRecordById(latest, "state_local_sponsor_share");
  const singapore = getRecordById(latest, "singapore_health_spending_gdp_share");

  const cards = [
    createMetricCard({
      label: "U.S. health spending",
      value: formatCompactCurrency(nhe?.value),
      subvalue: `Baseline year ${latest?.baseline_year ?? "—"}`,
      attribution: buildAttributionBlock({
        sourceName: nhe?.source_name,
        sourceUrl: nhe?.source_url,
        lastChecked: nhe?.last_checked,
        method: nhe?.model_label,
      }),
    }),
    createMetricCard({
      label: "U.S. health spending as a share of GDP",
      value: formatPercent(gdpShare?.value),
      subvalue: `Baseline year ${latest?.baseline_year ?? "—"}`,
      attribution: buildAttributionBlock({
        sourceName: gdpShare?.source_name,
        sourceUrl: gdpShare?.source_url,
        lastChecked: gdpShare?.last_checked,
        method: gdpShare?.model_label,
      }),
    }),
    createMetricCard({
      label: "Medicare spending",
      value: formatCompactCurrency(medicare?.value),
      subvalue: `Baseline year ${latest?.baseline_year ?? "—"}`,
      attribution: buildAttributionBlock({
        sourceName: medicare?.source_name,
        sourceUrl: medicare?.source_url,
        lastChecked: medicare?.last_checked,
        method: medicare?.model_label,
      }),
    }),
    createMetricCard({
      label: "Medicaid spending",
      value: formatCompactCurrency(medicaid?.value),
      subvalue: `Baseline year ${latest?.baseline_year ?? "—"}`,
      attribution: buildAttributionBlock({
        sourceName: medicaid?.source_name,
        sourceUrl: medicaid?.source_url,
        lastChecked: medicaid?.last_checked,
        method: medicaid?.model_label,
      }),
    }),
    createMetricCard({
      label: "Out-of-pocket spending",
      value: formatCompactCurrency(outOfPocket?.value),
      subvalue: `Baseline year ${latest?.baseline_year ?? "—"}`,
      attribution: buildAttributionBlock({
        sourceName: outOfPocket?.source_name,
        sourceUrl: outOfPocket?.source_url,
        lastChecked: outOfPocket?.last_checked,
        method: outOfPocket?.model_label,
      }),
    }),
    createMetricCard({
      label: "Federal share",
      value: formatPercent(federalShare?.value),
      subvalue: "Sponsor share in the CMS seed",
      attribution: buildAttributionBlock({
        sourceName: federalShare?.source_name,
        sourceUrl: federalShare?.source_url,
        lastChecked: federalShare?.last_checked,
        method: federalShare?.model_label,
      }),
    }),
    createMetricCard({
      label: "State/local share",
      value: formatPercent(stateLocalShare?.value),
      subvalue: "Sponsor share in the CMS seed",
      attribution: buildAttributionBlock({
        sourceName: stateLocalShare?.source_name,
        sourceUrl: stateLocalShare?.source_url,
        lastChecked: stateLocalShare?.last_checked,
        method: stateLocalShare?.model_label,
      }),
    }),
    createMetricCard({
      label: "Singapore benchmark",
      value: formatPercent(singapore?.value),
      subvalue: `Most recent available year ${singapore?.year ?? "—"}`,
      attribution: buildAttributionBlock({
        sourceName: singapore?.source_name,
        sourceUrl: singapore?.source_url,
        lastChecked: singapore?.last_checked,
        method: singapore?.model_label,
        extraLines: ["Primary seed from the World Bank series; the source manifest notes WHO GHED as the fallback reference."],
      }),
      tone: "accent",
    }),
  ];

  return cards;
}

function buildCalculatorPanel(data) {
  const latest = data.latest;
  const calculated = data.calculated;
  const assumptions = data.assumptions;
  const nhe = getRecordById(latest, "national_health_expenditures");
  const gdpShare = getRecordById(latest, "health_spending_gdp_share");
  const federalShare = getRecordById(latest, "federal_sponsor_share");
  const stateLocalShare = getRecordById(latest, "state_local_sponsor_share");
  const scenarioDefaults = getCalculatorDefaultState(calculated);
  const impliedGdp = computeImpliedGDP(nhe?.value, gdpShare?.value);
  const currentGovernmentHealthSpending = computeCurrentGovernmentHealthSpending(
    nhe?.value,
    federalShare?.value,
    stateLocalShare?.value,
  );

  const panel = createElement("article", "calculator-panel");
  const head = createElement("div", "calculator-panel__head");
  head.appendChild(createElement("p", "calculator-panel__eyebrow")).textContent = "Interactive savings calculator";
  head.appendChild(createElement("h3", "calculator-panel__title")).textContent =
    "Adjust the model assumptions and recompute the scenario from local data.";
  head.appendChild(createElement("p", "calculator-panel__lede")).textContent =
    "This is an explanatory model, not a formal budget score. Published CMS values stay separate from the assumption-driven outputs below.";
  panel.appendChild(head);

  const layout = createElement("div", "calculator-panel__layout");
  panel.appendChild(layout);

  const controlsSection = createElement("section", "calculator-section calculator-section--controls");
  controlsSection.appendChild(createElement("h4", "calculator-section__title")).textContent = "Model assumptions";
  controlsSection.appendChild(createElement("p", "calculator-section__note")).textContent =
    "Defaults come from the local assumptions manifest and the precomputed default scenario grid.";

  const fieldset = createElement("fieldset", "calculator-fieldset");
  const legend = createElement("legend", "sr-only");
  legend.textContent = "Savings calculator controls";
  fieldset.appendChild(legend);

  const controlRefs = {};
  for (const config of CALCULATOR_CONTROL_CONFIGS) {
    const controlState = createCalculatorControl({
      ...config,
      value: scenarioDefaults[config.key],
    });
    controlRefs[config.key] = controlState;
    fieldset.appendChild(controlState.control);
  }
  controlsSection.appendChild(fieldset);

  const scenarioSummary = createElement("p", "calculator-panel__scenario", {
    "aria-live": "polite",
  });
  controlsSection.appendChild(scenarioSummary);
  controlsSection.appendChild(
    buildAttributionBlock({
      sourceName: "American Health assumptions",
      sourceUrl: "./public/data/assumptions.json",
      lastChecked: assumptions?.generated_at,
      method: "model assumption defaults",
    }),
  );
  layout.appendChild(controlsSection);

  const resultsSection = createElement("section", "calculator-section calculator-section--results");
  resultsSection.appendChild(createElement("h4", "calculator-section__title")).textContent = "Calculated outputs";
  resultsSection.appendChild(createElement("p", "calculator-section__note")).textContent =
    "The first two cards are derived from published CMS values. The remaining cards are the active model output.";

  const baselineGrid = createElement("div", "calculator-result-grid");
  const modelGrid = createElement("div", "calculator-result-grid");
  const resultRefs = {};

  function appendResultCard(container, key, label, subvalue, tone = "default") {
    const card = createCalculatorResultCard({
      label,
      value: "â€”",
      subvalue,
      tone,
    });
    resultRefs[key] = {
      valueNode: card.querySelector(".metric-card__value"),
    };
    container.appendChild(card);
  }

  appendResultCard(
    baselineGrid,
    "impliedGdp",
    "Implied GDP",
    "Derived from published CMS health spending and the GDP share input.",
    "accent",
  );
  appendResultCard(
    baselineGrid,
    "currentGovernmentHealthSpending",
    "Current government health spending",
    "Derived from the published federal and state/local sponsor shares.",
    "accent",
  );
  appendResultCard(modelGrid, "targetGovernmentHealthSpending", "Target government health spending", "Model estimate", "accent");
  appendResultCard(modelGrid, "grossGovernmentSavings", "Gross annual government savings", "Model estimate", "accent");
  appendResultCard(modelGrid, "transitionCostDeduction", "Transition cost deduction", "Model estimate");
  appendResultCard(modelGrid, "adjustedGovernmentSavings", "Adjusted annual savings", "Model estimate", "accent");
  appendResultCard(modelGrid, "nationalSpendingAtTarget", "National spending at target", "Model estimate");
  appendResultCard(modelGrid, "nationalSavings", "National savings", "Model estimate", "accent");

  resultsSection.appendChild(createElement("h5", "calculator-section__subtitle")).textContent = "Derived baseline";
  resultsSection.appendChild(baselineGrid);
  resultsSection.appendChild(createElement("h5", "calculator-section__subtitle")).textContent = "Active scenario";
  resultsSection.appendChild(modelGrid);
  resultsSection.appendChild(
    buildAttributionBlock({
      sourceName: "American Health calculated outputs",
      sourceUrl: "./public/data/calculated.json",
      lastChecked: calculated?.generated_at,
      method: "browser-side recomputation from local JSON",
      extraLines: [`Precomputed default scenario grid: ${calculated?.scenarios?.length ?? 0} scenarios.`],
    }),
  );
  layout.appendChild(resultsSection);

  function readControlState() {
    return {
      targetGovernmentHealthShareGdp: Number(controlRefs.targetGovernmentHealthShareGdp.input.value),
      targetTotalHealthShareGdp: Number(controlRefs.targetTotalHealthShareGdp.input.value),
      implementationEfficiency: Number(controlRefs.implementationEfficiency.input.value),
      transitionCostOffset: Number(controlRefs.transitionCostOffset.input.value),
    };
  }

  function updatePanel() {
    const state = readControlState();
    const scenario = computeScenario({
      impliedGdp,
      currentGovernmentHealthSpending,
      currentNationalHealthSpending: nhe?.value,
      targetGovernmentHealthShareGdp: state.targetGovernmentHealthShareGdp,
      targetTotalHealthShareGdp: state.targetTotalHealthShareGdp,
      implementationEfficiency: state.implementationEfficiency,
      transitionCostOffset: state.transitionCostOffset,
    });

    for (const config of CALCULATOR_CONTROL_CONFIGS) {
      const currentValue = state[config.key];
      const control = controlRefs[config.key];
      control.valueNode.textContent = config.formatValue(currentValue);
      control.input.setAttribute("aria-valuetext", config.formatValue(currentValue));
    }

    scenarioSummary.textContent =
      `Active scenario ${scenario.id}: government target ${formatPercent(scenario.target_government_health_share_gdp)}, total target ${formatPercent(scenario.target_total_health_share_gdp)}, implementation efficiency ${formatPercent(scenario.implementation_efficiency)}, transition cost offset ${formatPercent(scenario.transition_cost_offset)}.`;

    resultRefs.impliedGdp.valueNode.textContent = formatCompactCurrency(impliedGdp);
    resultRefs.currentGovernmentHealthSpending.valueNode.textContent = formatCompactCurrency(currentGovernmentHealthSpending);
    resultRefs.targetGovernmentHealthSpending.valueNode.textContent = formatCompactCurrency(scenario.target_government_health_spending);
    resultRefs.grossGovernmentSavings.valueNode.textContent = formatCompactCurrency(scenario.gross_government_savings);
    resultRefs.transitionCostDeduction.valueNode.textContent = formatCompactCurrency(scenario.transition_cost_deduction);
    resultRefs.adjustedGovernmentSavings.valueNode.textContent = formatCompactCurrency(scenario.adjusted_government_savings);
    resultRefs.nationalSpendingAtTarget.valueNode.textContent = formatCompactCurrency(scenario.national_spending_at_target);
    resultRefs.nationalSavings.valueNode.textContent = formatCompactCurrency(scenario.national_savings);
  }

  for (const config of CALCULATOR_CONTROL_CONFIGS) {
    controlRefs[config.key].input.addEventListener("input", updatePanel);
  }

  updatePanel();

  return panel;
}

function buildChartCards(data) {
  const latest = data.latest;
  const history = data.history;
  const assumptions = data.assumptions;
  const nheSeries = getSeriesById(history, "national_health_expenditures");
  const usShareSeries = getSeriesById(history, "health_spending_gdp_share");
  const singaporeSeries = getSeriesById(history, "singapore_health_spending_gdp_share");
  const federalShare = getRecordById(latest, "federal_sponsor_share");
  const stateLocalShare = getRecordById(latest, "state_local_sponsor_share");
  const householdShare = getRecordById(latest, "household_sponsor_share");
  const privateBusinessShare = getRecordById(latest, "private_business_sponsor_share");
  const singapore = getRecordById(latest, "singapore_health_spending_gdp_share");
  const rolloutSequence = assumptions?.rollout_sequence ?? [];

  const spendingChart = renderLineChartSvg({
    points: nheSeries?.records ?? [],
    formatValue: formatCompactCurrency,
    ariaLabel: "United States health spending over time chart",
    title: "U.S. health spending over time",
    description: "Chart of U.S. national health expenditures from the local CMS seed.",
    note:
      (nheSeries?.records?.length ?? 0) <= 1
        ? "Single seeded year: the trend line will expand as more history is added."
        : "Local CMS history series.",
  });

  const comparisonChart = renderComparisonChartSvg({
    items: [
      {
        label: "United States",
        value: usShareSeries?.records?.at(-1)?.value ?? latest?.by_id?.health_spending_gdp_share?.value,
        year: usShareSeries?.records?.at(-1)?.year ?? latest?.baseline_year,
      },
      {
        label: "Singapore",
        value: singaporeSeries?.records?.at(-1)?.value ?? singapore?.value,
        year: singaporeSeries?.records?.at(-1)?.year ?? singapore?.year,
      },
    ],
    formatValue: formatPercent,
    ariaLabel: "United States and Singapore health spending as a share of GDP comparison chart",
    title: "U.S. vs. Singapore health spending as a share of GDP",
    description: "Comparison of the seeded U.S. and Singapore benchmark values.",
    note: "U.S. uses the 2024 CMS baseline; Singapore uses the most recent seeded World Bank series.",
  });

  const payerChart = renderStackedShareSvg({
    items: [
      {
        label: "Federal",
        value: federalShare?.value,
        color: "rgba(255,255,255,0.9)",
      },
      {
        label: "State/local",
        value: stateLocalShare?.value,
        color: "rgba(255,255,255,0.72)",
      },
      {
        label: "Household",
        value: householdShare?.value,
        color: "rgba(255,255,255,0.52)",
      },
      {
        label: "Private business",
        value: privateBusinessShare?.value,
        color: "rgba(255,255,255,0.36)",
      },
    ],
    formatValue: formatPercent,
    ariaLabel: "Current health spending by sponsor share chart",
    title: "Spending by payer",
    description: "Current CMS sponsor-share seed displayed as a stacked share bar.",
    note: "Known sponsor shares are displayed from the CMS seed and sum to 93.0%; the seed does not assign the remaining rounding gap.",
  });

  const timelineChart = renderTimelineSvg({
    steps: rolloutSequence,
    ariaLabel: "Implementation timeline chart",
    title: "Implementation timeline",
    description: "Structured rollout sequence stored in local assumptions JSON.",
    note: "The rollout sequence is read from ./public/data/assumptions.json.",
  });

  const chartCards = [
    createChartCard({
      eyebrow: "Current system",
      title: "U.S. spending over time",
      svg: spendingChart,
      note:
        (nheSeries?.records?.length ?? 0) <= 1
          ? "This chart currently shows a single seeded year. It is not inventing extra trend points."
          : "Annual CMS values loaded from local history.json.",
      attribution: buildAttributionBlock({
        sourceName: nheSeries?.records?.[0]?.source_name ?? "CMS National Health Expenditure history seed",
        sourceUrl: nheSeries?.records?.[0]?.source_url ?? "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/historical",
        lastChecked: nheSeries?.records?.[0]?.last_checked ?? latest?.generated_at,
        method: nheSeries?.records?.[0]?.model_label ?? "published value",
      }),
    }),
    createChartCard({
      eyebrow: "Benchmark",
      title: "U.S. vs. Singapore health spending as a share of GDP",
      svg: comparisonChart,
      note: "The benchmark uses the most recent available Singapore value from the World Bank series.",
      legend: createLegendList([
        {
          label: "United States",
          value: formatPercent(usShareSeries?.records?.at(-1)?.value ?? latest?.by_id?.health_spending_gdp_share?.value),
          color: "rgba(255,255,255,0.9)",
        },
        {
          label: "Singapore",
          value: formatPercent(singaporeSeries?.records?.at(-1)?.value ?? singapore?.value),
          color: "rgba(255,255,255,0.52)",
        },
      ]),
      attribution: buildAttributionBlock({
        sourceName: "CMS NHE history seed and World Bank WDI",
        sourceUrl: "https://data.worldbank.org/indicator/SH.XPD.CHEX.GD.ZS?locations=SG",
        lastChecked: singapore?.last_checked ?? latest?.generated_at,
        method: "published benchmark seed",
        extraLines: [
          `United States year: ${usShareSeries?.records?.at(-1)?.year ?? latest?.baseline_year ?? "—"}`,
          `Singapore year: ${singaporeSeries?.records?.at(-1)?.year ?? singapore?.year ?? "—"}`,
        ],
      }),
    }),
    createChartCard({
      eyebrow: "Current system",
      title: "Spending by payer",
      svg: payerChart,
      note: "Sponsor shares are shown as a stacked bar so the financing mix is readable at a glance.",
      legend: createLegendList([
        { label: "Federal", value: formatPercent(federalShare?.value), color: "rgba(255,255,255,0.9)" },
        { label: "State/local", value: formatPercent(stateLocalShare?.value), color: "rgba(255,255,255,0.72)" },
        { label: "Household", value: formatPercent(householdShare?.value), color: "rgba(255,255,255,0.52)" },
        {
          label: "Private business",
          value: formatPercent(privateBusinessShare?.value),
          color: "rgba(255,255,255,0.36)",
        },
      ]),
      attribution: buildAttributionBlock({
        sourceName: federalShare?.source_name ?? "CMS National Health Expenditure Fact Sheet",
        sourceUrl: federalShare?.source_url,
        lastChecked: federalShare?.last_checked,
        method: federalShare?.model_label ?? "published value",
      }),
    }),
    createChartCard({
      eyebrow: "Implementation",
      title: "Implementation timeline",
      svg: timelineChart,
      note: "The rollout order comes from the local assumptions manifest, not from hardcoded chart copy.",
      legend: createLegendList(
        rolloutSequence.map((step) => ({
          label: `Phase ${step.phase}`,
          value: step.label,
          color: "rgba(255,255,255,0.7)",
        })),
      ),
      attribution: buildAttributionBlock({
        sourceName: "American Health assumptions",
        sourceUrl: "./public/data/assumptions.json",
        lastChecked: assumptions?.generated_at,
        method: "policy sequence",
      }),
    }),
  ];

  return chartCards;
}

function buildSafeguardsSection(data) {
  const assumptions = data.assumptions;
  const safeguards = assumptions.safeguards_model;

  const section = createNarrativeSection({
    eyebrow: "1. Safeguards against exploitation",
    title: "Identity, price, and claims are the three hard gates.",
    lede: safeguards.headline,
  });

  const formulaGrid = createElement("div", "formula-grid");
  formulaGrid.appendChild(createFormulaBlock(safeguards.account_formula));
  formulaGrid.appendChild(createFormulaBlock(safeguards.payment_formula));
  formulaGrid.appendChild(createFormulaBlock(safeguards.boost_formula));
  formulaGrid.appendChild(createFormulaBlock(safeguards.boost_cap_formula));
  formulaGrid.appendChild(createFormulaBlock(safeguards.audit_formula));
  section.appendChild(formulaGrid);

  const cardGrid = createElement("div", "policy-grid");

  const accountCard = createElement("section", "policy-card");
  accountCard.appendChild(createElement("h4", "policy-card__title")).textContent = "A. One person, one account";
  accountCard.appendChild(createBulletList(safeguards.account_rules.map((rule) => `${rule.title}: ${rule.description}`)));
  accountCard.appendChild(
    createDataTable({
      columns: [
        { label: "Risk" },
        { label: "Guardrail" },
      ],
      rows: safeguards.account_safeguards.map((entry) => [entry.risk, entry.guardrail]),
      caption: "Account safeguards",
    }),
  );
  accountCard.appendChild(createElement("p", "policy-card__note")).textContent =
    `Restricted spending categories: ${safeguards.restricted_spending_categories.join(", ")}.`;
  cardGrid.appendChild(accountCard);

  const providerCard = createElement("section", "policy-card");
  providerCard.appendChild(createElement("h4", "policy-card__title")).textContent = "B. Provider fraud controls";
  providerCard.appendChild(
    createElement("p", "policy-card__note"),
  ).textContent = "The biggest exploitation risk is providers billing too much or too often.";
  providerCard.appendChild(
    createDataTable({
      columns: [
        { label: "Abuse" },
        { label: "Fix" },
      ],
      rows: safeguards.provider_controls.map((entry) => [entry.abuse, entry.fix]),
      caption: "Provider control matrix",
    }),
  );
  providerCard.appendChild(createBulletList(safeguards.foundation_points));
  cardGrid.appendChild(providerCard);

  const boostCard = createElement("section", "policy-card");
  boostCard.appendChild(createElement("h4", "policy-card__title")).textContent = "C. Need-boost fraud controls";
  boostCard.appendChild(createBulletList(safeguards.boost_controls));
  boostCard.appendChild(createElement("p", "policy-card__note")).textContent =
    "Verified categories, capped boosts, and risk-weighted audits keep the system generous for real need but hard to game.";
  cardGrid.appendChild(boostCard);

  section.appendChild(cardGrid);
  return section;
}

function buildSavingsSection(data) {
  const latest = data.latest;
  const assumptions = data.assumptions;
  const model = getPolicyModel(data);
  const spending = model.spending;
  const population = getRecordById(latest, "us_population_estimate");
  const targetTotalSpending = assumptions.dashboard_model?.service_envelope?.target_total_spending;

  const section = createNarrativeSection({
    eyebrow: "2. Projected savings using U.S. population",
    title: "The half-spending target is modeled against the 2024 population baseline.",
    lede: assumptions.dashboard_model?.mixed_year_note,
  });

  const metricGrid = createElement("div", "policy-metric-grid");
  [
    {
      label: "Current total health spending",
      value: formatCompactCurrency(spending.current_total_spending),
      note: "Published CMS 2024 baseline",
    },
    {
      label: "Current per-person spending",
      value: formatCurrency(spending.current_per_person_spending),
      note: `Population base ${formatNumber(population?.value)}`,
    },
    {
      label: "Half-spending target",
      value: formatCompactCurrency(targetTotalSpending),
      note: "Model target",
    },
    {
      label: "Target per-person spending",
      value: formatCurrency(spending.target_per_person_spending),
      note: "Model target",
    },
    {
      label: "Gross national savings",
      value: formatCompactCurrency(spending.gross_national_savings),
      note: "Model estimate",
    },
  ].forEach((entry) => {
    const card = createElement("div", "policy-metric-card");
    card.appendChild(createElement("p", "policy-metric-card__label")).textContent = entry.label;
    card.appendChild(createElement("div", "policy-metric-card__value")).textContent = entry.value;
    card.appendChild(createElement("p", "policy-metric-card__note")).textContent = entry.note;
    metricGrid.appendChild(card);
  });
  section.appendChild(metricGrid);

  section.appendChild(
    createDataTable({
      columns: [
        { label: "Implementation success" },
        { label: "Annual savings" },
      ],
      rows: model.savings_cases.map((entry) => [entry.label, formatCompactCurrency(entry.annual_savings)]),
      caption: "Realistic savings scenarios",
    }),
  );
  section.appendChild(
    buildAttributionBlock({
      sourceName: "CMS 2024 baseline plus Census 2024 population inputs",
      sourceUrl: population?.source_url,
      lastChecked: population?.last_checked,
      method: "published values plus browser-side model estimates",
      extraLines: [
        `Population source: ${population?.source_name ?? "Local data"}`,
        "Savings scenarios are browser-side model estimates, not official scores.",
      ],
    }),
  );

  return section;
}

function buildPopulationGroupsSection(data) {
  const assumptions = data.assumptions;
  const model = getPolicyModel(data);
  const latest = data.latest;

  const section = createNarrativeSection({
    eyebrow: "3. Population groups you must cover",
    title: "Population sizing is derived from official 2024 inputs.",
    lede: "The dashboard computes these group sizes in the browser from the local 2024 Census-backed input records.",
  });

  section.appendChild(
    createDataTable({
      columns: [
        { label: "Group" },
        { label: "Approx. people" },
      ],
      rows: (assumptions.dashboard_model?.population_groups ?? []).map((entry) => [
        entry.label,
        formatCompactNumber(model.population_groups?.[entry.id]),
      ]),
      caption: "Population groups",
    }),
  );

  section.appendChild(
    buildAttributionBlock({
      sourceName: "Census QuickFacts V2024 and 2024 ACS 1-year veterans release",
      sourceUrl: getRecordById(latest, "us_population_estimate")?.source_url,
      lastChecked: getRecordById(latest, "veterans_total")?.last_checked,
      method: "published values plus browser-side derived counts",
      extraLines: [
        `Population estimate: ${formatNumber(getRecordById(latest, "us_population_estimate")?.value)}`,
        `Veteran population: ${formatCompactNumber(getRecordById(latest, "veterans_total")?.value)}`,
      ],
    }),
  );

  return section;
}

function buildServiceModelSection(data) {
  const assumptions = data.assumptions;
  const coverage = assumptions.dashboard_model?.service_coverage ?? {};

  const section = createNarrativeSection({
    eyebrow: "4. Service level at half spending",
    title: "The model funds a strong universal basic system, not unlimited care at current U.S. prices.",
    lede: "Core coverage stays broad for necessary care, while luxury access and low-value spending shift to restrictions or supplements.",
  });

  const coverageGrid = createElement("div", "policy-grid");

  const coveredCard = createElement("section", "policy-card");
  coveredCard.appendChild(createElement("h4", "policy-card__title")).textContent = "Covered for everyone";
  coveredCard.appendChild(
    createDataTable({
      columns: [
        { label: "Service" },
        { label: "Coverage level" },
      ],
      rows: (coverage.covered_for_everyone ?? []).map((entry) => [entry.service, entry.coverage_level]),
      caption: "Core coverage",
    }),
  );
  coverageGrid.appendChild(coveredCard);

  const limitedCard = createElement("section", "policy-card");
  limitedCard.appendChild(createElement("h4", "policy-card__title")).textContent = "Limited or supplemental";
  limitedCard.appendChild(
    createDataTable({
      columns: [
        { label: "Service" },
        { label: "Treatment" },
      ],
      rows: (coverage.limited_or_supplemental ?? []).map((entry) => [entry.service, entry.treatment]),
      caption: "Restricted and supplemental care",
    }),
  );
  coverageGrid.appendChild(limitedCard);

  section.appendChild(coverageGrid);
  return section;
}

function buildEnvelopeSection(data) {
  const assumptions = data.assumptions;
  const model = getPolicyModel(data);
  const envelope = assumptions.dashboard_model?.service_envelope ?? {};
  const groups = model.population_groups ?? {};

  const section = createNarrativeSection({
    eyebrow: "5. A workable half-spending service envelope",
    title: "One possible $2.65T model uses explicit per-person envelopes and a reserve.",
    lede: "The totals below are computed in the browser from the local group counts and the envelope assumptions stored in assumptions.json.",
  });

  const rows = (envelope.group_benchmarks ?? []).map((entry) => {
    if (entry.id === "admin_audit_reserve") {
      return [
        entry.label,
        formatPercent(entry.share_of_target),
        formatCompactCurrency(model.service_envelope.admin_audit_reserve_total),
      ];
    }

    const populationValue = groups[entry.population_group_id] ?? 0;
    const totalKey =
      entry.id === "age_65_plus"
        ? "age_65_plus_total"
        : entry.id === "under_65_disabled"
          ? "under_65_disabled_total"
          : entry.id === "other_under_65_population"
            ? "other_under_65_population_total"
            : "veteran_additive_total";

    return [
      entry.label,
      `${formatCurrency(entry.average_envelope)} x ${formatCompactNumber(populationValue)}`,
      formatCompactCurrency(model.service_envelope[totalKey]),
    ];
  });

  rows.push(["Remaining reserve", "Target minus modeled total", formatCompactCurrency(model.service_envelope.remaining_reserve)]);

  section.appendChild(
    createDataTable({
      columns: [
        { label: "Group or bucket" },
        { label: "Average envelope" },
        { label: "Approx. total" },
      ],
      rows,
      caption: "Half-spending envelope",
    }),
  );

  return section;
}

function buildHardTruthSection(data) {
  const assumptions = data.assumptions;
  const section = createNarrativeSection({
    eyebrow: "6. The hard truth",
    title: "Cutting spending in half requires explicit limits.",
    lede: "This system promises basic care, catastrophic protection, and need-based support. It does not promise unlimited billing at private-sector prices.",
  });

  section.appendChild(createBulletList(assumptions.dashboard_model?.hard_truth_requirements ?? []));

  const quote = createElement("blockquote", "policy-quote");
  quote.textContent = assumptions.dashboard_model?.system_pitch ?? "";
  section.appendChild(quote);

  return section;
}

function renderDashboardBody(root, data) {
  clearNode(root);

  const wrapper = createElement("div", "dashboard-shell");

  const intro = createElement("div", "dashboard-intro");
  intro.appendChild(createElement("p", "dashboard-intro__eyebrow")).textContent = "Local data dashboard";
  intro.appendChild(createElement("p", "dashboard-intro__copy")).textContent =
    "Every figure below is loaded from local JSON files. Published values, benchmark values, policy assumptions, and browser-side model estimates are separated and labeled.";
  wrapper.appendChild(intro);

  const metricGrid = createElement("div", "metric-grid");
  for (const card of buildMetricCards(data)) {
    metricGrid.appendChild(card);
  }
  wrapper.appendChild(metricGrid);

  wrapper.appendChild(buildCalculatorPanel(data));

  const policySections = createElement("div", "narrative-stack");
  policySections.appendChild(buildSafeguardsSection(data));
  policySections.appendChild(buildSavingsSection(data));
  policySections.appendChild(buildPopulationGroupsSection(data));
  policySections.appendChild(buildServiceModelSection(data));
  policySections.appendChild(buildEnvelopeSection(data));
  policySections.appendChild(buildHardTruthSection(data));
  wrapper.appendChild(policySections);

  const chartGrid = createElement("div", "chart-grid");
  for (const card of buildChartCards(data)) {
    chartGrid.appendChild(card);
  }
  wrapper.appendChild(chartGrid);

  root.appendChild(wrapper);
}

export function renderDashboard(root, data) {
  if (!root) {
    return;
  }

  const issues = validateDashboardData(data);
  if (issues.length > 0) {
    clearNode(root);
    root.appendChild(createErrorState(issues));
    return;
  }

  renderDashboardBody(root, data);
}

export function renderDashboardLoading(root) {
  if (!root) {
    return;
  }

  clearNode(root);
  root.appendChild(createEmptyState("Loading local data from public/data/*.json.", "This section will populate after the browser finishes loading the local contract."));
}

export function renderDashboardMissing(root) {
  if (!root) {
    return;
  }

  clearNode(root);
  root.appendChild(createEmptyState("The dashboard section is present, but the local data contract is unavailable."));
}
