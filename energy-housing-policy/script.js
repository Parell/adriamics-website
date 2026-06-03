const DEFAULT_MODEL = {
  metadata: {
    label: "Illustrative policy explainer sample data",
    currencyYear: 2026,
  },
  energyWaste: {
    fossil: [
      { label: "Fuel", value: 44, tone: "danger" },
      { label: "Operations", value: 14, tone: "gold" },
      { label: "Balancing", value: 12, tone: "cool" },
      { label: "Emissions", value: 24, tone: "danger" },
    ],
    solar: [
      { label: "Modules", value: 28, tone: "solar" },
      { label: "Operations", value: 8, tone: "cool" },
      { label: "Flexibility", value: 11, tone: "good" },
      { label: "Externalities", value: 4, tone: "good" },
    ],
  },
  energy: {
    solarGenerationCost: 34,
    nuclearGenerationCost: 49,
    fossilThermalGenerationCost: 74,
    otherRenewablesGenerationCost: 42,
    thermalLossPenalty: 18,
    transmissionLossSolarCost: 3,
    transmissionLossNuclearCost: 5,
    transmissionLossFossilCost: 8,
    transmissionLossOtherRenewablesCost: 4,
    fuelTransportCost: 8,
    storageBalancingSolarCost: 10,
    storageBalancingNuclearCost: 3,
    storageBalancingFossilCost: 2,
    storageBalancingOtherRenewablesCost: 6,
    emissionFossil: 430,
    emissionSolar: 32,
    emissionNuclear: 12,
    emissionOtherRenewables: 24,
    electricityDemandPerPersonMwh: 4.16,
    householdAnnualDemandMwh: 10.4,
    personsPerHousehold: 2.5,
    utilitySolarGwhPerKm2: 210,
    homesPerGWh: 98.8,
    defaultMix: {
      solar: 34,
      nuclear: 18,
      fossilThermal: 30,
      otherRenewables: 18,
    },
  },
  solarLab: {
    incidentSolarTW: 174000,
    solarPlantWPerM2: 104,
    solarCapacityFactor: 0.23,
    batterySpecificEnergyKWhPerKg: 0.18,
    truckPayloadTons: 18,
    truckCostPerTonMile: 0.2,
    wireLossPer1000Km: 0.025,
    batteryBatchMWh: 12,
    batteryHaulDistanceKm: 180,
    population: 10000000,
    perCapitaElectricityKWh: 6000,
  },
  housing: {
    commuteDaysPerYear: 240,
    commuteTimeValuePerHour: 24,
    emissionsPerMile: 0.38,
    infrastructureBurdenDollarsPerPoint: 3.8,
    infrastructureDensityWeight: 0.68,
    infrastructureCommuteWeight: 0.32,
    infrastructureReferenceCommute: 18,
    densityCommuteMultiplierLow: 1.25,
    densityCommuteMultiplierHigh: 0.68,
    densityEmissionMultiplierLow: 1.1,
    densityEmissionMultiplierHigh: 0.78,
  },
  sources: [
    { name: "EIA", purpose: "Electricity prices, generation mix, sales, and fuel costs.", futureKey: "energy" },
    { name: "NREL PVWatts", purpose: "Solar production estimates and capacity-factor assumptions.", futureKey: "energy.utilitySolarGwhPerKm2" },
    { name: "NREL ATB / Cambium", purpose: "Projection assumptions for flexible, high-solar grids.", futureKey: "energy.storageBalancingSolarCost" },
    { name: "Census / ACS", purpose: "Population, commute, and housing inputs.", futureKey: "housing" },
    { name: "EPA Smart Location Database", purpose: "Accessibility and location efficiency for the density model.", futureKey: "housing" },
    { name: "CNT H + T / MIT Living Wage", purpose: "Affordability framing for housing, transport, and regional costs.", futureKey: "housing" },
  ],
};

const DATA_URL = "data/sample-models.json";

const state = {
  energyMix: {
    solar: 34,
    nuclear: 18,
    fossilThermal: 30,
    otherRenewables: 18,
  },
  housingDensity: 3.5,
  commuteDistance: 12,
  commuteSpeed: 28,
  housingCost: 1680,
  transportCostPerMile: 0.72,
  electricityDemandPerPerson: 4.16,
  solarPopulation: 10000000,
  solarPerCapitaKWh: 6000,
  batteryMWh: 12,
  batteryHaulDistanceKm: 180,
};

const fmtCurrency0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const fmtCurrency2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtNumber1 = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const fmtNumber2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtNumber4 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const fmtNumber6 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 6,
  maximumFractionDigits: 6,
});

const fmtNumber0 = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatSignedCurrency(value) {
  return `${value >= 0 ? "+" : "-"}${fmtCurrency0.format(Math.abs(value))}`;
}

function formatSignedNumber(value, formatter = fmtNumber0) {
  return `${value >= 0 ? "+" : "-"}${formatter.format(Math.abs(value))}`;
}

const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const sections = ["energy-waste", "solar-abundance", "energy-simulator", "housing-simulator", "combined-outcome", "assumptions"];
const data = JSON.parse(JSON.stringify(DEFAULT_MODEL));
const ENERGY_MIX_KEYS = ["solar", "nuclear", "fossilThermal", "otherRenewables"];

const $ = (selector, root = document) => root.querySelector(selector);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function deepMerge(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) {
    return Array.isArray(override) ? override.slice() : base;
  }

  const output = { ...base };
  if (!override || typeof override !== "object") {
    return output;
  }

  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      output[key] = deepMerge(base[key], value);
    } else {
      output[key] = Array.isArray(value) ? value.slice() : value;
    }
  }

  return output;
}

function interpolate(points, x) {
  if (!points.length) {
    return 0;
  }

  if (x <= points[0].x) {
    return points[0].y;
  }

  if (x >= points[points.length - 1].x) {
    return points[points.length - 1].y;
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];
    if (x >= left.x && x <= right.x) {
      const span = right.x - left.x;
      const t = span === 0 ? 0 : (x - left.x) / span;
      return lerp(left.y, right.y, t);
    }
  }

  return points[points.length - 1].y;
}

