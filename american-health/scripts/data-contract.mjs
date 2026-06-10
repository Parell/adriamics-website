import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDefaultScenarioGrid, computeCurrentGovernmentHealthSpending, computeImpliedGDP } from "../src/calculator.mjs";

const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(PROJECT_DIR, "data", "raw");
const NORMALIZED_DIR = path.join(PROJECT_DIR, "data", "normalized");
const PUBLIC_DATA_DIR = path.join(PROJECT_DIR, "public", "data");

export const SOURCE_URLS = {
  cmsNheFactSheet:
    "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet",
  cmsNheHistorical:
    "https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/historical",
  treasuryFiscalDataApi: "https://fiscaldata.treasury.gov/api-documentation/",
  treasuryMonthlyStatement: "https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/",
  cboBudgetOutlook: "https://www.cbo.gov/publication/62105",
  ssaTrusteesReport: "https://www.ssa.gov/oact/trsum/",
  worldBankWdi: "https://data.worldbank.org/indicator/SH.XPD.CHEX.GD.ZS",
  whoGhed: "https://ghdx.healthdata.org/record/ihme-data/world-health-organization-global-health-expenditure-database-ghed",
  singaporeMoh: "https://www.moh.gov.sg/",
  beaApi: "https://apps.bea.gov/API/signup/",
  fredGdp: "https://fred.stlouisfed.org/series/GDP",
};

const RAW_INPUT_FILES = {
  latest: path.join(RAW_DIR, "cms", "latest-baseline.json"),
  history: path.join(RAW_DIR, "cms", "history-seed.json"),
  assumptions: path.join(RAW_DIR, "model", "assumptions.json"),
  manifest: path.join(RAW_DIR, "source-manifest.json"),
};

const OUTPUT_FILES = {
  latest: "latest.json",
  history: "history.json",
  calculated: "calculated.json",
  sources: "sources.json",
  assumptions: "assumptions.json",
};

const SPONSOR_SHARE_IDS = new Set([
  "federal_sponsor_share",
  "state_local_sponsor_share",
  "household_sponsor_share",
  "private_business_sponsor_share",
]);

