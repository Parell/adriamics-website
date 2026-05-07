const SITE = {
  person: {
    name: "Daniel D. John",
    title: "Software Engineer | Engineering Physics Systems | Minnesota National Guard",
    intro:
      "I'm an engineer and physicist who builds software. I combine first-principles thinking with a deep understanding of aerospace control and computational simulation.",
    support: "Interested in software, science, or engineering ideas? Reach out.",
    github: "https://github.com/Parell",
    linkedin: "https://www.linkedin.com/in/daniel-john-6630b0232/",
    email: "parelldev01@gmail.com",
  },
  projects: [
    {
      name: "Physics Origin Shifting",
      status: "closed source",
      tone: "violet",
      caption: "large-world rendering support",
      image: {
        src: "../assets/test_image.png",
        alt: "Test image used for the Unity Continuous Floating Origin project card",
      },
      kicker: "Physics origin shifting for Unity",
      description:
        "Utility for keeping large Unity worlds numerically stable as the camera and scene scale increase. Useful for long-range traversal, precision management, and open-world simulations.",
      stack: ["Unity", "Origin shifting", "Large worlds", "C#"],
      links: [{ label: "Unity Asset Store", url: "https://u3d.as/3PCt" }],
    },
    {
      name: "GNC Trajectory Visualization",
      status: "open source",
      tone: "teal",
      caption: "trajectory planning tools",
      image: {
        src: "../assets/gnc_trajectory_visualization.png",
        alt: "Trajectory visualization for the GNC project",
      },
      kicker: "Mission trajectory visualization",
      description:
        "Visualization tools for guidance, navigation, and control trajectory work. Helps inspect paths, compare maneuvers, and reason about flight behavior during mission design.",
      stack: ["GNC", "Trajectory analysis", "Visualization"],
      links: [{ label: "GitHub", url: "https://github.com/Parell/gnc-trajectory-visualization" }],
    },
    {
      name: "ARA Rally Car",
      status: "in progress",
      tone: "amber",
      caption: "garage build",
      image: {
        src: "../assets/rally_car.jpg",
        alt: "2007 Subaru Impreza 2.5i rally car build",
      },
      kicker: "Rally car project",
      description:
        "A 2007 Subaru Impreza 2.5i that I'm building into a rally car. The focus is on a practical, capable setup that can handle the demands of real driving and competition.",
      stack: ["Automotive", "Rally", "Fabrication", "Build log"],
    },
    {
      name: "Decel",
      status: "closed source",
      tone: "violet",
      caption: "realistic space combat",
      kicker: "Small-scope orbital combat game",
      description:
        "A realistic space game built around N-body orbital mechanics with no patched conics. Defeat enemies to win, and fight with combat inspired by Children of a Dead Earth, but with more emphasis on piloting skill and tactical movement. The scope stays small: a world, weapons, and a way to get around.",
      stack: ["N-body mechanics", "Orbital combat", "Game dev", "Simulation"],
    },
    // {
    //   name: "pyEES",
    //   status: "open source",
    //   tone: "teal",
    //   caption: "thermodynamics solver",
    //   kicker: "Open-core browser-based thermodynamics solver",
    //   description:
    //     "An open-core, browser-based thermodynamics equation solver for students and instructors. Uses EES-like syntax, CoolProp-backed properties, units, parametric tables, plotting, assignments, and Python export.",
    //   stack: ["Thermodynamics", "EES syntax", "CoolProp", "Units", "Python export"],
    //   links: [{ label: "GitHub", url: "https://github.com/Parell/pyESS" }],
    // },
  ],
  blogPosts: [
    {
      title: "What this site is for",
      date: "2026-03-31",
      summary:
        "A temporary first post about the shape of this site, the kind of work I want to document here, and how the portfolio and blog should fit together.",
      url: "blog/what-this-site-is-for.html",
      kicker: "Temporary blog entry",
      caption: "site notes",
      tone: "teal",
      readTime: "3 min",
      tags: ["writing", "site updates", "systems"],
    },
  ],
};