function buildPath(points, scaleX, scaleY) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${scaleX(point.x)} ${scaleY(point.y)}`).join(" ");
}

function normalizeEnergyMix(rawMix, fallback = DEFAULT_MODEL.energy.defaultMix) {
  const source = ENERGY_MIX_KEYS.map((key) => {
    const value = Number(rawMix?.[key]);
    if (Number.isFinite(value)) {
      return Math.max(0, value);
    }
    return fallback[key];
  });

  const total = source.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return { ...fallback };
  }

  const scaled = source.map((value) => (value / total) * 100);
  const floored = scaled.map((value) => Math.floor(value));
  let remainder = 100 - floored.reduce((sum, value) => sum + value, 0);
  const ranked = scaled
    .map((value, index) => ({
      index,
      fraction: value - floored[index],
    }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);

  const result = floored.slice();
  for (let index = 0; index < remainder; index += 1) {
    result[ranked[index % ranked.length].index] += 1;
  }

  return {
    solar: result[0],
    nuclear: result[1],
    fossilThermal: result[2],
    otherRenewables: result[3],
  };
}

function redistributeEnergyMix(currentMix, activeKey, nextValue) {
  const activeValue = clamp(Math.round(nextValue), 0, 100);
  const otherKeys = ENERGY_MIX_KEYS.filter((key) => key !== activeKey);
  const remaining = 100 - activeValue;
  const currentOthers = otherKeys.map((key) => Math.max(0, Number(currentMix?.[key]) || 0));
  const currentOthersTotal = currentOthers.reduce((sum, value) => sum + value, 0);

  if (remaining <= 0) {
    return normalizeEnergyMix({
      solar: activeKey === "solar" ? activeValue : 0,
      nuclear: activeKey === "nuclear" ? activeValue : 0,
      fossilThermal: activeKey === "fossilThermal" ? activeValue : 0,
      otherRenewables: activeKey === "otherRenewables" ? activeValue : 0,
    });
  }

  const scaledOthers = otherKeys.map((key, index) => {
    const raw = currentOthersTotal > 0
      ? (currentOthers[index] / currentOthersTotal) * remaining
      : remaining / otherKeys.length;
    return { key, raw };
  });

  const floored = scaledOthers.map((entry) => Math.floor(entry.raw));
  let remainder = remaining - floored.reduce((sum, value) => sum + value, 0);
  const ranked = scaledOthers
    .map((entry, index) => ({
      index,
      fraction: entry.raw - floored[index],
    }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);

  const result = {
    solar: activeKey === "solar" ? activeValue : 0,
    nuclear: activeKey === "nuclear" ? activeValue : 0,
    fossilThermal: activeKey === "fossilThermal" ? activeValue : 0,
    otherRenewables: activeKey === "otherRenewables" ? activeValue : 0,
  };

  otherKeys.forEach((key, index) => {
    result[key] = floored[index];
  });

  for (let index = 0; index < remainder; index += 1) {
    const key = scaledOthers[ranked[index % ranked.length].index].key;
    result[key] += 1;
  }

  return normalizeEnergyMix(result);
}

function buildSolarAdoptionMix(model, solarAdoption) {
  const solarShare = clamp(solarAdoption, 0, 100);
  const remainder = 100 - solarShare;
  const base = model.energy.defaultMix;
  const nonSolarBase = base.nuclear + base.fossilThermal + base.otherRenewables || 1;
  const scale = remainder / nonSolarBase;

  // Keep the non-solar mix in the same proportions while solar adoption rises.
  return normalizeEnergyMix({
    solar: solarShare,
    nuclear: base.nuclear * scale,
    fossilThermal: base.fossilThermal * scale,
    otherRenewables: base.otherRenewables * scale,
  }, model.energy.defaultMix);
}

function svgWrap(inner, width = 760, height = 300) {
  return `
    <svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true">
      ${inner}
    </svg>
  `;
}

function renderStackChart(container, rows, options = {}) {
  const maxTotal = Math.max(...rows.map((row) => row.segments.reduce((sum, segment) => sum + segment.value, 0)));
  container.innerHTML = rows
    .map((row) => {
      const total = row.segments.reduce((sum, segment) => sum + segment.value, 0);
      const segments = row.segments
        .map((segment) => {
          const width = (segment.value / maxTotal) * 100;
          const segmentValue = options.segmentValueFormatter ? options.segmentValueFormatter(segment.value, segment, row) : fmtNumber0.format(segment.value);
          const title = options.segmentTitleFormatter
            ? options.segmentTitleFormatter(segment, row, total)
            : `${segment.label}: ${segmentValue}`;
          return `<span class="stack-segment stack-segment--${segment.tone}" style="width:${width}%" title="${title}"></span>`;
        })
        .join("");
      const rowValueFormatter = options.rowValueFormatter ?? ((value) => `${fmtCurrency0.format(value)} / MWh`);

      return `
        <div class="stack-row">
          <div class="stack-row__label">${row.label}</div>
          <div class="stack-row__bar">${segments}</div>
          <div class="stack-row__value">${rowValueFormatter(total, row)}</div>
        </div>
      `;
    })
    .join("");
}

function renderLineChart(container, series, options) {
  const width = options.width ?? 760;
  const height = options.height ?? 300;
  const padding = { top: 20, right: 22, bottom: 56, left: 64 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xMin = options.xMin ?? Math.min(...series.flatMap((s) => s.points.map((point) => point.x)));
  const xMax = options.xMax ?? Math.max(...series.flatMap((s) => s.points.map((point) => point.x)));
  const yMin = options.yMin ?? 0;
  const yMax = options.yMax ?? Math.max(...series.flatMap((s) => s.points.map((point) => point.y))) * 1.12;

  const scaleX = (x) => padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const scaleY = (y) => padding.top + (1 - (y - yMin) / (yMax - yMin)) * plotHeight;

  const yTicks = options.yTicks ?? 4;
  const xTicks = options.xTicks ?? 5;

  const gridLines = Array.from({ length: yTicks + 1 }, (_, index) => {
    const y = yMin + ((yMax - yMin) / yTicks) * index;
    const yPos = scaleY(y);
    return `
      <line class="chart-grid-line" x1="${padding.left}" y1="${yPos}" x2="${width - padding.right}" y2="${yPos}"></line>
      <text class="chart-label" x="${padding.left - 12}" y="${yPos + 4}" text-anchor="end">${options.yFormatter ? options.yFormatter(y) : fmtNumber0.format(y)}</text>
    `;
  }).join("");

  const xLines = Array.from({ length: xTicks + 1 }, (_, index) => {
    const x = xMin + ((xMax - xMin) / xTicks) * index;
    const xPos = scaleX(x);
    return `
      <line class="chart-grid-line" x1="${xPos}" y1="${padding.top}" x2="${xPos}" y2="${height - padding.bottom}"></line>
      <text class="chart-label" x="${xPos}" y="${height - 14}" text-anchor="middle">${options.xFormatter ? options.xFormatter(x) : fmtNumber0.format(x)}</text>
    `;
  }).join("");

  const xGuide = options.highlightX ?? null;
  const marker = xGuide === null
    ? ""
    : `
      <line class="chart-marker" x1="${scaleX(xGuide)}" y1="${padding.top}" x2="${scaleX(xGuide)}" y2="${height - padding.bottom}"></line>
    `;

  const paths = series.map((entry) => {
    const path = buildPath(entry.points, scaleX, scaleY);
    const highlightedY = interpolate(entry.points, xGuide ?? entry.points[Math.floor(entry.points.length / 2)].x);
    const highlightedX = scaleX(xGuide ?? entry.points[Math.floor(entry.points.length / 2)].x);
    const highlightedYPos = scaleY(highlightedY);
    const label = options.pointLabelFormatter ? options.pointLabelFormatter(highlightedY) : fmtNumber0.format(highlightedY);

    return `
      <path class="chart-series" d="${path}" stroke="${entry.color}"></path>
      <circle class="chart-point" cx="${highlightedX}" cy="${highlightedYPos}" r="4.5" fill="${entry.color}"></circle>
      <text class="chart-current-label" x="${highlightedX + 8}" y="${highlightedYPos - 10}">${label}</text>
    `;
  }).join("");

  const axisTitles = [
    options.xLabel
      ? `<text class="chart-axis-title chart-axis-title--x" x="${padding.left + (plotWidth / 2)}" y="${height - 16}" text-anchor="middle">${options.xLabel}</text>`
      : "",
    options.yLabel
      ? `<text class="chart-axis-title chart-axis-title--y" x="18" y="${padding.top + (plotHeight / 2)}" text-anchor="middle" transform="rotate(-90 18 ${padding.top + (plotHeight / 2)})">${options.yLabel}</text>`
      : "",
  ].join("");

  container.innerHTML = svgWrap(`
    ${gridLines}
    ${xLines}
    ${marker}
    ${paths}
    ${axisTitles}
    <line class="chart-axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"></line>
    <line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"></line>
  `, width, height);
}

function computeEnergyModel(model, mix, demandPerPersonMwh) {
  const shares = normalizeEnergyMix(mix, model.energy.defaultMix);
  const solar = shares.solar / 100;
  const nuclear = shares.nuclear / 100;
  const fossilThermal = shares.fossilThermal / 100;
  const otherRenewables = shares.otherRenewables / 100;
  const annualDemandPerPerson = Math.max(0, Number.isFinite(demandPerPersonMwh)
    ? demandPerPersonMwh
    : model.energy.electricityDemandPerPersonMwh ?? (model.energy.householdAnnualDemandMwh / model.energy.personsPerHousehold));
  const annualDemandPerHousehold = annualDemandPerPerson * model.energy.personsPerHousehold;

  const generationCost =
    (solar * model.energy.solarGenerationCost) +
    (nuclear * model.energy.nuclearGenerationCost) +
    (fossilThermal * model.energy.fossilThermalGenerationCost) +
    (otherRenewables * model.energy.otherRenewablesGenerationCost);

  const thermalLossPenalty = fossilThermal * model.energy.thermalLossPenalty;
  const transmissionLossPenalty =
    (solar * model.energy.transmissionLossSolarCost) +
    (nuclear * model.energy.transmissionLossNuclearCost) +
    (fossilThermal * model.energy.transmissionLossFossilCost) +
    (otherRenewables * model.energy.transmissionLossOtherRenewablesCost);
  const fuelTransportCost = fossilThermal * model.energy.fuelTransportCost;
  const storageBalancingCost =
    (solar * model.energy.storageBalancingSolarCost) +
    (nuclear * model.energy.storageBalancingNuclearCost) +
    (fossilThermal * model.energy.storageBalancingFossilCost) +
    (otherRenewables * model.energy.storageBalancingOtherRenewablesCost);
  const deliveredCost =
    generationCost +
    thermalLossPenalty +
    transmissionLossPenalty +
    fuelTransportCost +
    storageBalancingCost;
  const annualCostPerPerson = deliveredCost * annualDemandPerPerson;
  const emissions =
    (solar * model.energy.emissionSolar) +
    (nuclear * model.energy.emissionNuclear) +
    (fossilThermal * model.energy.emissionFossil) +
    (otherRenewables * model.energy.emissionOtherRenewables);

  return {
    shares,
    solar,
    nuclear,
    fossilThermal,
    otherRenewables,
    generationCost,
    thermalLossPenalty,
    transmissionLossPenalty,
    fuelTransportCost,
    storageBalancingCost,
    deliveredCost,
    annualCostPerPerson,
    annualDemandPerPerson,
    annualDemandPerHousehold,
    emissions,
    totalPenaltyCost: thermalLossPenalty + transmissionLossPenalty + fuelTransportCost + storageBalancingCost,
  };
}

function computeHousingModel(model, input) {
  const densityValue = clamp(input.density, 1, 8);
  const normalized = (densityValue - 1) / 7;
  const commuteDistance = clamp(input.commuteDistance, 2, 40);
  const commuteSpeed = clamp(input.commuteSpeed, 10, 45);
  const housing = Math.max(0, input.housingCost);
  const transportCostPerMile = Math.max(0, input.transportCostPerMile);

  const commuteMultiplier = lerp(model.housing.densityCommuteMultiplierLow, model.housing.densityCommuteMultiplierHigh, normalized);
  const emissionMultiplier = lerp(model.housing.densityEmissionMultiplierLow, model.housing.densityEmissionMultiplierHigh, normalized);
  const effectiveCommuteDistance = commuteDistance * commuteMultiplier;
  const dailyCommuteMiles = effectiveCommuteDistance * 2;
  const annualCommuteMiles = dailyCommuteMiles * model.housing.commuteDaysPerYear;
  const annualCommuteHours = (dailyCommuteMiles / commuteSpeed) * model.housing.commuteDaysPerYear;
  const transportAnnual = annualCommuteMiles * transportCostPerMile;
  const transportMonthly = transportAnnual / 12;
  const totalMonthly = housing + transportMonthly;
  const commuteTimeValueAnnual = annualCommuteHours * model.housing.commuteTimeValuePerHour;
  const commuteTimeValueMonthly = commuteTimeValueAnnual / 12;

  const infrastructureBurdenIndex = clamp(
    100 * (
      (model.housing.infrastructureDensityWeight * (1 - normalized)) +
      (model.housing.infrastructureCommuteWeight * clamp(effectiveCommuteDistance / model.housing.infrastructureReferenceCommute, 0.55, 1.4))
    ),
    0,
    100,
  );
  const infrastructureBurdenMonthly = infrastructureBurdenIndex * model.housing.infrastructureBurdenDollarsPerPoint;
  const trueLivingCostMonthly = totalMonthly + commuteTimeValueMonthly + infrastructureBurdenMonthly;
  const emissions = (annualCommuteMiles * model.housing.emissionsPerMile * emissionMultiplier) / 1000;

  const baselineCommuteMultiplier = model.housing.densityCommuteMultiplierLow;
  const baselineCommuteMiles = commuteDistance * baselineCommuteMultiplier * 2 * model.housing.commuteDaysPerYear;
  const moneySavedFromShorterCommute = Math.max(0, (baselineCommuteMiles * transportCostPerMile) - transportAnnual);

  return {
    densityValue,
    normalized,
    commuteDistance,
    commuteSpeed,
    commuteMultiplier,
    emissionMultiplier,
    effectiveCommuteDistance,
    dailyCommuteMiles,
    annualCommuteMiles,
    annualCommuteHours,
    housing,
    transportMonthly,
    transportAnnual,
    totalMonthly,
    commuteTimeValueAnnual,
    commuteTimeValueMonthly,
    infrastructureBurdenIndex,
    infrastructureBurdenMonthly,
    trueLivingCostMonthly,
    emissions,
    moneySavedFromShorterCommute,
    baselineCommuteMiles,
  };
}

function computeHousingSeries(model, input, key) {
  const points = [];
  for (let density = 1; density <= 8; density += 0.25) {
    const metrics = computeHousingModel(model, {
      ...input,
      density,
    });
    points.push({
      x: density,
      y: metrics[key],
    });
  }
  return points;
}

function getHousingInputs() {
  return {
    density: Number($("#density-slider").value),
    commuteDistance: Number($("#commute-distance-slider").value),
    commuteSpeed: Number($("#commute-speed-slider").value),
    housingCost: Number($("#housing-cost-slider").value),
    transportCostPerMile: Number($("#transport-cost-slider").value),
  };
}

function getCombinedControls() {
  return {
    solarAdoption: state.energyMix.solar,
    density: state.housingDensity,
    commuteDistance: state.commuteDistance,
    electricityDemandPerPerson: state.electricityDemandPerPerson,
  };
}

function computeCombinedScenario(model) {
  const housingInput = getHousingInputs();
  const combined = getCombinedControls();
  const currentEnergy = computeEnergyModel(model, buildSolarAdoptionMix(model, combined.solarAdoption), combined.electricityDemandPerPerson);
  const currentHousing = computeHousingModel(model, {
    ...housingInput,
    density: combined.density,
    commuteDistance: combined.commuteDistance,
  });
  const referenceEnergy = computeEnergyModel(model, buildSolarAdoptionMix(model, 10), combined.electricityDemandPerPerson);
  const referenceHousing = computeHousingModel(model, {
    ...housingInput,
    density: 1,
    commuteDistance: combined.commuteDistance,
  });

  // Convert the household-level housing burden back into a per-person annual figure.
  const currentAnnualCostPerPerson =
    currentEnergy.annualCostPerPerson +
    ((currentHousing.trueLivingCostMonthly * 12) / model.energy.personsPerHousehold);
  const referenceAnnualCostPerPerson =
    referenceEnergy.annualCostPerPerson +
    ((referenceHousing.trueLivingCostMonthly * 12) / model.energy.personsPerHousehold);

  // Compare against a low-solar, low-density reference so the savings remain legible.
  const energyLossAvoided =
    (referenceEnergy.totalPenaltyCost - currentEnergy.totalPenaltyCost) * combined.electricityDemandPerPerson;
  const commuteTimeSaved = referenceHousing.annualCommuteHours - currentHousing.annualCommuteHours;
  const transportCostSaved = referenceHousing.transportAnnual - currentHousing.transportAnnual;
  const infrastructureBurdenReduction = referenceHousing.infrastructureBurdenIndex - currentHousing.infrastructureBurdenIndex;
  // Emissions are kept in tCO2e by converting the electricity slice from kg/MWh to tons.
  const emissionsReductionEstimate =
    ((referenceEnergy.emissions * combined.electricityDemandPerPerson) / 1000) +
    referenceHousing.emissions -
    (((currentEnergy.emissions * combined.electricityDemandPerPerson) / 1000) + currentHousing.emissions);

  return {
    combined,
    currentEnergy,
    currentHousing,
    referenceEnergy,
    referenceHousing,
    currentAnnualCostPerPerson,
    referenceAnnualCostPerPerson,
    annualSavingsPerPerson: referenceAnnualCostPerPerson - currentAnnualCostPerPerson,
    energyLossAvoided,
    commuteTimeSaved,
    transportCostSaved,
    infrastructureBurdenReduction,
    emissionsReductionEstimate,
  };
}

function buildScenarioSummary(model, scenario) {
  const lines = [
    `${model.metadata.label} | Combined policy scenario`,
    `Solar adoption: ${fmtNumber0.format(scenario.combined.solarAdoption)}%`,
    `Housing density: ${fmtNumber1.format(scenario.combined.density)}x`,
    `Commute distance: ${fmtNumber1.format(scenario.combined.commuteDistance)} mi`,
    `Electricity demand: ${fmtNumber1.format(scenario.combined.electricityDemandPerPerson)} MWh/person/year`,
    `Annual cost/person: ${fmtCurrency0.format(scenario.currentAnnualCostPerPerson)}`,
    `Energy loss avoided: ${formatSignedCurrency(scenario.energyLossAvoided)}/person/year`,
    `Commute time saved: ${formatSignedNumber(scenario.commuteTimeSaved, fmtNumber0)}/year`,
    `Transportation cost saved: ${formatSignedCurrency(scenario.transportCostSaved)}/year`,
    `Infrastructure burden reduction: ${formatSignedNumber(scenario.infrastructureBurdenReduction, fmtNumber0)}/100`,
    `Emissions reduction estimate: ${formatSignedNumber(scenario.emissionsReductionEstimate, fmtNumber1)} tCO2e/year`,
    "Assumptions: solar share rebalances the existing grid mix, density changes commute and infrastructure burden, and demand per person scales electricity cost linearly.",
  ];

  return lines.join("\n");
}

function renderHousingComparison(model, input, currentMetrics) {
  const scenarios = [
    {
      key: "low-density",
      title: "Low-density sprawl",
      density: 1,
      note: "Longer roads, longer utility runs, and more service area per household.",
      tone: "danger",
    },
    {
      key: "mixed-use",
      title: "Medium-density mixed-use",
      density: 4,
      note: "Shorter trips, shared infrastructure, and more destinations within reach.",
      tone: "gold",
    },
    {
      key: "transit-oriented",
      title: "High-density transit-oriented",
      density: 7.5,
      note: "Shortest commutes and the least infrastructure spread per household.",
      tone: "good",
    },
  ];

  const baseline = computeHousingModel(model, {
    ...input,
    density: 1,
  });

  $("#density-comparison-grid").innerHTML = scenarios.map((scenario) => {
    const metrics = computeHousingModel(model, {
      ...input,
      density: scenario.density,
    });
    const savingsAnnual = Math.max(0, baseline.transportAnnual - metrics.transportAnnual);
    const timeSavedAnnual = Math.max(0, baseline.annualCommuteHours - metrics.annualCommuteHours);
    const active = Math.abs(currentMetrics.densityValue - scenario.density) <= 0.5;

    return `
      <article class="comparison-card comparison-card--${scenario.tone} ${active ? "comparison-card--active" : ""}">
        <div class="comparison-card__head">
          <span class="comparison-card__eyebrow">${scenario.title}</span>
          <span class="comparison-card__badge">${active ? "Current frame" : "Scenario"}</span>
        </div>
        <strong class="comparison-card__value">${fmtCurrency0.format(metrics.trueLivingCostMonthly)} / mo</strong>
        <ul class="comparison-card__list">
          <li>${fmtCurrency0.format(metrics.totalMonthly)} monthly housing + transport</li>
          <li>${fmtNumber0.format(metrics.annualCommuteHours)} commute hours / yr</li>
          <li>${fmtNumber0.format(metrics.infrastructureBurdenIndex)} infrastructure index</li>
          <li>${fmtNumber1.format(metrics.emissions)} tCO2e / yr</li>
        </ul>
        <p class="comparison-card__delta">
          ${scenario.note}
          ${scenario.density === 1 ? " This is the baseline." : ` Roughly ${fmtCurrency0.format(savingsAnnual)} / yr and ${fmtNumber0.format(timeSavedAnnual)} hours saved versus low-density sprawl.`}
        </p>
      </article>
    `;
  }).join("");
}

function renderEnergyWaste(model) {
  renderStackChart($("#waste-chart"), [
    {
      label: "Fossil-heavy system",
      segments: model.energyWaste.fossil,
    },
    {
      label: "Solar-heavy system",
      segments: model.energyWaste.solar,
    },
  ]);
}

function getSolarInputs() {
  return {
    population: Number($("#solar-population-slider").value),
    perCapitaKWh: Number($("#solar-per-capita-slider").value),
    batteryMWh: Number($("#battery-mwh-slider").value),
    batteryDistanceKm: Number($("#battery-distance-slider").value),
  };
}

function computeSolarLab(model, input) {
  const population = clamp(Math.round(input.population), 500000, 25000000);
  const perCapitaKWh = clamp(input.perCapitaKWh, 2000, 15000);
  const batteryMWh = clamp(input.batteryMWh, 1, 120);
  const batteryDistanceKm = clamp(input.batteryDistanceKm, 25, 1200);
  const incidentSolarTW = model.solarLab.incidentSolarTW;
  const annualOutputGwhPerKm2 = model.solarLab.solarPlantWPerM2 * model.solarLab.solarCapacityFactor * 8.76;
  const annualDemandGWh = (population * perCapitaKWh) / 1000000;
  const annualDemandTWh = annualDemandGWh / 1000;
  const averageLoadGW = annualDemandGWh / 8760;
  const averageLoadTW = averageLoadGW / 1000;
  const captureFractionPercent = (averageLoadTW / incidentSolarTW) * 100;
  const areaKm2 = annualDemandGWh / annualOutputGwhPerKm2;

  const batteryMassTons = batteryMWh / model.solarLab.batterySpecificEnergyKWhPerKg;
  const truckloads = Math.max(1, Math.ceil(batteryMassTons / model.solarLab.truckPayloadTons));
  const distanceMiles = batteryDistanceKm * 0.621371;
  const tonMiles = batteryMassTons * distanceMiles;
  const freightCost = tonMiles * model.solarLab.truckCostPerTonMile;
  const wireLossPercent = clamp((batteryDistanceKm / 1000) * model.solarLab.wireLossPer1000Km, 0, 0.12);
  const wireLossMWh = batteryMWh * wireLossPercent;

  return {
    population,
    perCapitaKWh,
    batteryMWh,
    batteryDistanceKm,
    annualOutputGwhPerKm2,
    annualDemandGWh,
    annualDemandTWh,
    averageLoadGW,
    averageLoadTW,
    captureFractionPercent,
    areaKm2,
    batteryMassTons,
    truckloads,
    tonMiles,
    freightCost,
    wireLossPercent,
    wireLossMWh,
    incidentSolarTW,
  };
}

function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSolarCanvas(canvas, metrics, model) {
  if (!canvas) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, rect.width || canvas.clientWidth || 960);
  const height = Math.max(220, rect.height || canvas.clientHeight || 520);
  const dpr = window.devicePixelRatio || 1;

  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "rgba(255, 255, 255, 0.03)");
  bg.addColorStop(1, "rgba(255, 255, 255, 0.01)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Large incoming solar field
  const sunX = width * 0.16;
  const sunY = height * 0.38;
  const sunR = Math.min(width, height) * 0.18;
  const sun = ctx.createRadialGradient(sunX - sunR * 0.2, sunY - sunR * 0.2, sunR * 0.08, sunX, sunY, sunR * 1.1);
  sun.addColorStop(0, "#fff8e8");
  sun.addColorStop(0.46, "#ffd07c");
  sun.addColorStop(0.72, "rgba(255, 191, 88, 0.42)");
  sun.addColorStop(1, "rgba(255, 191, 88, 0)");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 14; i += 1) {
    const angle = (Math.PI * 2 * i) / 14;
    const inner = sunR * 1.15;
    const outer = sunR * 1.52;
    ctx.strokeStyle = "#ffcf76";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sunX + Math.cos(angle) * inner, sunY + Math.sin(angle) * inner);
    ctx.lineTo(sunX + Math.cos(angle) * outer, sunY + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();

  // Planet and capture target
  const earthX = width * 0.74;
  const earthY = height * 0.43;
  const earthR = Math.min(width, height) * 0.12;
  const earth = ctx.createRadialGradient(earthX - earthR * 0.3, earthY - earthR * 0.35, earthR * 0.1, earthX, earthY, earthR * 1.1);
  earth.addColorStop(0, "#d9f5ff");
  earth.addColorStop(0.5, "#69d4ff");
  earth.addColorStop(1, "#12344a");
  ctx.fillStyle = earth;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
  ctx.fill();

  // Faint atmosphere
  ctx.save();
  ctx.strokeStyle = "rgba(105, 212, 255, 0.22)";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const panelWidth = width * 0.3;
  const panelHeight = height * 0.1;
  const panelX = earthX - panelWidth * 0.5;
  const panelY = earthY + earthR + height * 0.06;
  const panel = ctx.createLinearGradient(panelX, panelY, panelX + panelWidth, panelY + panelHeight);
  panel.addColorStop(0, "rgba(255, 191, 88, 0.95)");
  panel.addColorStop(1, "rgba(255, 215, 148, 0.95)");
  ctx.fillStyle = panel;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1.5;
  const radius = 8;
  ctx.beginPath();
  ctx.moveTo(panelX + radius, panelY);
  ctx.lineTo(panelX + panelWidth - radius, panelY);
  ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + radius);
  ctx.lineTo(panelX + panelWidth, panelY + panelHeight - radius);
  ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - radius, panelY + panelHeight);
  ctx.lineTo(panelX + radius, panelY + panelHeight);
  ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - radius);
  ctx.lineTo(panelX, panelY + radius);
  ctx.quadraticCurveTo(panelX, panelY, panelX + radius, panelY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#1f2933";
  for (let x = panelX + 10; x < panelX + panelWidth; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, panelY);
    ctx.lineTo(x - 12, panelY + panelHeight);
    ctx.stroke();
  }
  ctx.restore();

  // Rays scaled by the useful capture fraction, but the frame keeps the abundance visible.
  const rays = 16;
  const demandRatio = clamp(metrics.averageLoadTW / metrics.incidentSolarTW, 0, 1);
  for (let i = 0; i < rays; i += 1) {
    const t = i / (rays - 1);
    const startY = lerp(sunY - sunR * 0.22, sunY + sunR * 0.22, t);
    const targetY = lerp(earthY - earthR * 0.7, earthY + earthR * 0.7, t);
    const targetX = earthX - earthR - 18;
    const endX = lerp(sunX + sunR * 1.15, targetX, 0.94);
    const endY = lerp(startY, targetY, 0.55);
    ctx.strokeStyle = i % 5 === 0 ? "rgba(255, 255, 255, 0.32)" : "rgba(255, 191, 88, 0.18)";
    ctx.lineWidth = i % 5 === 0 ? 2.4 : 1.2;
    ctx.beginPath();
    ctx.moveTo(sunX + sunR * 0.92, startY);
    ctx.quadraticCurveTo(width * 0.43, height * 0.22 + t * height * 0.18, endX, endY);
    ctx.stroke();
  }

  // Capture ratio marker
  const barX = width * 0.12;
  const barY = height * 0.79;
  const barW = width * 0.76;
  const barH = 26;
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
  ctx.lineWidth = 1;
  drawRoundedRectPath(ctx, barX, barY, barW, barH, 999);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 191, 88, 0.88)";
  drawRoundedRectPath(ctx, barX + 1, barY + 1, barW * 0.98, barH - 2, 999);
  ctx.fill();

  const captureW = Math.max(6, barW * clamp(demandRatio * 4000, 0.002, 0.22));
  ctx.fillStyle = "rgba(8, 12, 17, 0.88)";
  drawRoundedRectPath(ctx, barX + 1, barY + 1, captureW, barH - 2, 999);
  ctx.fill();

  ctx.fillStyle = "#0a0f14";
  ctx.font = '700 13px "Aptos", "Segoe UI Variable", "Segoe UI", sans-serif';
  ctx.fillText("Available energy", barX + 14, barY + 18);
  ctx.textAlign = "right";
  ctx.fillText("Useful captured demand", barX + barW - 14, barY + 18);
  ctx.font = '600 12px "Aptos", "Segoe UI Variable", "Segoe UI", sans-serif';
  ctx.fillText(`${fmtNumber6.format(metrics.captureFractionPercent)}% of incident solar`, barX + barW - 14, barY + 40);

  ctx.textAlign = "left";
  ctx.fillStyle = "#eef3f8";
  ctx.font = '800 16px "Aptos", "Segoe UI Variable", "Segoe UI", sans-serif';
  ctx.fillText(`${fmtNumber0.format(metrics.incidentSolarTW)} TW striking Earth`, sunX - sunR * 0.15, sunY - sunR * 1.24);
  ctx.fillStyle = "#cdefff";
  ctx.fillText(`${fmtNumber1.format(metrics.averageLoadTW * 1000)} GW useful average load`, earthX - earthR * 1.1, earthY - earthR * 1.25);
}

function renderSolarSection(model) {
  const input = getSolarInputs();
  const solar = computeSolarLab(model, input);
  const output = model.solarLab.solarPlantWPerM2 * model.solarLab.solarCapacityFactor * 8.76;

  state.solarPopulation = solar.population;
  state.solarPerCapitaKWh = solar.perCapitaKWh;
  state.batteryMWh = solar.batteryMWh;
  state.batteryHaulDistanceKm = solar.batteryDistanceKm;

  $("#solar-incident-value").textContent = `${fmtNumber0.format(solar.incidentSolarTW)} TW`;
  $("#solar-demand-tw-value").textContent = `${fmtNumber1.format(solar.averageLoadTW * 1000)} GW`;
  $("#solar-fraction-value").textContent = `${fmtNumber6.format(solar.captureFractionPercent)}%`;

  $("#solar-population-readout").textContent = `${fmtNumber1.format(solar.population / 1000000)}M people`;
  $("#solar-per-capita-readout").textContent = `${fmtNumber0.format(solar.perCapitaKWh)} kWh / yr`;
  $("#battery-mwh-readout").textContent = `${fmtNumber0.format(solar.batteryMWh)} MWh`;
  $("#battery-distance-readout").textContent = `${fmtNumber0.format(solar.batteryDistanceKm)} km`;

  $("#solar-demand-value").textContent = `${fmtNumber0.format(solar.annualDemandTWh)} TWh / yr`;
  $("#solar-average-load-value").textContent = `${fmtNumber1.format(solar.averageLoadGW)} GW`;
  $("#solar-area-value").textContent = `${fmtNumber0.format(solar.areaKm2)} km^2`;
  $("#solar-output-value").textContent = `${fmtNumber0.format(output)} GWh / km^2 / yr`;

  $("#battery-mass-value").textContent = `${fmtNumber1.format(solar.batteryMassTons)} t`;
  $("#battery-loads-value").textContent = `${fmtNumber0.format(solar.truckloads)} load${solar.truckloads === 1 ? "" : "s"}`;
  $("#battery-tonmiles-value").textContent = `${fmtNumber0.format(solar.tonMiles)} ton-mi`;
  $("#battery-freight-cost-value").textContent = `${fmtCurrency0.format(solar.freightCost)}`;
  $("#battery-summary-copy").textContent = `A ${fmtNumber0.format(solar.batteryMWh)} MWh battery batch weighs about ${fmtNumber1.format(solar.batteryMassTons)} metric tons and generates ${fmtNumber0.format(solar.tonMiles)} ton-miles over ${fmtNumber0.format(solar.batteryDistanceKm)} km.`;

  const canvas = $("#solar-flux-canvas");
  drawSolarCanvas(canvas, solar, model);
  renderTechnologyComparison(model, solar);
}

function renderTechnologyComparison(model, solar) {
  const cards = [
    {
      title: "Solar",
      tone: "gold",
      badge: "Abundant source",
      value: `${fmtNumber0.format(model.solarLab.incidentSolarTW)} TW`,
      list: [
        `${fmtNumber0.format(solar.annualOutputGwhPerKm2)} GWh / km^2 / yr utility output`,
        "No fuel transport chain",
        "Variable output, low operating fuel cost",
      ],
      delta: "Best when land, storage, and grid balancing are explicitly planned.",
    },
    {
      title: "Nuclear",
      tone: "cool",
      badge: "Dense energy",
      value: "High reliability",
      list: [
        "High capacity factor when the plant is operating",
        "Small fuel mass, large capital stack",
        "Complex permitting, construction, and delivery timeline",
      ],
      delta: "A strong firm-power option, but project risk is mostly upfront and organizational.",
    },
    {
      title: "Fossil thermal",
      tone: "danger",
      badge: "Dispatchable but lossy",
      value: `${fmtCurrency0.format(model.energy.thermalLossPenalty)} / MWh heat-loss penalty`,
      list: [
        "Dispatchable, but fuel must be extracted and delivered continuously",
        "Heat rejection is built into the conversion process",
        "Emissions and fuel volatility stay attached to output",
      ],
      delta: "Reliable output does not erase the fuel-chain burden.",
    },
    {
      title: "Batteries",
      tone: "good",
      badge: "Storage buffer",
      value: `${fmtNumber1.format(solar.batteryMassTons)} t per ${fmtNumber0.format(solar.batteryMWh)} MWh`,
      list: [
        `${fmtNumber0.format(solar.truckloads)} truckload${solar.truckloads === 1 ? "" : "s"} at the current batch size`,
        `${fmtNumber0.format(solar.tonMiles)} ton-mi freight burden`,
        "Useful for storage, poor as physically transported fuel",
      ],
      delta: "Great for buffering and fast response, not for replacing wires as the distribution layer.",
    },
  ];

  $("#technology-comparison-grid").innerHTML = cards.map((card) => `
    <article class="comparison-card comparison-card--${card.tone}">
      <div class="comparison-card__head">
        <span class="comparison-card__eyebrow">${card.title}</span>
        <span class="comparison-card__badge">${card.badge}</span>
      </div>
      <strong class="comparison-card__value">${card.value}</strong>
      <ul class="comparison-card__list">
        ${card.list.map((entry) => `<li>${entry}</li>`).join("")}
      </ul>
      <p class="comparison-card__delta">${card.delta}</p>
    </article>
  `).join("");
}

function renderEnergySimulator(model) {
  state.energyMix = normalizeEnergyMix(state.energyMix, model.energy.defaultMix);
  const metrics = computeEnergyModel(model, state.energyMix, state.electricityDemandPerPerson);
  const mix = metrics.shares;
  const annualPerPerson = metrics.annualCostPerPerson;

  const controlMap = [
    ["solar", "#solar-share", "#solar-share-readout"],
    ["nuclear", "#nuclear-share", "#nuclear-share-readout"],
    ["fossilThermal", "#fossil-thermal-share", "#fossil-thermal-share-readout"],
    ["otherRenewables", "#other-renewables-share", "#other-renewables-share-readout"],
  ];

  controlMap.forEach(([key, inputSelector, readoutSelector]) => {
    const input = $(inputSelector);
    const readout = $(readoutSelector);
    if (input) {
      input.value = mix[key];
    }
    if (readout) {
      readout.textContent = `${fmtNumber0.format(mix[key])}%`;
    }
  });

  $("#energy-person-cost-value").textContent = `${fmtCurrency0.format(annualPerPerson)} / yr`;
  $("#energy-delivered-cost-value").textContent = `${fmtCurrency0.format(metrics.deliveredCost)} / MWh`;
  $("#energy-generation-cost-value").textContent = `${fmtCurrency0.format(metrics.generationCost)} / MWh`;

  renderStackChart($("#energy-mix-chart"), [
    {
      label: "Grid mix",
      segments: [
        { label: "Solar", value: mix.solar, tone: "solar" },
        { label: "Nuclear", value: mix.nuclear, tone: "cool" },
        { label: "Fossil thermal", value: mix.fossilThermal, tone: "danger" },
        { label: "Other renewables", value: mix.otherRenewables, tone: "good" },
      ],
    },
  ], {
    rowValueFormatter: (value) => `${fmtNumber0.format(value)}%`,
    segmentValueFormatter: (value) => `${fmtNumber0.format(value)}%`,
    segmentTitleFormatter: (segment) => `${segment.label}: ${fmtNumber0.format(segment.value)}%`,
  });

  $("#energy-mix-caption").textContent = `The four sliders are renormalized to exactly 100%, so the current mix is ${fmtNumber0.format(mix.solar)}% solar, ${fmtNumber0.format(mix.nuclear)}% nuclear, ${fmtNumber0.format(mix.fossilThermal)}% fossil thermal, and ${fmtNumber0.format(mix.otherRenewables)}% other renewables.`;

  renderStackChart($("#energy-losses-chart"), [
    {
      label: "Delivered cost",
      segments: [
        { label: "Generation", value: metrics.generationCost, tone: "solar" },
        { label: "Thermal conversion loss", value: metrics.thermalLossPenalty, tone: "danger" },
        { label: "Transmission / distribution loss", value: metrics.transmissionLossPenalty, tone: "cool" },
        { label: "Fuel transport", value: metrics.fuelTransportCost, tone: "danger" },
        { label: "Storage / balancing", value: metrics.storageBalancingCost, tone: "good" },
      ],
    },
  ], {
    rowValueFormatter: (value) => `${fmtCurrency0.format(value)} / MWh`,
    segmentValueFormatter: (value) => `${fmtCurrency0.format(value)}`,
    segmentTitleFormatter: (segment) => `${segment.label}: ${fmtCurrency0.format(segment.value)} / MWh`,
  });

  $("#energy-losses-caption").textContent = `Delivered electricity costs ${fmtCurrency0.format(metrics.deliveredCost)} per MWh in this simplified model, with ${fmtCurrency0.format(metrics.totalPenaltyCost)} per MWh coming from non-generation penalties. The annual cost per person uses ${fmtNumber1.format(metrics.annualDemandPerPerson)} MWh/person/year.`;
  $("#energy-mix-caption").textContent += ` The annual cost per person uses ${fmtNumber1.format(metrics.annualDemandPerPerson)} MWh/person/year.`;
}

function renderHousingSimulator(model) {
  const input = getHousingInputs();
  const metrics = computeHousingModel(model, input);

  state.housingDensity = input.density;
  state.commuteDistance = input.commuteDistance;
  state.commuteSpeed = input.commuteSpeed;
  state.housingCost = input.housingCost;
  state.transportCostPerMile = input.transportCostPerMile;

  $("#density-readout").textContent = `${fmtNumber1.format(input.density)}x`;
  $("#commute-distance-readout").textContent = `${fmtNumber1.format(input.commuteDistance)} mi`;
  $("#commute-speed-readout").textContent = `${fmtNumber0.format(input.commuteSpeed)} mph`;
  $("#housing-cost-readout").textContent = `${fmtCurrency0.format(input.housingCost)}`;
  $("#transport-cost-readout").textContent = `${fmtCurrency2.format(input.transportCostPerMile)}/mi`;

  $("#housing-total-value").textContent = `${fmtCurrency0.format(metrics.totalMonthly)} / mo`;
  $("#housing-commute-value").textContent = `${fmtNumber0.format(metrics.annualCommuteHours)} hrs / yr`;
  $("#housing-savings-value").textContent = `${fmtCurrency0.format(metrics.moneySavedFromShorterCommute)} / yr`;
  $("#housing-infra-value").textContent = `${fmtNumber0.format(metrics.infrastructureBurdenIndex)} / 100`;
  $("#housing-emissions-value").textContent = `${fmtNumber1.format(metrics.emissions)} tCO2e / yr`;
  $("#housing-true-cost-value").textContent = `${fmtCurrency0.format(metrics.trueLivingCostMonthly)} / mo`;

  const costSeries = computeHousingSeries(model, input, "trueLivingCostMonthly");
  const burdenSeries = computeHousingSeries(model, input, "infrastructureBurdenIndex");

  renderLineChart($("#housing-cost-chart"), [
    {
      name: "True living cost",
      color: "#ffbf58",
      points: costSeries,
    },
  ], {
    xMin: 1,
    xMax: 8,
    highlightX: input.density,
    xTicks: 7,
    yTicks: 4,
    xFormatter: (value) => `${fmtNumber0.format(value)}x`,
    yFormatter: (value) => `${fmtNumber0.format(value)}`,
    pointLabelFormatter: (value) => `${fmtCurrency0.format(value)}`,
    xLabel: "Density level",
    yLabel: "Monthly cost ($)",
  });

  $("#housing-cost-caption").textContent = `At ${fmtNumber1.format(input.density)}x density, the simplified monthly housing + transport total is ${fmtCurrency0.format(metrics.totalMonthly)}, while the broader true living cost rises to ${fmtCurrency0.format(metrics.trueLivingCostMonthly)} once commute time and infrastructure are counted.`;

  renderLineChart($("#housing-emissions-chart"), [
    {
      name: "Infrastructure burden index",
      color: "#69d4ff",
      points: burdenSeries,
    },
  ], {
    xMin: 1,
    xMax: 8,
    highlightX: input.density,
    xTicks: 7,
    yTicks: 4,
    xFormatter: (value) => `${fmtNumber0.format(value)}x`,
    yFormatter: (value) => `${fmtNumber0.format(value)}`,
    pointLabelFormatter: (value) => `${fmtNumber0.format(value)}`,
    xLabel: "Density level",
    yLabel: "Burden index",
  });

  $("#housing-emissions-caption").textContent = `A lower density setting pushes the infrastructure burden index up because more road, pipe, utility, and service area is spread across each household.`;

  renderHousingComparison(model, input, metrics);
}

function renderCombined(model) {
  const scenario = computeCombinedScenario(model);
  const solarInput = $("#solar-adoption-slider");
  const densityInput = $("#combined-density-slider");
  const commuteInput = $("#combined-commute-distance-slider");
  const demandInput = $("#electricity-demand-slider");
  const solarReadout = $("#solar-adoption-readout");
  const densityReadout = $("#combined-density-readout");
  const commuteReadout = $("#combined-commute-distance-readout");
  const demandReadout = $("#electricity-demand-readout");

  if (solarInput) {
    solarInput.value = scenario.combined.solarAdoption;
  }
  if (densityInput) {
    densityInput.value = scenario.combined.density;
  }
  if (commuteInput) {
    commuteInput.value = scenario.combined.commuteDistance;
  }
  if (demandInput) {
    demandInput.value = scenario.combined.electricityDemandPerPerson;
  }
  if (solarReadout) {
    solarReadout.textContent = `${fmtNumber0.format(scenario.combined.solarAdoption)}%`;
  }
  if (densityReadout) {
    densityReadout.textContent = `${fmtNumber1.format(scenario.combined.density)}x`;
  }
  if (commuteReadout) {
    commuteReadout.textContent = `${fmtNumber1.format(scenario.combined.commuteDistance)} mi`;
  }
  if (demandReadout) {
    demandReadout.textContent = `${fmtNumber1.format(scenario.combined.electricityDemandPerPerson)} MWh/person/yr`;
  }

  const scenarios = [
    {
      title: "Status quo",
      value: fmtCurrency0.format(scenario.referenceAnnualCostPerPerson * model.energy.personsPerHousehold),
      meta: "Low solar, low density, and the same commute assumptions.",
    },
    {
      title: "Energy only",
      value: fmtCurrency0.format((scenario.currentEnergy.annualCostPerPerson + ((scenario.referenceHousing.trueLivingCostMonthly * 12) / model.energy.personsPerHousehold)) * model.energy.personsPerHousehold),
      meta: "Cleaner power without changing settlement form.",
    },
    {
      title: "Density only",
      value: fmtCurrency0.format((scenario.referenceEnergy.annualCostPerPerson + ((scenario.currentHousing.trueLivingCostMonthly * 12) / model.energy.personsPerHousehold)) * model.energy.personsPerHousehold),
      meta: "Compact living without a cleaner grid.",
    },
    {
      title: "Combined",
      value: fmtCurrency0.format(scenario.currentAnnualCostPerPerson * model.energy.personsPerHousehold),
      meta: "Lower operating cost, lower infrastructure burden, and lower emissions.",
      best: true,
    },
  ];

  $("#scenario-grid").innerHTML = scenarios.map((entry) => `
    <article class="scenario-card ${entry.best ? "scenario-card--best" : ""}">
      <div class="scenario-card__title">${entry.title}</div>
      <strong class="scenario-card__value">${entry.value} / yr</strong>
      <span class="scenario-card__meta">${entry.meta}</span>
    </article>
  `).join("");

  $("#combined-metric-grid").innerHTML = [
    {
      label: "Annual cost / person",
      value: `${fmtCurrency0.format(scenario.currentAnnualCostPerPerson)} / yr`,
      meta: "Energy, housing, commute time value, and infrastructure burden combined.",
    },
    {
      label: "Energy loss avoided",
      value: `${formatSignedCurrency(scenario.energyLossAvoided)} / yr`,
      meta: "Reduced fuel-chain and non-generation penalties versus the reference scenario.",
    },
    {
      label: "Commute time saved",
      value: `${formatSignedNumber(scenario.commuteTimeSaved, fmtNumber0)} hrs / yr`,
      meta: "Time saved by shorter trips and the lower-density reference comparison.",
    },
    {
      label: "Transportation cost saved",
      value: `${formatSignedCurrency(scenario.transportCostSaved)} / yr`,
      meta: "Direct household transport outlay avoided each year.",
    },
    {
      label: "Infrastructure burden reduction",
      value: `${formatSignedNumber(scenario.infrastructureBurdenReduction, fmtNumber0)} / 100`,
      meta: "Less road, pipe, utility, and service area per household.",
    },
    {
      label: "Emissions reduction estimate",
      value: `${formatSignedNumber(scenario.emissionsReductionEstimate, fmtNumber1)} tCO2e / yr`,
      meta: "Electricity and commute emissions versus the reference scenario.",
    },
  ].map((card) => `
    <article class="metric-card metric-card--combined">
      <span class="metric-card__label">${card.label}</span>
      <strong class="metric-card__value">${card.value}</strong>
      <span class="metric-card__meta">${card.meta}</span>
    </article>
  `).join("");

  $("#combined-summary").innerHTML = `
    <p>
      Solar reduces fuel-chain and thermal waste. Density reduces movement, infrastructure, and household cost burdens.
      Together they reduce the amount of energy society must generate in the first place.
    </p>
    <ul>
      <li>Current scenario savings versus the reference case: ${fmtCurrency0.format(scenario.annualSavingsPerPerson)} per person each year.</li>
      <li>Reference case uses 10% solar adoption and 1x housing density while keeping the same commute-distance assumption.</li>
      <li>Transportation, time, and emissions estimates stay transparent instead of being folded into one opaque score.</li>
    </ul>
  `;

  $("#combined-assumption-list").innerHTML = `
    <li>Solar adoption changes the grid mix by increasing solar share and scaling the remaining mix proportionally.</li>
    <li>Density only changes commute distance, commute time, emissions, and infrastructure burden inputs already defined above.</li>
    <li>Electricity demand per person scales the energy cost linearly, which keeps the arithmetic legible.</li>
    <li>Commute speed, housing payment, transport cost per mile, and commute days are held constant from the housing model.</li>
  `;

  $("#combined-source-grid").innerHTML = model.sources.slice(0, 4).map((source) => `
    <article class="source-card source-card--compact">
      <h3>${source.name}</h3>
      <p>${source.purpose}</p>
    </article>
  `).join("");

  $("#combined-copy-button").dataset.copyText = buildScenarioSummary(model, scenario);
  $("#combined-copy-status").textContent = `Reference case: 10% solar, 1x density. Combined annual household burden: ${fmtCurrency0.format(scenario.currentAnnualCostPerPerson * model.energy.personsPerHousehold)}.`;
}

async function copyScenarioSummary() {
  const button = $("#combined-copy-button");
  const status = $("#combined-copy-status");
  const text = button?.dataset.copyText ?? "";

  if (!text) {
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    if (status) {
      status.textContent = "Scenario summary copied to clipboard.";
    }
  } catch {
    if (status) {
      status.textContent = "Copy failed in this browser.";
    }
  }
}

function renderAll(model) {
  renderEnergyWaste(model);
  renderSolarSection(model);
  renderEnergySimulator(model);
  renderHousingSimulator(model);
  renderCombined(model);
}

function attachSliderListeners(model) {
  const solarInputs = [
    "#solar-population-slider",
    "#solar-per-capita-slider",
    "#battery-mwh-slider",
    "#battery-distance-slider",
  ];

  solarInputs.forEach((selector) => {
    const input = $(selector);
    if (!input) {
      return;
    }

    input.addEventListener("input", () => renderAll(model));
  });

  const energyInputs = [
    ["solar", $("#solar-share")],
    ["nuclear", $("#nuclear-share")],
    ["fossilThermal", $("#fossil-thermal-share")],
    ["otherRenewables", $("#other-renewables-share")],
  ];

  energyInputs.forEach(([key, input]) => {
    if (!input) {
      return;
    }

    input.addEventListener("input", (event) => {
      state.energyMix = redistributeEnergyMix(state.energyMix, key, Number(event.target.value));
      renderAll(model);
    });
  });

  $("#density-slider").addEventListener("input", () => renderAll(model));
  $("#commute-distance-slider").addEventListener("input", () => renderAll(model));
  $("#commute-speed-slider").addEventListener("input", () => renderAll(model));
  $("#housing-cost-slider").addEventListener("input", () => renderAll(model));
  $("#transport-cost-slider").addEventListener("input", () => renderAll(model));

  $("#solar-adoption-slider")?.addEventListener("input", (event) => {
    state.energyMix = redistributeEnergyMix(state.energyMix, "solar", Number(event.target.value));
    renderAll(model);
  });

  $("#combined-density-slider")?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    const densityInput = $("#density-slider");
    if (densityInput) {
      densityInput.value = value;
    }
    renderAll(model);
  });

  $("#combined-commute-distance-slider")?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    const commuteInput = $("#commute-distance-slider");
    if (commuteInput) {
      commuteInput.value = value;
    }
    renderAll(model);
  });

  $("#electricity-demand-slider")?.addEventListener("input", (event) => {
    state.electricityDemandPerPerson = Number(event.target.value);
    renderAll(model);
  });

  $("#combined-copy-button")?.addEventListener("click", copyScenarioSummary);
}

function setupScrollSpy() {
  const progress = $("#scroll-progress");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }

      const id = entry.target.id;
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
      });
    }
  }, {
    rootMargin: "-35% 0px -55% 0px",
    threshold: 0.1,
  });

  sections.map((id) => document.getElementById(id)).filter(Boolean).forEach((section) => observer.observe(section));

  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll <= 0 ? 0 : scrollTop / maxScroll;
    progress.style.width = `${clamp(ratio * 100, 0, 100)}%`;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

async function loadModel() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }

    const loaded = await response.json();
    return deepMerge(DEFAULT_MODEL, loaded);
  } catch {
    return data;
  }
}

async function init() {
  const model = await loadModel();
  Object.assign(data, model);
  state.energyMix = normalizeEnergyMix(data.energy.defaultMix ?? DEFAULT_MODEL.energy.defaultMix, DEFAULT_MODEL.energy.defaultMix);
  state.electricityDemandPerPerson = data.energy.electricityDemandPerPersonMwh ?? (data.energy.householdAnnualDemandMwh / data.energy.personsPerHousehold);
  state.solarPopulation = data.solarLab.population;
  state.solarPerCapitaKWh = data.solarLab.perCapitaElectricityKWh;
  state.batteryMWh = data.solarLab.batteryBatchMWh;
  state.batteryHaulDistanceKm = data.solarLab.batteryHaulDistanceKm;
  attachSliderListeners(data);
  setupScrollSpy();
  renderAll(data);
  window.addEventListener("resize", () => renderAll(data), { passive: true });
}

init();
