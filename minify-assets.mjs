import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const assets = [
  { source: "site.css", output: "site.min.css", type: "css" },
  { source: "site.js", output: "site.min.js", type: "js" },
];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [command, ...args], {
      cwd: root,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code}.`));
    });
  });
}

async function minifyAsset({ source, output, type }) {
  const sourcePath = path.join(root, source);
  const outputPath = path.join(root, output);
  const command = path.join(
    root,
    "node_modules",
    type === "css" ? "clean-css-cli/bin/cleancss" : "terser/bin/terser",
  );
  const args = type === "css"
    ? ["-o", outputPath, sourcePath]
    : [sourcePath, "--compress", "--mangle", "--comments", "false", "--output", outputPath];

  await run(command, args);
  console.log(`${source} -> ${output}`);
}

for (const asset of assets) {
  await minifyAsset(asset);
}
