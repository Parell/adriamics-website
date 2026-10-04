import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = import.meta.dirname;
const website = resolve(root, "website");
const output = resolve(root, "public");

rmSync(output, { force: true, recursive: true });
mkdirSync(output, { recursive: true });

const files = [
  "index.html",
  "site.css",
  "site.js",
  "robots.txt",
  "_headers"
];

for (const file of files) cpSync(resolve(website, file), resolve(output, file));
cpSync(resolve(website, "LICENSE"), resolve(output, "LICENSE"));
cpSync(resolve(root, "sitemap.xml"), resolve(output, "sitemap.xml"));

for (const directory of ["assets", "frame", "privacy-policy", "terms-of-service", "rocinante"]) {
  const source = resolve(website, directory);
  if (existsSync(source)) cpSync(source, resolve(output, directory), { recursive: true });
}

const studyOutput = resolve(output, "study");
mkdirSync(studyOutput, { recursive: true });
for (const file of ["index.html", "notes.css", "notes.js", "search-index.json"]) {
  cpSync(resolve(root, "study", file), resolve(studyOutput, file));
}

for (const directory of ["assets", "engineering", "hidden", "math", "physics", "webmeji"]) {
  const source = resolve(root, "study", directory);
  if (existsSync(source)) cpSync(source, resolve(studyOutput, directory), { recursive: true });
}

const mathjax = resolve(root, "study", "vendor", "mathjax");
if (existsSync(mathjax)) cpSync(mathjax, resolve(studyOutput, "vendor", "mathjax"), { recursive: true });

console.log(`Built Cloudflare deployment files in ${output}`);
