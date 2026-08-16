import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const notesRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(notesRoot);
const assets = [
  { root: notesRoot, source: 'notes.css', output: 'notes.min.css', tool: 'css' },
  { root: notesRoot, source: 'notes-runtime.js', output: 'notes-runtime.min.js', tool: 'js' },
  { root: notesRoot, source: 'notes.js', output: 'notes.min.js', tool: 'js' },
  { root: repoRoot, source: 'site.css', output: 'site.min.css', tool: 'css' },
  { root: repoRoot, source: 'site.js', output: 'site.min.js', tool: 'js' },
];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const executable = process.platform === 'win32' && command === 'npx' ? 'npx.cmd' : command;
    const child = spawn(executable, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}.`));
    });
  });
}

async function minifyJavaScript(sourcePath, outputPath) {
  await run('npx', [
    '--yes',
    'terser@5.44.0',
    sourcePath,
    '--compress',
    '--mangle',
    '--comments',
    'false',
    '--output',
    outputPath,
  ]);
}

async function minifyCss(sourcePath, outputPath) {
  await run('npx', [
    '--yes',
    'clean-css-cli@5.6.3',
    '-o',
    outputPath,
    sourcePath,
  ]);
}

await mkdir(notesRoot, { recursive: true });

for (const asset of assets) {
  const sourcePath = path.join(asset.root, asset.source);
  const outputPath = path.join(asset.root, asset.output);
  await readFile(sourcePath);

  if (asset.tool === 'css') await minifyCss(sourcePath, outputPath);
  else await minifyJavaScript(sourcePath, outputPath);

  console.log(`${asset.source} -> ${asset.output}`);
}
