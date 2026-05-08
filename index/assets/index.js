(function () {
  const SITE = window.ADRIAMICS_SITE || {};

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeHref(value) {
    return escapeHtml(encodeURI(String(value)));
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!succeeded) {
      throw new Error("Copy command failed");
    }
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  function sortByDateDesc(items = []) {
    return [...items].sort((left, right) => new Date(right.date) - new Date(left.date));
  }

  function getYearFromDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return String(date.getFullYear());
  }

  function getYearsFromItems(items = []) {
    return [...new Set(items.map((item) => getYearFromDate(item.date)).filter(Boolean))].sort(
      (left, right) => Number(right) - Number(left)
    );
  }

  function toSearchText(parts = []) {
    return parts
      .filter(Boolean)
      .flatMap((part) => (Array.isArray(part) ? part : [part]))
      .join(" ")
      .toLowerCase();
  }

  function renderTags(tags = []) {
    if (!tags.length) {
      return "";
    }

    return `<ul class="tag-list">${tags
      .map((tag) => `<li>${escapeHtml(tag)}</li>`)
      .join("")}</ul>`;
  }

  function renderLinkList(links = [], className = "link-list") {
    if (!links.length) {
      return "";
    }

    return `<div class="${className}">${links
      .map((link, index) => {
        const external = /^https?:\/\//i.test(link.href);
        const target = external ? ' target="_blank" rel="noreferrer"' : "";
        const variant = index === 0 ? "btn primary" : "btn secondary";
        const href = resolveHref(link.href);

        return `<a class="${variant}" href="${escapeHref(href)}"${target}>${escapeHtml(link.label)}</a>`;
      })
      .join("")}</div>`;
  }

  function getPortfolioHref() {
    return document.body.dataset.page === "home" ? "portfolio/" : "../portfolio/";
  }

  function resolveHref(value) {
    if (!value) {
      return "";
    }

    if (value === "portfolio") {
      return getPortfolioHref();
    }

    if (value.startsWith("site-section:")) {
      const section = value.slice("site-section:".length);

      if (!section) {
        return "";
      }

      return document.body.dataset.page === "home" ? `#${section}` : `../index.html#${section}`;
    }

    return value;
  }

  function resolveAssetSrc(value) {
    if (!value) {
      return "";
    }

    return document.body.dataset.page === "home" ? `index/assets/${value}` : `../index/assets/${value}`;
  }

  function getVisibleItems(container, items = []) {
    const limit = Number(container?.dataset?.limit || 0);

    return limit > 0 ? items.slice(0, limit) : items;
  }

  function renderNewsCard(item) {
    const search = toSearchText([item.title, item.summary, item.category, item.tags]);
    const imageSrc = resolveAssetSrc(item.image || "");
    const href = item.link ? resolveHref(item.link) : "";

    return `
      ${href
        ? `<a class="card news-card news-card-link" id="${escapeHtml(item.slug)}" href="${escapeHref(href)}" data-search="${escapeHtml(search)}">`
        : `<article class="card news-card" id="${escapeHtml(item.slug)}" data-search="${escapeHtml(search)}">`
      }
        ${imageSrc
        ? `
              <div class="card-media">
                <img src="${escapeHref(imageSrc)}" alt="${escapeHtml(item.imageAlt || item.title)}" loading="lazy" />
              </div>
            `
        : ""
      }
        <p class="eyebrow">${escapeHtml(item.category)} | ${escapeHtml(formatDate(item.date))}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        ${renderTags(item.tags)}
      ${href ? `</a>` : `</article>`}
    `;
  }

  function renderNewsYearButton(year, activeYear) {
    const active = year === activeYear;

    return `
      <button
        class="chip${active ? " is-active" : ""}"
        type="button"
        data-news-year="${escapeHtml(year)}"
        aria-pressed="${active ? "true" : "false"}"
      >
        ${escapeHtml(year)}
      </button>
    `;
  }

  function renderCards(container, items, renderer) {
    if (!container) {
      return;
    }

    const limit = Number(container.dataset.limit || 0);
    const sortedItems = container.dataset.sort === "date-desc" ? sortByDateDesc(items) : items;
    const finalItems = limit > 0 ? sortedItems.slice(0, limit) : sortedItems;

    container.innerHTML = finalItems.map(renderer).join("");
  }

  function renderNewsArchive() {
    const newsItems = sortByDateDesc(SITE.news || []);
    const yearButtons = $("#home-news-years");
    const newsList = $("#home-news");

    if (!yearButtons || !newsList) {
      return;
    }

    const years = getYearsFromItems(newsItems);
    let activeYear = years[0] || "";

    function render() {
      const visibleItems = activeYear
        ? newsItems.filter((item) => getYearFromDate(item.date) === activeYear)
        : newsItems;

      yearButtons.innerHTML = years.map((year) => renderNewsYearButton(year, activeYear)).join("");

      newsList.innerHTML = visibleItems.length
        ? visibleItems.map(renderNewsCard).join("")
        : `<p class="archive-empty">No newsroom entries are available for this year.</p>`;
    }

    yearButtons.addEventListener("click", (event) => {
      const button = event.target.closest("[data-news-year]");

      if (!button || !yearButtons.contains(button)) {
        return;
      }

      const nextYear = button.dataset.newsYear || "";

      if (nextYear && nextYear !== activeYear) {
        activeYear = nextYear;
        render();
      }
    });

    render();
  }

  function renderHome() {
    renderNewsArchive();
  }

  function renderNewsPage() {
    renderCards($("#news-list"), SITE.news || [], renderNewsCard);
  }

  function bindCurrentYear() {
    const year = String(new Date().getFullYear());
    $$("[data-current-year]").forEach((element) => {
      element.textContent = year;
    });
  }

  function bindHomeBackgroundFade() {
    if (document.body.dataset.page !== "home") {
      return;
    }

    const root = document.body;
    const motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    let rafId = 0;

    function update() {
      rafId = 0;

      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));

      root.style.setProperty("--home-bg-fade", progress.toFixed(4));
      root.style.setProperty("--home-bg-shift", (window.scrollY * 0.12).toFixed(2));
    }

    function scheduleUpdate() {
      if (rafId) {
        return;
      }

      rafId = window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    if (motionQuery) {
      if (typeof motionQuery.addEventListener === "function") {
        motionQuery.addEventListener("change", scheduleUpdate);
      } else if (typeof motionQuery.addListener === "function") {
        motionQuery.addListener(scheduleUpdate);
      }
    }
    update();
  }

  function init() {
    bindCurrentYear();
    bindHomeBackgroundFade();
    const page = document.body.dataset.page || "";

    if (page === "home") {
      renderHome();
    }

    if (page === "news") {
      renderNewsPage();
    }
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-text]");
    if (!button) {
      return;
    }

    event.preventDefault();

    const text = button.dataset.copyText;
    if (!text) {
      return;
    }

    try {
      await copyTextToClipboard(text);

      if (button.dataset.copyTempLabel) {
        const originalLabel = button.dataset.copyOriginalLabel || button.textContent;
        button.dataset.copyOriginalLabel = originalLabel;
        button.textContent = button.dataset.copyTempLabel;

        window.setTimeout(() => {
          if (button.dataset.copyOriginalLabel === originalLabel && button.textContent === button.dataset.copyTempLabel) {
            button.textContent = originalLabel;
          }
        }, 1600);
      }

      const status = button.querySelector("[data-copy-email-status]");
      if (status) {
        status.textContent = "Email copied to clipboard";
        window.setTimeout(() => {
          if (status.textContent === "Email copied to clipboard") {
            status.textContent = "";
          }
        }, 1800);
      }
    } catch {
      const status = button.querySelector("[data-copy-email-status]");
      if (status) {
        status.textContent = "Could not copy email";
        window.setTimeout(() => {
          if (status.textContent === "Could not copy email") {
            status.textContent = "";
          }
        }, 2200);
      }
    }
  });

  document.addEventListener("DOMContentLoaded", init);
})();
