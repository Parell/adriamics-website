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
const metadataSeparator = ' | ';

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
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, ' ')
    .replace(/^\s{0,3}>\s?/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, ' ')
    .replace(/^\s*\d+\.\s+/gm, ' ')
    .replace(/\|/g, ' ')
    .replace(/[*_~$]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitFrontmatter(markdown) {
  const text = String(markdown ?? '').replace(/^\uFEFF/, '');
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

  return parts.length ? parts.join(metadataSeparator) : fallbackPath;
}

function getPageUrl(pagePath) {
  const normalized = toPosix(pagePath).replace(/^notes\//, '').replace(/\.md$/i, '');
  return `/notes/${normalized}/`;
}

function getNoteRoutePath(notePath) {
  return toPosix(path.dirname(notePath)).replace(/^notes\//, '');
}

function getNoteSourcePath(notePath) {
  return path.join(notesRoot, toPosix(notePath));
}

function getNoteOutputDir(notePath) {
  return path.dirname(getNoteSourcePath(notePath));
}

function isFolderLayoutNotePath(notePath) {
  const normalized = toPosix(notePath).replace(/^notes\//, '');
  const parts = normalized.split('/');

  if (parts.length < 3) {
    return false;
  }

  const fileName = parts.at(-1);
  const folderName = parts.at(-2);
  return fileName === `${folderName}.md`;
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

function stashInlineHtml(tokens, html) {
  const token = `@@INLINE_${tokens.length}@@`;
  tokens.push({ token, html });
  return token;
}

function restoreInlineHtml(html, tokens) {
  return tokens.reduceRight(
    (currentHtml, token) => currentHtml.replaceAll(token.token, token.html),
    html,
  );
}

function renderInline(text, sourcePath) {
  const tokens = [];
  let source = String(text ?? '');

  source = source.replace(/`([^`]+)`/g, (_, code) => {
    return stashInlineHtml(tokens, `<code>${escapeHtml(code)}</code>`);
  });

  source = source.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, alt, src) => {
    const resolvedSrc = rewriteInternalHref(src, sourcePath);
    return stashInlineHtml(tokens, `<img src="${escapeHtml(resolvedSrc)}" alt="${escapeHtml(alt)}" />`);
  });

  source = source.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => {
    const resolvedHref = rewriteInternalHref(href, sourcePath);
    const renderedLabel = renderInline(label, sourcePath);
    return stashInlineHtml(tokens, `<a href="${escapeHtml(resolvedHref)}">${renderedLabel}</a>`);
  });

  const html = escapeHtml(source)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>');

  return restoreInlineHtml(html, tokens);
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
      return summary;
    }
  }

  return '';
}

function getFirstPagePath(node) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (node.path) {
    return node.path;
  }

  for (const child of node.children ?? []) {
    const path = getFirstPagePath(child);

    if (path) {
      return path;
    }
  }

  return null;
}

function containsPagePath(node, pagePath) {
  return node?.path === pagePath
    || (node?.children ?? []).some((child) => containsPagePath(child, pagePath));
}

function getNoteUrl(notePath) {
  return `/notes/${getNoteRoutePath(notePath)}/`;
}

function renderSubjectLinks(structures, activeStructureId = null) {
  const links = structures.map((structure) => {
    const pagePath = getFirstPagePath(structure);

    if (!pagePath) {
      return '';
    }

    const isActive = structure.id === activeStructureId;
    const activeClass = isActive ? ' class="is-active"' : '';
    const current = isActive ? ' aria-current="true"' : '';
    return `<li><a${activeClass}${current} href="${escapeHtml(getNoteUrl(pagePath))}">${escapeHtml(structure.title)}</a></li>`;
  }).join('');

  return `<aside class="notes-structures" aria-label="Guide structures">
          <ul class="subject-list">${links}</ul>
        </aside>`;
}

function renderGuideTree(nodes, activePagePath = null, depth = 0) {
  return nodes.map((node) => {
    const pagePath = node.path ?? getFirstPagePath(node);

    if (!pagePath) {
      return '';
    }

    const isActive = node.path === activePagePath;
    const isAncestor = !isActive && containsPagePath(node, activePagePath);
    const classes = [
      'guide-tree__button',
      node.children?.length ? 'guide-tree__button--folder' : 'guide-tree__button--page',
      isActive ? 'is-active' : '',
      isAncestor ? 'is-ancestor' : '',
    ].filter(Boolean).join(' ');
    const current = isActive ? ' aria-current="page"' : '';
    const children = node.children?.length
      ? `<ul class="guide-tree__branch">${renderGuideTree(node.children, activePagePath, depth + 1)}</ul>`
      : '';

    return `<li class="guide-tree__item"><a class="${classes}" style="--guide-depth: ${depth}" href="${escapeHtml(getNoteUrl(pagePath))}"${current}>${escapeHtml(node.title)}</a>${children}</li>`;
  }).join('');
}

function renderSearchPanel() {
  return `<aside class="search-panel" id="search-panel" aria-labelledby="search-panel-title" hidden>
    <div class="search-panel__card panel">
      <div class="search-panel__head">
        <div>
          <p class="section-label">Search</p>
          <h2 class="search-panel__title" id="search-panel-title">Find a note</h2>
        </div>
        <button class="search-panel__close" id="search-close" type="button" aria-label="Close search">Close</button>
      </div>
      <label class="search-panel__field">
        <span class="sr-only">Search all notes</span>
        <input id="search-input" type="search" placeholder="Search all notes..." autocomplete="off" spellcheck="false" />
      </label>
      <p class="search-panel__status" id="search-status" aria-live="polite">Loading search index...</p>
      <div class="search-results" id="search-results" role="list"></div>
    </div>
  </aside>`;
}

function buildLandingRedirectHtml() {
  const redirectUrl = '/notes/subjects/general/introduction/';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Introduction | Adriamics</title>
  <meta name="description" content="Redirecting to the Universal Education System introduction page." />
  <link rel="canonical" href="${siteOrigin}${redirectUrl}" />
  <meta http-equiv="refresh" content="0; url=${redirectUrl}" />
  <script>
    location.replace(${JSON.stringify(redirectUrl)});
  </script>
</head>
<body>
  <p>Redirecting to <a href="${redirectUrl}">Introduction</a>.</p>
</body>
</html>`;
}

function renderHeader(structures, activeStructureId = null, includeIntro = false) {
  const intro = includeIntro
    ? `
        <p class="notes-intro">
          The Universal Education System is an open collection of structured notes for math,
          physics, engineering, biology, chemistry, programming, and self-guided learning.
          Browse subjects, search notes, and suggest corrections through GitHub.
        </p>`
    : '';

  return `<header class="shell notes-header">
    <div class="notes-header__inner">
      <div class="notes-header__brand">
        <p class="eyebrow">The</p>
        <h1>Universal Education System</h1>${intro}
      </div>
      <nav class="notes-header__links" aria-label="Notes page links">
        <a href="/">Home</a>
      </nav>
      ${renderSubjectLinks(structures, activeStructureId)}
    </div>
  </header>`;
}

function renderNotesPageDocument({
  title,
  description,
  canonicalUrl,
  bodyClass,
  mainClass,
  mainAriaLabel,
  mainHtml,
  structures,
  activeStructureId = null,
  includeIntro = false,
  extraHead = '',
}) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta name="color-scheme" content="dark" />
  <link rel="stylesheet" href="/notes/notes.css" />
  ${extraHead}
  <script defer src="/notes/notes.js"></script>
</head>
<body class="notes-page ${escapeHtml(bodyClass)}" id="top">
  <a class="skip-link" href="#content">Skip to content</a>
  <button class="notes-search-trigger" id="search-trigger" type="button" aria-expanded="false" aria-controls="search-panel">
    Search notes
  </button>

  ${renderHeader(structures, activeStructureId, includeIntro)}

  <main id="content" class="${escapeHtml(mainClass)}" aria-label="${escapeHtml(mainAriaLabel)}">
    ${mainHtml}
  </main>
  ${renderSearchPanel()}
  <a class="back-to-top" href="#top" aria-label="Back to top">Back to top</a>
</body>
</html>`;
}

function plainTextFromHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function renderTableOfContents(bodyHtml, title) {
  const headingPattern = /<h([1-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
  const titleText = String(title ?? '').trim().toLowerCase();
  const entries = [];
  let match = headingPattern.exec(bodyHtml);

  while (match) {
    const [, level, id, headingHtml] = match;
    const text = plainTextFromHtml(headingHtml).replace(/\s+/g, ' ').trim();
    const normalizedText = text.toLowerCase();

    if (normalizedText && normalizedText !== 'table of contents' && normalizedText !== 'contents' && normalizedText !== titleText) {
      entries.push({ level: Number.parseInt(level, 10), id, headingHtml });
    }

    match = headingPattern.exec(bodyHtml);
  }

  if (!entries.length) {
    return '';
  }

  const links = entries.map((entry) => {
    const indent = Math.max(0, entry.level - 1);
    return `<li class="notes-toc__item" style="--toc-indent: ${indent}"><a class="notes-toc__link" href="#${escapeHtml(entry.id)}">${entry.headingHtml}</a></li>`;
  }).join('');

  return `<nav class="notes-toc panel" aria-label="Table of contents">
      <div class="notes-toc__head">
        <p class="section-label">Table of contents</p>
      </div>
      <ol class="notes-toc__list">${links}</ol>
    </nav>`;
}

function buildNoteHtml({
  title,
  description,
  metadataLabel,
  bodyHtml,
  canonicalUrl,
  editUrl,
  structures,
  structure,
  pagePath,
}) {
  const tocHtml = renderTableOfContents(bodyHtml, title);
  const layoutClass = tocHtml ? ' notes-layout--has-toc' : '';
  const mainHtml = `
    <aside class="notes-sidebar panel" aria-labelledby="guide-tree-title">
      <div class="notes-sidebar__head">
        <p class="section-label">Guides</p>
      </div>
      <nav aria-labelledby="guide-tree-title">
        <h2 class="notes-sidebar__title" id="guide-tree-title">${escapeHtml(structure.title)}</h2>
        <ul class="guide-tree">${renderGuideTree(structure.children ?? [], pagePath)}</ul>
      </nav>
    </aside>
    <section class="notes-viewer panel">
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
      <article class="markdown-body" id="note-content">
        ${bodyHtml}
      </article>
    </section>
    ${tocHtml}`;

  return renderNotesPageDocument({
    title: `${title} | Adriamics`,
    description,
    canonicalUrl,
    bodyClass: 'note-standalone-page',
    mainClass: `shell notes-layout${layoutClass}`,
    mainAriaLabel: 'Notes content',
    mainHtml,
    structures,
    activeStructureId: structure.id,
    extraHead: `<script>
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
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>`,
  });
}

function buildLandingHtml() {
  return buildLandingRedirectHtml();
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

  function visit(node, structure) {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.path) {
      notes.push({
        structure,
        structureId: structure.id,
        structureTitle: structure.title,
        title: node.title,
        path: node.path,
      });
    }

    (node.children ?? []).forEach((child) => visit(child, structure));
  }

  structures.forEach((structure) => visit(structure, structure));
  return notes;
}

async function listMarkdownNotePaths(dirPath = path.join(notesRoot, 'subjects')) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return listMarkdownNotePaths(entryPath);
    }

    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      return [];
    }

    return [toPosix(path.relative(notesRoot, entryPath))];
  }));

  return paths.flat().sort();
}

async function validateManifestCoverage(notes) {
  const manifestPaths = notes.map((note) => note.path);
  const uniqueManifestPaths = new Set(manifestPaths);
  const duplicatePaths = manifestPaths
    .filter((notePath, index) => manifestPaths.indexOf(notePath) !== index);
  const markdownPaths = await listMarkdownNotePaths();
  const markdownPathSet = new Set(markdownPaths);
  const invalidManifestPaths = [...uniqueManifestPaths]
    .filter((notePath) => !isFolderLayoutNotePath(notePath))
    .sort();
  const missingFiles = [...uniqueManifestPaths]
    .filter((notePath) => !markdownPathSet.has(notePath))
    .sort();
  const errors = [];

  if (duplicatePaths.length) {
    errors.push(`Duplicate manifest note paths:\n${[...new Set(duplicatePaths)].sort().map((notePath) => `- ${notePath}`).join('\n')}`);
  }

  if (invalidManifestPaths.length) {
    errors.push(`Manifest note paths must use the folder layout <slug>/<slug>.md:\n${invalidManifestPaths.map((notePath) => `- ${notePath}`).join('\n')}`);
  }

  if (missingFiles.length) {
    errors.push(`Manifest note paths with no markdown file:\n${missingFiles.map((notePath) => `- ${notePath}`).join('\n')}`);
  }

  if (errors.length) {
    throw new Error(errors.join('\n\n'));
  }
}

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function removeStaleGeneratedPages(notes) {
  const expectedOutputDirs = new Set(
    notes.map((note) => getNoteOutputDir(note.path)),
  );

  async function visit(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const indexEntry = entries.find((entry) => entry.isFile() && entry.name === 'index.html');

    if (indexEntry) {
      const sourceFile = path.join(dirPath, `${path.basename(dirPath)}.md`);
      if (!expectedOutputDirs.has(dirPath) || !(await exists(sourceFile))) {
        await fs.rm(path.join(dirPath, indexEntry.name), { force: true });
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

async function buildNotePage(note, urlPath, structures) {
  const sourcePath = getNoteSourcePath(note.path);
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
  const editUrl = `https://github.com/Parell/parell.github.io/issues/new?template=correction.yml&page_path=${encodeURIComponent(`notes/${note.path}`)}&title=${encodeURIComponent(`[Correction]: ${title}`)}`;
  const bodyHtml = renderBlocks(bodyWithoutTitle, `notes/${note.path}`);
  const pageHtml = buildNoteHtml({
    title,
    description,
    metadataLabel,
    bodyHtml,
    canonicalUrl,
    editUrl,
    structures,
    structure: note.structure,
    pagePath: note.path,
  });
  const outputPath = path.join(notesRoot, path.dirname(note.path), 'index.html');

  await ensureDir(outputPath);
  await fs.writeFile(outputPath, pageHtml, 'utf8');

  return {
    title,
    subject: note.structureTitle,
    url: urlPath,
    text: trimMarkdownText(`${title} ${bodyWithoutTitle}`),
  };
}

async function buildLandingPage(structures) {
  await fs.writeFile(path.join(notesRoot, 'index.html'), buildLandingHtml(structures), 'utf8');
}

async function buildSearchIndex(entries) {
  const json = `${JSON.stringify(entries, null, 2)}\n`;
  await fs.writeFile(path.join(notesRoot, 'search-index.json'), json, 'utf8');
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

  await validateManifestCoverage(notes);

  const urls = notes.map((note) => getNoteUrl(note.path));

  await removeStaleGeneratedPages(notes);

  const searchEntries = [];
  for (let index = 0; index < notes.length; index += 1) {
    searchEntries.push(await buildNotePage(notes[index], urls[index], manifest.structures));
  }

  await buildLandingPage(manifest.structures);
  await buildSearchIndex(searchEntries);
  await buildSitemap(urls);
}

await main();
