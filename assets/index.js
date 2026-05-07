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

    return document.body.dataset.page === "home" ? `assets/${value}` : `../assets/${value}`;
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

  function renderWorkCard(item) {
    const search = toSearchText([item.title, item.summary, item.kind, item.meta, item.badge, item.tags]);
    const imageSrc = resolveAssetSrc(item.image || "");

    return `
      <article class="card project-card" id="${escapeHtml(item.slug)}" data-search="${escapeHtml(search)}">
        ${imageSrc
        ? `
              <div class="card-media">
                <img src="${escapeHref(imageSrc)}" alt="${escapeHtml(item.imageAlt || item.title)}" loading="lazy" />
              </div>
            `
        : ""
      }
        <div class="card-top">
          <p class="eyebrow">${escapeHtml(item.kind)} | ${escapeHtml(item.meta)}</p>
          <span class="project-status">${escapeHtml(item.badge)}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        ${renderTags(item.tags)}
        ${renderLinkList(item.links || [], "project-links")}
      </article>
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

  function renderProjectsPage() {
    const container = $("#projects-list");
    renderCards(container, SITE.work || [], renderWorkCard);

    const search = $("#project-search");
    const chips = $$("[data-project-filter]");
    const cards = $$("[data-search]", container || document);

    function applyFilter(value) {
      const query = String(value || "").trim().toLowerCase();

      cards.forEach((card) => {
        const haystack = card.dataset.search || "";
        const visible = !query || haystack.includes(query);
        card.hidden = !visible;
      });

      chips.forEach((chip) => {
        chip.classList.toggle("is-active", chip.dataset.projectFilter === query);
      });
    }

    if (search) {
      search.addEventListener("input", (event) => {
        applyFilter(event.target.value);
      });
    }

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        if (!search) {
          return;
        }

        search.value = chip.dataset.projectFilter || "";
        applyFilter(search.value);
        search.focus();
      });
    });

    applyFilter(search?.value || "");
  }

  function populateRoleInterestField() {
    const input = $("#role-interest");

    if (!input) {
      return;
    }

    const roles = Array.isArray(SITE.careers?.roles) ? SITE.careers.roles : [];
    const suggestedRole = roles.find((role) => role && role.title && role.title.trim())?.title || "";

    if (suggestedRole) {
      input.placeholder = `e.g. ${suggestedRole}`;
    }
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

    if (page === "projects") {
      renderProjectsPage();
    }

    populateRoleInterestField();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
