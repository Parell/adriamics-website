import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = import.meta.dirname;
const output = resolve(root, "public");

rmSync(output, { force: true, recursive: true });
mkdirSync(output, { recursive: true });

const files = [
  "index.html",
  "site.min.css",
  "site.min.js",
  "robots.txt",
  "sitemap.xml",
  "LICENSE",
  "_headers"
];

for (const file of files) cpSync(resolve(root, file), resolve(output, file));

for (const directory of ["assets", "privacy-policy", "terms-of-service", "rocinante"]) {
  const source = resolve(root, directory);
  if (existsSync(source)) cpSync(source, resolve(output, directory), { recursive: true });
}

console.log(`Built Cloudflare deployment files in ${output}`);
