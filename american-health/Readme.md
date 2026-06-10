The New American Health System
## Core message

The website should explain one simple idea:

> The U.S. can reduce public healthcare cost growth by moving from fragmented entitlement payment to a simpler system built around transparent national prices, universal catastrophic insurance, automatic income-based subsidies, mandatory health savings, and a safety net.

The system being explained has seven parts:

1. Mandatory savings
2. Universal catastrophic insurance
3. Automatic income-based subsidies
4. Transparent national prices
5. Safety net only after account + insurance + subsidy
6. Private insurance as optional supplement
7. One automated account system

---

## Main website goal

The website should help a normal person understand:

- what the current U.S. healthcare system costs,
- why it is expensive,
- what Singapore-style structure means,
- what the proposed U.S. replacement would do,
- what implementation order makes sense,
- how much money could be saved under different assumptions,
- which claims are data-based and which claims are policy assumptions.

The website should be built around data, not static talking points.

---

## Recommended site structure

### Home

Purpose: Explain the whole idea in under 60 seconds.

Sections:

1. Current U.S. healthcare spending
2. The target system
3. Why price control comes first
4. How the transition works
5. Link to dashboard
6. Link to implementation timeline

Suggested hero copy:

> The U.S. healthcare system spends far more than peer systems because prices, coverage, subsidies, and insurance are fragmented. This proposal shows a simpler replacement path: national transparent prices first, then universal catastrophic coverage, automatic subsidies, medical savings accounts, and a final safety net.

Primary call to action:

> View the cost model

---

### Cost Dashboard

Purpose: Show current spending, program costs, and possible savings.

Cards:

| Card                        | Data shown                                   |
| --------------------------- | -------------------------------------------- |
| U.S. health spending        | total national health expenditures           |
| Health spending as % of GDP | current healthcare share of GDP              |
| Medicare spending           | annual Medicare spending                     |
| Medicaid spending           | annual Medicaid spending                     |
| Out-of-pocket spending      | annual household direct spending             |
| Federal share               | federally sponsored health spending          |
| State/local share           | state/local sponsored health spending        |
| Singapore benchmark         | Singapore health spending as % of GDP        |
| Reform target               | selected target public health spending share |
| Estimated savings           | model-estimated annual savings               |

Recommended chart types:

- Line chart: U.S. health spending as % GDP over time
- Line chart: Singapore vs U.S. health spending as % GDP
- Stacked bar: U.S. health spending by payer
- Slider calculator: target public health spending as % GDP
- Timeline: policy rollout sequence

---

### Current System

Purpose: Explain what exists today.

Explain:

- Medicare
- Medicaid
- CHIP
- ACA subsidies
- employer insurance tax preference
- private insurance
- out-of-pocket payments
- Social Security/Medicare payroll taxes
- HHS/CMS administrative role

Suggested diagram:

Today:
Worker / Employer
   ↓
Payroll taxes + premiums + deductibles + income taxes
   ↓
Social Security, Medicare, Medicaid, ACA, employer insurance, private insurers
   ↓
Hospitals, physicians, drug companies, pharmacies, long-term care

Message:
> The current system has many payers, many eligibility gates, many plan types, and many hidden prices.

---

### Proposed System

Purpose: Explain the replacement architecture.

Suggested diagram:

Proposed:
Worker / Employer / Treasury
   ↓
American Provident Account
   ├── Health Savings Account
   ├── Retirement Account
   ├── Disability Insurance Pool
   ├── Survivor Insurance Pool
   └── Catastrophic Health Premium
        ↓
National Catastrophic Plan + Price Schedule
        ↓
Approved providers at transparent national prices

Core design:

| System part                      | Function                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| Mandatory savings                | prefunds routine healthcare and retirement                  |
| Universal catastrophic insurance | covers large medical events                                 |
| Automatic subsidies              | supports low-income households without complex applications |
| Transparent national prices      | prevents accounts from being drained by inflated prices     |
| Safety net                       | last-resort protection after normal layers fail             |
| Private insurance                | optional supplemental upgrade                               |
| Automated account                | one payment rail for contributions, benefits, and subsidies |

---

### Implementation Timeline

Purpose: Show that this should not be launched all at once.

Recommended policy implementation order:

| Phase | Reform                           | Reason                                                           |
| ----: | -------------------------------- | ---------------------------------------------------------------- |
|     1 | Transparent national prices      | price control must come before accounts                          |
|     2 | Automated data/payment rail      | system needs IDs, claims, income, and account infrastructure     |
|     3 | Universal catastrophic insurance | protects people before shifting routine costs                    |
|     4 | Automatic income-based subsidies | replaces welfare-style enrollment with automatic top-ups         |
|     5 | Mandatory health savings         | works only after prices and catastrophic coverage exist          |
|     6 | Medicaid/ACA conversion          | convert into top-ups, premiums, and safety-net support           |
|     7 | Private insurance supplement     | move private insurance from core coverage to optional upgrades   |
|     8 | Retirement reform later          | do not bundle Social Security replacement into first health bill |

Main message:

> Transparent prices first. Catastrophic protection second. Mandatory savings later.

---

### Interactive Savings Calculator

Purpose: Let users test assumptions.

Inputs:

| Input                                   |                                  Default |
| --------------------------------------- | ---------------------------------------: |
| U.S. health spending                    |                         latest CMS value |
| U.S. GDP                                | derived from CMS or pulled from BEA/FRED |
| federal sponsor share                   |                         latest CMS value |
| state/local sponsor share               |                         latest CMS value |
| target government health spending % GDP |                                     4.0% |
| target total health spending % GDP      |                  optional, default 12.0% |
| implementation efficiency factor        |                                      50% |
| transition cost factor                  |                      10-year cost offset |

Outputs:

| Output                             | Formula                                                                |
| ---------------------------------- | ---------------------------------------------------------------------- |
| implied GDP                        | health_spending / health_spending_gdp_share                            |
| current government health spending | health_spending × government_sponsor_share                             |
| target government health spending  | GDP × target_government_health_share                                   |
| gross annual government savings    | current_government_health_spending - target_government_health_spending |
| adjusted annual savings            | gross_savings × implementation_efficiency_factor                       |
| national spending at target        | GDP × target_total_health_share                                        |
| national savings                   | current_health_spending - national_spending_at_target                  |

Example formula:

```ts
const impliedGDP = nhe.total / nhe.healthShareGDP;

const currentGovHealth =
  nhe.total * (nhe.federalSponsorShare + nhe.stateLocalSponsorShare);

const targetGovHealth = impliedGDP * targetGovShareGDP;

const grossGovSavings = currentGovHealth - targetGovHealth;

const adjustedGovSavings =
  Math.max(0, grossGovSavings) * implementationEfficiency;
```

Important disclaimer:

> The calculator estimates fiscal room under user-selected assumptions. It is not a formal budget score.

---

## Real data sources

Use official or highly stable public sources first.

Official public data sources
   ↓
Node build scripts download raw files/API responses
   ↓
Raw data is cached locally for audit/debug
   ↓
Scripts normalize, truncate, and compute derived values
   ↓
Static JSON files are written into /public/data
   ↓
The browser loads only local JSON/JS files

No CMS, Treasury, World Bank, BEA, or CBO API calls should run in the user's browser.
- lets the build fail if source data is invalid,
- keeps the frontend simple: HTML, CSS, JS, and local JSON.

