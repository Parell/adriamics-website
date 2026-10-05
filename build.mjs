import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { buildSync } from "esbuild";
import vm from "node:vm";

const root = import.meta.dirname;
const website = resolve(root, "website");
const output = resolve(root, "public");
const websiteCssVersion = createHash("sha256").update(readFileSync(resolve(website, "website.css"))).digest("hex").slice(0, 12);
const heroSphereBundle = buildSync({
  entryPoints: [resolve(website, "hero-sphere.js")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  minify: true,
  legalComments: "eof",
  write: false,
});
const heroSphereVersion = createHash("sha256").update(heroSphereBundle.outputFiles[0].contents).digest("hex").slice(0, 12);
const preserveStudyOutput = process.argv.includes("--preserve-study");

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
  if (!/^\/(?:[a-z0-9-]+\/)*$/.test(project.url) || project.url === "/") {
    throw new Error(`Invalid public project URL: ${project.url}`);
  }
  if (project.version !== undefined && (typeof project.version !== "string" || !project.version.trim())) {
    throw new Error(`Invalid public project version for ${project.id}.`);
  }
}

const manifestSandbox = { window: {} };
vm.runInNewContext(readFileSync(resolve(root, "study/source/manifest.js"), "utf8"), manifestSandbox);
const studyManifest = manifestSandbox.window.ADRIAMICS_STUDY_MANIFEST;
if (!Array.isArray(studyManifest?.structures) || studyManifest.structures.length === 0) {
  throw new Error("Study manifest must define at least one structure.");
}
function countTopics(nodes, location = "structures") {
  if (!Array.isArray(nodes)) throw new Error(`Study manifest ${location} must be an array.`);
  for (const [index, node] of nodes.entries()) {
    const nodeLocation = `${location}[${index}]`;
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      throw new Error(`Study manifest ${nodeLocation} must be an object.`);
    }
    if (typeof node.title !== "string" || !node.title.trim()) {
      throw new Error(`Study manifest ${nodeLocation} must have a title.`);
    }
    if (node.path !== undefined) {
      if (typeof node.path !== "string" || !node.path.trim()) {
        throw new Error(`Study manifest ${nodeLocation} has an invalid path.`);
      }
    }
    if (node.children !== undefined) countTopics(node.children, `${nodeLocation}.children`);
  }
}
countTopics(studyManifest.structures);

// Do not remove the last good site output until the controlled public inputs
// have passed validation. A malformed registry or Study manifest must not
// leave the deployment directory blank.
if (!preserveStudyOutput) {
  try {
    rmSync(output, { recursive: true, force: true });
  } catch (error) {
    // Windows can keep the output directory itself open while still allowing
    // its generated contents to be removed (for example, while Wrangler runs).
    if (error.code !== "EPERM" && error.code !== "EBUSY") throw error;
    for (const entry of readdirSync(output)) {
      if (entry === "study") continue;
      rmSync(resolve(output, entry), { recursive: true, force: true });
    }
  }
}

function renderProjectNavigation(currentPath) {
  return `<header class="site-header"><div class="shell site-header__inner"><a class="site-brand" href="/" aria-label="Adriamics home"><span>ADRI</span><em>AMICS</em></a><nav class="site-nav" aria-label="Main navigation"><button class="site-nav__contact" type="button" data-contact-open>Contact</button></nav></div></header>${renderContactPanel()}`;
}

function renderContactPanel() {
  return `<dialog class="contact-dialog" id="contact-dialog" aria-labelledby="contact-title"><div class="contact-dialog__inner"><div class="contact-dialog__heading"><div><h2 id="contact-title">Let's talk</h2><p><a href="mailto:contact@adriamics.com" data-copy-email="contact@adriamics.com">contact@adriamics.com</a></p></div><button class="contact-dialog__close" type="button" data-contact-close>Close</button></div><form class="contact-form" data-contact-form><div class="contact-form__grid"><label>Name<input name="name" autocomplete="name" required /></label><label>Email<input name="email" type="email" autocomplete="email" required /></label></div><label>Subject<input name="subject" required /></label><label>Message<textarea name="message" required></textarea></label><button class="project-action contact-form__submit" type="submit">Copy email template <span aria-hidden="true">↗</span></button><p class="contact-form__status" data-contact-status aria-live="polite"></p></form></div></dialog>`;
}

function renderFooter() {
  return `<footer class="shell site-footer"><span>ADRIAMICS © 2026</span><nav class="site-footer__social" aria-label="Social and contact links"><a href="https://www.linkedin.com/company/adriamics/" target="_blank" rel="noreferrer">LinkedIn</a><a href="https://x.com/adriamics" target="_blank" rel="noreferrer">X</a><a href="mailto:contact@adriamics.com" data-copy-email="contact@adriamics.com">contact@adriamics.com</a></nav><nav class="site-footer__legal" aria-label="Legal"><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a></nav></footer>`;
}

