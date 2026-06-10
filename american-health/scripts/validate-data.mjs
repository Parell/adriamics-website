import assert from "node:assert/strict";
import { buildDataContract, loadBuiltData, validateContract } from "./data-contract.mjs";

const contract = await buildDataContract({ allowYearRegression: true });

assert.doesNotThrow(() => validateContract(contract));

const baseLatest = contract.latest;
const baseHistory = contract.history;
const baseCalculated = contract.calculated;
const baseSources = contract.sources;
const baseAssumptions = contract.assumptions;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

assert.throws(() => {
  const next = clone(contract);
  next.latest.records[0].value = 0;
  validateContract(next);
});

assert.throws(() => {
  const next = clone(contract);
  next.latest.records.find((record) => record.id === "health_spending_gdp_share").value = 1.5;
  validateContract(next);
});

assert.throws(() => {
  const next = clone(contract);
  next.latest.records.find((record) => record.id === "federal_sponsor_share").value = 0.6;
  next.latest.records.find((record) => record.id === "state_local_sponsor_share").value = 0.6;
  next.latest.records.find((record) => record.id === "household_sponsor_share").value = 0.6;
  next.latest.records.find((record) => record.id === "private_business_sponsor_share").value = 0.6;
  validateContract(next);
});

assert.throws(() => {
  const next = clone(contract);
  next.latest.baseline_year = 2023;
  validateContract(next, { previousLatest: { baseline_year: 2024 } });
});

assert.throws(() => {
  const next = clone(contract);
  delete next.latest.records[0].source_url;
  validateContract(next);
});

assert.throws(() => {
  const next = clone(contract);
  delete next.calculated.scenarios[0].model_label;
  validateContract(next);
});

assert.throws(() => {
  const next = clone(contract);
  next.history.series[0].records.push({
    year: 2023,
    value: next.history.series[0].records[0].value,
    calendar_year: true,
    source_id: next.history.series[0].records[0].source_id,
    source_name: next.history.series[0].records[0].source_name,
    source_url: next.history.series[0].records[0].source_url,
    last_checked: next.history.series[0].records[0].last_checked,
    model_label: next.history.series[0].records[0].model_label,
  });
  validateContract(next);
});

assert.doesNotThrow(() => {
  void baseLatest;
  void baseHistory;
  void baseCalculated;
  void baseSources;
  void baseAssumptions;
});

const built = await loadBuiltData();
assert.equal(built.latest.baseline_year, contract.latest.baseline_year);

console.log("American Health data contract validation passed.");

