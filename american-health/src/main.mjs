import { renderDashboard, renderDashboardLoading, summarizeLatest } from "./dashboard.mjs";

const LOCAL_DATA_FILES = {
  latest: "./public/data/latest.json",
  history: "./public/data/history.json",
  calculated: "./public/data/calculated.json",
  sources: "./public/data/sources.json",
  assumptions: "./public/data/assumptions.json",
};

async function loadJson(url) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  return response.json();
}

export async function loadSiteData() {
  const [latest, history, calculated, sources, assumptions] = await Promise.all([
    loadJson(LOCAL_DATA_FILES.latest),
    loadJson(LOCAL_DATA_FILES.history),
    loadJson(LOCAL_DATA_FILES.calculated),
    loadJson(LOCAL_DATA_FILES.sources),
    loadJson(LOCAL_DATA_FILES.assumptions),
  ]);

  return {
    latest,
    history,
    calculated,
    sources,
    assumptions,
  };
}

function setStatus(message, isError = false) {
  const statusNode = document.querySelector("[data-contract-status]");
  if (statusNode) {
    statusNode.textContent = message;
    statusNode.dataset.state = isError ? "error" : "ready";
  }

  document.body.dataset.americanHealthContract = isError ? "error" : "ready";
}

async function bootstrap() {
  const dashboardRoot = document.querySelector("[data-dashboard-root]");
  renderDashboardLoading(dashboardRoot);

  try {
    const data = await loadSiteData();
    window.__AMERICAN_HEALTH_DATA__ = data;

    const summary = summarizeLatest(data.latest);
    const sourceCount = Array.isArray(data.sources?.sources) ? data.sources.sources.length : 0;
    setStatus(
      `Local data ready for ${summary.baseline_year ?? "the current baseline"} with ${summary.record_count} records across ${sourceCount} sources.`,
    );
    renderDashboard(dashboardRoot, data);
  } catch (error) {
    console.error(error);
    setStatus("Local data could not be loaded.", true);
    if (dashboardRoot) {
      dashboardRoot.innerHTML =
        '<div class="dashboard-state dashboard-state--error"><h3 class="dashboard-state__title">Local data error</h3><p class="dashboard-state__message">The dashboard could not load because one or more local JSON files are missing or invalid.</p><p class="dashboard-state__detail">Check the browser console and confirm the files under public/data/ exist.</p></div>';
    }
  }
}

void bootstrap();