const SELECTORS = {
  brandLink: "#brand-link",
  blogList: "#blog-list",
  blogNote: "#blog-note",
  featuredLink: "#featured-link",
  featuredMeta: "#featured-meta",
  featuredSummary: "#featured-summary",
  featuredTitle: "#featured-title",
  footerText: "#footer-text",
  githubNav: "#github-nav",
  heroEmail: "#hero-email",
  heroGithub: "#hero-github",
  heroLinkedin: "#hero-linkedin",
  heroLede: "#hero-lede",
  heroResume: "#hero-resume",
  heroSupport: "#hero-support",
  heroTitle: "#hero-title",
  heroEyebrow: "#hero-eyebrow",
  linkedinNav: "#linkedin-nav",
  projectsList: "#projects-list",
  projectsNote: "#projects-note",
  textStream: "#text-stream",
};

const TEXT_STREAM = {
  maxRows: 32,
  minLinesPerRow: 6,
  minRows: 16,
  rowHeight: 48,
  url: new URL("../assets/text-stream.txt", window.location.href).toString(),
};

const FALLBACK_TEXT_STREAM_LINES = [
  "systems over slogans",
  "physics informed software",
  "high signal, low ceremony",
  "deterministic by design",
  "measure before you guess",
  "control the failure modes",
  "numerics before intuition",
  "clarity over cleverness",
  "engineer the edge cases",
  "fast enough is a requirement",
  "reduce ambiguity early",
  "instrument everything useful",
  "good defaults, explicit exits",
  "build what can be verified",
  "simplicity is a constraint",
  "make state transitions obvious",
  "optimize the critical path",
  "prefer repeatable results",
  "document the invariants",
  "keep the feedback loop short",
];

const $ = (selector, root = document) => root.querySelector(selector);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setText(selector, value, root = document) {
  const element = $(selector, root);
  if (element) {
    element.textContent = value;
  }
}

function setLink(selector, href, root = document) {
  const element = $(selector, root);
  if (element) {
    element.href = href;
  }
}

function setCopyEmailButton(selector, email, root = document) {
  const element = $(selector, root);
  if (!element) {
    return;
  }

  element.dataset.copyEmail = email;
  element.title = "Copy email to clipboard";

  const label = element.querySelector("[data-copy-email-label]");
  if (label) {
    label.textContent = `email: ${email}`;
  } else {
    element.textContent = `email: ${email}`;
  }

  const hint = element.querySelector("[data-copy-email-hint]");
  if (hint) {
    hint.textContent = "copy";
  }

  const status = element.querySelector("[data-copy-email-status]");
  if (status) {
    status.textContent = "";
  }

  element.dataset.copyState = "idle";
}

function getGithubHandle(url) {
  return url.split("/").filter(Boolean).pop() || "your-username";
}

function sortPostsByDateDesc(posts) {
  const source = Array.isArray(posts) ? posts : [];
  return [...source].sort((left, right) => new Date(right.date) - new Date(left.date));
}

function renderHtmlList(items = [], renderItem) {
  const source = Array.isArray(items) ? items : [];
  return source.map((item, index) => renderItem(item, index)).join("");
}

function renderTags(items = []) {
  return renderHtmlList(items, (item) => `<li>${escapeHtml(item)}</li>`);
}

function renderLinks(links = []) {
  return renderHtmlList(links, (link, index) => {
    const external = /^https?:\/\//i.test(link.url);
    const classes = index === 0 ? "btn primary" : "btn secondary";

    return `<a class="${classes}" href="${escapeHtml(link.url)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${escapeHtml(link.label)}</a>`;
  });
}