function renderGenericProjectPage(project) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="color-scheme" content="dark"/><meta name="description" content="${escapeHtml(project.headline)}"/><title>${escapeHtml(project.name)} — Adriamics</title><link rel="stylesheet" href="/website.css"/><script defer src="/website.js"></script></head><body class="project-page"><!-- shared-site-header --><main id="content" class="shell project-detail"><p class="eyebrow">${escapeHtml(project.verb)}</p><h1>${escapeHtml(project.name)}</h1><p class="project-detail__lede">${escapeHtml(project.headline)}</p><dl class="project-status"><div><dt>Status</dt><dd>${escapeHtml(project.status)}</dd></div></dl></main><!-- shared-site-footer --></body></html>`;
}

function applyProjectFacts(html) {
  return html.replace(/\{\{project\.([a-z0-9-]+)\.([a-z]+)\}\}/g, (token, id, field) => {
    const project = projects.find((entry) => entry.id === id);
    if (!project) throw new Error(`Project page references unknown project: ${id}`);
    const value = field === "headline" || field === "status" || field === "version" || field === "name" || field === "label" || field === "verb" ? project[field] : undefined;
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
writeFileSync(resolve(output, "hero-sphere.js"), heroSphereBundle.outputFiles[0].text);
mkdirSync(resolve(output, "vendor"), { recursive: true });
cpSync(resolve(root, "node_modules", "three", "LICENSE"), resolve(output, "vendor", "THREE-LICENSE.txt"));
for (const [file, route] of [["index.html", "/"], ["privacy-policy.html", "/privacy-policy"], ["terms-of-service.html", "/terms-of-service"]]) {
  let html = readFileSync(resolve(website, file), "utf8");
  html = applyProjectFacts(html);
  if (!html.includes('/website.js')) html = html.replace('</head>', '  <script defer src="/website.js"></script>\n</head>');
  for (const [marker, markup] of [["<!-- shared-site-header -->", renderProjectNavigation(route)], ["<!-- shared-site-footer -->", renderFooter()]]) {
    if (html.split(marker).length !== 2) throw new Error(`${file} must contain exactly one ${marker} marker.`);
    html = html.replace(marker, markup);
  }
  html = html.replace(/(\/website\.css\?v=)[a-zA-Z0-9._-]+/g, `$1${websiteCssVersion}`);
  html = html.replace(/href="\/website\.css(?:\?v=[^"]*)?"/g, `href="/website.css?v=${websiteCssVersion}"`);
  html = html.replace(/src="\/hero-sphere\.js(?:\?v=[^"]*)?"/g, `src="/hero-sphere.js?v=${heroSphereVersion}"`);
  writeFileSync(resolve(output, file), html);
}
const frameHtml = readFileSync(resolve(website, "frame", "index.html"), "utf8");
let renderedFrame = frameHtml;
if (!renderedFrame.includes('/website.js')) renderedFrame = renderedFrame.replace('</head>', '  <script defer src="/website.js"></script>\n</head>');
for (const [marker, markup] of [["<!-- shared-site-header -->", renderProjectNavigation("/frame/")], ["<!-- shared-site-footer -->", renderFooter()]]) {
  if (renderedFrame.split(marker).length !== 2) throw new Error(`website/frame/index.html must contain exactly one ${marker} marker.`);
  renderedFrame = renderedFrame.replace(marker, markup);
}
renderedFrame = renderedFrame.replace(/(\/website\.css)(?:\?v=[a-zA-Z0-9._-]+)?/g, `$1?v=${websiteCssVersion}`);
renderedFrame = renderedFrame.replace(/src="\/hero-sphere\.js(?:\?v=[^"]*)?"/g, `src="/hero-sphere.js?v=${heroSphereVersion}"`);
mkdirSync(resolve(output, "frame"), { recursive: true });
writeFileSync(resolve(output, "frame", "index.html"), renderedFrame);

for (const directory of ["assets", "privacy-policy", "terms-of-service", "rocinante"]) {
  const source = resolve(website, directory);
  if (existsSync(source)) cpSync(source, resolve(output, directory), { recursive: true });
}

mkdirSync(resolve(output, "assets"), { recursive: true });
for (const asset of ["favicon.png", "image-1.webp", "image-2.webp", "image-3.webp"]) {
  const source = resolve(root, "assets", asset);
  cpSync(source, resolve(output, "assets", asset));
}
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
