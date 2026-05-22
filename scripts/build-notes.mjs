import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const notesRoot = path.join(repoRoot, 'notes');
const manifestPath = path.join(notesRoot, 'subjects', 'manifest.js');
const siteOrigin = 'https://adriamics.com';

function toPosix(inputPath) {
  return String(inputPath).split(path.sep).join('/');
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(text) {
  return String(text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function trimMarkdownText(text) {
  return String(text ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, ' $1 ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, ' $1 ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, ' ')
    .replace(/^\s{0,3}>\s?/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, ' ')
    .replace(/^\s*\d+\.\s+/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/[*_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitFrontmatter(markdown) {
  const text = String(markdown ?? '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return { metadata: null, body: text };
  }

  return {
    metadata: parseFrontmatter(match[1]),
    body: text.slice(match[0].length),
  };
}

function parseFrontmatterValue(value) {
  const trimmed = String(value ?? '').trim();

  if (trimmed === '[]') {
    return [];
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseFrontmatter(block) {
  const metadata = {};
  let currentKey = null;

  block.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) {
      return;
    }

    const listItemMatch = line.match(/^\s*-\s+(.*)$/);

    if (listItemMatch && currentKey) {
      if (!Array.isArray(metadata[currentKey])) {
        metadata[currentKey] = metadata[currentKey] ? [metadata[currentKey]] : [];
      }

      metadata[currentKey].push(parseFrontmatterValue(listItemMatch[1]));
      return;
    }

    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);

    if (!fieldMatch) {
      currentKey = null;
      return;
    }

    const [, rawKey, rawValue] = fieldMatch;
    const key = rawKey.trim();
    const value = rawValue.trim();

    currentKey = key;
    metadata[key] = value ? parseFrontmatterValue(value) : [];
  });

  return metadata;
}

function getMetadataLabel(metadata, fallbackPath) {
  if (!metadata || typeof metadata !== 'object') {
    return fallbackPath;
  }

  const parts = [
    metadata.subject,
    metadata.topic,
    metadata.level,
    metadata.status,
    metadata.last_reviewed ? `Reviewed ${metadata.last_reviewed}` : null,
  ].filter(Boolean);

  if (Array.isArray(metadata.auditors) && metadata.auditors.length) {
    parts.push(`Auditors: ${metadata.auditors.join(', ')}`);
  }

  return parts.length ? parts.join(' \u2022 ') : fallbackPath;
}

function getPageUrl(pagePath) {
  const normalized = toPosix(pagePath).replace(/^notes\//, '').replace(/\.md$/i, '');
  return `/notes/${normalized}/`;
}

function rewriteInternalHref(href, sourcePath) {
  const trimmed = String(href ?? '').trim();

  if (
    !trimmed
    || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(trimmed)
  ) {
    return trimmed;
  }

  try {
    const sourceDir = toPosix(path.posix.dirname(sourcePath)).replace(/^\/+/, '');
    const resolved = new URL(trimmed, `https://example.invalid/${sourceDir}/`);
    let pathname = resolved.pathname.replace(/^\/+/, '');

    if (pathname.startsWith('notes/')) {
      pathname = pathname.slice('notes/'.length);
    }

    if (pathname.endsWith('.md')) {
      pathname = `${pathname.slice(0, -3)}/`;
      return `/notes/${pathname}${resolved.search}${resolved.hash}`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

function renderInline(text, sourcePath) {
  let html = escapeHtml(text);
  const codeSpans = [];

  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE_${codeSpans.length}@@`;
    codeSpans.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, src) => {
    return `<img src="${escapeHtml(rewriteInternalHref(src, sourcePath))}" alt="${escapeHtml(alt)}" />`;
  });

  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => {
    const resolvedHref = rewriteInternalHref(href, sourcePath);
    return `<a href="${escapeHtml(resolvedHref)}">${label}</a>`;
  });

  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');

  codeSpans.forEach((value, index) => {
    html = html.replace(`@@CODE_${index}@@`, value);
  });

  return html;
}

function slugifyHeading(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['".,()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function uniqueHeadingId(baseId, usedIds) {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let index = 2;
  while (usedIds.has(`${baseId}-${index}`)) {
    index += 1;
  }

  const nextId = `${baseId}-${index}`;
  usedIds.add(nextId);
  return nextId;
}

function isFence(line) {
  return /^\s*```/.test(line);
}

function isMathFence(line) {
  return /^\s*\$\$\s*$/.test(line);
}

function isHeading(line) {
  return /^\s{0,3}#{1,6}\s+/.test(line);
}

function isHr(line) {
  return /^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line);
}

function isStandaloneAnchor(line) {
  return /^\s*<a\s+id="[^"]+"><\/a>\s*$/i.test(line);
}

function isRawHtmlLine(line) {
  return /^\s*</.test(line) && !/^\s*<\s*\/?\s*(?:p|li|ul|ol|table|thead|tbody|tr|td|th|pre|code|blockquote|div|section|article|h[1-6])\b/i.test(line);
}

function isTableStart(lines, index) {
  if (index + 1 >= lines.length) {
    return false;
  }

  const header = lines[index];
  const separator = lines[index + 1];

  return header.includes('|') && /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(separator);
}

function isListItem(line) {
  return /^\s{0,8}(?:[-*+]|(?:\d+\.))\s+/.test(line);
}

function getIndentWidth(line) {
  return line.match(/^[ \t]*/)?.[0].length ?? 0;
}

function splitTableRow(row) {
  const trimmed = row.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split(/\|/).map((cell) => cell.trim());
}

function renderBlocks(markdown, sourcePath) {
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  const usedHeadingIds = new Set();
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (isFence(line)) {
      const fenceMatch = line.match(/^(\s*```+)/);
      const fence = fenceMatch ? fenceMatch[1].trim() : '```';
      const fenceChar = fence[0];
      const fenceLength = fence.length;
      const fencePattern = new RegExp(`^\\s*${escapeRegExp(fenceChar)}{${fenceLength},}\\s*$`);
      const codeLines = [];
      index += 1;

      while (index < lines.length && !fencePattern.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    if (isMathFence(line)) {
      const mathLines = [];
      index += 1;

      while (index < lines.length && !isMathFence(lines[index])) {
        mathLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(`<div class="math-block">$$\n${escapeHtml(mathLines.join('\n'))}\n$$</div>`);
      continue;
    }

    if (isHeading(line)) {
      const headingMatch = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      const id = uniqueHeadingId(slugifyHeading(headingText), usedHeadingIds);
      blocks.push(`<h${level} id="${id}">${renderInline(headingText, sourcePath)}</h${level}>`);
      index += 1;
      continue;
    }

    if (isHr(line)) {
      blocks.push('<hr />');
      index += 1;
      continue;
    }

    if (isStandaloneAnchor(line)) {
      blocks.push(line.trim());
      index += 1;
      continue;
    }

    if (isRawHtmlLine(line)) {
      const htmlLines = [line];
      index += 1;

      while (index < lines.length && lines[index].trim() && isRawHtmlLine(lines[index])) {
        htmlLines.push(lines[index]);
        index += 1;
      }

      blocks.push(htmlLines.join('\n'));
      continue;
    }

    if (isTableStart(lines, index)) {
      const header = splitTableRow(lines[index]);
      index += 2;
      const bodyRows = [];

      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        bodyRows.push(splitTableRow(lines[index]));
        index += 1;
      }

      const headerHtml = header.map((cell) => `<th>${renderInline(cell, sourcePath)}</th>`).join('');
      const bodyHtml = bodyRows.map((row) => {
        const cells = row.map((cell) => `<td>${renderInline(cell, sourcePath)}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');

      blocks.push(`<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`);
      continue;
    }

    if (line.trim().startsWith('>')) {
      const quoteLines = [];

      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].replace(/^\s{0,3}>\s?/, ''));
        index += 1;
      }

      blocks.push(`<blockquote>${renderBlocks(quoteLines.join('\n'), sourcePath)}</blockquote>`);
      continue;
    }

    if (isListItem(line)) {
      const startIndent = getIndentWidth(line);
      const isOrdered = /^\s*\d+\.\s+/.test(line);
      const items = [];

      while (index < lines.length && isListItem(lines[index]) && getIndentWidth(lines[index]) === startIndent) {
        const currentLine = lines[index];
        const markerMatch = currentLine.match(/^\s{0,8}(?:[-*+]|(?:\d+\.))\s+(.*)$/);
        const itemLines = [markerMatch ? markerMatch[1] : currentLine.trim()];
        index += 1;

        while (index < lines.length) {
          const nextLine = lines[index];

          if (!nextLine.trim()) {
            itemLines.push('');
            index += 1;
            continue;
          }

          const nextIndent = getIndentWidth(nextLine);

          if (nextIndent > startIndent) {
            itemLines.push(nextLine);
            index += 1;
            continue;
          }

          break;
        }

        items.push(`<li>${renderBlocks(itemLines.join('\n').replace(/^\n+|\n+$/g, ''), sourcePath)}</li>`);
      }

      const listTag = isOrdered ? 'ol' : 'ul';
      blocks.push(`<${listTag}>${items.join('')}</${listTag}>`);
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (index < lines.length) {
      const nextLine = lines[index];
      if (
        !nextLine.trim()
        || isHeading(nextLine)
        || isFence(nextLine)
        || isMathFence(nextLine)
        || isHr(nextLine)
        || isTableStart(lines, index)
        || nextLine.trim().startsWith('>')
        || isListItem(nextLine)
      ) {
        break;
      }

      paragraphLines.push(nextLine);
      index += 1;
    }

    blocks.push(`<p>${renderInline(paragraphLines.join(' ').trim(), sourcePath)}</p>`);
  }

  return blocks.join('\n');
}

function stripFirstH1(markdown) {
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  if (index < lines.length && /^\s{0,3}#\s+/.test(lines[index])) {
    return lines.slice(index + 1).join('\n').replace(/^\s*\n+/, '');
  }

  return markdown;
}

function getSummary(markdown) {
  const body = stripFirstH1(String(markdown ?? '').replace(/\r\n/g, '\n'));
  const lines = body.split('\n');
  let index = 0;

  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) {
      index += 1;
    }

    if (index >= lines.length) {
      break;
    }

    if (isHeading(lines[index])) {
      const headingText = trimMarkdownText(lines[index]);
      index += 1;

      if (/^table of contents$/i.test(headingText) || /^contents$/i.test(headingText)) {
        while (
          index < lines.length
          && (isListItem(lines[index]) || !lines[index].trim())
        ) {
          index += 1;
        }
      }

      continue;
    }

    if (isStandaloneAnchor(lines[index])) {
      index += 1;
      continue;
    }

    if (isListItem(lines[index]) || isHr(lines[index]) || isFence(lines[index]) || isMathFence(lines[index])) {
      index += 1;
      continue;
    }

    const paragraphLines = [lines[index]];
    index += 1;

    while (
      index < lines.length
      && lines[index].trim()
      && !isHeading(lines[index])
      && !isListItem(lines[index])
      && !isHr(lines[index])
      && !isFence(lines[index])
      && !isMathFence(lines[index])
      && !isTableStart(lines, index)
      && !lines[index].trim().startsWith('>')
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    const summary = trimMarkdownText(paragraphLines.join(' '));

    if (summary) {
      return summary.slice(0, 160);
    }
  }

  return '';
}

function buildNoteHtml({ title, description, metadataLabel, bodyHtml, canonicalUrl, standaloneUrl, editUrl }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} | Adriamics</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta name="color-scheme" content="dark" />
  <link rel="stylesheet" href="/notes/notes.css" />
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['\\\\(', '\\\\)'], ['$', '$']],
        displayMath: [['$$', '$$']]
      },
      svg: { fontCache: 'global' },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
      }
    };
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
</head>
<body class="notes-page note-standalone-page" id="top">
  <a class="skip-link" href="#content">Skip to content</a>

  <header class="shell notes-header">
    <div class="notes-header__inner">
      <div class="notes-header__brand">
        <p class="eyebrow">The</p>
        <h1>Universal Education System</h1>
      </div>
      <nav class="notes-header__links" aria-label="Note page links">
        <a href="/notes/">Browse notes</a>
        <a href="${escapeHtml(standaloneUrl)}">This page</a>
        <a href="/">Home</a>
      </nav>
    </div>
  </header>

  <main id="content" class="shell">
    <article class="notes-viewer panel">
      <div class="viewer-head">
        <div>
          <h1>${escapeHtml(title)}</h1>
          <p class="viewer-meta">${escapeHtml(metadataLabel)}</p>
        </div>
        <div class="viewer-head__actions">
          <a class="suggest-edit-link" href="${escapeHtml(editUrl)}" target="_blank" rel="noreferrer">Suggest edit</a>
          <p class="viewer-status">Standalone, crawlable note page</p>
        </div>
      </div>
      <article class="markdown-body">
        ${bodyHtml}
      </article>
    </article>
  </main>
</body>
</html>`;
}

async function loadManifest() {
  const manifestText = await fs.readFile(manifestPath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(manifestText, sandbox, { filename: manifestPath });
  const manifest = sandbox.window.UES_GUIDE_MANIFEST;

  if (!manifest || !Array.isArray(manifest.structures)) {
    throw new Error('Could not load notes manifest.');
  }

  return manifest;
}

function flattenNotes(structures) {
  const notes = [];

  function visit(node, structureId, structureTitle) {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.path) {
      notes.push({
        structureId,
        structureTitle,
        title: node.title,
        path: node.path,
      });
    }

    (node.children ?? []).forEach((child) => visit(child, structureId, structureTitle));
  }

  structures.forEach((structure) => visit(structure, structure.id, structure.title));
  return notes;
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function removeStaleGeneratedPages(notes) {
  const expectedOutputDirs = new Set(
    notes.map((note) => path.join(notesRoot, note.path.replace(/\.md$/i, ''))),
  );

  async function visit(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    if (entries.some((entry) => entry.isFile() && entry.name === 'index.html')) {
      const sourceFile = `${dirPath}.md`;
      if (!expectedOutputDirs.has(dirPath) || !(await exists(sourceFile))) {
        await fs.rm(dirPath, { recursive: true, force: true });
        return;
      }
    }

    await Promise.all(entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => visit(path.join(dirPath, entry.name))));
  }

  await visit(path.join(notesRoot, 'subjects'));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function buildNotePage(note, urlPath) {
  const sourcePath = path.join(notesRoot, note.path);
  const markdown = await fs.readFile(sourcePath, 'utf8');
  const { metadata, body } = splitFrontmatter(markdown);
  const bodyWithoutTitle = stripFirstH1(body);
  const title = typeof metadata?.title === 'string' && metadata.title.trim()
    ? metadata.title.trim()
    : note.title;
  const metadataLabel = getMetadataLabel(metadata, note.path);
  const summary = getSummary(bodyWithoutTitle) || title;
  const description = summary.length > 160 ? `${summary.slice(0, 157)}...` : summary;
  const canonicalUrl = `${siteOrigin}${urlPath}`;
  const standaloneUrl = urlPath;
  const editUrl = `https://github.com/Parell/parell.github.io/issues/new?template=correction.yml&page_path=${encodeURIComponent(`notes/${note.path}`)}&title=${encodeURIComponent(`[Correction]: ${title}`)}`;
  const bodyHtml = renderBlocks(bodyWithoutTitle, `notes/${note.path}`);
  const pageHtml = buildNoteHtml({
    title,
    description,
    metadataLabel,
    bodyHtml,
    canonicalUrl,
    standaloneUrl,
    editUrl,
  });
  const outputPath = path.join(notesRoot, note.path.replace(/\.md$/i, ''), 'index.html');

  await ensureDir(outputPath);
  await fs.writeFile(outputPath, pageHtml, 'utf8');
}

async function buildSitemap(noteUrls) {
  const urls = [
    `${siteOrigin}/`,
    `${siteOrigin}/notes/`,
    ...noteUrls.map((urlPath) => `${siteOrigin}${urlPath}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`;

  await fs.writeFile(path.join(repoRoot, 'sitemap.xml'), xml, 'utf8');
}

async function main() {
  const manifest = await loadManifest();
  const notes = flattenNotes(manifest.structures);
  const urls = notes.map((note) => {
    const sourcePath = `notes/${note.path}`;
    return getPageUrl(sourcePath);
  });

  await removeStaleGeneratedPages(notes);

  for (let index = 0; index < notes.length; index += 1) {
    await buildNotePage(notes[index], urls[index]);
  }

  await buildSitemap(urls);
}

await main();