export class ContractValidationError extends Error {
  constructor(issues) {
    super(`American Health data contract validation failed:\n- ${issues.join("\n- ")}`);
    this.name = "ContractValidationError";
    this.issues = issues;
  }
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(filePath) {
  const text = await readFile(filePath, "utf8");
  return JSON.parse(text);
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildRecordIndex(records) {
  const index = {};

  for (const record of records) {
    index[record.id] = record;
  }

  return index;
}

function ensureSourceMetadata(record, fallback) {
  return {
    ...record,
    source_id: record.source_id ?? fallback.source_id,
    source_name: record.source_name ?? fallback.source_name,
    source_url: record.source_url ?? fallback.source_url,
    last_checked: record.last_checked ?? fallback.checked_at,
    model_label: record.model_label ?? fallback.model_label ?? "published value",
  };
}

function normalizeLatest(rawLatest) {
  if (!isObject(rawLatest)) {
    throw new Error("Latest CMS raw input must be an object.");
  }

  if (!Array.isArray(rawLatest.records)) {
    throw new Error("Latest CMS raw input must contain a records array.");
  }

  const records = rawLatest.records.map((record) => ensureSourceMetadata(record, rawLatest));
  const byId = buildRecordIndex(records);

  return {
    generated_at: rawLatest.generated_at ?? new Date().toISOString(),
    baseline_year: rawLatest.baseline_year,
    source_id: rawLatest.source_id,
    source_name: rawLatest.source_name,
    source_url: rawLatest.source_url,
    release_label: rawLatest.release_label ?? "CMS 2024 release",
    records,
    by_id: byId,
  };
}

function normalizeHistory(rawHistory, latest) {
  const rawSeries = Array.isArray(rawHistory?.series) ? rawHistory.series : [];
  const series = rawSeries.length > 0 ? rawSeries : latest.records.map((record) => ({
    id: record.id,
    label: record.label,
    unit: record.unit,
    calendar_year: true,
    records: [
      {
        year: record.calendar_year,
        value: record.value,
        source_id: record.source_id,
        source_name: record.source_name,
        source_url: record.source_url,
        last_checked: record.last_checked,
        model_label: record.model_label,
      },
    ],
  }));

  return {
    generated_at: rawHistory?.generated_at ?? new Date().toISOString(),
    baseline_year: latest.baseline_year,
    series: series.map((entry) => ({
      ...entry,
      records: Array.isArray(entry.records)
      ? [...entry.records]
            .map((record) => ({
              ...record,
              calendar_year: record.calendar_year ?? entry.calendar_year ?? true,
              fiscal_year: record.fiscal_year ?? entry.fiscal_year ?? false,
              source_id: record.source_id ?? entry.source_id ?? latest.source_id,
              source_name: record.source_name ?? entry.source_name ?? latest.source_name,
              source_url: record.source_url ?? entry.source_url ?? latest.source_url,
              last_checked: record.last_checked ?? entry.last_checked ?? latest.generated_at,
              model_label: record.model_label ?? entry.model_label ?? "published value",
            }))
            .sort((a, b) => a.year - b.year)
        : [],
    })),
    by_id: buildRecordIndex(
      series.map((entry) => ({
        id: entry.id,
        ...entry,
      })),
    ),
  };
}

function normalizeAssumptions(rawAssumptions) {
  if (!isObject(rawAssumptions)) {
    throw new Error("Assumptions raw input must be an object.");
  }

  return {
    generated_at: rawAssumptions.generated_at ?? new Date().toISOString(),
    policy_assumptions: Array.isArray(rawAssumptions.policy_assumptions) ? rawAssumptions.policy_assumptions : [],
    model_assumptions: Array.isArray(rawAssumptions.model_assumptions) ? rawAssumptions.model_assumptions : [],
    rollout_sequence: Array.isArray(rawAssumptions.rollout_sequence) ? rawAssumptions.rollout_sequence : [],
    safeguards_model: isObject(rawAssumptions.safeguards_model) ? rawAssumptions.safeguards_model : {},
    dashboard_model: isObject(rawAssumptions.dashboard_model) ? rawAssumptions.dashboard_model : {},
  };
}

function normalizeSources(rawManifest) {
  if (!isObject(rawManifest) || !Array.isArray(rawManifest.sources)) {
    throw new Error("Source manifest raw input must contain a sources array.");
  }

  return {
    generated_at: rawManifest.generated_at ?? new Date().toISOString(),
    version: rawManifest.version ?? "1",
    sources: rawManifest.sources.map((source) => ({
      ...source,
      fields: Array.isArray(source.fields) ? source.fields : [],
    })),
  };
}

function buildCalculated(latest, assumptions) {
  const recordIndex = latest.by_id;
  const totalHealthSpending = recordIndex.national_health_expenditures?.value ?? 0;
  const healthSpendingGdpShare = recordIndex.health_spending_gdp_share?.value ?? 0;
  const federalSponsorShare = recordIndex.federal_sponsor_share?.value ?? 0;
  const stateLocalSponsorShare = recordIndex.state_local_sponsor_share?.value ?? 0;

  const modelAssumptions = Object.fromEntries(
    assumptions.model_assumptions.map((entry) => [entry.id, entry.default]),
  );

  const targetTotalHealthShareGdp = modelAssumptions.target_total_health_share_gdp ?? 0.12;
  const targetGovernmentHealthShareGdp = modelAssumptions.target_government_health_share_gdp ?? 0.04;
  const implementationEfficiency = modelAssumptions.implementation_efficiency ?? 0.5;
  const transitionCostOffset = modelAssumptions.transition_cost_offset ?? 0.1;

  const impliedGdp = computeImpliedGDP(totalHealthSpending, healthSpendingGdpShare);
  const currentGovernmentHealthSpending = computeCurrentGovernmentHealthSpending(
    totalHealthSpending,
    federalSponsorShare,
    stateLocalSponsorShare,
  );

  const scenarios = buildDefaultScenarioGrid({
    impliedGdp,
    currentGovernmentHealthSpending,
    currentNationalHealthSpending: totalHealthSpending,
    targetTotalHealthShareGdp,
    implementationEfficiency,
    transitionCostOffset,
  }).map((scenario) => ({
    ...scenario,
    model_label: "model estimate",
  }));

  return {
    generated_at: new Date().toISOString(),
    baseline_year: latest.baseline_year,
    inputs: {
      national_health_expenditures: totalHealthSpending,
      health_spending_gdp_share: healthSpendingGdpShare,
      federal_sponsor_share: federalSponsorShare,
      state_local_sponsor_share: stateLocalSponsorShare,
      target_government_health_share_gdp: targetGovernmentHealthShareGdp,
      target_total_health_share_gdp: targetTotalHealthShareGdp,
      implementation_efficiency: implementationEfficiency,
      transition_cost_offset: transitionCostOffset,
    },
    summary: {
      implied_gdp: impliedGdp,
      current_government_health_spending: currentGovernmentHealthSpending,
    },
    scenarios,
    by_id: buildRecordIndex(scenarios),
  };
}

function buildSources(rawManifest, latest, history) {
  const manifest = normalizeSources(rawManifest);
  const chartedMetricIds = new Set([
    ...latest.records.map((record) => record.id),
    ...history.series.map((series) => series.id),
  ]);
  const sourceIds = new Set([
    latest.source_id,
    ...latest.records.map((record) => record.source_id),
    ...history.series.flatMap((series) => series.records.map((record) => record.source_id)),
  ]);

  return {
    generated_at: manifest.generated_at,
    version: manifest.version,
    sources: manifest.sources.map((source) => ({
      ...source,
      charted_fields: (Array.isArray(source.fields) ? source.fields : []).filter((field) => chartedMetricIds.has(field)),
      field_provenance: (Array.isArray(source.fields) ? source.fields : []).map((field) => ({
        field,
        output_path:
          source.id === "cms_nhe_historical"
            ? `history.by_id.${field}`
            : `latest.by_id.${field}`,
      })),
      referenced: sourceIds.has(source.id),
    })),
  };
}

function validateNumeric(value, message, issues) {
  if (!Number.isFinite(value)) {
    issues.push(message);
  }
}

function validateLatest(latest, issues) {
  if (!isObject(latest)) {
    issues.push("latest.json must be an object.");
    return;
  }

  if (!Array.isArray(latest.records)) {
    issues.push("latest.json must contain a records array.");
    return;
  }

  for (const record of latest.records) {
    if (!isObject(record)) {
      issues.push("Each latest record must be an object.");
      continue;
    }

    if (!record.source_id || !record.source_name || !record.source_url || !record.last_checked) {
      issues.push(`Latest record ${record.id ?? "(unknown)"} is missing source metadata.`);
    }

    validateNumeric(record.value, `Latest record ${record.id ?? "(unknown)"} must have a numeric value.`, issues);

    if ((record.unit === "usd" || record.unit === "currency") && record.value <= 0) {
      issues.push(`Spending value ${record.id ?? "(unknown)"} must be positive.`);
    }

    if ((record.unit === "share" || String(record.id).includes("gdp_share") || SPONSOR_SHARE_IDS.has(record.id)) && (record.value < 0 || record.value > 1)) {
      issues.push(`Share value ${record.id ?? "(unknown)"} must be between 0 and 1.`);
    }

    if ((record.calendar_year && record.fiscal_year) || (!record.calendar_year && !record.fiscal_year)) {
      issues.push(`Latest record ${record.id ?? "(unknown)"} must be labeled as calendar year or fiscal year.`);
    }
  }

  const sponsorShareSum = latest.records
    .filter((record) => SPONSOR_SHARE_IDS.has(record.id))
    .reduce((sum, record) => sum + safeNumber(record.value), 0);

  if (sponsorShareSum > 0 && Math.abs(1 - sponsorShareSum) > 0.1) {
    issues.push(`Sponsor shares should total close to 1.0, but total ${sponsorShareSum.toFixed(3)}.`);
  }
}

function safeNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

function validateHistory(history, issues) {
  if (!isObject(history) || !Array.isArray(history.series)) {
    issues.push("history.json must contain a series array.");
    return;
  }

  for (const series of history.series) {
    if (!isObject(series) || !Array.isArray(series.records)) {
      issues.push(`History series ${series?.id ?? "(unknown)"} must contain records.`);
      continue;
    }

    let previousYear = null;
    for (const record of series.records) {
      if (!record.source_id || !record.source_name || !record.source_url || !record.last_checked) {
        issues.push(`History record in ${series.id ?? "(unknown)"} is missing source metadata.`);
      }

      validateNumeric(record.year, `History record in ${series.id ?? "(unknown)"} must have a numeric year.`, issues);
      validateNumeric(record.value, `History record in ${series.id ?? "(unknown)"} must have a numeric value.`, issues);

      if (previousYear !== null && record.year < previousYear) {
        issues.push(`History series ${series.id ?? "(unknown)"} regressed from ${previousYear} to ${record.year}.`);
      }
      previousYear = record.year;

      if ((record.calendar_year && record.fiscal_year) || (!record.calendar_year && !record.fiscal_year)) {
        issues.push(`History record in ${series.id ?? "(unknown)"} must be labeled as calendar year or fiscal year.`);
      }
    }
  }
}

function validateCalculated(calculated, issues) {
  if (!isObject(calculated) || !Array.isArray(calculated.scenarios)) {
    issues.push("calculated.json must contain a scenarios array.");
    return;
  }

  for (const scenario of calculated.scenarios) {
    if (!isObject(scenario)) {
      issues.push("Each calculated scenario must be an object.");
      continue;
    }

    if (!scenario.model_label) {
      issues.push(`Calculated scenario ${scenario.id ?? "(unknown)"} must be labeled as a model estimate.`);
    }

    const numericFields = [
      "target_government_health_share_gdp",
      "target_total_health_share_gdp",
      "implementation_efficiency",
      "transition_cost_offset",
      "target_government_health_spending",
      "gross_government_savings",
      "transition_cost_deduction",
      "adjusted_government_savings",
      "national_spending_at_target",
      "national_savings",
    ];

    for (const field of numericFields) {
      validateNumeric(scenario[field], `Calculated scenario ${scenario.id ?? "(unknown)"} is missing ${field}.`, issues);
    }

    if (scenario.target_government_health_share_gdp < 0 || scenario.target_government_health_share_gdp > 1) {
      issues.push(`Calculated scenario ${scenario.id ?? "(unknown)"} has an invalid government health share.`);
    }

    if (scenario.target_total_health_share_gdp < 0 || scenario.target_total_health_share_gdp > 1) {
      issues.push(`Calculated scenario ${scenario.id ?? "(unknown)"} has an invalid total health spending share.`);
    }
  }
}

function validateSources(sources, issues) {
  if (!isObject(sources) || !Array.isArray(sources.sources)) {
    issues.push("sources.json must contain a sources array.");
    return;
  }

  for (const source of sources.sources) {
    if (!isObject(source)) {
      issues.push("Each source manifest entry must be an object.");
      continue;
    }

    if (!source.id || !source.name || !source.url) {
      issues.push("Every source entry must include id, name, and url.");
    }

    if (!Array.isArray(source.fields)) {
      issues.push(`Source ${source.id ?? "(unknown)"} must include a fields array.`);
    }
  }
}

function validateAssumptions(assumptions, issues) {
  if (!isObject(assumptions)) {
    issues.push("assumptions.json must be an object.");
    return;
  }

  if (
    !Array.isArray(assumptions.policy_assumptions) ||
    !Array.isArray(assumptions.model_assumptions) ||
    !Array.isArray(assumptions.rollout_sequence)
  ) {
    issues.push("assumptions.json must contain policy_assumptions, model_assumptions, and rollout_sequence arrays.");
    return;
  }

  for (const step of assumptions.rollout_sequence) {
    if (!isObject(step)) {
      issues.push("Each rollout sequence entry must be an object.");
      continue;
    }

    if (!step.id || !step.label || !step.description || !Number.isFinite(step.phase)) {
      issues.push(`Rollout sequence entry ${step.id ?? "(unknown)"} must include id, phase, label, and description.`);
    }
  }

  if (!isObject(assumptions.safeguards_model)) {
    issues.push("assumptions.json must contain safeguards_model.");
  }

  if (!isObject(assumptions.dashboard_model)) {
    issues.push("assumptions.json must contain dashboard_model.");
  }
}

export function validateContract(contract, { previousLatest, allowYearRegression = false } = {}) {
  const issues = [];

  validateLatest(contract.latest, issues);
  validateHistory(contract.history, issues);
  validateCalculated(contract.calculated, issues);
  validateSources(contract.sources, issues);
  validateAssumptions(contract.assumptions, issues);

  const baselineYear = contract.latest?.baseline_year;
  const previousBaselineYear = previousLatest?.baseline_year;

  if (
    !allowYearRegression &&
    Number.isFinite(baselineYear) &&
    Number.isFinite(previousBaselineYear) &&
    baselineYear < previousBaselineYear
  ) {
    issues.push(`Latest year regressed from ${previousBaselineYear} to ${baselineYear}.`);
  }

  if (issues.length > 0) {
    throw new ContractValidationError(issues);
  }

  return true;
}

async function loadRawInputs() {
  return {
    latest: await readJson(RAW_INPUT_FILES.latest),
    history: await readJson(RAW_INPUT_FILES.history),
    assumptions: await readJson(RAW_INPUT_FILES.assumptions),
    manifest: await readJson(RAW_INPUT_FILES.manifest),
  };
}

async function loadPreviousLatest() {
  const filePath = path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.latest);

  try {
    await access(filePath);
    return readJson(filePath);
  } catch {
    return null;
  }
}

export async function buildDataContract({ allowYearRegression = false } = {}) {
  const raw = await loadRawInputs();
  const latest = normalizeLatest(raw.latest);
  const history = normalizeHistory(raw.history, latest);
  const assumptions = normalizeAssumptions(raw.assumptions);
  const calculated = buildCalculated(latest, assumptions);
  const sources = buildSources(raw.manifest, latest, history);
  const previousLatest = await loadPreviousLatest();

  validateContract(
    { latest, history, calculated, sources, assumptions },
    { previousLatest, allowYearRegression },
  );

  const normalized = {
    latest,
    history,
    calculated,
    sources,
    assumptions,
  };

  await Promise.all([
    writeJson(path.join(NORMALIZED_DIR, OUTPUT_FILES.latest), latest),
    writeJson(path.join(NORMALIZED_DIR, OUTPUT_FILES.history), history),
    writeJson(path.join(NORMALIZED_DIR, OUTPUT_FILES.calculated), calculated),
    writeJson(path.join(NORMALIZED_DIR, OUTPUT_FILES.sources), sources),
    writeJson(path.join(NORMALIZED_DIR, OUTPUT_FILES.assumptions), assumptions),
    writeJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.latest), latest),
    writeJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.history), history),
    writeJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.calculated), calculated),
    writeJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.sources), sources),
    writeJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.assumptions), assumptions),
  ]);

  return normalized;
}

export async function loadBuiltData() {
  return {
    latest: await readJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.latest)),
    history: await readJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.history)),
    calculated: await readJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.calculated)),
    sources: await readJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.sources)),
    assumptions: await readJson(path.join(PUBLIC_DATA_DIR, OUTPUT_FILES.assumptions)),
  };
}
