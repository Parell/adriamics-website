import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = import.meta.dirname;
const website = resolve(root, "website");
const output = resolve(root, "public");

try {
  rmSync(output, { recursive: true, force: true });
} catch (error) {
  // Windows can keep the output directory itself open while still allowing
  // its generated contents to be removed (for example, while Wrangler runs).
  if (error.code !== "EPERM" && error.code !== "EBUSY") throw error;
  for (const entry of readdirSync(output)) {
    rmSync(resolve(output, entry), { recursive: true, force: true });
  }
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

const projectRegistry = JSON.parse(readFileSync(resolve(website, "public.json"), "utf8"));
const projects = projectRegistry.projects;
if (!Array.isArray(projects) || projects.length === 0) throw new Error("website/public.json must define at least one public project.");
const projectIds = new Set();
const projectUrls = new Set();
for (const project of projects) {
  for (const key of ["id", "name", "label", "verb", "status", "headline", "url", "visual"]) {
    if (typeof project[key] !== "string" || !project[key].trim()) throw new Error(`Public project is missing ${key}.`);
  }
  if (!/^[a-z0-9-]+$/.test(project.id) || projectIds.has(project.id)) throw new Error(`Invalid or duplicate public project id: ${project.id}`);
  if (projectUrls.has(project.url)) throw new Error(`Duplicate public project URL: ${project.url}`);
  projectIds.add(project.id);
  projectUrls.add(project.url);
  if (!project.url.startsWith("/") || project.url.startsWith("//")) throw new Error(`Invalid public project URL: ${project.url}`);
}

const manifestSandbox = { window: {} };
vm.runInNewContext(readFileSync(resolve(root, "study/source/manifest.js"), "utf8"), manifestSandbox);
const studyManifest = manifestSandbox.window.ADRIAMICS_STUDY_MANIFEST;
if (!Array.isArray(studyManifest?.structures)) throw new Error("Could not load study project facts.");
let studyTopicCount = 0;
function countTopics(nodes) {
  for (const node of nodes) {
    if (node.path) studyTopicCount += 1;
    if (Array.isArray(node.children)) countTopics(node.children);
  }
}
countTopics(studyManifest.structures);

function renderProjectNavigation(currentPath) {
  const links = projects.map((project) => {
    const current = currentPath === project.url || (project.id === "study" && currentPath.startsWith("/study/"));
    return `<a href="${escapeHtml(project.url)}"${current ? ' aria-current="page"' : ""}>${escapeHtml(project.name)}</a>`;
  }).join("");
  return `<header class="site-header"><div class="shell site-header__inner"><a class="site-brand" href="/" aria-label="Adriamics home">Adriamics</a><nav class="site-nav" aria-label="Main navigation">${links}<a href="https://github.com/Parell/adriamics" target="_blank" rel="noopener noreferrer">GitHub</a></nav></div></header>`;
}

function renderFooter() {
  return `<footer class="shell site-footer"><span>ADRIAMICS © 2026</span><nav class="site-footer__links" aria-label="Footer navigation"><a href="https://github.com/Parell/adriamics" target="_blank" rel="noopener noreferrer">GitHub</a><a href="mailto:contact@adriamics.com">Contact</a><a href="/study/">Study</a><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a></nav></footer>`;
}

function visualFor(project) {
  if (project.visual === "prerequisite-graph") return `<svg viewBox="0 0 260 130" role="img" aria-labelledby="study-graph-title"><title id="study-graph-title">Math, physics, and engineering form a learning path</title><path d="M36 65H224M82 65 130 30m0 35 48 35"/><circle class="node-fill" cx="36" cy="65" r="12"/><circle class="node-fill" cx="130" cy="30" r="12"/><circle class="node-fill" cx="130" cy="65" r="12"/><circle class="node-fill" cx="178" cy="100" r="12"/><circle class="node-fill" cx="224" cy="65" r="12"/></svg>`;
  if (project.visual === "mission-pipeline") return `<svg viewBox="0 0 260 130" role="img" aria-labelledby="frame-graph-title"><title id="frame-graph-title">Mission design, simulation, verification, and flight software pipeline</title><path d="M32 65H228M82 65V38m48 27V92m48-27V38"/><rect class="node-fill" x="20" y="53" width="24" height="24"/><circle class="node-fill" cx="82" cy="65" r="11"/><circle class="node-fill" cx="130" cy="65" r="11"/><circle class="node-fill" cx="178" cy="65" r="11"/><rect class="node-fill" x="216" y="53" width="24" height="24"/></svg>`;
  if (project.visual === "orbit-schematic") return `<svg viewBox="0 0 260 130" role="img" aria-labelledby="tug-graph-title"><title id="tug-graph-title">Orbital transfer concept</title><ellipse cx="130" cy="65" rx="88" ry="32" transform="rotate(-18 130 65)"/><path d="M54 75C83 22 159 20 204 54" stroke-dasharray="4 5"/><circle class="node-fill" cx="54" cy="75" r="5"/><circle class="node-fill" cx="204" cy="54" r="5"/><circle class="node-fill" cx="130" cy="65" r="3"/></svg>`;
  return `<svg viewBox="0 0 260 130" role="img" aria-label="${escapeHtml(project.name)} engineering schematic"><path d="M34 65H226M130 28V102"/><circle class="node-fill" cx="34" cy="65" r="11"/><circle class="node-fill" cx="130" cy="65" r="18"/><circle class="node-fill" cx="226" cy="65" r="11"/></svg>`;
}

function renderProjectSequence() {
  return projects.map((project, index) => `<a class="project-card" href="${escapeHtml(project.url)}"><span class="project-card__number">0${index + 1} / ${escapeHtml(project.verb)}</span><span class="project-card__visual">${visualFor(project)}</span><span class="project-card__bottom"><span><span class="project-card__title">${escapeHtml(project.label)}</span><span class="project-card__verb">${escapeHtml(project.verb)}</span><span class="project-card__description">${escapeHtml(project.headline)}</span></span><span class="project-card__arrow" aria-hidden="true">↗</span></span></a>`).join("");
}

function renderProjectStatus() {
  return `<div class="evidence__items">${projects.map((project) => {
    const value = project.id === "study" ? `${studyTopicCount} TOPICS · ${project.status}`
      : project.version ? `${project.version} · ${project.status}` : project.status;
    return `<div class="evidence__item"><span class="evidence__name">${escapeHtml(project.label)}</span><span class="evidence__value">${escapeHtml(value)}</span></div>`;
  }).join("")}</div>`;
}

function applyProjectFacts(html) {
  return html.replace(/\{\{project\.([a-z0-9-]+)\.([a-z]+)\}\}/g, (token, id, field) => {
    const project = projects.find((entry) => entry.id === id);
    if (!project) throw new Error(`Project page references unknown project: ${id}`);
    const value = field === "headline" || field === "status" || field === "version" || field === "name" ? project[field] : undefined;
    if (value === undefined) throw new Error(`Project ${id} does not publish ${field}.`);
    return escapeHtml(value);
  });
}

mkdirSync(output, { recursive: true });

const files = ["website.css", "website.js", "robots.txt", "_headers"];

for (const file of files) {
  const source = resolve(website, file);
  if (existsSync(source)) cpSync(source, resolve(output, file));
}
for (const [file, route] of [["index.html", "/"], ["privacy-policy.html", "/privacy-policy"], ["terms-of-service.html", "/terms-of-service"]]) {
  let html = readFileSync(resolve(website, file), "utf8");
  html = applyProjectFacts(html);
  for (const [marker, markup] of [["<!-- shared-site-header -->", renderProjectNavigation(route)], ["<!-- shared-site-footer -->", renderFooter()]]) {
    if (html.split(marker).length !== 2) throw new Error(`${file} must contain exactly one ${marker} marker.`);
    html = html.replace(marker, markup);
  }
  if (file === "index.html") {
    for (const [marker, markup] of [["<!-- project-sequence -->", renderProjectSequence()], ["<!-- project-status -->", renderProjectStatus()]]) {
      if (html.split(marker).length !== 2) throw new Error(`${file} must contain exactly one ${marker} marker.`);
      html = html.replace(marker, markup);
    }
  }
  writeFileSync(resolve(output, file), html);
}
for (const directory of ["assets", "privacy-policy", "terms-of-service", "rocinante", "frame", "tug"]) {
  const source = resolve(website, directory);
  if (existsSync(source)) cpSync(source, resolve(output, directory), { recursive: true });
}

cpSync(resolve(root, "assets"), resolve(output, "assets"), { recursive: true });
cpSync(resolve(root, "LICENSE"), resolve(output, "LICENSE"));

const studyOutput = resolve(output, "study");
mkdirSync(studyOutput, { recursive: true });
for (const file of ["study.css", "study.js"]) {
  cpSync(resolve(root, "study", file), resolve(studyOutput, file));
}

for (const directory of ["assets", "webmeji"]) {
  const source = resolve(root, "study", directory);
  if (existsSync(source)) cpSync(source, resolve(studyOutput, directory), { recursive: true });
}

const mathjax = resolve(root, "study", "vendor", "mathjax");
if (existsSync(mathjax)) cpSync(mathjax, resolve(studyOutput, "vendor", "mathjax"), { recursive: true });

console.log(`Built Cloudflare deployment files in ${output}`);