/index.html
/assets/*.js
/assets/*.css
/data/latest.json
/data/history.json
/data/calculated.json
/data/sources.json
/data/assumptions.json

american-health/
  index.html
  src/
    main.mjs
    dashboard.mjs
    calculator.mjs
    charts.mjs
    format.mjs
  public/
    data/
      latest.json
      history.json
      calculated.json
      sources.json
      assumptions.json
  data/
    raw/
      cms/
      worldbank/
      treasury/
      bea/
      cbo/
    normalized/
      cms_nhe.json
      worldbank_health_gdp.json
      treasury_mts.json
  scripts/
    sources/
      fetch-cms-nhe.mjs
      fetch-worldbank.mjs
      fetch-treasury.mjs
      fetch-bea.mjs
    normalize/
      normalize-cms-nhe.mjs
      normalize-worldbank.mjs
      normalize-treasury.mjs
    compute/
      compute-baseline.mjs
      compute-savings.mjs
      compute-history.mjs
    build-data.mjs

    node scripts/build-data.mjs

---

Example normalized CMS record:

```json
{
  "source_id": "cms_nhe_fact_sheet",
  "year": 2024,
  "national_health_expenditures": 5300000000000,
  "health_spending_gdp_share": 0.18,
  "medicare_spending": 1118000000000,
  "medicaid_spending": 931700000000,
  "federal_sponsor_share": 0.31,
  "state_local_sponsor_share": 0.16
}
```


/public/data/calculated.json
```

Example:

```json
{
  "generated_at": "2026-06-04T00:00:00.000Z",
  "baseline_year": 2024,
  "implied_gdp": 29444444444444,
  "current_government_health_spending": 2491000000000,
  "scenarios": [
    {
      "id": "target_gov_4pct_gdp_efficiency_50pct",
      "target_government_health_share_gdp": 0.04,
      "implementation_efficiency": 0.5,
      "target_government_health_spending": 1177777777778,
      "gross_government_savings": 1313222222222,
      "adjusted_government_savings": 656611111111
    }
  ]
}
```

Use local fetch only.

```js
export async function loadSiteData() {
  const [latest, history, calculated, sources, assumptions] = await Promise.all([
    fetch('/data/latest.json').then(r => r.json()),
    fetch('/data/history.json').then(r => r.json()),
    fetch('/data/calculated.json').then(r => r.json()),
    fetch('/data/sources.json').then(r => r.json()),
    fetch('/data/assumptions.json').then(r => r.json())
  ]);

  return { latest, history, calculated, sources, assumptions };
}
```

Generate default scenarios during build.

```js
const targetGovShares = [0.03, 0.04, 0.05, 0.06];
const efficiencies = [0.25, 0.5, 0.75, 1.0];

const scenarios = [];

for (const target of targetGovShares) {
  for (const efficiency of efficiencies) {
    const targetGovHealth = impliedGDP * target;
    const grossSavings = currentGovHealth - targetGovHealth;

    scenarios.push({
      target_government_health_share_gdp: target,
      implementation_efficiency: efficiency,
      target_government_health_spending: targetGovHealth,
      gross_government_savings: grossSavings,
      adjusted_government_savings: Math.max(0, grossSavings) * efficiency
    });
  }
}
```

### Required MVP data sources

| Source                                                | Use                                                    |  Update frequency | Notes                                 |
| ----------------------------------------------------- | ------------------------------------------------------ | ----------------: | ------------------------------------- |
| CMS National Health Expenditure Accounts              | U.S. health spending, payer shares, service categories |            annual | primary U.S. health spending source   |
| CMS NHE Fact Sheet                                    | headline values for latest year                        |            annual | easier to validate manually           |
| Treasury Fiscal Data API / Monthly Treasury Statement | federal outlays and receipts                           |           monthly | use for current-year fiscal trend     |
| CBO Budget and Economic Outlook                       | projected federal spending and debt                    | annual/semiannual | use for projections                   |
| SSA Trustees Report                                   | Social Security and Medicare trust fund data           |            annual | use for retirement/disability context |
| World Bank WDI / WHO GHED                             | international health spending % GDP                    |            annual | use for Singapore/U.S. comparison     |
| Singapore Ministry of Health                          | Singapore budget and operating expenditure             |            annual | use for local benchmark               |
| BEA or FRED                                           | U.S. GDP                                               |         quarterly | use if not deriving GDP from CMS      |

### Source URLs

```text
CMS NHE Fact Sheet:
https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/nhe-fact-sheet

CMS NHE Historical Data:
https://www.cms.gov/data-research/statistics-trends-and-reports/national-health-expenditure-data/historical

Treasury Fiscal Data API:
https://fiscaldata.treasury.gov/api-documentation/

Treasury Monthly Statement:
https://fiscaldata.treasury.gov/datasets/monthly-treasury-statement/

CBO Budget and Economic Outlook:
https://www.cbo.gov/publication/62105

SSA Trustees Report Summary:
https://www.ssa.gov/oact/trsum/

World Bank health spending % GDP:
https://data.worldbank.org/indicator/SH.XPD.CHEX.GD.ZS

World Bank API example:
https://api.worldbank.org/v2/country/USA;SGP/indicator/SH.XPD.CHEX.GD.ZS?format=json

Singapore Ministry of Health:
https://www.moh.gov.sg/

BEA API:
https://apps.bea.gov/API/signup/

FRED GDP:
https://fred.stlouisfed.org/series/GDP
```

---

## Baseline values to display at launch

Use these as the initial seed data. Replace them automatically when newer data is available.

| Metric                                     |         Baseline |
| ------------------------------------------ | ---------------: |
| U.S. national health expenditures, 2024    |    $5.3 trillion |
| U.S. health spending share of GDP, 2024    |            18.0% |
| Medicare spending, 2024                    |  $1.118 trillion |
| Medicaid spending, 2024                    |   $931.7 billion |
| Private health insurance spending, 2024    | $1.6446 trillion |
| Out-of-pocket spending, 2024               |   $556.6 billion |
| Hospital expenditures, 2024                | $1.6347 trillion |
| Physician and clinical services, 2024      | $1.1097 trillion |
| Prescription drug spending, 2024           |   $467.0 billion |
| Federal government sponsor share, 2024     |              31% |
| State/local government sponsor share, 2024 |              16% |
| Household sponsor share, 2024              |              28% |
| Private business sponsor share, 2024       |              18% |

Source: CMS National Health Expenditure Fact Sheet, 2024 release.

---

## Data validation rules

Before publishing data, validate it.

Rules:

1. Spending values must be positive.
2. GDP share must be between 0 and 1.
3. Sponsor shares should total close to 1.0.
4. Latest year cannot move backward unless manually approved.
5. Every charted value must include a source name and URL.
6. Every calculated estimate must be labeled as a model estimate.
7. Never mix calendar-year CMS data and fiscal-year Treasury data without labeling.

---

### Savings calculator

Build the calculator with sliders:

- target government spending share of GDP,
- target total health spending share of GDP,
- implementation efficiency,
- transition cost offset.

Show:

- current estimated government health spending,
- target government health spending,
- gross annual savings,
- adjusted annual savings,
- national spending reduction.

---

### Charts

Add:

1. U.S. spending breakdown
2. Spending as % GDP
3. U.S. vs Singapore comparison
4. Implementation timeline
5. Savings scenario bars

---

### Source transparency

Every chart should show:

- source name,
- source URL,
- last checked date,
- calculation method.

Add a `/sources` page that lists every source and field.

---

## Policy implementation order to show on the site

This should be one of the main visuals.

```text
1. Transparent national prices
2. Automated payment and eligibility rail
3. Universal catastrophic insurance
4. Automatic income-based subsidies
5. Mandatory health savings
6. Medicaid/ACA conversion
7. Private insurance as supplemental coverage
8. Retirement account reform later
```

Explain why:

### 1. Transparent national prices

This comes first because savings accounts fail if medical prices remain inflated.

Key policy:

> Any provider accepting federal healthcare money must accept national reference prices for covered services.

---

### 2. Automated payment and eligibility rail

Build the infrastructure before replacing benefits.

Needed systems:

- national patient ID or privacy-safe equivalent,
- provider ID,
- household income feed from IRS/Treasury,
- account ledger,
- claims clearinghouse,
- audit system.

---

### 3. Universal catastrophic insurance

Protect people before shifting routine expenses into accounts.

Coverage:

- hospital care,
- cancer treatment,
- dialysis,
- major trauma,
- high-cost drugs,
- expensive chronic disease,
- major surgery.

---

### 4. Automatic income-based subsidies

Subsidies should be automatic.

No separate Medicaid-style eligibility churn for normal support.

Rules:

```text
Income data → monthly subsidy calculation → account top-up or premium payment
```

---

### 5. Mandatory health savings

Only start required savings after prices and catastrophic insurance are in place.

Reason:

> Health savings accounts only work if normal care has predictable, transparent, controlled prices.

---

### 6. Medicaid/ACA conversion

Convert gradually:

1. ACA marketplace population
2. Medicaid expansion adults
3. CHIP/children
4. elderly low-income groups
5. disabled and high-cost populations last

Do not rush disabled/high-cost groups.

---

### 7. Private insurance supplement

Private insurance remains legal but moves into add-ons:

- broader networks,
- lower deductibles,
- private hospital rooms,
- dental/vision/hearing,
- premium hospitals,
- faster specialist access.

---

### 8. Retirement later

Do not combine full Social Security replacement with the first healthcare bill.

Reason:

> Healthcare price reform is already large enough. Retirement transition creates separate financing problems because current retirees still need benefits while younger workers build accounts.

---

## 14. Website copy: plain-English explanation

Use this on the system page.

```text
This proposal does not make healthcare free. It changes who pays, when they pay, and at what price.

Today, the U.S. pays through a maze of Medicare, Medicaid, ACA subsidies, employer insurance, private insurance, payroll taxes, premiums, deductibles, and out-of-pocket bills.

The proposed system uses one national account and one basic protection layer.

Routine care is paid from a health savings account.
Large medical bills are covered by universal catastrophic insurance.
Low-income households receive automatic deposits and premium support.
Providers accepting federal money must use transparent national prices.
Private insurance becomes optional supplemental coverage.
A safety net remains for people whose account, insurance, and subsidies are still not enough.
```

---

## 15. Website copy: why prices come first

Use this on the implementation page.

```text
The first reform is not mandatory savings. The first reform is transparent national prices.

If the U.S. creates health savings accounts while hospital and drug prices remain uncontrolled, the accounts will be drained by the same inflated prices that make the current system expensive.

Price control is the foundation. After prices are predictable, catastrophic insurance and health savings accounts become workable.
```

---

## 16. Website copy: what makes it automatic

```text
The system should work like payroll withholding.

Money enters the account automatically.
Income-based support is calculated automatically.
Catastrophic insurance enrollment is automatic.
Approved claims are paid through one clearinghouse.
Safety-net help is triggered when account balance, income, and medical need meet defined rules.

The goal is to remove annual plan shopping, Medicaid churn, duplicate applications, and fragmented eligibility checks.
```

---

## 17. Main assumptions to expose

Create `/public/data/assumptions.json`.

```json
{
  "policy_assumptions": [
    {
      "id": "price_schedule_required",
      "label": "National reference prices apply to providers accepting federal money",
      "type": "policy_assumption"
    },
    {
      "id": "catastrophic_universal",
      "label": "Every resident is automatically enrolled in catastrophic coverage",
      "type": "policy_assumption"
    },
    {
      "id": "subsidies_income_based",
      "label": "Subsidies are calculated from income and household status",
      "type": "policy_assumption"
    },
    {
      "id": "private_supplemental",
      "label": "Private insurance becomes optional supplemental coverage",
      "type": "policy_assumption"
    }
  ],
  "model_assumptions": [
    {
      "id": "target_government_health_gdp",
      "label": "Target government health spending as share of GDP",
      "default": 0.04
    },
    {
      "id": "implementation_efficiency",
      "label": "Share of theoretical savings actually achieved",
      "default": 0.5
    }
  ]
}
```

---

## 18. Disclaimers

The site should include these plainly:

```text
This website is an explanatory model, not an official budget score.

Savings estimates depend on assumptions about prices, utilization, subsidies, provider behavior, and transition costs.

CMS, Treasury, CBO, SSA, World Bank, and Singapore MOH data are used where available. Any estimate not directly published by those sources is labeled as a model calculation.
```

```text
Calendar-year and fiscal-year data are not the same. CMS health spending is usually calendar-year data. Federal budget data is usually fiscal-year data. The site labels both separately.
```

```text
Singapore is used as a structural example. The U.S. version would require different rules because the U.S. is larger, older, more expensive, more federalized, and has existing Medicare, Medicaid, Social Security, employer insurance, and private insurance commitments.
```

---

## 21. Suggested visual design

Use a clean civic/data style.

Recommended design:

- white or dark neutral background,
- large metric cards,
- simple charts,
- no colors,
- every number has a source,
- every assumption is labeled,
- avoid emotional language.

Tone:

> clear, technical, public-interest, not campaign-style.

---

## 22. Future features

After MVP:

1. state-by-state Medicaid spending map,
2. household impact calculator,
3. employer insurance cost comparison,
4. hospital price transparency explorer,
5. international comparison dashboard,
6. downloadable policy brief,
7. simulation mode for different target GDP shares,
8. public GitHub data audit,
9. API endpoint for all model outputs,
10. versioned assumptions history.

---

## 23. Final implementation principle

The website should make one thing obvious:

> The reform does not start by replacing every program. It starts by controlling prices, building automatic payment infrastructure, and then moving people into a simpler account + insurance + subsidy system.

That is the cleanest sequence:

```text
Prices → payment rail → catastrophic protection → subsidies → accounts → program conversion
```
