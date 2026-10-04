import { existsSync, watch } from "node:fs";
import { spawn } from "node:child_process";
import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const websiteRoot = resolve(root, "website");
const watchedDirectories = ["website", "assets", "study/source", "study/assets", "study/webmeji", "study/vendor/mathjax"];
const watchedFiles = ["build.mjs", "website/build.mjs", "study/build-study.mjs", "study/study.css", "study/study.js"];
const staticWebsiteFiles = new Set(["website.js", "robots.txt", "_headers", "LICENSE"]);
let timer;
let building = false;
let rebuildQueued = false;
let fullBuildQueued = false;
let websiteBuildQueued = false;
const pendingWebsiteCopies = new Set();
const watchers = [];

function run(scriptPath) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [scriptPath], { cwd: root, stdio: "inherit" });
    child.once("error", rejectRun);
    child.once("exit", (code) => code === 0 ? resolveRun() : rejectRun(new Error(`Command exited with code ${code}.`)));
  });
}

async function runBuild(full = false) {
  await run(resolve(root, "build.mjs"));
  if (full) await run(resolve(root, "study", "build-study.mjs"));
}

function queueBuild(kind = "drain") {
  if (kind === "full") fullBuildQueued = true;
  else if (kind !== "drain") websiteBuildQueued = true;
  if (kind.startsWith("copy:")) pendingWebsiteCopies.add(kind.slice(5));
  if (building) {
    rebuildQueued = true;
    return;
  }

  building = true;
  void (async () => {
    try {
      if (fullBuildQueued) {
        fullBuildQueued = false;
        websiteBuildQueued = false;
        pendingWebsiteCopies.clear();
        await runBuild(true);
      } else {
        const files = [...pendingWebsiteCopies];
        pendingWebsiteCopies.clear();
        if (files.length) {
          for (const file of files) await copyFile(resolve(websiteRoot, file), resolve(root, "public", file));
        }
        if (websiteBuildQueued) {
          websiteBuildQueued = false;
          await runBuild();
        }
      }
      console.log("Build complete; refresh the browser to see the latest changes.");
    } catch (error) {
      console.error(`Build failed: ${error.message}`);
    } finally {
      building = false;
      if (rebuildQueued) {
        rebuildQueued = false;
        queueBuild(fullBuildQueued ? "full" : "website");
      }
    }
  })();
}

function scheduleBuild(kind) {
  if (kind === "full") fullBuildQueued = true;
  else websiteBuildQueued = true;
  if (kind.startsWith("copy:")) pendingWebsiteCopies.add(kind.slice(5));
  clearTimeout(timer);
  timer = setTimeout(() => queueBuild(), 200);
}

function onWebsiteChange(_eventType, filename) {
  if (!filename) return scheduleBuild("full");
  const relativePath = String(filename).split("\\").join("/");
  if (!relativePath.includes("/") && staticWebsiteFiles.has(relativePath)) {
    return scheduleBuild(`copy:${relativePath}`);
  }
  if (relativePath === "index.html" || relativePath === "website.css" || relativePath.startsWith("assets/")) {
    return scheduleBuild("website");
  }
  // Other site inputs (including routes and build logic) can affect files copied by the full build.
  scheduleBuild("full");
}

function startWatching() {
  for (const directory of watchedDirectories) {
    const path = resolve(root, directory);
    if (!existsSync(path)) continue;
    const watcher = watch(path, { recursive: true }, directory === "website"
      ? onWebsiteChange
      : directory === "assets" ? () => scheduleBuild("website") : () => scheduleBuild("full"));
    watcher.on("error", (error) => console.error(`Watcher error for ${directory}: ${error.message}`));
    watchers.push(watcher);
  }
  for (const file of watchedFiles) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const watcher = watch(path, () => scheduleBuild("full"));
    watcher.on("error", (error) => console.error(`Watcher error for ${file}: ${error.message}`));
    watchers.push(watcher);
  }
}

async function startDevelopment() {
  try {
    await runBuild(true);
  } catch (error) {
    console.error(`Initial build failed: ${error.message}`);
  }

  startWatching();
  console.log("Watching website and study sources. Website page, style, and asset edits rebuild only the main site; study edits rebuild all generated pages.");

  const server = spawn(process.execPath, [resolve(root, "node_modules", "wrangler", "bin", "wrangler.js"), "dev"], {
    cwd: root,
    stdio: "inherit",
  });
  let shuttingDown = false;
  const stop = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
    if (server.exitCode === null) server.kill(signal);
  };

  process.once("SIGINT", () => stop("SIGINT"));
  process.once("SIGTERM", () => stop("SIGTERM"));
  server.once("error", (error) => {
    console.error(`Could not start Wrangler: ${error.message}`);
    stop("SIGTERM");
    process.exitCode = 1;
  });
  server.once("exit", (code, signal) => {
    clearTimeout(timer);
    for (const watcher of watchers) watcher.close();
    process.exitCode = code ?? (signal ? 1 : 0);
  });
}

void startDevelopment();
