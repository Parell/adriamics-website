import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const notesRoot = path.join(repoRoot, 'notes');
const manifestPath = path.join(notesRoot, 'source', 'manifest.js');
const siteOrigin = 'https://adriamics.com';
const githubRepoUrl = 'https://github.com/Parell/parell.github.io';
const githubRepoBranch = 'master';
const headerArtworkUrl = encodeURI('/assets/name.gif');
const notesThemeStorageKey = 'ues-notes:contrast-mode';
const practiceLevelLabels = new Map([
  [1, 'Direct Practice'],
  [2, 'Integrated Practice'],
  [3, 'Applied Problems'],
  [4, 'Challenge / Synthesis'],
]);
const practiceSkillLinks = {
  'subjects/math/algebra/algebra.md': {
    Fractions: '#fractions-in-algebra',
    'Linear Equations': '#one-variable-linear-equations',
    'Inverse Operations': '#one-variable-linear-equations',
    'Like Terms': '#like-terms',
    'Distributing and factoring': '#distributing-and-factoring',
    'Order of Operations': '#order-of-operations',
    'Exponent Laws': '#exponent-laws',
    'Systems of equations': '#two-linear-equations-in-two-variables',
    Elimination: '#example-elimination',
    'Common factoring methods': '#common-factoring-methods',
    'Zero-product property': '#zero-product-property',
    'Evaluating functions': '#evaluating-functions',
    Functions: '#9-functions',
    'Sets of numbers': '#sets-of-numbers',
    'Interval notation': '#interval-notation',
  },
};

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

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();

    if (!inner) {
      return [];
    }

    const items = [];
    let current = '';
    let quote = null;

    for (let index = 0; index < inner.length; index += 1) {
      const character = inner[index];

      if (quote) {
        if (character === quote && inner[index - 1] !== '\\') {
          quote = null;
        }

        current += character;
        continue;
      }

      if (character === '"' || character === "'") {
        quote = character;
        current += character;
        continue;
      }

      if (character === ',') {
        items.push(parseFrontmatterValue(current));
        current = '';
        continue;
      }

      current += character;
    }

    if (current.trim()) {
      items.push(parseFrontmatterValue(current));
    }

    return items;
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) {
    return Number(trimmed);
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

function buildGithubBlobUrl(relativePath) {
  return `${githubRepoUrl}/blob/${githubRepoBranch}/${toPosix(relativePath)}`;
}

function buildGithubBlameUrl(sourceUrl) {
  return String(sourceUrl ?? '').replace('/blob/', '/blame/');
}

function renderSourceLinks(sourceUrl) {
  if (!sourceUrl) {
    return '';
  }

  return `<a class="viewer-source-jump" href="${escapeHtml(buildGithubBlameUrl(sourceUrl))}" target="_blank" rel="noreferrer">GitHub Blame</a>`;
}

function renderMetadataLine(className, sourceUrl = null) {
  if (!sourceUrl) {
    return '';
  }

  return `<p class="${className}">${renderSourceLinks(sourceUrl)}</p>`;
}

function getNoteRoutePath(notePath) {
  return toPosix(path.dirname(notePath)).replace(/^notes\//, '');
}

function getNoteSourcePath(notePath) {
  const normalized = toPosix(notePath).replace(/^subjects\//, '');
  return path.join(notesRoot, 'source', normalized);
}

function getNoteOutputDir(notePath) {
  return path.join(notesRoot, getNoteRoutePath(notePath));
}

function getPracticeOutputDir(notePath) {
  return path.join(getNoteOutputDir(notePath), 'practice');
}

function getPracticeUrl(notePath) {
  return `${getNoteUrl(notePath)}practice/`;
}

function parsePracticeProblemId(id, sourcePath, problemIndex) {
  const problemId = String(id).trim();
  const match = problemId.match(/^(.*?)-(\d)(\d+)$/);

  if (!match) {
    throw new Error(`Practice problem id "${problemId}" in ${sourcePath} (problem ${problemIndex + 1}) must end with a one-digit level followed by a position, like "algebra-14".`);
  }

  const level = Number.parseInt(match[2], 10);
  const position = Number.parseInt(match[3], 10);

  if (!Number.isFinite(level) || level <= 0 || !Number.isFinite(position) || position < 0) {
    throw new Error(`Practice problem id "${problemId}" in ${sourcePath} (problem ${problemIndex + 1}) must encode a positive level and a non-negative position.`);
  }

  return { level, position };
}

function getPracticeLevelLabel(level) {
  const parsedLevel = Number.parseInt(String(level).trim(), 10);
  return practiceLevelLabels.get(parsedLevel) ?? 'Practice problems';
}

function resolvePracticeSkillHref(notePath, skillName) {
  const normalizedNotePath = toPosix(notePath).replace(/^notes\//, '');
  const skillMap = practiceSkillLinks[normalizedNotePath] ?? {};
  const label = String(skillName).trim();

  if (skillMap[label]) {
    return `${getNoteUrl(notePath)}${skillMap[label]}`;
  }

  return `${getNoteUrl(notePath)}#${slugifyHeading(label)}`;
}

function renderPracticeSkills(notePath, skills) {
  return skills.map((skill) => {
    const label = String(skill).trim();
    const href = resolvePracticeSkillHref(notePath, label);
    return `<a class="practice-problem__skill" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
  }).join(' &middot; ');
}

function groupPracticeProblems(problems) {
  const groups = new Map();

  problems.forEach((problem) => {
    const level = Number.parseInt(String(problem.level).trim(), 10);
    const normalizedLevel = Number.isFinite(level) ? level : 0;
    const position = Number.parseInt(String(problem.position).trim(), 10);
    const normalizedPosition = Number.isFinite(position) ? position : 0;

    if (!groups.has(normalizedLevel)) {
      groups.set(normalizedLevel, {
        level: normalizedLevel,
        label: getPracticeLevelLabel(normalizedLevel),
        items: [],
      });
    }

    groups.get(normalizedLevel).items.push({ problem, position: normalizedPosition });
  });

  return [...groups.values()]
    .sort((left, right) => left.level - right.level)
    .map((group) => ({
      ...group,
      items: group.items.sort((left, right) => left.position - right.position),
    }));
}

function getRelativeNotesAssetHref(outputDirPath, assetName) {
  const relativeOutputDir = toPosix(path.relative(notesRoot, outputDirPath));
  const depth = relativeOutputDir ? relativeOutputDir.split('/').filter(Boolean).length : 0;
  const prefix = '../'.repeat(depth);
  return `${prefix}${assetName}`;
}

async function getAssetVersion(assetPath) {
  const assetContent = await fs.readFile(assetPath, 'utf8');
  return crypto.createHash('sha256').update(assetContent).digest('hex').slice(0, 12);
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
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(\S(?:[^*\n]*?\S)?)\*(?!\*)/g, '<em>$1</em>');

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

function parseWidgetMarkerLine(line) {
  const match = line.match(/^\s*<!--\s*widget:([^>]+?)\s*-->\s*$/i);

  if (!match) {
    return null;
  }

  return match[1].trim();
}

function resolveWidgetIncludeMarkers(markdown, widgetRegistry) {
  const widgetsById = new Map(widgetRegistry.map((widget) => [widget.id, widget.html]));
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');

  return lines.map((line) => {
    const widgetId = parseWidgetMarkerLine(line);

    if (!widgetId) {
      return line;
    }

    const widgetHtml = widgetsById.get(widgetId);

    if (!widgetHtml) {
      throw new Error(`Widget include marker "${widgetId}" does not match any widget definition.`);
    }

    return widgetHtml;
  }).join('\n');
}

function isRawHtmlLine(line) {
  return /^\s*</.test(line) && !/^\s*<!--/.test(line);
}

function extractWidgetRootId(html) {
  const firstHtmlLine = String(html ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .find((line) => line.trim()) ?? '';
  const match = firstHtmlLine.match(/^\s*<([A-Za-z][A-Za-z0-9:-]*)\b[^>]*\bid\s*=\s*["']([^"']+)["']/i);

  return match ? match[2].trim() : '';
}

function collectWidgetBlocks(markdown, sourcePath, note) {
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  const bodyLines = [];
  const widgets = [];
  let index = 0;

  while (index < lines.length) {
    const markerLine = lines[index];
    const widgetId = parseWidgetMarkerLine(markerLine);

    if (!widgetId) {
      bodyLines.push(markerLine);
      index += 1;
      continue;
    }

    const markerLineNumber = index + 1;
    index += 1;

    const widgetLines = [];

    while (index < lines.length) {
      const currentLine = lines[index];

      if (isRawHtmlLine(currentLine)) {
        widgetLines.push(currentLine);
        index += 1;
        continue;
      }

      if (!currentLine.trim()) {
        let nextIndex = index;

        while (nextIndex < lines.length && !lines[nextIndex].trim()) {
          nextIndex += 1;
        }

        if (nextIndex < lines.length && isRawHtmlLine(lines[nextIndex])) {
          widgetLines.push(...lines.slice(index, nextIndex));
          index = nextIndex;
          continue;
        }

        break;
      }

      break;
    }

    if (!widgetLines.length) {
      bodyLines.push(markerLine);
      continue;
    }

    const html = widgetLines.join('\n');
    const rootId = extractWidgetRootId(html);

    widgets.push({
      id: widgetId,
      html,
      rootId,
      sourcePath,
      sourceLine: markerLineNumber,
      notePath: note?.path ?? '',
      noteTitle: note?.title ?? '',
      noteUrl: note?.path ? getNoteUrl(note.path) : '',
    });

    bodyLines.push(...widgetLines);
  }

  return {
    body: bodyLines.join('\n'),
    widgets,
  };
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

function stripLeadingTitleHeading(markdown, title) {
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  if (index >= lines.length || !isHeading(lines[index])) {
    return markdown;
  }

  const headingText = trimMarkdownText(lines[index]).replace(/\s+/g, ' ').trim().toLowerCase();
  const normalizedTitle = trimMarkdownText(title).replace(/\s+/g, ' ').trim().toLowerCase();

  if (!headingText || headingText !== normalizedTitle) {
    return markdown;
  }

  return lines.slice(index + 1).join('\n').replace(/^\s*\n+/, '');
}

function stripManualTableOfContents(markdown) {
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  const output = [];
  let index = 0;

  while (index < lines.length) {
    if (isHeading(lines[index])) {
      const headingText = trimMarkdownText(lines[index]);

      if (/^table of contents$/i.test(headingText) || /^contents$/i.test(headingText)) {
        index += 1;

        while (index < lines.length) {
          if (!lines[index].trim()) {
            index += 1;
            continue;
          }

          if (isListItem(lines[index])) {
            index += 1;
            continue;
          }

          break;
        }

        while (output.length && !output.at(-1).trim()) {
          output.pop();
        }

        continue;
      }
    }

    output.push(lines[index]);
    index += 1;
  }

  return output.join('\n').replace(/^\s*\n+/, '');
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

function getNoteSlug(notePath) {
  return path.basename(notePath, '.md');
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
    const href = getNoteUrl(pagePath);
    return `<li><a${activeClass}${current} href="${escapeHtml(href)}" data-subject-id="${escapeHtml(structure.id)}" data-default-href="${escapeHtml(href)}" data-notes-nav-item>${escapeHtml(structure.title)}</a></li>`;
  }).join('');

  return `<aside class="notes-structures" aria-label="Guide structures">
          <div class="notes-header__brand">
            <p class="notes-header__eyebrow">Open Sourced Education for all</p>
            <p class="notes-header__title">Universal Education System</p>
          </div>
          <ul class="subject-list"><li><button type="button" data-leave-notes data-notes-nav-item>Leave</button></li>${links}<li><button class="notes-theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Switch to light mode" data-notes-nav-item>Light Mode</button></li></ul>
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

    return `<li class="guide-tree__item"><a class="${classes}" style="--guide-depth: ${depth}" href="${escapeHtml(getNoteUrl(pagePath))}"${current} data-notes-nav-item>${escapeHtml(node.title)}</a>${children}</li>`;
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
        <button class="search-panel__close notes-action-chip" id="search-close" type="button" aria-label="Close search" data-notes-nav-item>Close</button>
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

function renderTimerPanel() {
  return `<aside class="timer-panel" id="timer-panel" role="dialog" aria-modal="true" aria-label="Timer" hidden>
    <div class="timer-panel__card panel" tabindex="-1"></div>
  </aside>`;
}

function renderNotesFooter() {
  return `<footer class="shell notes-footer">
    <div class="notes-footer__inner">
      <a href="/privacy-policy/">Privacy Policy</a>
      <span class="notes-footer__sep" aria-hidden="true">-</span>
      <a href="/terms-of-service/">Terms of Service</a>
    </div>
  </footer>`;
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
  <link rel="icon" type="image/png" href="/assets/favicon.png" />
  <link rel="canonical" href="${siteOrigin}${redirectUrl}" />
  <script>
    (() => {
      try {
        const storedTheme = window.localStorage.getItem(${JSON.stringify(notesThemeStorageKey)});

        if (storedTheme === 'sepia' || storedTheme === 'light') {
          document.documentElement.classList.add('notes-page--sepia');
        }
      } catch {
        // Ignore storage access failures.
      }
    })();
  </script>
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

function renderQuickActions({ practiceUrl = null, backToNoteUrl = null } = {}) {
  const actions = [];

  if (practiceUrl) {
    actions.push(`<a class="notes-action-chip notes-action-chip--practice" href="${escapeHtml(practiceUrl)}" data-notes-nav-item>Practice</a>`);
  }

  if (backToNoteUrl) {
    actions.push(`<a class="notes-action-chip" href="${escapeHtml(backToNoteUrl)}" data-notes-nav-item>Back to note</a>`);
  }

  return actions.join('');
}

function renderFloatingActions(quickActionsHtml) {
  return `<div class="notes-quick-actions notes-quick-actions--floating" role="group" aria-label="Quick actions">${quickActionsHtml}<button class="notes-action-chip notes-action-chip--search" type="button" data-search-trigger aria-controls="search-panel" aria-expanded="false" data-notes-nav-item>Search</button><a class="notes-action-chip notes-action-chip--back-to-top" href="#top" aria-label="Back to top" data-notes-nav-item>Back to top</a></div>`;
}

function renderPomodoroBar() {
  return `<div class="notes-pomodoro-bar" data-pomodoro-bar role="progressbar" aria-label="Pomodoro timer progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="Pomodoro timer is idle">
    <div class="notes-pomodoro-bar__fill" data-pomodoro-fill></div>
  </div>`;
}

function renderPomodoroControls() {
  const presets = [
    { mode: 'focus', minutes: 25, label: 'Focus' },
    { mode: 'short', minutes: 5, label: 'Short break' },
    { mode: 'long', minutes: 15, label: 'Long break' },
  ];

  return `<div class="notes-header__timer" aria-label="Pomodoro timer">
    <p class="notes-header__eyebrow">Pomodoro</p>
    <div class="notes-pomodoro" role="group" aria-label="Pomodoro presets">
      ${presets.map((preset) => {
    const ariaLabel = `Start ${preset.minutes} minute ${preset.label.toLowerCase()} timer`;

    return `<button class="notes-pomodoro__preset" type="button" data-pomodoro-trigger data-pomodoro-mode="${escapeHtml(preset.mode)}" data-pomodoro-minutes="${escapeHtml(String(preset.minutes))}" aria-label="${escapeHtml(ariaLabel)}" aria-pressed="false">
          <span class="notes-pomodoro__minutes" aria-hidden="true">${escapeHtml(String(preset.minutes))}</span>
          <span class="notes-pomodoro__label">${escapeHtml(preset.label)}</span>
        </button>`;
  }).join('')}
    </div>
    <span class="sr-only" data-pomodoro-status aria-live="polite">Pomodoro timer is idle</span>
  </div>`;
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
      ${renderSubjectLinks(structures, activeStructureId)}
      ${renderPomodoroControls()}
      <img class="notes-header__art" src="${headerArtworkUrl}" alt="" aria-hidden="true" decoding="async" />
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
  floatingActionsHtml = '',
  stylesheetHref = '/notes/notes.css',
  scriptHref = '/notes/notes.js',
  extraHead = '',
}) {
  const themeBootstrapScript = `<script>
    (() => {
      try {
        const storedTheme = window.localStorage.getItem(${JSON.stringify(notesThemeStorageKey)});

        if (storedTheme === 'sepia' || storedTheme === 'light') {
          document.documentElement.classList.add('notes-page--sepia');
        }
      } catch {
        // Ignore storage access failures.
      }
    })();
  </script>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta name="color-scheme" content="dark" />
  <link rel="icon" type="image/png" href="/assets/favicon.png" />
  ${themeBootstrapScript}
  <link rel="stylesheet" href="${escapeHtml(stylesheetHref)}" />
  ${extraHead}
  <script defer src="${escapeHtml(scriptHref)}"></script>
</head>
<body class="notes-page ${escapeHtml(bodyClass)}" id="top">
  ${renderPomodoroBar()}
  <a class="skip-link" href="#content">Skip to content</a>
  ${floatingActionsHtml}

  ${renderHeader(structures, activeStructureId, includeIntro)}

  <main id="content" class="${escapeHtml(mainClass)}" aria-label="${escapeHtml(mainAriaLabel)}">
    ${mainHtml}
  </main>
  ${renderNotesFooter()}
  ${renderSearchPanel()}
  ${renderTimerPanel()}
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

function normalizeTocHeadingText(headingHtml) {
  return plainTextFromHtml(headingHtml).replace(/\s+/g, ' ').trim().toLowerCase();
}

function buildTocTree(entries) {
  const root = { level: 0, children: [] };
  const stack = [root];

  for (const entry of entries) {
    const node = { ...entry, children: [] };

    while (stack.length > 1 && node.level <= stack[stack.length - 1].level) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  return root.children;
}

function renderTocNodes(nodes) {
  return `<ol class="notes-toc__list">${nodes.map((node) => {
    const children = node.children.length ? renderTocNodes(node.children) : '';
    return `<li class="notes-toc__item"><a class="notes-toc__link" href="#${escapeHtml(node.id)}">${node.headingHtml}</a>${children}</li>`;
  }).join('')}</ol>`;
}

function splitTocNodes(nodes) {
  const midpoint = Math.ceil(nodes.length / 2);
  return [nodes.slice(0, midpoint), nodes.slice(midpoint)];
}

function renderTocColumns(nodes) {
  const columns = splitTocNodes(nodes).filter((columnNodes) => columnNodes.length > 0);
  return `<div class="notes-toc__columns">${columns.map((columnNodes) => renderTocNodes(columnNodes)).join('')}</div>`;
}

function renderTableOfContents(bodyHtml) {
  const headingPattern = /<h([1-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
  const entries = Array.from(bodyHtml.matchAll(headingPattern), ([, level, id, headingHtml]) => ({
    level: Number.parseInt(level, 10),
    id,
    headingHtml,
  })).filter((entry) => {
    const normalizedText = normalizeTocHeadingText(entry.headingHtml);
    return normalizedText && normalizedText !== 'table of contents' && normalizedText !== 'contents';
  });

  if (!entries.length) {
    return '';
  }

  const tocTree = buildTocTree(entries);
  const tocHtml = tocTree.length > 1 ? renderTocColumns(tocTree) : renderTocNodes(tocTree);

  return `<nav class="notes-toc" aria-label="Table of contents">
      <h2 class="notes-toc__title">Table of Contents</h2>
      ${tocHtml}
    </nav>`;
}

function buildNoteHtml({
  title,
  description,
  bodyHtml,
  beforeBodyHtml = '',
  afterBodyHtml = '',
  canonicalUrl,
  editUrl,
  sourceUrl,
  structures,
  structure,
  notePath,
  outputDir,
  assetVersions,
  practiceUrl = null,
}) {
  const tocHtml = renderTableOfContents(bodyHtml);
  const stylesheetHref = `${getRelativeNotesAssetHref(outputDir, 'notes.css')}?v=${assetVersions.notesCss}`;
  const scriptHref = `${getRelativeNotesAssetHref(outputDir, 'notes.js')}?v=${assetVersions.notesJs}`;
  const quickActionsHtml = renderQuickActions({ practiceUrl });
  const floatingActionsHtml = renderFloatingActions(quickActionsHtml);
  const mainHtml = `
    <aside class="notes-sidebar panel" aria-labelledby="guide-tree-title">
      <div class="notes-sidebar__head">
        <p class="section-label">Guides</p>
      </div>
      <nav aria-labelledby="guide-tree-title">
        <h2 class="notes-sidebar__title" id="guide-tree-title">${escapeHtml(structure.title)}</h2>
        <ul class="guide-tree">${renderGuideTree(structure.children ?? [], notePath)}</ul>
      </nav>
    </aside>
    <section class="notes-viewer panel">
      <div class="viewer-head">
        <div>
          <h1>${escapeHtml(title)}</h1>
          ${renderMetadataLine('viewer-meta', sourceUrl)}
        </div>
      <div class="viewer-head__actions">
          <a class="suggest-edit-link notes-action-chip" href="${escapeHtml(editUrl)}" target="_blank" rel="noreferrer" data-notes-nav-item>Suggest edit</a>
          ${practiceUrl ? `<a class="notes-action-chip notes-action-chip--practice" href="${escapeHtml(practiceUrl)}" data-notes-nav-item>Practice</a>` : ''}
        </div>
      </div>
      <article class="markdown-body" id="note-content">
        ${tocHtml}
        ${beforeBodyHtml}
        ${bodyHtml}
        ${afterBodyHtml}
      </article>
    </section>
  `;

  return renderNotesPageDocument({
    title: `${title} | Adriamics`,
    description,
    canonicalUrl,
    bodyClass: 'note-standalone-page',
    mainClass: 'shell notes-layout',
    mainAriaLabel: 'Notes content',
    mainHtml,
    structures,
    activeStructureId: structure.id,
    floatingActionsHtml,
    stylesheetHref,
    scriptHref,
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

function trimBlankLines(lines) {
  let start = 0;
  let end = lines.length;

  while (start < end && !lines[start].trim()) {
    start += 1;
  }

  while (end > start && !lines[end - 1].trim()) {
    end -= 1;
  }

  return lines.slice(start, end);
}

function isPracticeMetadataStart(lines, index) {
  if (lines[index]?.trim() !== '<!--') {
    return false;
  }

  let nextIndex = index + 1;

  while (nextIndex < lines.length && !lines[nextIndex].trim()) {
    nextIndex += 1;
  }

  return nextIndex < lines.length && /^[A-Za-z0-9_-]+:\s*/.test(lines[nextIndex]);
}

function parsePracticeSolutionBlock(markdown, sourcePath, problemId) {
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  const startIndex = lines.findIndex((line) => /^\s*:::solution\s*$/.test(line));

  if (startIndex < 0) {
    return {
      promptMarkdown: trimBlankLines(lines).join('\n'),
      solutionMarkdown: '',
    };
  }

  const endIndex = lines.findIndex((line, index) => index > startIndex && /^\s*:::\s*$/.test(line));

  if (endIndex < 0) {
    throw new Error(`Missing closing ::: for solution block in ${sourcePath}${problemId ? ` (${problemId})` : ''}`);
  }

  const trailing = lines.slice(endIndex + 1).filter((line) => line.trim());

  if (trailing.length) {
    throw new Error(`Unexpected content after solution block in ${sourcePath}${problemId ? ` (${problemId})` : ''}`);
  }

  return {
    promptMarkdown: trimBlankLines(lines.slice(0, startIndex)).join('\n'),
    solutionMarkdown: trimBlankLines(lines.slice(startIndex + 1, endIndex)).join('\n'),
  };
}

function validatePracticeProblemMetadata(metadata, sourcePath, problemIndex, seenProblemIds, solutionMarkdown) {
  const requiredFields = ['id', 'note', 'title', 'skills'];

  for (const field of requiredFields) {
    const value = metadata?.[field];
    const isMissing = Array.isArray(value)
      ? !value.length
      : value === undefined || value === null || String(value).trim() === '';

    if (isMissing) {
      throw new Error(`Missing required field "${field}" in ${sourcePath} (problem ${problemIndex + 1})`);
    }
  }

  if (!Array.isArray(metadata.skills)) {
    throw new Error(`Field "skills" must be an array in ${sourcePath} (problem ${problemIndex + 1})`);
  }

  const id = String(metadata.id).trim();

  if (seenProblemIds.has(id)) {
    throw new Error(`Duplicate problem id "${id}" in ${sourcePath}; already used in ${seenProblemIds.get(id)}`);
  }

  seenProblemIds.set(id, sourcePath);

  const { level, position } = parsePracticeProblemId(id, sourcePath, problemIndex);

  const type = metadata.type === undefined || metadata.type === null || String(metadata.type).trim() === ''
    ? ''
    : String(metadata.type).trim().toLowerCase();
  const derivedAnswer = String(metadata.answer ?? solutionMarkdown ?? '').trim();

  if (type === 'numeric') {
    if (!derivedAnswer) {
      throw new Error(`Numeric problem "${id}" in ${sourcePath} must use a numeric answer.`);
    }

    const numericAnswer = Number(derivedAnswer);

    if (!Number.isFinite(numericAnswer)) {
      throw new Error(`Numeric problem "${id}" in ${sourcePath} must use a numeric answer.`);
    }

    if (metadata.tolerance !== undefined && metadata.tolerance !== null && String(metadata.tolerance).trim() !== '') {
      const tolerance = Number(String(metadata.tolerance).trim());

      if (!Number.isFinite(tolerance) || tolerance < 0) {
        throw new Error(`Numeric problem "${id}" in ${sourcePath} must use a valid non-negative tolerance.`);
      }
    }
  }

  return {
    id,
    level,
    position,
    note: String(metadata.note).trim(),
    title: String(metadata.title).trim(),
    type,
    answer: derivedAnswer,
    exam: metadata.exam === undefined || metadata.exam === null ? '' : String(metadata.exam).trim(),
    tolerance: metadata.tolerance,
    unit: metadata.unit,
    skills: metadata.skills,
  };
}

function parsePracticeProblems(markdown, sourcePath, seenProblemIds) {
  const lines = String(markdown ?? '').replace(/\r\n/g, '\n').split('\n');
  const problems = [];
  let index = 0;

  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) {
      index += 1;
    }

    if (index >= lines.length) {
      break;
    }

    if (!isPracticeMetadataStart(lines, index)) {
      throw new Error(`Unexpected content before a problem block in ${sourcePath} on line ${index + 1}.`);
    }

    const metadataLines = [];
    index += 1;

    while (index < lines.length && lines[index].trim() !== '-->') {
      metadataLines.push(lines[index]);
      index += 1;
    }

    if (index >= lines.length) {
      throw new Error(`Missing closing metadata delimiter in ${sourcePath}.`);
    }

    const metadata = parseFrontmatter(metadataLines.join('\n'));
    index += 1;

    const bodyLines = [];

    while (index < lines.length && !isPracticeMetadataStart(lines, index)) {
      bodyLines.push(lines[index]);
      index += 1;
    }

    const { promptMarkdown, solutionMarkdown } = parsePracticeSolutionBlock(bodyLines.join('\n'), sourcePath, metadata.id);
    const problem = validatePracticeProblemMetadata(metadata, sourcePath, problems.length, seenProblemIds, solutionMarkdown);

    problems.push({
      ...problem,
      promptMarkdown,
      solutionMarkdown,
      sourcePath,
    });
  }

  if (!problems.length) {
    throw new Error(`No practice problems were found in ${sourcePath}.`);
  }

  return problems;
}

function normalizePracticeExam(problem) {
  const explicitExam = String(problem.exam ?? '').trim().toLowerCase();

  if (explicitExam) {
    if (['i', '1', 'exam i', 'exam 1'].includes(explicitExam)) {
      return { key: 'exam-i', label: 'Exam I' };
    }

    if (['ii', '2', 'exam ii', 'exam 2'].includes(explicitExam)) {
      return { key: 'exam-ii', label: 'Exam II' };
    }

    if (['final', 'exam final'].includes(explicitExam)) {
      return { key: 'final', label: 'Final' };
    }
  }

  if (problem.level <= 1) {
    return { key: 'exam-i', label: 'Exam I' };
  }

  if (problem.level === 2) {
    return { key: 'exam-ii', label: 'Exam II' };
  }

  return { key: 'final', label: 'Final' };
}

function renderPracticeProblem(problem, practiceSourcePath, notePath) {
  const promptHtml = renderBlocks(problem.promptMarkdown, practiceSourcePath);
  const solutionHtml = problem.solutionMarkdown
    ? renderBlocks(problem.solutionMarkdown, practiceSourcePath)
    : '<p class="practice-problem__solution-empty">No solution provided.</p>';
  const skills = renderPracticeSkills(notePath, problem.skills);
  const exam = normalizePracticeExam(problem);
  const problemNumber = `${String(problem.level).trim()}.${String(problem.position).trim()}`;
  const tolerance = problem.tolerance === undefined || problem.tolerance === null || String(problem.tolerance).trim() === ''
    ? ''
    : String(problem.tolerance).trim();
  const unit = problem.unit === undefined || problem.unit === null ? '' : String(problem.unit).trim();
  const type = problem.type === undefined || problem.type === null || String(problem.type).trim() === ''
    ? ''
    : String(problem.type).trim();
  const metadataBits = [
    `<span class="practice-problem__exam">${escapeHtml(exam.label)}</span>`,
    `<span class="practice-problem__problem">Problem ${escapeHtml(problemNumber)}</span>`,
    skills ? `<span class="practice-problem__uses"><span class="practice-problem__skills">${skills}</span></span>` : null,
    unit ? `<span>Unit ${escapeHtml(unit)}</span>` : null,
  ].filter(Boolean).join(' | ');

  return `<article class="practice-problem panel" id="${escapeHtml(problem.id)}" data-practice-problem data-exam="${escapeHtml(exam.key)}" data-problem-number="${escapeHtml(problemNumber)}"${type ? ` data-problem-type="${escapeHtml(type)}"` : ''}${problem.answer ? ` data-problem-answer="${escapeHtml(String(problem.answer).trim())}"` : ''}${tolerance ? ` data-problem-tolerance="${escapeHtml(tolerance)}"` : ''}${unit ? ` data-problem-unit="${escapeHtml(unit)}"` : ''}>
      <div class="practice-problem__head">
        <div>
          <h2 class="practice-problem__title"><span class="practice-problem__number">${escapeHtml(problemNumber)}</span><span class="practice-problem__title-text">${escapeHtml(problem.title)}</span></h2>
          <p class="practice-problem__meta">${metadataBits}</p>
        </div>
        <button type="button" class="practice-problem__complete-toggle" data-practice-complete-toggle aria-pressed="false">
          <span class="practice-problem__complete-mark" aria-hidden="true"></span>
          <span class="practice-problem__complete-text">Complete</span>
        </button>
      </div>
      <div class="practice-problem__prompt markdown-body" data-practice-prompt>
        ${promptHtml}
      </div>
      <div class="practice-problem__actions">
        <div class="practice-problem__study" data-practice-study role="group" aria-label="ChatGPT study mode">
          <label class="sr-only" for="practice-study-${escapeHtml(problem.id)}">Your work for ${escapeHtml(problem.title)}</label>
          <textarea
            id="practice-study-${escapeHtml(problem.id)}"
            class="practice-problem__study-input"
            data-practice-study-input
            rows="2"
            placeholder="Write your work here before asking ChatGPT..."
          ></textarea>
        </div>
        <div class="practice-problem__action-links" aria-label="Problem actions">
          <button type="button" class="practice-problem__feedback" data-practice-solution-toggle data-notes-nav-item>Show solutions</button>
          <span class="practice-problem__action-separator" aria-hidden="true">-</span>
          <button type="button" class="practice-problem__study-submit" data-practice-study-submit data-notes-nav-item>Ask ChatGPT</button>
        </div>
      </div>
      <section class="practice-problem__solution" data-practice-solution hidden>
        <p class="section-label">Solution</p>
        <div class="markdown-body">
          ${solutionHtml}
        </div>
      </section>
    </article>`;
}

function buildPracticeHtml({
  title,
  description,
  canonicalUrl,
  noteUrl,
  editUrl,
  sourceUrl,
  notePath,
  practiceSourcePath,
  structures,
  structure,
  outputDir,
  assetVersions,
  problems,
}) {
  const stylesheetHref = `${getRelativeNotesAssetHref(outputDir, 'notes.css')}?v=${assetVersions.notesCss}`;
  const scriptHref = `${getRelativeNotesAssetHref(outputDir, 'notes.js')}?v=${assetVersions.notesJs}`;
  const totalProblems = problems.length;
  const problemGroups = groupPracticeProblems(problems);
  const problemHtml = problemGroups.map((group) => {
    const levelProblemHtml = group.items.map(({ problem }) => {
      return renderPracticeProblem(problem, practiceSourcePath, notePath);
    }).join('');

    return `<section class="practice-level practice-level--level-${escapeHtml(String(group.level))} panel" data-practice-level="${escapeHtml(String(group.level))}" aria-labelledby="practice-level-${group.level}">
        <div class="practice-level__head">
          <div class="practice-level__eyebrow">
            <p class="section-label">Difficulty</p>
            <h2 id="practice-level-${escapeHtml(String(group.level))}">${escapeHtml(group.label)}</h2>
          </div>
          <div class="practice-level__badge" aria-hidden="true">
            <span class="practice-level__badge-label">Level</span>
            <span class="practice-level__badge-value">${escapeHtml(String(group.level))}</span>
          </div>
        </div>
        <div class="practice-problem-list practice-problem-list--grouped">
          ${levelProblemHtml}
        </div>
      </section>`;
  }).join('');
  const quickActionsHtml = renderQuickActions({ backToNoteUrl: noteUrl });
  const floatingActionsHtml = renderFloatingActions(quickActionsHtml);
  const mainHtml = `
    <aside class="notes-sidebar panel" aria-labelledby="guide-tree-title">
      <div class="notes-sidebar__head">
        <p class="section-label">Guides</p>
      </div>
      <nav aria-labelledby="guide-tree-title">
        <h2 class="notes-sidebar__title" id="guide-tree-title">${escapeHtml(structure.title)}</h2>
        <ul class="guide-tree">${renderGuideTree(structure.children ?? [], notePath)}</ul>
      </nav>
    </aside>
    <section class="notes-viewer panel practice-viewer" data-practice-page>
      <div class="viewer-head">
        <div>
          <h1>${escapeHtml(title)}</h1>
          ${renderMetadataLine('viewer-meta practice-note-meta-line', sourceUrl)}
        </div>
      <div class="viewer-head__actions">
          <a class="suggest-edit-link notes-action-chip" href="${escapeHtml(editUrl)}" target="_blank" rel="noreferrer" data-notes-nav-item>Suggest edit</a>
          <a class="practice-back-link notes-action-chip" href="${escapeHtml(noteUrl)}" data-notes-nav-item>Back to note</a>
        </div>
      </div>
      <section class="practice-filters panel" data-practice-filters aria-label="Practice filters">
        <div class="practice-filters__bar" role="toolbar" aria-label="Practice problem filters">
          <button type="button" class="practice-filters__button is-active" data-practice-filter-button data-practice-filter="all" aria-pressed="true">All</button>
          <button type="button" class="practice-filters__button" data-practice-filter-button data-practice-filter="exam-i" aria-pressed="false">Exam I</button>
          <button type="button" class="practice-filters__button" data-practice-filter-button data-practice-filter="exam-ii" aria-pressed="false">Exam II</button>
          <button type="button" class="practice-filters__button" data-practice-filter-button data-practice-filter="final" aria-pressed="false">Final</button>
          <button type="button" class="practice-filters__button" data-practice-filter-button data-practice-filter="marked" aria-pressed="false">Marked</button>
          <button type="button" class="practice-filters__button" data-practice-filter-button data-practice-filter="missed" aria-pressed="false">Missed</button>
        </div>
        <p class="practice-filters__summary" data-practice-filter-summary aria-live="polite">Showing all ${escapeHtml(String(totalProblems))} problems</p>
      </section>
      <section class="practice-progress" data-practice-progress role="progressbar" aria-label="Practice completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0 of ${escapeHtml(String(totalProblems))} problems completed">
        <div class="practice-progress__head">
          <p class="section-label">Progress</p>
          <p class="practice-progress__summary" data-practice-progress-summary>0 of ${escapeHtml(String(totalProblems))} completed</p>
        </div>
        <div class="practice-progress__track" aria-hidden="true">
          <div class="practice-progress__fill" data-practice-progress-fill></div>
        </div>
      </section>
      <div class="practice-problem-list">
        ${problemHtml}
      </div>
    </section>`;

  return renderNotesPageDocument({
    title: `${title} | Adriamics`,
    description,
    canonicalUrl,
    bodyClass: 'practice-page',
    mainClass: 'shell notes-layout',
    mainAriaLabel: 'Practice problems',
    mainHtml,
    structures,
    activeStructureId: structure.id,
    floatingActionsHtml,
    stylesheetHref,
    scriptHref,
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

async function listMarkdownFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return listMarkdownFiles(entryPath);
    }

    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      return [];
    }

    return [entryPath];
  }));

  return paths.flat().sort();
}

async function validateManifestCoverage(notes) {
  const manifestPaths = notes.map((note) => note.path);
  const uniqueManifestPaths = new Set(manifestPaths);
  const duplicatePaths = manifestPaths
    .filter((notePath, index) => manifestPaths.indexOf(notePath) !== index);
  const invalidManifestPaths = [...uniqueManifestPaths]
    .filter((notePath) => !isFolderLayoutNotePath(notePath))
    .sort();
  const missingFiles = [];

  for (const notePath of uniqueManifestPaths) {
    if (!(await exists(getNoteSourcePath(notePath)))) {
      missingFiles.push(notePath);
    }
  }

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

function getGeneratedSourcePathFromOutputDir(outputDir) {
  const relativeOutputDir = toPosix(path.relative(path.join(notesRoot, 'subjects'), outputDir));
  const parts = relativeOutputDir.split('/').filter(Boolean);

  if (!parts.length) {
    return null;
  }

  if (parts.at(-1) === 'practice') {
    if (parts.length < 2) {
      return null;
    }

    const noteParts = parts.slice(0, -1);
    return path.join(notesRoot, 'source', ...noteParts, `${noteParts.at(-1)}-problems.md`);
  }

  return path.join(notesRoot, 'source', ...parts, `${parts.at(-1)}.md`);
}

async function loadNoteDocuments(notes) {
  const noteDocuments = new Map();
  const widgets = [];

  for (const note of notes) {
    const sourcePath = getNoteSourcePath(note.path);
    const markdown = await fs.readFile(sourcePath, 'utf8');
    const { body } = splitFrontmatter(markdown);
    const bodyWithoutManualToc = stripManualTableOfContents(body);
    const bodyWithoutTitle = stripLeadingTitleHeading(bodyWithoutManualToc, note.title);
    const widgetResult = collectWidgetBlocks(bodyWithoutTitle, sourcePath, note);

    noteDocuments.set(note.path, {
      sourcePath,
      bodyForDisplay: widgetResult.body,
      widgets: widgetResult.widgets,
    });

    widgets.push(...widgetResult.widgets);
  }

  return { noteDocuments, widgets };
}

async function loadPracticeProblems(notes) {
  const noteBySourcePath = new Map(notes.map((note) => [getNoteSourcePath(note.path), note]));
  const seenProblemIds = new Map();
  const practiceSourcePaths = (await listMarkdownFiles(path.join(notesRoot, 'source')))
    .filter((sourcePath) => sourcePath.endsWith('-problems.md'));
  const practiceByNotePath = new Map();

  for (const practiceSourcePath of practiceSourcePaths) {
    const noteSourcePath = practiceSourcePath.replace(/-problems\.md$/i, '.md');
    const note = noteBySourcePath.get(noteSourcePath);

    if (!note) {
      continue;
    }

    const markdown = await fs.readFile(practiceSourcePath, 'utf8');
    const problems = parsePracticeProblems(markdown, practiceSourcePath, seenProblemIds);

    practiceByNotePath.set(note.path, {
      note,
      sourcePath: practiceSourcePath,
      problems,
    });
  }

  return practiceByNotePath;
}

async function removeStaleGeneratedPages(notes, practiceByNotePath) {
  const expectedOutputDirs = new Set([
    ...notes.map((note) => getNoteOutputDir(note.path)),
    ...[...practiceByNotePath.values()].map((practice) => getPracticeOutputDir(practice.note.path)),
  ]);

  async function visit(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const indexEntry = entries.find((entry) => entry.isFile() && entry.name === 'index.html');

    if (indexEntry) {
      const sourceFile = getGeneratedSourcePathFromOutputDir(dirPath);
      if (!sourceFile || !expectedOutputDirs.has(dirPath) || !(await exists(sourceFile))) {
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

async function buildNotePage(note, urlPath, structures, assetVersions, noteDocument, practice = null, widgetRegistry = []) {
  const sourcePath = noteDocument.sourcePath;
  const title = note.title;
  const bodyForDisplay = noteDocument.bodyForDisplay;
  const summary = getSummary(bodyForDisplay) || title;
  const description = summary.length > 160 ? `${summary.slice(0, 157)}...` : summary;
  const canonicalUrl = `${siteOrigin}${urlPath}`;
  const editUrl = `https://github.com/Parell/parell.github.io/issues/new?template=correction.yml&page_path=${encodeURIComponent(toPosix(path.relative(repoRoot, sourcePath)))}&title=${encodeURIComponent(`[Correction]: ${title}`)}`;
  const sourceUrl = buildGithubBlobUrl(toPosix(path.relative(repoRoot, sourcePath)));
  const resolvedBodyForDisplay = resolveWidgetIncludeMarkers(bodyForDisplay, widgetRegistry);
  const bodyHtml = renderBlocks(resolvedBodyForDisplay, `notes/${note.path}`);
  const pageHtml = buildNoteHtml({
    title,
    description,
    bodyHtml,
    beforeBodyHtml: '',
    afterBodyHtml: '',
    canonicalUrl,
    editUrl,
    sourceUrl,
    structures,
    structure: note.structure,
    notePath: note.path,
    practiceUrl: practice ? getPracticeUrl(note.path) : null,
    outputDir: getNoteOutputDir(note.path),
    assetVersions,
  });
  const outputPath = path.join(getNoteOutputDir(note.path), 'index.html');

  await ensureDir(outputPath);
  await fs.writeFile(outputPath, pageHtml, 'utf8');

  return {
    title,
    subject: note.structureTitle,
    url: urlPath,
    text: trimMarkdownText(`${title} ${resolvedBodyForDisplay}`),
  };
}

async function buildPracticePage(practice, structures, assetVersions) {
  const sourcePath = practice.sourcePath;
  const note = practice.note;
  const title = `${note.title} Practice`;
  const description = `${practice.problems.length} practice problem${practice.problems.length === 1 ? '' : 's'}`;
  const canonicalUrl = `${siteOrigin}${getPracticeUrl(note.path)}`;
  const relativeSourcePath = toPosix(path.relative(repoRoot, sourcePath));
  const editUrl = `https://github.com/Parell/parell.github.io/issues/new?template=correction.yml&page_path=${encodeURIComponent(relativeSourcePath)}&title=${encodeURIComponent(`[Correction]: ${title}`)}`;
  const sourceUrl = buildGithubBlobUrl(relativeSourcePath);
  const pageHtml = buildPracticeHtml({
    title,
    description,
    canonicalUrl,
    noteUrl: getNoteUrl(note.path),
    editUrl,
    sourceUrl,
    notePath: note.path,
    practiceSourcePath: sourcePath,
    structures,
    structure: note.structure,
    outputDir: getPracticeOutputDir(note.path),
    assetVersions,
    problems: practice.problems,
  });
  const outputPath = path.join(getPracticeOutputDir(note.path), 'index.html');

  await ensureDir(outputPath);
  await fs.writeFile(outputPath, pageHtml, 'utf8');

  return {
    url: getPracticeUrl(note.path),
  };
}

async function buildLandingPage(structures) {
  await fs.writeFile(path.join(notesRoot, 'index.html'), buildLandingHtml(structures), 'utf8');
}

async function buildRootIndexPage(siteCssVersion) {
  const indexPath = path.join(repoRoot, 'index.html');
  const html = await fs.readFile(indexPath, 'utf8');
  const versionPattern = /site\.css\?v=[^"]+/;

  if (!versionPattern.test(html)) {
    throw new Error('Could not update the root stylesheet version in index.html.');
  }

  const updatedHtml = html.replace(versionPattern, `site.css?v=${siteCssVersion}`);
  await fs.writeFile(indexPath, updatedHtml, 'utf8');
}

async function buildSearchIndex(entries) {
  const json = `${JSON.stringify(entries, null, 2)}\n`;
  await fs.writeFile(path.join(notesRoot, 'search-index.json'), json, 'utf8');
}

async function buildSitemap(noteUrls, practiceUrls) {
  const urls = [
    `${siteOrigin}/`,
    `${siteOrigin}/blog/what-this-site-is-for.html`,
    `${siteOrigin}/energy-housing-policy/`,
    `${siteOrigin}/privacy-policy/`,
    `${siteOrigin}/terms-of-service/`,
    `${siteOrigin}/notes/`,
    ...noteUrls.map((urlPath) => `${siteOrigin}${urlPath}`),
    ...practiceUrls.map((urlPath) => `${siteOrigin}${urlPath}`),
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
  const assetVersions = {
    siteCss: await getAssetVersion(path.join(repoRoot, 'site.css')),
    notesCss: await getAssetVersion(path.join(notesRoot, 'notes.css')),
    notesJs: await getAssetVersion(path.join(notesRoot, 'notes.js')),
  };

  await validateManifestCoverage(notes);

  const urls = notes.map((note) => getNoteUrl(note.path));
  const { noteDocuments, widgets: widgetRegistry } = await loadNoteDocuments(notes);
  const practiceByNotePath = await loadPracticeProblems(notes);
  const practiceUrls = [];
  const searchEntries = [];
  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index];
    const practice = practiceByNotePath.get(note.path);
    const noteDocument = noteDocuments.get(note.path);

    if (!noteDocument) {
      throw new Error(`Missing loaded note content for ${note.path}.`);
    }

    searchEntries.push(await buildNotePage(note, urls[index], manifest.structures, assetVersions, noteDocument, practice, widgetRegistry));

    if (practice) {
      const practicePage = await buildPracticePage(practice, manifest.structures, assetVersions);
      practiceUrls.push(practicePage.url);
    }
  }

  await removeStaleGeneratedPages(notes, practiceByNotePath);

  await buildRootIndexPage(assetVersions.siteCss);
  await buildLandingPage(manifest.structures);
  await buildSearchIndex(searchEntries);
  await buildSitemap(urls, practiceUrls);
}

await main();

