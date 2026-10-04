import { watch } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const watchedDirectories = ["website", "study/source"];
const watchedFiles = ["build.mjs", "sitemap.xml", "study/build-notes.mjs", "study/index.html", "study/notes.css", "study/notes.js"];
let timer;
let building = false;
let rebuildQueued = false;

function build() {
  if (building) {
    rebuildQueued = true;
    return;
  }

  building = true;
  const child = spawn("npm", ["run", "build"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  child.on("exit", (code) => {
    building = false;
    if (code === 0) console.log("Build complete; refresh the browser to see the latest changes.");
    else console.error(`Build failed with exit code ${code}.`);
    if (rebuildQueued) {
      rebuildQueued = false;
      build();
    }
  });
}

function scheduleBuild() {
  clearTimeout(timer);
  timer = setTimeout(build, 250);
}

for (const directory of watchedDirectories) {
  watch(resolve(root, directory), { recursive: true }, scheduleBuild);
}
for (const file of watchedFiles) {
  watch(resolve(root, file), scheduleBuild);
}

console.log("Watching website/ and study sources. Changes rebuild public/ for the running Wrangler dev server.");
console.log("Press Ctrl+C to stop.");