function renderProjectCard(project) {
  const image = project.image ?? null;
  const stack = project.stack ?? [];
  const links = project.links ?? [];

  return `
    <article class="project-card">
      <div class="project-card__head">
        <h3>${escapeHtml(project.name)}</h3>
        <span class="project-status" data-status="${escapeHtml(project.status)}">${escapeHtml(project.status)}</span>
      </div>
      <div class="project-media${image?.src ? " has-image" : ""}" data-tone="${escapeHtml(project.tone)}" data-caption="${escapeHtml(project.caption)}">
        ${image?.src ? `<img class="project-media__image" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || "")}" loading="lazy" decoding="async" />` : ""}
      </div>
      <div class="project-card__body">
        <div class="project-kicker">${escapeHtml(project.kicker)}</div>
        <p class="project-desc">${escapeHtml(project.description)}</p>
        <ul class="tag-list">
          ${renderTags(stack)}
        </ul>
        <div class="project-links">
          ${renderLinks(links)}
        </div>
      </div>
    </article>
  `;
}

function renderBlogCard(post) {
  const tags = post.tags ?? [];

  return `
    <article class="project-card project-card--text-only">
      <div class="project-card__head">
        <h3>${escapeHtml(post.title)}</h3>
        <span class="project-status" data-status="blog">Blog</span>
      </div>
      <div class="project-card__body">
        <div class="project-kicker">${escapeHtml(post.kicker)} - ${escapeHtml(post.date)} - ${escapeHtml(post.readTime)}</div>
        <p class="project-desc">${escapeHtml(post.summary)}</p>
        <ul class="tag-list">
          ${renderTags(tags)}
        </ul>
        <div class="project-links">
          <a class="btn primary" href="${escapeHtml(post.url)}">Read post</a>
        </div>
      </div>
    </article>
  `;
}

function renderProjects(projects) {
  const container = $(SELECTORS.projectsList);
  if (!container) {
    return;
  }

  container.innerHTML = renderHtmlList(projects, renderProjectCard);
}

function renderBlogPosts(posts) {
  const container = $(SELECTORS.blogList);
  if (!container) {
    return;
  }

  container.innerHTML = renderHtmlList(posts, renderBlogCard);
}

function parseStreamText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

let currentTextStreamLines = FALLBACK_TEXT_STREAM_LINES;

function getTextStreamRowCount() {
  return Math.min(TEXT_STREAM.maxRows, Math.max(TEXT_STREAM.minRows, Math.round(window.innerHeight / TEXT_STREAM.rowHeight)));
}

function renderTextStreamRow(rowIndex, linesPerRow) {
  const seed = rowIndex * linesPerRow;
  const items = Array.from({ length: linesPerRow }, (_, lineIndex) => {
    const line = currentTextStreamLines[(seed + lineIndex) % currentTextStreamLines.length];
    return `<span class="text-stream__line">${escapeHtml(line)}</span>`;
  });

  const speed = 120 + (rowIndex % 4) * 80 + (rowIndex % 3) * 40;
  const delay = -(rowIndex % 5) * 6;

  return `
    <div class="text-stream__row">
      <div class="text-stream__track" style="--speed: ${speed}s; --delay: ${delay}s;">
        <div class="text-stream__group">${items.join("")}</div>
        <div class="text-stream__group" aria-hidden="true">${items.join("")}</div>
      </div>
    </div>
  `;
}

function renderTextStream(lines = currentTextStreamLines) {
  const container = $(SELECTORS.textStream);
  if (!container) {
    return;
  }

  currentTextStreamLines = lines.length > 0 ? lines : FALLBACK_TEXT_STREAM_LINES;
  const rows = getTextStreamRowCount();
  const linesPerRow = Math.max(TEXT_STREAM.minLinesPerRow, Math.ceil(currentTextStreamLines.length / rows));

  container.innerHTML = Array.from({ length: rows }, (_, rowIndex) => renderTextStreamRow(rowIndex, linesPerRow)).join("");
}

async function loadTextStream() {
  try {
    const response = await fetch(TEXT_STREAM.url);
    if (!response.ok) {
      throw new Error(`Failed to load text stream: ${response.status}`);
    }

    const lines = parseStreamText(await response.text());
    renderTextStream(lines);
  } catch {
    renderTextStream(FALLBACK_TEXT_STREAM_LINES);
  }
}

function renderFooter(person, githubHandle) {
  const footer = $(SELECTORS.footerText);
  if (!footer) {
    return;
  }

  footer.innerHTML = `
    <a href="${escapeHtml(person.github)}" target="_blank" rel="noreferrer">GitHub: @${escapeHtml(githubHandle)}</a>
    <span class="footer__sep" aria-hidden="true">-</span>
    <a href="${escapeHtml(person.linkedin)}" target="_blank" rel="noreferrer">LinkedIn</a>
    <span class="footer__sep" aria-hidden="true">-</span>
    <button
      class="copy-email"
      type="button"
      data-copy-email="${escapeHtml(person.email)}"
      data-copy-state="idle"
      title="Copy email to clipboard"
    >
      <span class="copy-email__label" data-copy-email-label>email: ${escapeHtml(person.email)}</span>
      <span class="copy-email__hint" data-copy-email-hint aria-hidden="true">copy</span>
      <span class="sr-only" data-copy-email-status aria-live="polite"></span>
    </button>
    <span class="footer__sep" aria-hidden="true">-</span>
    <a class="footer__top" href="#top">Back to top</a>
  `;
}

const copyEmailResetTimers = new WeakMap();

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

function setCopyEmailState(button, state, message) {
  if (!button) {
    return;
  }

  button.dataset.copyState = state;

  const hint = button.querySelector("[data-copy-email-hint]");
  if (hint) {
    hint.textContent = message;
  }

  const status = button.querySelector("[data-copy-email-status]");
  if (status) {
    status.textContent = state === "idle" ? "" : message === "copied" ? "Email copied to clipboard" : "Could not copy email";
  }

  button.title = state === "copied" ? "Copied to clipboard" : state === "error" ? "Copy failed" : "Copy email to clipboard";
}

function scheduleCopyEmailReset(button, delayMs = 1600) {
  const previous = copyEmailResetTimers.get(button);
  if (previous) {
    window.clearTimeout(previous);
  }

  const timeoutId = window.setTimeout(() => {
    setCopyEmailState(button, "idle", "copy");
    copyEmailResetTimers.delete(button);
  }, delayMs);

  copyEmailResetTimers.set(button, timeoutId);
}

function renderFeaturedBlog(post) {
  if (post) {
    setText(SELECTORS.featuredMeta, `Latest from the blog - ${post.date}`);
    setText(SELECTORS.featuredTitle, post.title);
    setText(SELECTORS.featuredSummary, post.summary);
    setLink(SELECTORS.featuredLink, post.url);
    setText(SELECTORS.featuredLink, "Read post ->");
    setText(SELECTORS.blogNote, "Newest post first");
    return;
  }

  setText(SELECTORS.featuredMeta, "Latest from the blog");
  setText(SELECTORS.featuredTitle, "Blog coming soon");
  setText(SELECTORS.featuredSummary, "A placeholder for the newest post will appear here once one exists.");
  setLink(SELECTORS.featuredLink, "#blog");
  setText(SELECTORS.featuredLink, "View blog list ->");
  setText(SELECTORS.blogNote, "Blog section");
}

function init() {
  const { person, projects, blogPosts } = SITE;
  const sortedPosts = sortPostsByDateDesc(blogPosts);
  const latestBlog = sortedPosts[0] ?? null;
  const githubHandle = getGithubHandle(person.github);

  document.title = `${person.name} // Portfolio`;

  setText(SELECTORS.brandLink, person.name);
  setText(SELECTORS.heroEyebrow, person.title);
  setText(SELECTORS.heroTitle, person.name);
  setText(SELECTORS.heroLede, person.intro);
  setText(SELECTORS.heroSupport, person.support);
  setText(SELECTORS.heroGithub, `github: @${githubHandle}`);
  setLink(SELECTORS.heroGithub, person.github);
  setText(SELECTORS.heroLinkedin, "LinkedIn");
  setLink(SELECTORS.heroLinkedin, person.linkedin);
  setCopyEmailButton(SELECTORS.heroEmail, person.email);
  setText(SELECTORS.heroResume, "resume: PDF");
  setLink(SELECTORS.heroResume, "../assets/Daniel John - Resume.pdf");
  setLink(SELECTORS.githubNav, person.github);
  setLink(SELECTORS.linkedinNav, person.linkedin);

  renderFeaturedBlog(latestBlog);
  setText(SELECTORS.projectsNote, "");
  renderProjects(projects);
  renderBlogPosts(sortedPosts);
  renderFooter(person, githubHandle);
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-email]");
  if (!button) {
    return;
  }

  event.preventDefault();

  const email = button.dataset.copyEmail;
  if (!email) {
    return;
  }

  try {
    await copyTextToClipboard(email);
    setCopyEmailState(button, "copied", "copied");
    scheduleCopyEmailReset(button);
  } catch {
    setCopyEmailState(button, "error", "failed");
    scheduleCopyEmailReset(button, 2200);
  }
});

window.addEventListener("resize", () => {
  renderTextStream(currentTextStreamLines);
});

init();
void loadTextStream();
