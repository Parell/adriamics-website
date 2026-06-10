import {
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "./format.mjs";

const LOCAL_DATA_FILES = {
  latest: "../public/data/latest.json",
  history: "../public/data/history.json",
  calculated: "../public/data/calculated.json",
  sources: "../public/data/sources.json",
  assumptions: "../public/data/assumptions.json",
};

async function loadJson(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  return response.json();
}

async function loadSiteData() {
  const [latest, history, calculated, sources, assumptions] = await Promise.all([
    loadJson(LOCAL_DATA_FILES.latest),
    loadJson(LOCAL_DATA_FILES.history),
    loadJson(LOCAL_DATA_FILES.calculated),
    loadJson(LOCAL_DATA_FILES.sources),
    loadJson(LOCAL_DATA_FILES.assumptions),
  ]);

  return { latest, history, calculated, sources, assumptions };
}

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

function createSourceMetaLine(label, value, href) {
  const line = createElement("p", "source-meta__line");
  const labelNode = createElement("span", "source-meta__label");
  labelNode.textContent = `${label}: `;
  line.appendChild(labelNode);

  if (href) {
    const link = createElement("a", "source-meta__link", {
      href,
      target: "_blank",
      rel: "noreferrer",
    });
    link.textContent = value;
    line.appendChild(link);
  } else {
    const valueNode = createElement("span", "source-meta__value");
    valueNode.textContent = value;
    line.appendChild(valueNode);
  }

  return line;
}

function createMetaBlock(lines) {
  const block = createElement("div", "source-meta");
  for (const line of lines) {
    if (!line) {
      continue;
    }

    const { label, value, href } = line;
    block.appendChild(createSourceMetaLine(label, value, href));
  }
  return block;
}

function formatRecordValue(record) {
  if (!isObject(record)) {
    return "-";
  }

  if (record.unit === "usd" || record.unit === "currency") {
    return formatCompactCurrency(record.value);
  }

  if (record.unit === "share") {
    return formatPercent(record.value);
  }

  if (record.unit === "people") {
    return formatCompactNumber(record.value);
  }

  if (Number.isFinite(record.value)) {
    return formatNumber(record.value);
  }

  return "-";
}

function createPageHeader() {
  const header = createElement("header", "site-header");

  const lockup = createElement("div", "brand-lockup");
  lockup.appendChild(createElement("span", "brand-mark", { "aria-hidden": "true" }));
  const lockupCopy = createElement("div");
  lockupCopy.appendChild(createElement("p", "eyebrow")).textContent = "American Health";
  lockupCopy.appendChild(createElement("p", "brand-title")).textContent = "Source Catalog";
  lockup.appendChild(lockupCopy);
  header.appendChild(lockup);

  const nav = createElement("nav", "site-nav", { "aria-label": "Primary" });
  nav.appendChild(createElement("a", "", { href: "../index.html" })).textContent = "Home";
  nav.appendChild(createElement("a", "", { href: "../index.html#dashboard" })).textContent = "Dashboard";
  nav.appendChild(createElement("a", "", { href: "../index.html#today-vs-proposed" })).textContent = "Diagram";
  nav.appendChild(createElement("a", "", { href: "../index.html#singapore-note" })).textContent = "Singapore";
  nav.appendChild(createElement("a", "", { href: "./" })).textContent = "Sources";
  header.appendChild(nav);

  return header;
}

function createPageFooter() {
  const footer = createElement("footer", "site-footer");

  const top = createElement("div", "footer-top");
  top.appendChild(createElement("a", "footer__top", { href: "../index.html" })).textContent = "Back to home";
  top.appendChild(createElement("span", "footer__sep", { "aria-hidden": "true" })).textContent = "-";
  top.appendChild(createElement("span", "footer-note")).textContent = "American Health";
  footer.appendChild(top);

  footer.appendChild(createElement("div", "footer-rule", { "aria-hidden": "true" }));
  footer.appendChild(
    (() => {
      const copy = createElement("p", "footer-copy");
      copy.textContent =
        "This page lists the local JSON contract, the source manifest, and the model outputs used by the site.";
      return copy;
    })(),
  );

  return footer;
}

function createMetricCard({ label, value, subvalue }) {
  const card = createElement("article", "metric-card");
  card.appendChild(createElement("p", "metric-card__label")).textContent = label;
  card.appendChild(createElement("div", "metric-card__value")).textContent = value;
  if (subvalue) {
    card.appendChild(createElement("p", "metric-card__subvalue")).textContent = subvalue;
  }
  return card;
}

function createSummaryMetrics(data) {
  const latestCount = Array.isArray(data.latest?.records) ? data.latest.records.length : 0;
  const historySeriesCount = Array.isArray(data.history?.series) ? data.history.series.length : 0;
  const sourceCount = Array.isArray(data.sources?.sources) ? data.sources.sources.length : 0;
  const scenarioCount = Array.isArray(data.calculated?.scenarios) ? data.calculated.scenarios.length : 0;

  const cards = [
    createMetricCard({
      label: "Sources",
      value: formatCompactNumber(sourceCount),
      subvalue: "Named source records in the manifest",
    }),
    createMetricCard({
      label: "Published fields",
      value: formatCompactNumber(latestCount),
      subvalue: "Latest dashboard records",
    }),
    createMetricCard({
      label: "Historical series",
      value: formatCompactNumber(historySeriesCount),
      subvalue: "Seeded time series entries",
    }),
    createMetricCard({
      label: "Calculated scenarios",
      value: formatCompactNumber(scenarioCount),
      subvalue: "Browser-side model outputs",
    }),
  ];

  const grid = createElement("div", "metric-grid");
  for (const card of cards) {
    grid.appendChild(card);
  }
  return grid;
}

function createSourceCard(source) {
  const card = createElement("section", "policy-card");
  card.appendChild(createElement("h3", "policy-card__title")).textContent = source.name ?? source.id ?? "Source";
  card.appendChild(
    createMetaBlock([
      { label: "Group", value: source.group ?? "-" },
      { label: "Status", value: source.status ?? "-" },
      { label: "Cadence", value: source.cadence ?? "-" },
      { label: "Period", value: source.period_type ?? "-" },
      { label: "URL", value: source.url ?? "-", href: source.url },
      { label: "Referenced", value: source.referenced ? "Yes" : "No" },
    ]),
  );

  if (source.notes) {
    card.appendChild(createElement("p", "policy-card__note")).textContent = source.notes;
  }

  const fields = Array.isArray(source.fields) ? source.fields : [];
  if (fields.length > 0) {
    card.appendChild(
      createDataTable({
        columns: [
          { label: "Field" },
          { label: "Output path" },
        ],
        rows: fields.map((field) => {
          const provenance = Array.isArray(source.field_provenance)
            ? source.field_provenance.find((entry) => entry.field === field)
            : null;
          return [field, provenance?.output_path ?? "-"];
        }),
        caption: "Fields from this source",
      }),
    );
  }

  return card;
}

function createTableSection({ eyebrow, title, lede, columns, rows, caption }) {
  const section = createElement("section", "panel section-frame");
  const head = createElement("div", "section-head");
  head.appendChild(createElement("p", "panel-label")).textContent = eyebrow;
  head.appendChild(createElement("h2")).textContent = title;
  if (lede) {
    head.appendChild(createElement("p", "section-intro")).textContent = lede;
  }
  section.appendChild(head);
  section.appendChild(
    createDataTable({
      columns,
      rows,
      caption,
    }),
  );
  return section;
}

function createSourceManifestSection(data) {
  const section = createElement("section", "panel section-frame");
  const head = createElement("div", "section-head");
  head.appendChild(createElement("p", "panel-label")).textContent = "Source manifest";
  head.appendChild(createElement("h2")).textContent = "Every named source is listed here with the fields it contributes.";
  head.appendChild(createElement("p", "section-intro")).textContent =
    "This is the canonical manifest for published data used by the dashboard and charts.";
  section.appendChild(head);

  const grid = createElement("div", "policy-grid");
  for (const source of data.sources?.sources ?? []) {
    grid.appendChild(createSourceCard(source));
  }
  section.appendChild(grid);
  return section;
}

function createPublishedRecordsSection(data) {
  const rows = (data.latest?.records ?? []).map((record) => [
    record.label ?? record.id ?? "-",
    formatRecordValue(record),
    record.unit ?? "-",
    record.source_name ?? "-",
    formatDate(record.last_checked),
    record.model_label ?? "-",
  ]);

  return createTableSection({
    eyebrow: "Published data",
    title: "Latest dashboard records",
    lede: "These are the current published or seeded records shown on the home dashboard.",
    columns: [
      { label: "Field" },
      { label: "Value" },
      { label: "Unit" },
      { label: "Source" },
      { label: "Last checked" },
      { label: "Method" },
    ],
    rows,
    caption: "Current published records",
  });
}

function createHistorySection(data) {
  const rows = (data.history?.series ?? []).map((series) => {
    const records = Array.isArray(series.records) ? series.records : [];
    const lastRecord = records.at(-1) ?? null;
    return [
      series.label ?? series.id ?? "-",
      formatCompactNumber(records.length),
      Number.isFinite(lastRecord?.year) ? String(lastRecord.year) : "-",
      formatRecordValue(lastRecord),
      series.source_name ?? lastRecord?.source_name ?? "-",
      lastRecord?.model_label ?? series.model_label ?? "-",
    ];
  });

  return createTableSection({
    eyebrow: "Historical series",
    title: "Seeded time series fields",
    lede: "These are the historical series used for the U.S. spending trend and the Singapore benchmark.",
    columns: [
      { label: "Series" },
      { label: "Record count" },
      { label: "Latest year" },
      { label: "Latest value" },
      { label: "Source" },
      { label: "Method" },
    ],
    rows,
    caption: "Historical series summary",
  });
}

function createCalculatedSection(data) {
  const summaryRows = [
    ["National health expenditures", formatCompactCurrency(data.calculated?.inputs?.national_health_expenditures)],
    ["Health spending GDP share", formatPercent(data.calculated?.inputs?.health_spending_gdp_share)],
    ["Federal sponsor share", formatPercent(data.calculated?.inputs?.federal_sponsor_share)],
    ["State/local sponsor share", formatPercent(data.calculated?.inputs?.state_local_sponsor_share)],
    ["Target government health share", formatPercent(data.calculated?.inputs?.target_government_health_share_gdp)],
    ["Target total health share", formatPercent(data.calculated?.inputs?.target_total_health_share_gdp)],
    ["Implementation efficiency", formatPercent(data.calculated?.inputs?.implementation_efficiency)],
    ["Transition cost offset", formatPercent(data.calculated?.inputs?.transition_cost_offset)],
  ];

  const scenarioRows = (data.calculated?.scenarios ?? []).map((scenario) => [
    scenario.id ?? "-",
    formatPercent(scenario.target_government_health_share_gdp),
    formatPercent(scenario.target_total_health_share_gdp),
    formatPercent(scenario.implementation_efficiency),
    formatPercent(scenario.transition_cost_offset),
    formatCompactCurrency(scenario.target_government_health_spending),
    formatCompactCurrency(scenario.gross_government_savings),
    formatCompactCurrency(scenario.adjusted_government_savings),
    formatCompactCurrency(scenario.national_spending_at_target),
    formatCompactCurrency(scenario.national_savings),
    scenario.model_label ?? "-",
  ]);

  const section = createElement("section", "panel section-frame");
  const head = createElement("div", "section-head");
  head.appendChild(createElement("p", "panel-label")).textContent = "Calculated outputs";
  head.appendChild(createElement("h2")).textContent = "Browser-side model inputs and scenario outputs";
  head.appendChild(createElement("p", "section-intro")).textContent =
    "These values are recomputed locally from the published records and the assumption defaults.";
  section.appendChild(head);

  section.appendChild(
    createDataTable({
      columns: [
        { label: "Input field" },
        { label: "Value" },
      ],
      rows: summaryRows,
      caption: "Model inputs",
    }),
  );

  section.appendChild(
    createDataTable({
      columns: [
        { label: "Scenario" },
        { label: "Gov share" },
        { label: "Total share" },
        { label: "Efficiency" },
        { label: "Transition offset" },
        { label: "Target gov spending" },
        { label: "Gross gov savings" },
        { label: "Adjusted gov savings" },
        { label: "National spending at target" },
        { label: "National savings" },
        { label: "Method" },
      ],
      rows: scenarioRows,
      caption: "Scenario outputs",
    }),
  );

  return section;
}

function createAssumptionsSection(data) {
  const section = createElement("section", "panel section-frame");
  const head = createElement("div", "section-head");
  head.appendChild(createElement("p", "panel-label")).textContent = "Assumptions";
  head.appendChild(createElement("h2")).textContent = "Policy assumptions and model assumptions are shown separately.";
  head.appendChild(createElement("p", "section-intro")).textContent =
    "The site separates policy assumptions from model assumptions so the reader can see what is fixed and what is calculated.";
  section.appendChild(head);

  const stack = createElement("div", "narrative-stack");

  stack.appendChild(
    createTableSection({
      eyebrow: "Policy assumptions",
      title: "Policy rules described in the manifest",
      lede: "These are the fixed policy assumptions the site uses to describe the proposal.",
      columns: [
        { label: "ID" },
        { label: "Label" },
        { label: "Type" },
      ],
      rows: (data.assumptions?.policy_assumptions ?? []).map((entry) => [
        entry.id ?? "-",
        entry.label ?? "-",
        entry.type ?? "-",
      ]),
      caption: "Policy assumptions",
    }),
  );

  stack.appendChild(
    createTableSection({
      eyebrow: "Model assumptions",
      title: "Defaults used by the calculator",
      lede: "These values seed the browser-side scenario grid and the live calculator sliders.",
      columns: [
        { label: "ID" },
        { label: "Label" },
        { label: "Default" },
        { label: "Unit" },
      ],
      rows: (data.assumptions?.model_assumptions ?? []).map((entry) => [
        entry.id ?? "-",
        entry.label ?? "-",
        formatNumber(entry.default),
        entry.unit ?? "-",
      ]),
      caption: "Model assumptions",
    }),
  );

  stack.appendChild(
    createTableSection({
      eyebrow: "Rollout sequence",
      title: "Implementation phases",
      lede: "This is the ordered rollout path that also appears in the dashboard timeline chart.",
      columns: [
        { label: "Phase" },
        { label: "Label" },
        { label: "Description" },
      ],
      rows: (data.assumptions?.rollout_sequence ?? []).map((entry) => [
        Number.isFinite(entry.phase) ? String(entry.phase) : "-",
        entry.label ?? "-",
        entry.description ?? "-",
      ]),
      caption: "Rollout sequence",
    }),
  );

  const safeguards = data.assumptions?.safeguards_model ?? {};
  stack.appendChild(
    createTableSection({
      eyebrow: "Safeguards model",
      title: "Key formulas and controls",
      lede: safeguards.headline ?? "The site labels the account, payment, boost, and audit rules separately.",
      columns: [
        { label: "Label" },
        { label: "Expression" },
      ],
      rows: [
        [safeguards.account_formula?.label ?? "Account formula", safeguards.account_formula?.expression ?? "-"],
        [safeguards.payment_formula?.label ?? "Payment formula", safeguards.payment_formula?.expression ?? "-"],
        [safeguards.boost_formula?.label ?? "Boost formula", safeguards.boost_formula?.expression ?? "-"],
        [safeguards.boost_cap_formula?.label ?? "Boost cap", safeguards.boost_cap_formula?.expression ?? "-"],
        [safeguards.audit_formula?.label ?? "Audit formula", safeguards.audit_formula?.expression ?? "-"],
      ],
      caption: "Safeguards formulas",
    }),
  );

  const dashboardModel = data.assumptions?.dashboard_model ?? {};
  const dashboardRows = [
    ["Baseline label", dashboardModel.baseline_label ?? "-"],
    ["Mixed year note", dashboardModel.mixed_year_note ?? "-"],
    ["Savings scenarios", formatCompactNumber(Array.isArray(dashboardModel.savings_scenarios) ? dashboardModel.savings_scenarios.length : 0)],
    ["Population groups", formatCompactNumber(Array.isArray(dashboardModel.population_groups) ? dashboardModel.population_groups.length : 0)],
    ["Core coverage items", formatCompactNumber(Array.isArray(dashboardModel.service_coverage?.covered_for_everyone) ? dashboardModel.service_coverage.covered_for_everyone.length : 0)],
    ["Supplemental items", formatCompactNumber(Array.isArray(dashboardModel.service_coverage?.limited_or_supplemental) ? dashboardModel.service_coverage.limited_or_supplemental.length : 0)],
    ["Half-spending target", formatCompactCurrency(dashboardModel.service_envelope?.target_total_spending)],
    ["Hard truth requirements", formatCompactNumber(Array.isArray(dashboardModel.hard_truth_requirements) ? dashboardModel.hard_truth_requirements.length : 0)],
  ];

  stack.appendChild(
    createTableSection({
      eyebrow: "Dashboard model",
      title: "Readable dashboard assumptions",
      lede: dashboardModel.system_pitch ?? "The dashboard-model section groups the policy story with the browser-side calculator assumptions.",
      columns: [
        { label: "Field" },
        { label: "Value" },
      ],
      rows: dashboardRows,
      caption: "Dashboard model summary",
    }),
  );

  section.appendChild(stack);
  return section;
}

function createLoadingState() {
  const state = createElement("div", "dashboard-state dashboard-state--empty");
  state.appendChild(createElement("h3", "dashboard-state__title")).textContent = "Loading sources";
  state.appendChild(createElement("p", "dashboard-state__message")).textContent =
    "The source catalog is loading the local JSON contract.";
  return state;
}

function createErrorState(message) {
  const state = createElement("div", "dashboard-state dashboard-state--error");
  state.appendChild(createElement("h3", "dashboard-state__title")).textContent = "Source catalog unavailable";
  state.appendChild(createElement("p", "dashboard-state__message")).textContent = message;
  return state;
}

function renderSourcesPage(root, data) {
  clearNode(root);

  const wrapper = createElement("div", "dashboard-shell");
  wrapper.appendChild(createPageHeader());

  const hero = createElement("section", "panel hero-frame", { "aria-labelledby": "sources-title" });
  hero.appendChild(createElement("div", "panel-label")).textContent = "Source transparency";
  const heroContent = createElement("div", "hero-content");
  heroContent.appendChild(createElement("p", "eyebrow")).textContent = "Local data only";
  heroContent.appendChild(createElement("h1", null, { id: "sources-title" })).textContent =
    "Every source, field, assumption, and model output used by the site.";
  heroContent.appendChild(createElement("p", "lede")).textContent =
    "This page is the citation index for the home explainer and dashboard. It lists the source manifest, the published records, the historical series, the calculator outputs, and the assumptions manifest from the local JSON contract.";
  hero.appendChild(heroContent);
  hero.appendChild(
    createMetaBlock([
      { label: "Contract generated", value: formatDate(data.latest?.generated_at ?? data.sources?.generated_at) },
      { label: "Manifest version", value: data.sources?.version ?? "-" },
      { label: "Latest baseline year", value: Number.isFinite(data.latest?.baseline_year) ? String(data.latest.baseline_year) : "-" },
      { label: "Local only", value: "Yes" },
    ]),
  );
  wrapper.appendChild(hero);

  wrapper.appendChild(createSummaryMetrics(data));
  wrapper.appendChild(createSourceManifestSection(data));
  wrapper.appendChild(createPublishedRecordsSection(data));
  wrapper.appendChild(createHistorySection(data));
  wrapper.appendChild(createCalculatedSection(data));
  wrapper.appendChild(createAssumptionsSection(data));
  wrapper.appendChild(createPageFooter());

  root.appendChild(wrapper);
}

async function bootstrap() {
  const root = document.querySelector("[data-sources-root]");
  if (!root) {
    return;
  }

  clearNode(root);
  root.appendChild(createLoadingState());

  try {
    const data = await loadSiteData();
    renderSourcesPage(root, data);
  } catch (error) {
    console.error(error);
    clearNode(root);
    root.appendChild(createErrorState("The local JSON files could not be loaded. Check public/data for missing or invalid files."));
  }
}

void bootstrap();
