import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import path from 'node:path';
import vm from 'node:vm';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const notesRoot = path.join(repoRoot, 'notes');
const manifestPath = path.join(notesRoot, 'source', 'manifest.js');
const sourceHistoryPath = path.join(notesRoot, 'source-history.json');
const siteOrigin = 'https://adriamics.com';
const githubRepoUrl = 'https://github.com/Parell/parell.github.io';
const githubRepoBranch = 'master';
const headerArtworkUrl = encodeURI('/assets/name.gif');
const notesThemeStorageKey = 'ues-notes:contrast-mode';
const metadataSeparator = ' | ';
const provenanceVersionLimit = 8;
const provenanceReviewLimit = 8;
const execFileAsync = promisify(execFile);
const gitHistoryCache = new Map();
const gitFileContentCache = new Map();
let sourceHistoryPromise = null;
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

function getMetadataLabel(metadata, fallbackPath) {
  const parts = getMetadataParts(metadata);
  return parts.length ? parts.join(metadataSeparator) : (fallbackPath ?? '');
}

function formatMetadataValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? '').trim())
      .filter(Boolean)
      .join(', ');
  }

  return String(value ?? '').trim();
}

function formatReviewerValue(value) {
  const normalize = (item) => String(item ?? '')
    .trim()
    .replace(/^,+\s*/, '')
    .replace(/^["']+/, '')
    .replace(/["']+$/, '');

  if (Array.isArray(value)) {
    return value
      .map(normalize)
      .filter(Boolean)
      .join(', ');
  }

  return normalize(value);
}

function isProbablyUrl(value) {
  return /^https?:\/\/\S+$/i.test(String(value ?? '').trim());
}

function normalizeSourceEntry(entry) {
  if (typeof entry === 'string') {
    const value = entry.trim();

    if (!value) {
      return null;
    }

    return {
      label: value,
      href: isProbablyUrl(value) ? value : '',
      note: '',
    };
  }

  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const label = formatMetadataValue(entry.title ?? entry.name ?? entry.label ?? entry.source ?? entry.citation);
  const href = formatMetadataValue(entry.url ?? entry.href);
  const note = formatMetadataValue(entry.note ?? entry.description ?? entry.details);

  if (!label && !href) {
    return null;
  }

  return {
    label: label || href,
    href: isProbablyUrl(href) ? href : '',
    note,
  };
}

function formatGitDate(isoDate) {
  const normalized = String(isoDate ?? '').trim();

  if (!normalized) {
    return '';
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return date.toISOString().slice(0, 10);
}

function formatShortSha(sha) {
  return String(sha ?? '').slice(0, 7);
}

function buildGithubBlobUrl(relativePath) {
  return `${githubRepoUrl}/blob/${githubRepoBranch}/${toPosix(relativePath)}`;
}

function buildGithubCommitUrl(sha) {
  return `${githubRepoUrl}/commit/${sha}`;
}

function formatReviewSummary(metadata) {
  const parts = [];
  const status = formatMetadataValue(metadata?.status);
  const lastReviewed = formatMetadataValue(metadata?.last_reviewed);
  const auditors = formatReviewerValue(metadata?.auditors);

  if (status) {
    parts.push(status);
  }

  if (lastReviewed) {
    parts.push(`Reviewed ${lastReviewed}`);
  }

  if (auditors) {
    parts.push(`Reviewers: ${auditors}`);
  }

  return parts;
}

function normalizeReviewSummaryPart(part) {
  const value = String(part ?? '').trim();

  if (/^Reviewers:/i.test(value)) {
    const reviewers = value.replace(/^Reviewers:\s*/i, '');
    return `Reviewers: ${formatReviewerValue(reviewers)}`;
  }

  return value;
}

function getMetadataParts(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return [];
  }

  const parts = [];
  const subject = formatMetadataValue(metadata.subject);
  const topic = formatMetadataValue(metadata.topic);
  const level = formatMetadataValue(metadata.level);
  const status = formatMetadataValue(metadata.status);
  const lastReviewed = formatMetadataValue(metadata.last_reviewed);

  if (subject) parts.push(subject);
  if (topic) parts.push(topic);
  if (level) parts.push(level);
  if (status) parts.push(status);
  if (lastReviewed) parts.push(`Reviewed ${lastReviewed}`);

  if (Array.isArray(metadata.auditors) && metadata.auditors.length) {
    const auditors = formatMetadataValue(metadata.auditors);

    if (auditors) {
      parts.push(`Auditors: ${auditors}`);
    }
  }

  return parts;
}

function renderPracticeMetadataLine(metadata) {
  const parts = getMetadataParts(metadata);
  if (!parts.length) {
    return '';
  }

  return renderMetadataLine(parts.join(metadataSeparator), 'viewer-meta practice-note-meta-line');
}

function renderSourceJumpLink() {
  return `<a class="viewer-source-jump" href="#provenance-sources-title">jump to sources</a>`;
}

function renderMetadataLine(metadataText, className) {
  const text = String(metadataText ?? '').trim();

  if (!text) {
    return '';
  }

  return `<p class="${className}">${escapeHtml(text)} | ${renderSourceJumpLink()}</p>`;
}

function getPageUrl(pagePath) {
  const normalized = toPosix(pagePath).replace(/^notes\//, '').replace(/\.md$/i, '');
  return `/notes/${normalized}/`;
}

function getNoteRoutePath(notePath) {
  return toPosix(path.dirname(notePath)).replace(/^notes\//, '');
}

function getNoteSourcePath(notePath) {
  const normalized = toPosix(notePath).replace(/^subjects\//, '');
  return path.join(notesRoot, 'source', normalized);
}

async function runGit(args) {
  const result = await execFileAsync('git', args, {
    cwd: repoRoot,
    maxBuffer: 20 * 1024 * 1024,
  });

  return String(result.stdout ?? '');
}

async function getGitFileHistory(relativePath) {
  const normalizedPath = toPosix(relativePath);

  if (gitHistoryCache.has(normalizedPath)) {
    return gitHistoryCache.get(normalizedPath);
  }

  if (!sourceHistoryPromise) {
    sourceHistoryPromise = fs.readFile(sourceHistoryPath, 'utf8')
      .then((text) => JSON.parse(text))
      .catch(() => ({}));
  }

  const sourceHistory = await sourceHistoryPromise;
  const history = sourceHistory?.[normalizedPath] ?? {
    relativePath: normalizedPath,
    sourceUrl: buildGithubBlobUrl(normalizedPath),
    commits: [],
    authorSummary: [],
    reviewSnapshots: [],
  };

  gitHistoryCache.set(normalizedPath, history);
  return history;
}

function renderSourceEntries(sources) {
  const entries = Array.isArray(sources)
    ? sources.map(normalizeSourceEntry).filter(Boolean)
    : [];

  if (!entries.length) {
    return '<p class="notes-provenance__empty">No external sources recorded in frontmatter yet.</p>';
  }

  return `<ul class="notes-provenance__list">${entries.map((entry) => {
    const linkText = escapeHtml(entry.label);
    const noteText = entry.note ? `<span class="notes-provenance__note">${escapeHtml(entry.note)}</span>` : '';

    if (entry.href) {
      return `<li class="notes-provenance__item"><a class="notes-provenance__link" href="${escapeHtml(entry.href)}" target="_blank" rel="noreferrer">${linkText}</a>${noteText}</li>`;
    }

    return `<li class="notes-provenance__item">${linkText}${noteText}</li>`;
  }).join('')}</ul>`;
}

function renderGitFileLinks(fileLinks) {
  if (!Array.isArray(fileLinks) || !fileLinks.length) {
    return '<p class="notes-provenance__empty">No GitHub source file was recorded for this page.</p>';
  }

  return `<ul class="notes-provenance__list">${fileLinks.map((fileLink) => {
    const label = escapeHtml(fileLink.label);
    const href = buildGithubBlobUrl(fileLink.path);
    const pathLabel = escapeHtml(fileLink.path);
    return `<li class="notes-provenance__item"><a class="notes-provenance__link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${label}</a><span class="notes-provenance__note">${pathLabel}</span></li>`;
  }).join('')}</ul>`;
}

function renderAuthorHistory(authorSummary) {
  if (!Array.isArray(authorSummary) || !authorSummary.length) {
    return '<p class="notes-provenance__empty">No Git history was found for this file.</p>';
  }

  return `<ul class="notes-provenance__list">${authorSummary.map((entry) => {
    const firstDate = formatGitDate(entry.firstDate);
    const lastDate = formatGitDate(entry.lastDate);
    const range = firstDate && lastDate
      ? firstDate === lastDate
        ? firstDate
        : `${firstDate} to ${lastDate}`
      : '';
    const metaParts = [];

    if (entry.count) {
      metaParts.push(`${entry.count} commit${entry.count === 1 ? '' : 's'}`);
    }

    if (range) {
      metaParts.push(range);
    }

    return `<li class="notes-provenance__item"><strong>${escapeHtml(entry.author || 'Unknown author')}</strong>${metaParts.length ? `<span class="notes-provenance__note">${escapeHtml(metaParts.join(' | '))}</span>` : ''}</li>`;
  }).join('')}</ul>`;
}

function renderReviewHistory(reviewSnapshots) {
  if (!Array.isArray(reviewSnapshots) || !reviewSnapshots.length) {
    return '<p class="notes-provenance__empty">No reviewer metadata was found in this file history.</p>';
  }

  return `<ol class="notes-provenance__list notes-provenance__list--ordered">${reviewSnapshots.slice(-provenanceReviewLimit).reverse().map((entry) => {
    const details = [
      formatGitDate(entry.date),
      ...((Array.isArray(entry.summary) ? entry.summary : []).map(normalizeReviewSummaryPart)),
    ].filter(Boolean);

    return `<li class="notes-provenance__item"><a class="notes-provenance__link" href="${escapeHtml(buildGithubCommitUrl(entry.sha))}" target="_blank" rel="noreferrer">${escapeHtml(formatShortSha(entry.sha))}</a><span class="notes-provenance__note">${escapeHtml(details.join(' | ') || 'No review details recorded')}</span><span class="notes-provenance__note">${escapeHtml(entry.subject || '')}</span></li>`;
  }).join('')}</ol>`;
}

function renderVersionHistory(commits) {
  if (!Array.isArray(commits) || !commits.length) {
    return '<p class="notes-provenance__empty">No version history was found for this file.</p>';
  }

  return `<ol class="notes-provenance__list notes-provenance__list--ordered">${commits.slice(0, provenanceVersionLimit).map((entry) => {
    const details = [
      formatGitDate(entry.date),
      entry.author,
      entry.subject,
    ].filter(Boolean);

    return `<li class="notes-provenance__item"><a class="notes-provenance__link" href="${escapeHtml(buildGithubCommitUrl(entry.sha))}" target="_blank" rel="noreferrer">${escapeHtml(formatShortSha(entry.sha))}</a><span class="notes-provenance__note">${escapeHtml(details.join(' | ') || 'No version details recorded')}</span></li>`;
  }).join('')}</ol>`;
}

function renderProvenanceSection({
  sources,
  fileLinks,
  authorSummary,
  reviewSnapshots,
  commits,
}) {
  return `<section class="notes-provenance panel" aria-labelledby="provenance-title">
    <div class="notes-provenance__head">
      <p class="section-label">Provenance</p>
      <h2 id="provenance-title">Sources, authors, reviewers, and versions</h2>
      <p class="notes-provenance__lead">This section is generated from the note frontmatter and the Git history recorded in GitHub.</p>
    </div>
    <div class="notes-provenance__grid">
      <section class="notes-provenance__section" aria-labelledby="provenance-sources-title">
        <h3 id="provenance-sources-title">Sources</h3>
        ${renderSourceEntries(sources)}
      </section>
      <section class="notes-provenance__section" aria-labelledby="provenance-files-title">
        <h3 id="provenance-files-title">GitHub files</h3>
        ${renderGitFileLinks(fileLinks)}
      </section>
      <section class="notes-provenance__section" aria-labelledby="provenance-authors-title">
        <h3 id="provenance-authors-title">Author history</h3>
        ${renderAuthorHistory(authorSummary)}
      </section>
      <section class="notes-provenance__section" aria-labelledby="provenance-reviewers-title">
        <h3 id="provenance-reviewers-title">Reviewer history</h3>
        ${renderReviewHistory(reviewSnapshots)}
      </section>
      <section class="notes-provenance__section notes-provenance__section--wide" aria-labelledby="provenance-versions-title">
        <h3 id="provenance-versions-title">Version history</h3>
        ${renderVersionHistory(commits)}
      </section>
    </div>
  </section>`;
}

function getNoteOutputDir(notePath) {
  return path.join(notesRoot, getNoteRoutePath(notePath));
}

function getPracticeSourcePath(notePath) {
  return getNoteSourcePath(notePath).replace(/\.md$/i, '-problems.md');
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

function createDemoLabel(label, valueId, valueText = '') {
  const valueMarkup = valueId
    ? `<output id="${escapeHtml(valueId)}">${escapeHtml(valueText)}</output>`
    : escapeHtml(valueText);

  return `<span class="interactive-demo__control-label">${escapeHtml(label)} ${valueMarkup}</span>`;
}

function createRangeControl({
  id,
  label,
  min,
  max,
  step,
  value,
  unit = '',
}) {
  const unitSuffix = unit ? ` ${escapeHtml(unit)}` : '';
  const valueId = `${id}-value`;

  return `<label class="interactive-demo__control" for="${escapeHtml(id)}">
    ${createDemoLabel(label, valueId, `${value}${unitSuffix}`)}
    <input id="${escapeHtml(id)}" type="range" min="${escapeHtml(String(min))}" max="${escapeHtml(String(max))}" step="${escapeHtml(String(step))}" value="${escapeHtml(String(value))}" />
  </label>`;
}

function createSelectControl({
  id,
  label,
  options,
  value,
}) {
  const valueId = `${id}-value`;
  const optionHtml = options.map((option) => {
    const optionValue = typeof option === 'object' ? option.value : option;
    const optionLabel = typeof option === 'object' ? option.label : option;
    const selected = String(optionValue) === String(value) ? ' selected' : '';
    return `<option value="${escapeHtml(String(optionValue))}"${selected}>${escapeHtml(String(optionLabel))}</option>`;
  }).join('');

  return `<label class="interactive-demo__control" for="${escapeHtml(id)}">
    ${createDemoLabel(label, valueId, String(value))}
    <select id="${escapeHtml(id)}">
      ${optionHtml}
    </select>
  </label>`;
}

function createToggleButton({ id, label, value, checked = false }) {
  return `<button
    type="button"
    class="interactive-demo__toggle${checked ? ' is-active' : ''}"
    id="${escapeHtml(id)}"
    data-toggle-value="${escapeHtml(String(value))}"
    aria-pressed="${checked ? 'true' : 'false'}"
  >${escapeHtml(label)}</button>`;
}

function createMetric({ id, label, value }) {
  return `<div class="interactive-demo__metric">
    <span class="interactive-demo__metric-label">${escapeHtml(label)}</span>
    <span class="interactive-demo__metric-value" id="${escapeHtml(id)}">${escapeHtml(value)}</span>
  </div>`;
}

function createDemoSection({
  slug,
  title,
  summary,
  kind,
  controlsHtml,
  figureHtml,
  metricsHtml = '',
  noteHtml = '',
}) {
  return `<section class="interactive-demo panel" data-math-demo="${escapeHtml(kind)}" data-math-demo-id="${escapeHtml(slug)}">
    <div class="interactive-demo__head">
      <p class="section-label">Interactive visual</p>
      <h2 class="interactive-demo__title">${escapeHtml(title)}</h2>
      <p class="interactive-demo__summary">${escapeHtml(summary)}</p>
    </div>
    <div class="interactive-demo__body">
      <div class="interactive-demo__controls" role="group" aria-label="${escapeHtml(title)} controls">
        ${controlsHtml}
      </div>
      <div class="interactive-demo__figure">
        ${metricsHtml ? `<div class="interactive-demo__readouts">${metricsHtml}</div>` : ''}
        ${figureHtml}
        ${noteHtml ? `<p class="interactive-demo__note">${escapeHtml(noteHtml)}</p>` : ''}
      </div>
    </div>
  </section>`;
}

function buildMathInteractiveDemo(note) {
  if (!note || note.structureId !== 'math') {
    return '';
  }

  const slug = getNoteSlug(note.path);
  const id = `math-demo-${slug}`;

  switch (slug) {
    case 'arithmetic':
      return createDemoSection({
        slug,
        kind: 'arithmetic',
        title: 'Number line moves',
        summary: 'Change a starting value and a step to see addition and subtraction as movement on a number line.',
        controlsHtml: [
          createRangeControl({ id: `${id}-start`, label: 'Start value', min: -10, max: 10, step: 1, value: 2 }),
          createRangeControl({ id: `${id}-step`, label: 'Step size', min: -10, max: 10, step: 1, value: 4 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-equation`, label: 'Update', value: '2 + 4 = 6' }),
          createMetric({ id: `${id}-distance`, label: 'Distance from zero', value: '6' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 220" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Animated number line</title>
          <desc id="${escapeHtml(id)}-desc">A number line with a movable start point and step size.</desc>
          <g id="${escapeHtml(id)}-grid" stroke="var(--border)" stroke-width="1" opacity="0.95"></g>
          <line x1="50" y1="110" x2="750" y2="110" stroke="var(--accent-strong)" stroke-width="2" />
          <g id="${escapeHtml(id)}-ticks" stroke="var(--muted)" stroke-width="1"></g>
          <circle id="${escapeHtml(id)}-start-point" cx="0" cy="110" r="9" fill="var(--pomodoro-short)" />
          <circle id="${escapeHtml(id)}-end-point" cx="0" cy="110" r="9" fill="var(--accent-strong)" />
          <line id="${escapeHtml(id)}-arrow" x1="0" y1="110" x2="0" y2="110" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" />
          <text id="${escapeHtml(id)}-start-label" x="0" y="140" fill="var(--text)" font-size="18" text-anchor="middle"></text>
          <text id="${escapeHtml(id)}-end-label" x="0" y="78" fill="var(--text)" font-size="18" text-anchor="middle"></text>
        </svg>`,
      });
    case 'logic':
      return createDemoSection({
        slug,
        kind: 'logic',
        title: 'Truth table explorer',
        summary: 'Switch the proposition values and connective to see how the truth table changes row by row.',
        controlsHtml: [
          `<div class="interactive-demo__control">
            ${createDemoLabel('Connective', `${id}-connective-value`, 'and')}
            <select id="${escapeHtml(id)}-connective">
              <option value="and">and</option>
              <option value="or">or</option>
              <option value="implies">implies</option>
              <option value="iff">iff</option>
            </select>
          </div>`,
          `<div class="interactive-demo__control">
            <span class="interactive-demo__control-label">Inputs</span>
            <div class="interactive-demo__toggle-row">
              ${createToggleButton({ id: `${id}-p`, label: 'P', value: 'true', checked: true })}
              ${createToggleButton({ id: `${id}-q`, label: 'Q', value: 'true', checked: false })}
            </div>
          </div>`,
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-statement`, label: 'Statement', value: 'P and Q' }),
          createMetric({ id: `${id}-result`, label: 'Result', value: 'false' }),
        ].join(''),
        figureHtml: `<table class="interactive-demo__table" aria-label="Truth table">
          <thead>
            <tr><th>P</th><th>Q</th><th>Value</th><th>Row</th></tr>
          </thead>
          <tbody>
            <tr data-row="tt-ff"><td>F</td><td>F</td><td id="${escapeHtml(id)}-row-ff">F</td><td>1</td></tr>
            <tr data-row="tt-ft"><td>F</td><td>T</td><td id="${escapeHtml(id)}-row-ft">F</td><td>2</td></tr>
            <tr data-row="tt-tf"><td>T</td><td>F</td><td id="${escapeHtml(id)}-row-tf">F</td><td>3</td></tr>
            <tr data-row="tt-tt"><td>T</td><td>T</td><td id="${escapeHtml(id)}-row-tt">T</td><td>4</td></tr>
          </tbody>
        </table>`,
        noteHtml: 'The highlighted row shows the current input combination and output.',
      });
    case 'geometry':
      return createDemoSection({
        slug,
        kind: 'geometry',
        title: 'Triangle angle and area',
        summary: 'Adjust an included angle and the two side lengths to see how triangle area and the third side respond.',
        controlsHtml: [
          createRangeControl({ id: `${id}-side-a`, label: 'Side a', min: 2, max: 12, step: 0.5, value: 7 }),
          createRangeControl({ id: `${id}-side-b`, label: 'Side b', min: 2, max: 12, step: 0.5, value: 8 }),
          createRangeControl({ id: `${id}-angle-c`, label: 'Included angle (deg)', min: 20, max: 140, step: 1, value: 62 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-area`, label: 'Area', value: '0' }),
          createMetric({ id: `${id}-side-c`, label: 'Third side', value: '0' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Triangle visualizer</title>
          <desc id="${escapeHtml(id)}-desc">A triangle whose shape changes with the included angle and side lengths.</desc>
          <g id="${escapeHtml(id)}-tri-grid" stroke="var(--border)" stroke-width="1" opacity="0.7"></g>
          <polygon id="${escapeHtml(id)}-triangle" points="" fill="rgba(255,255,255,0.06)" stroke="var(--accent-strong)" stroke-width="3" />
          <circle id="${escapeHtml(id)}-vertex-a" cx="0" cy="0" r="5" fill="var(--pomodoro-short)" />
          <circle id="${escapeHtml(id)}-vertex-b" cx="0" cy="0" r="5" fill="var(--pomodoro-short)" />
          <circle id="${escapeHtml(id)}-vertex-c" cx="0" cy="0" r="5" fill="var(--pomodoro-long)" />
          <text id="${escapeHtml(id)}-labels" x="20" y="300" fill="var(--text)" font-size="18"></text>
        </svg>`,
      });
    case 'algebra':
      return createDemoSection({
        slug,
        kind: 'line-graph',
        title: 'Linear equation explorer',
        summary: 'Change slope and intercept to see how y = mx + b shifts and tilts on the coordinate plane.',
        controlsHtml: [
          createRangeControl({ id: `${id}-slope`, label: 'Slope m', min: -4, max: 4, step: 0.1, value: 1.4 }),
          createRangeControl({ id: `${id}-intercept`, label: 'Intercept b', min: -5, max: 5, step: 0.5, value: -1 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-equation`, label: 'Equation', value: 'y = 1.4x - 1.0' }),
          createMetric({ id: `${id}-intercepts`, label: 'Intercepts', value: 'x = 0.7, y = -1.0' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Linear graph</title>
          <desc id="${escapeHtml(id)}-desc">A line that updates as the slope and intercept change.</desc>
          <g id="${escapeHtml(id)}-axes" stroke="var(--border)" stroke-width="1"></g>
          <path id="${escapeHtml(id)}-line" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
          <circle id="${escapeHtml(id)}-y-intercept" cx="0" cy="0" r="6" fill="var(--pomodoro-short)" />
          <circle id="${escapeHtml(id)}-x-intercept" cx="0" cy="0" r="6" fill="var(--pomodoro-long)" />
        </svg>`,
      });
    case 'functions':
      return createDemoSection({
        slug,
        kind: 'function-family',
        title: 'Function family transformer',
        summary: 'Choose a function family and shift, stretch, or lift it to see how the graph changes.',
        controlsHtml: [
          createSelectControl({
            id: `${id}-family`,
            label: 'Family',
            value: 'quadratic',
            options: [
              { value: 'linear', label: 'Linear' },
              { value: 'quadratic', label: 'Quadratic' },
              { value: 'absolute', label: 'Absolute value' },
              { value: 'rational', label: 'Rational' },
              { value: 'exponential', label: 'Exponential' },
            ],
          }),
          createRangeControl({ id: `${id}-stretch`, label: 'Vertical scale a', min: -3, max: 3, step: 0.1, value: 1.2 }),
          createRangeControl({ id: `${id}-shift-x`, label: 'Horizontal shift h', min: -4, max: 4, step: 0.5, value: 1 }),
          createRangeControl({ id: `${id}-shift-y`, label: 'Vertical shift k', min: -4, max: 4, step: 0.5, value: 0 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-formula`, label: 'Current form', value: 'y = 1.2 f(x - 1.0) + 0.0' }),
          createMetric({ id: `${id}-domain`, label: 'Domain note', value: 'All real numbers' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Function family graph</title>
          <desc id="${escapeHtml(id)}-desc">A transformed function graph with selectable families and sliders for scale and shift.</desc>
          <g id="${escapeHtml(id)}-axes" stroke="var(--border)" stroke-width="1"></g>
          <path id="${escapeHtml(id)}-base-path" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2" stroke-dasharray="8 6" />
          <path id="${escapeHtml(id)}-active-path" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
        </svg>`,
      });
    case 'probability':
      return createDemoSection({
        slug,
        kind: 'probability',
        title: 'Binomial distribution',
        summary: 'Adjust the success probability and trial count to see how the distribution of outcomes changes.',
        controlsHtml: [
          createRangeControl({ id: `${id}-probability`, label: 'Success probability p', min: 0.1, max: 0.9, step: 0.05, value: 0.5 }),
          createRangeControl({ id: `${id}-trials`, label: 'Trials n', min: 1, max: 12, step: 1, value: 6 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-expected`, label: 'Expected value', value: '3.0' }),
          createMetric({ id: `${id}-variance`, label: 'Variance', value: '1.5' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Probability bars</title>
          <desc id="${escapeHtml(id)}-desc">A bar chart showing the distribution of success counts.</desc>
          <g id="${escapeHtml(id)}-bars" fill="var(--accent-strong)"></g>
          <g id="${escapeHtml(id)}-axis" stroke="var(--border)" stroke-width="1"></g>
        </svg>`,
      });
    case 'statistics':
      return createDemoSection({
        slug,
        kind: 'statistics',
        title: 'Dot plot and summary',
        summary: 'Move five sample points to see how the mean, median, and spread respond to the data.',
        controlsHtml: [
          createRangeControl({ id: `${id}-x1`, label: 'Data point 1', min: 0, max: 100, step: 1, value: 18 }),
          createRangeControl({ id: `${id}-x2`, label: 'Data point 2', min: 0, max: 100, step: 1, value: 32 }),
          createRangeControl({ id: `${id}-x3`, label: 'Data point 3', min: 0, max: 100, step: 1, value: 54 }),
          createRangeControl({ id: `${id}-x4`, label: 'Data point 4', min: 0, max: 100, step: 1, value: 68 }),
          createRangeControl({ id: `${id}-x5`, label: 'Data point 5', min: 0, max: 100, step: 1, value: 86 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-mean`, label: 'Mean', value: '51.6' }),
          createMetric({ id: `${id}-median`, label: 'Median', value: '54' }),
          createMetric({ id: `${id}-range`, label: 'Range', value: '68' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Dot plot</title>
          <desc id="${escapeHtml(id)}-desc">A dot plot of five data values on a number line.</desc>
          <g id="${escapeHtml(id)}-axis" stroke="var(--border)" stroke-width="1"></g>
          <g id="${escapeHtml(id)}-ticks" stroke="var(--muted)" stroke-width="1"></g>
          <g id="${escapeHtml(id)}-points"></g>
          <line id="${escapeHtml(id)}-mean-line" x1="0" y1="40" x2="0" y2="280" stroke="var(--pomodoro-long)" stroke-width="3" stroke-dasharray="8 6" />
        </svg>`,
      });
    case 'trigonometry':
      return createDemoSection({
        slug,
        kind: 'trig',
        title: 'Unit circle and wave',
        summary: 'Move the angle around the unit circle to watch sine and cosine update together.',
        controlsHtml: [
          createRangeControl({ id: `${id}-angle`, label: 'Angle', min: 0, max: 360, step: 1, value: 30 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-sin`, label: 'sin(theta)', value: '0.500' }),
          createMetric({ id: `${id}-cos`, label: 'cos(theta)', value: '0.866' }),
          createMetric({ id: `${id}-tan`, label: 'tan(theta)', value: '0.577' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Unit circle and sine wave</title>
          <desc id="${escapeHtml(id)}-desc">The unit circle on the left and a sine wave on the right.</desc>
          <circle id="${escapeHtml(id)}-circle" cx="170" cy="160" r="110" fill="none" stroke="var(--border)" stroke-width="2" />
          <line id="${escapeHtml(id)}-circle-x" x1="60" y1="160" x2="280" y2="160" stroke="var(--border)" stroke-width="1" />
          <line id="${escapeHtml(id)}-circle-y" x1="170" y1="50" x2="170" y2="270" stroke="var(--border)" stroke-width="1" />
          <line id="${escapeHtml(id)}-radius" x1="170" y1="160" x2="170" y2="160" stroke="var(--accent-strong)" stroke-width="4" />
          <circle id="${escapeHtml(id)}-point" cx="170" cy="160" r="7" fill="var(--pomodoro-short)" />
          <path id="${escapeHtml(id)}-wave" fill="none" stroke="var(--pomodoro-long)" stroke-width="3" />
          <line id="${escapeHtml(id)}-wave-marker" x1="0" y1="0" x2="0" y2="0" stroke="var(--accent-strong)" stroke-width="3" />
        </svg>`,
      });
    case 'limits':
      return createDemoSection({
        slug,
        kind: 'limit',
        title: 'Approaching a limit',
        summary: 'Move the removable discontinuity to see how the function approaches the same value from both sides.',
        controlsHtml: [
          createRangeControl({ id: `${id}-a`, label: 'Hole position a', min: -4, max: 4, step: 0.5, value: 1 }),
          createRangeControl({ id: `${id}-probe`, label: 'Probe offset', min: 0.1, max: 2, step: 0.1, value: 0.6 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-limit`, label: 'Limit', value: '2.0' }),
          createMetric({ id: `${id}-left-right`, label: 'Left/right values', value: 'approach the same height' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Limit graph</title>
          <desc id="${escapeHtml(id)}-desc">A graph with a hole and probe points that move toward the limit.</desc>
          <g id="${escapeHtml(id)}-axes" stroke="var(--border)" stroke-width="1"></g>
          <path id="${escapeHtml(id)}-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
          <circle id="${escapeHtml(id)}-hole" cx="0" cy="0" r="7" fill="var(--panel)" stroke="var(--pomodoro-short)" stroke-width="3" />
          <circle id="${escapeHtml(id)}-left-probe" cx="0" cy="0" r="6" fill="var(--pomodoro-long)" />
          <circle id="${escapeHtml(id)}-right-probe" cx="0" cy="0" r="6" fill="var(--pomodoro-short)" />
        </svg>`,
      });
    case 'derivatives':
      return createDemoSection({
        slug,
        kind: 'derivative',
        title: 'Tangent line slope',
        summary: 'Move the tangent point to see the instantaneous slope on a cubic curve.',
        controlsHtml: [
          createRangeControl({ id: `${id}-x0`, label: 'Point x0', min: -3, max: 3, step: 0.1, value: 0.8 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-slope`, label: 'Slope', value: '0.92' }),
          createMetric({ id: `${id}-derivative`, label: 'Derivative', value: "f'(x0)" }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Derivative graph</title>
          <desc id="${escapeHtml(id)}-desc">A curve with a tangent line at the selected point.</desc>
          <g id="${escapeHtml(id)}-axes" stroke="var(--border)" stroke-width="1"></g>
          <path id="${escapeHtml(id)}-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
          <line id="${escapeHtml(id)}-tangent" x1="0" y1="0" x2="0" y2="0" stroke="var(--pomodoro-long)" stroke-width="3" />
          <circle id="${escapeHtml(id)}-touch-point" cx="0" cy="0" r="7" fill="var(--pomodoro-short)" />
        </svg>`,
      });
    case 'integrals':
      return createDemoSection({
        slug,
        kind: 'integral',
        title: 'Area under a curve',
        summary: 'Move the bounds to see how the accumulated area changes between two x-values.',
        controlsHtml: [
          createRangeControl({ id: `${id}-left`, label: 'Left bound a', min: -3, max: 1, step: 0.1, value: -1.2 }),
          createRangeControl({ id: `${id}-right`, label: 'Right bound b', min: -1, max: 3, step: 0.1, value: 1.8 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-area`, label: 'Area', value: '0.00' }),
          createMetric({ id: `${id}-estimate`, label: 'Riemann estimate', value: '0.00' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Integral area graph</title>
          <desc id="${escapeHtml(id)}-desc">A curve with shaded area and Riemann rectangles between two bounds.</desc>
          <g id="${escapeHtml(id)}-axes" stroke="var(--border)" stroke-width="1"></g>
          <path id="${escapeHtml(id)}-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
          <path id="${escapeHtml(id)}-area-path" fill="rgba(255,255,255,0.08)" stroke="none" />
          <g id="${escapeHtml(id)}-rectangles"></g>
        </svg>`,
      });
    case 'series':
      return createDemoSection({
        slug,
        kind: 'series',
        title: 'Geometric partial sums',
        summary: 'Adjust the ratio and term count to see how a geometric series approaches its limit.',
        controlsHtml: [
          createRangeControl({ id: `${id}-ratio`, label: 'Ratio r', min: 0.1, max: 0.9, step: 0.05, value: 0.5 }),
          createRangeControl({ id: `${id}-terms`, label: 'Terms n', min: 1, max: 12, step: 1, value: 6 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-partial-sum`, label: 'Partial sum', value: '1.969' }),
          createMetric({ id: `${id}-limit`, label: 'Limit', value: '2.000' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Partial sums</title>
          <desc id="${escapeHtml(id)}-desc">A sequence of partial sums approaching a horizontal limit.</desc>
          <g id="${escapeHtml(id)}-axes" stroke="var(--border)" stroke-width="1"></g>
          <path id="${escapeHtml(id)}-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
          <line id="${escapeHtml(id)}-limit-line" x1="40" y1="0" x2="760" y2="0" stroke="var(--pomodoro-long)" stroke-width="3" stroke-dasharray="8 6" />
          <g id="${escapeHtml(id)}-points"></g>
        </svg>`,
      });
    case 'vectors':
      return createDemoSection({
        slug,
        kind: 'vectors',
        title: 'Vector addition',
        summary: 'Change the x and y components of two vectors and watch the resultant update in real time.',
        controlsHtml: [
          createRangeControl({ id: `${id}-ax`, label: 'Vector A x', min: -8, max: 8, step: 1, value: 5 }),
          createRangeControl({ id: `${id}-ay`, label: 'Vector A y', min: -8, max: 8, step: 1, value: 3 }),
          createRangeControl({ id: `${id}-bx`, label: 'Vector B x', min: -8, max: 8, step: 1, value: -2 }),
          createRangeControl({ id: `${id}-by`, label: 'Vector B y', min: -8, max: 8, step: 1, value: 4 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-result`, label: 'Resultant', value: '(3, 7)' }),
          createMetric({ id: `${id}-magnitude`, label: 'Magnitude', value: '7.62' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Vector sum</title>
          <desc id="${escapeHtml(id)}-desc">Two component vectors and their resultant on a coordinate plane.</desc>
          <g id="${escapeHtml(id)}-axes" stroke="var(--border)" stroke-width="1"></g>
          <line id="${escapeHtml(id)}-vector-a" x1="400" y1="160" x2="400" y2="160" stroke="var(--pomodoro-short)" stroke-width="5" stroke-linecap="round" />
          <line id="${escapeHtml(id)}-vector-b" x1="400" y1="160" x2="400" y2="160" stroke="var(--pomodoro-long)" stroke-width="5" stroke-linecap="round" />
          <line id="${escapeHtml(id)}-vector-r" x1="400" y1="160" x2="400" y2="160" stroke="var(--accent-strong)" stroke-width="5" stroke-linecap="round" />
          <circle id="${escapeHtml(id)}-tip-a" cx="400" cy="160" r="7" fill="var(--pomodoro-short)" />
          <circle id="${escapeHtml(id)}-tip-b" cx="400" cy="160" r="7" fill="var(--pomodoro-long)" />
          <circle id="${escapeHtml(id)}-tip-r" cx="400" cy="160" r="7" fill="var(--accent-strong)" />
        </svg>`,
      });
    case 'matrices':
      return createDemoSection({
        slug,
        kind: 'matrix',
        title: 'Linear transformation',
        summary: 'Change the entries of a 2x2 matrix to see how it stretches and shears a grid.',
        controlsHtml: [
          createRangeControl({ id: `${id}-a`, label: 'a', min: -2, max: 2, step: 0.25, value: 1.25 }),
          createRangeControl({ id: `${id}-b`, label: 'b', min: -2, max: 2, step: 0.25, value: 0.5 }),
          createRangeControl({ id: `${id}-c`, label: 'c', min: -2, max: 2, step: 0.25, value: -0.25 }),
          createRangeControl({ id: `${id}-d`, label: 'd', min: -2, max: 2, step: 0.25, value: 1 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-det`, label: 'Determinant', value: '1.375' }),
          createMetric({ id: `${id}-trace`, label: 'Trace', value: '2.25' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Matrix transform</title>
          <desc id="${escapeHtml(id)}-desc">A square grid and transformed basis vectors.</desc>
          <g id="${escapeHtml(id)}-grid" stroke="var(--border)" stroke-width="1" opacity="0.8"></g>
          <path id="${escapeHtml(id)}-square" fill="rgba(255,255,255,0.06)" stroke="var(--accent-strong)" stroke-width="3" />
          <line id="${escapeHtml(id)}-basis-x" x1="400" y1="160" x2="400" y2="160" stroke="var(--pomodoro-short)" stroke-width="5" />
          <line id="${escapeHtml(id)}-basis-y" x1="400" y1="160" x2="400" y2="160" stroke="var(--pomodoro-long)" stroke-width="5" />
        </svg>`,
      });
    case 'eigenvalues':
      return createDemoSection({
        slug,
        kind: 'eigenvalues',
        title: 'Eigenvector directions',
        summary: 'Use a symmetric matrix so the real eigenvectors stay visible as the transformation changes.',
        controlsHtml: [
          createRangeControl({ id: `${id}-a`, label: 'a', min: -2, max: 2, step: 0.25, value: 1.5 }),
          createRangeControl({ id: `${id}-b`, label: 'b', min: -2, max: 2, step: 0.25, value: 0.75 }),
          createRangeControl({ id: `${id}-d`, label: 'd', min: -2, max: 2, step: 0.25, value: 0.25 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-lambda1`, label: 'Eigenvalue 1', value: '1.87' }),
          createMetric({ id: `${id}-lambda2`, label: 'Eigenvalue 2', value: '-0.12' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Eigenvectors</title>
          <desc id="${escapeHtml(id)}-desc">A transformed grid with eigenvector directions highlighted.</desc>
          <g id="${escapeHtml(id)}-grid" stroke="var(--border)" stroke-width="1" opacity="0.8"></g>
          <path id="${escapeHtml(id)}-ellipse" fill="rgba(255,255,255,0.06)" stroke="var(--accent-strong)" stroke-width="3" />
          <line id="${escapeHtml(id)}-evec-1" x1="400" y1="160" x2="400" y2="160" stroke="var(--pomodoro-short)" stroke-width="4" />
          <line id="${escapeHtml(id)}-evec-2" x1="400" y1="160" x2="400" y2="160" stroke="var(--pomodoro-long)" stroke-width="4" />
        </svg>`,
      });
    case 'discrete-math':
      return createDemoSection({
        slug,
        kind: 'recursion-tree',
        title: 'Counting paths in a tree',
        summary: 'Adjust the depth and branching factor to see how recursion and the product rule grow the number of outcomes.',
        controlsHtml: [
          createRangeControl({ id: `${id}-depth`, label: 'Depth', min: 1, max: 6, step: 1, value: 4 }),
          createSelectControl({
            id: `${id}-branching`,
            label: 'Branches',
            value: '2',
            options: [
              { value: '2', label: '2 branches' },
              { value: '3', label: '3 branches' },
              { value: '4', label: '4 branches' },
            ],
          }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-leaves`, label: 'Leaves', value: '16' }),
          createMetric({ id: `${id}-formula`, label: 'Count', value: '2^4' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Recursion tree</title>
          <desc id="${escapeHtml(id)}-desc">A tree that expands by a chosen branching factor and depth.</desc>
          <g id="${escapeHtml(id)}-links" stroke="var(--border)" stroke-width="2"></g>
          <g id="${escapeHtml(id)}-nodes" fill="var(--accent-strong)"></g>
        </svg>`,
      });
    case 'modeling':
      return createDemoSection({
        slug,
        kind: 'growth-model',
        title: 'Growth model',
        summary: 'Adjust the initial value and growth rate to see how a simple model changes over time.',
        controlsHtml: [
          createRangeControl({ id: `${id}-initial`, label: 'Initial value', min: 1, max: 20, step: 1, value: 5 }),
          createRangeControl({ id: `${id}-rate`, label: 'Growth rate', min: -0.2, max: 0.4, step: 0.01, value: 0.08 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-year-5`, label: 'Value at t = 5', value: '7.35' }),
          createMetric({ id: `${id}-trend`, label: 'Trend', value: 'growth' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Model growth curve</title>
          <desc id="${escapeHtml(id)}-desc">A growth or decay curve with sample points.</desc>
          <g id="${escapeHtml(id)}-axes" stroke="var(--border)" stroke-width="1"></g>
          <path id="${escapeHtml(id)}-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
          <g id="${escapeHtml(id)}-points"></g>
        </svg>`,
      });
    case 'first-order-odes':
      return createDemoSection({
        slug,
        kind: 'slope-field',
        title: 'Slope field and solution',
        summary: 'Move the initial value to see how the solution curve follows the same slope field.',
        controlsHtml: [
          createRangeControl({ id: `${id}-equilibrium`, label: 'Equilibrium level', min: -3, max: 3, step: 0.5, value: 1 }),
          createRangeControl({ id: `${id}-initial`, label: 'Initial value', min: -4, max: 4, step: 0.5, value: -1 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-solution`, label: 'Solution', value: 'y(t) = 1 + Ce^-t' }),
          createMetric({ id: `${id}-level`, label: 'Target level', value: '1.0' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Slope field</title>
          <desc id="${escapeHtml(id)}-desc">A slope field with a solution curve through the selected initial value.</desc>
          <g id="${escapeHtml(id)}-field" stroke="var(--border)" stroke-width="2" stroke-linecap="round"></g>
          <path id="${escapeHtml(id)}-solution-path" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
          <circle id="${escapeHtml(id)}-initial-point" cx="0" cy="0" r="7" fill="var(--pomodoro-short)" />
        </svg>`,
      });
    case 'second-order-odes':
      return createDemoSection({
        slug,
        kind: 'oscillator',
        title: 'Damped oscillator',
        summary: 'Tweak damping and frequency to see how the oscillation fades and tightens over time.',
        controlsHtml: [
          createRangeControl({ id: `${id}-damping`, label: 'Damping', min: 0, max: 1, step: 0.05, value: 0.18 }),
          createRangeControl({ id: `${id}-frequency`, label: 'Frequency', min: 0.5, max: 4, step: 0.1, value: 2 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-period`, label: 'Period', value: '3.14' }),
          createMetric({ id: `${id}-decay`, label: 'Decay', value: 'slow' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Oscillator</title>
          <desc id="${escapeHtml(id)}-desc">A damped oscillation plotted over time.</desc>
          <g id="${escapeHtml(id)}-axes" stroke="var(--border)" stroke-width="1"></g>
          <path id="${escapeHtml(id)}-oscillation" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
          <path id="${escapeHtml(id)}-envelope" fill="none" stroke="var(--pomodoro-long)" stroke-width="2" stroke-dasharray="6 6" />
        </svg>`,
      });
    case 'systems-of-odes':
      return createDemoSection({
        slug,
        kind: 'phase-portrait',
        title: 'Phase portrait',
        summary: 'Adjust the linear system to see trajectories spiral, settle, or diverge in the xy-plane.',
        controlsHtml: [
          createRangeControl({ id: `${id}-alpha`, label: 'Growth term', min: -1, max: 1, step: 0.05, value: 0.2 }),
          createRangeControl({ id: `${id}-beta`, label: 'Rotation term', min: -2, max: 2, step: 0.05, value: 1 }),
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-stability`, label: 'Stability', value: 'spiral source' }),
          createMetric({ id: `${id}-start`, label: 'Initial point', value: '(1, -0.5)' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 320" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Phase portrait</title>
          <desc id="${escapeHtml(id)}-desc">A vector field and trajectory in the phase plane.</desc>
          <g id="${escapeHtml(id)}-field" stroke="var(--border)" stroke-width="2" stroke-linecap="round"></g>
          <path id="${escapeHtml(id)}-trajectory" fill="none" stroke="var(--accent-strong)" stroke-width="4" />
          <circle id="${escapeHtml(id)}-phase-point" cx="0" cy="0" r="7" fill="var(--pomodoro-short)" />
        </svg>`,
      });
    case 'proof-writing':
      return createDemoSection({
        slug,
        kind: 'proof-strategy',
        title: 'Proof strategy map',
        summary: 'Choose a proof strategy and watch the same claim reorganize into a different reasoning path.',
        controlsHtml: [
          `<div class="interactive-demo__control">
            ${createDemoLabel('Strategy', `${id}-strategy-value`, 'direct')}
            <div class="interactive-demo__toggle-row">
              ${createToggleButton({ id: `${id}-direct`, label: 'Direct', value: 'direct', checked: true })}
              ${createToggleButton({ id: `${id}-contrapositive`, label: 'Contrapositive', value: 'contrapositive' })}
              ${createToggleButton({ id: `${id}-contradiction`, label: 'Contradiction', value: 'contradiction' })}
              ${createToggleButton({ id: `${id}-cases`, label: 'Cases', value: 'cases' })}
            </div>
          </div>`,
        ].join(''),
        metricsHtml: [
          createMetric({ id: `${id}-goal`, label: 'Claim', value: 'If n is even, then n^2 is even' }),
          createMetric({ id: `${id}-hint`, label: 'First step', value: 'Write n = 2k' }),
        ].join(''),
        figureHtml: `<svg class="interactive-demo__svg" viewBox="0 0 800 260" role="img" aria-labelledby="${escapeHtml(id)}-title ${escapeHtml(id)}-desc">
          <title id="${escapeHtml(id)}-title">Proof flow</title>
          <desc id="${escapeHtml(id)}-desc">A simple proof flowchart showing how the reasoning path changes with strategy.</desc>
          <g id="${escapeHtml(id)}-nodes"></g>
          <g id="${escapeHtml(id)}-links" stroke="var(--border)" stroke-width="3"></g>
        </svg>`,
        noteHtml: 'The highlighted path shows the reasoning order that matches the chosen strategy.',
      });
    default:
      return '';
  }
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
  const actions = [
    `<button class="notes-action-chip notes-action-chip--search" type="button" data-search-trigger aria-expanded="false" aria-controls="search-panel" data-notes-nav-item>
      Search notes
    </button>`,
  ];

  if (practiceUrl) {
    actions.push(`<a class="notes-action-chip notes-action-chip--practice" href="${escapeHtml(practiceUrl)}" data-notes-nav-item>Practice</a>`);
  }

  if (backToNoteUrl) {
    actions.push(`<a class="notes-action-chip" href="${escapeHtml(backToNoteUrl)}" data-notes-nav-item>Back to note</a>`);
  }

  return actions.join('');
}

function renderFloatingActions(quickActionsHtml) {
  return `<div class="notes-quick-actions notes-quick-actions--floating" role="group" aria-label="Quick actions">${quickActionsHtml}<a class="notes-action-chip notes-action-chip--back-to-top" href="#top" aria-label="Back to top" data-notes-nav-item>Back to top</a></div>`;
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
  interactiveDemoHtml = '',
  canonicalUrl,
  editUrl,
  structures,
  structure,
  notePath,
  outputDir,
  assetVersions,
  practiceUrl = null,
  metadataLabel,
  provenance,
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
          ${renderMetadataLine(metadataLabel, 'viewer-meta')}
        </div>
      <div class="viewer-head__actions">
          <a class="suggest-edit-link notes-action-chip" href="${escapeHtml(editUrl)}" target="_blank" rel="noreferrer" data-notes-nav-item>Suggest edit</a>
          ${practiceUrl ? `<a class="notes-action-chip notes-action-chip--practice" href="${escapeHtml(practiceUrl)}" data-notes-nav-item>Practice</a>` : ''}
        </div>
      </div>
      <article class="markdown-body" id="note-content">
        ${tocHtml}
        ${interactiveDemoHtml}
        ${bodyHtml}
      </article>
      ${renderProvenanceSection(provenance)}
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

function isPracticeFrontmatterStart(lines, index) {
  if (lines[index]?.trim() !== '---') {
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

    if (!isPracticeFrontmatterStart(lines, index)) {
      throw new Error(`Unexpected content before a problem block in ${sourcePath} on line ${index + 1}.`);
    }

    const frontmatterLines = [];
    index += 1;

    while (index < lines.length && lines[index].trim() !== '---') {
      frontmatterLines.push(lines[index]);
      index += 1;
    }

    if (index >= lines.length) {
      throw new Error(`Missing closing frontmatter delimiter in ${sourcePath}.`);
    }

    const metadata = parseFrontmatter(frontmatterLines.join('\n'));
    index += 1;

    const bodyLines = [];

    while (index < lines.length && !isPracticeFrontmatterStart(lines, index)) {
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

function renderPracticeProblem(problem, practiceSourcePath, notePath) {
  const promptHtml = renderBlocks(problem.promptMarkdown, practiceSourcePath);
  const solutionHtml = problem.solutionMarkdown
    ? renderBlocks(problem.solutionMarkdown, practiceSourcePath)
    : '<p class="practice-problem__solution-empty">No solution provided.</p>';
  const skills = renderPracticeSkills(notePath, problem.skills);
  const tolerance = problem.tolerance === undefined || problem.tolerance === null || String(problem.tolerance).trim() === ''
    ? ''
    : String(problem.tolerance).trim();
  const unit = problem.unit === undefined || problem.unit === null ? '' : String(problem.unit).trim();
  const type = problem.type === undefined || problem.type === null || String(problem.type).trim() === ''
    ? ''
    : String(problem.type).trim();
  const metadataBits = [
    skills ? `<span class="practice-problem__uses"><span class="practice-problem__skills">${skills}</span></span>` : null,
    unit ? `<span>Unit ${escapeHtml(unit)}</span>` : null,
  ].filter(Boolean).join(' | ');

  return `<article class="practice-problem panel" id="${escapeHtml(problem.id)}" data-practice-problem${type ? ` data-problem-type="${escapeHtml(type)}"` : ''}${problem.answer ? ` data-problem-answer="${escapeHtml(String(problem.answer).trim())}"` : ''}${tolerance ? ` data-problem-tolerance="${escapeHtml(tolerance)}"` : ''}${unit ? ` data-problem-unit="${escapeHtml(unit)}"` : ''}>
      <div class="practice-problem__head">
        <div>
          <h2 class="practice-problem__title"><span class="practice-problem__number">${escapeHtml(`${String(problem.level).trim()}.${String(problem.position).trim()}`)}</span><span class="practice-problem__title-text">${escapeHtml(problem.title)}</span></h2>
          <p class="practice-problem__meta">${metadataBits}</p>
        </div>
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
  noteMetadata,
  editUrl,
  notePath,
  practiceSourcePath,
  structures,
  structure,
  outputDir,
  assetVersions,
  problems,
  provenance,
}) {
  const stylesheetHref = `${getRelativeNotesAssetHref(outputDir, 'notes.css')}?v=${assetVersions.notesCss}`;
  const scriptHref = `${getRelativeNotesAssetHref(outputDir, 'notes.js')}?v=${assetVersions.notesJs}`;
  const problemGroups = groupPracticeProblems(problems);
  const problemHtml = problemGroups.map((group) => {
    const levelProblemHtml = group.items.map(({ problem }) => {
      return renderPracticeProblem(problem, practiceSourcePath, notePath);
    }).join('');

    return `<section class="practice-level panel" aria-labelledby="practice-level-${group.level}">
        <div class="practice-level__head">
          <p class="section-label">Level ${escapeHtml(String(group.level))}</p>
          <h2 id="practice-level-${escapeHtml(String(group.level))}">${escapeHtml(group.label)}</h2>
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
          ${renderPracticeMetadataLine(noteMetadata)}
        </div>
        <div class="viewer-head__actions">
          <a class="suggest-edit-link notes-action-chip" href="${escapeHtml(editUrl)}" target="_blank" rel="noreferrer" data-notes-nav-item>Suggest edit</a>
          <a class="practice-back-link notes-action-chip" href="${escapeHtml(noteUrl)}" data-notes-nav-item>Back to note</a>
        </div>
      </div>
      <div class="practice-problem-list">
        ${problemHtml}
      </div>
      ${renderProvenanceSection(provenance)}
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
      throw new Error(`Practice file has no matching note: ${toPosix(path.relative(notesRoot, practiceSourcePath))}`);
    }

    const markdown = await fs.readFile(practiceSourcePath, 'utf8');
    const noteMarkdown = await fs.readFile(noteSourcePath, 'utf8');
    const { metadata: noteMetadata } = splitFrontmatter(noteMarkdown);
    const problems = parsePracticeProblems(markdown, practiceSourcePath, seenProblemIds);

    practiceByNotePath.set(note.path, {
      note,
      noteMetadata,
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

async function buildNotePage(note, urlPath, structures, assetVersions, practice = null) {
  const sourcePath = getNoteSourcePath(note.path);
  const markdown = await fs.readFile(sourcePath, 'utf8');
  const { metadata, body } = splitFrontmatter(markdown);
  const bodyWithoutManualToc = stripManualTableOfContents(body);
  const title = typeof metadata?.title === 'string' && metadata.title.trim()
    ? metadata.title.trim()
    : note.title;
  const metadataLabel = getMetadataLabel(metadata, note.path);
  const bodyForDisplay = stripLeadingTitleHeading(bodyWithoutManualToc, title);
  const summary = getSummary(bodyForDisplay) || title;
  const description = summary.length > 160 ? `${summary.slice(0, 157)}...` : summary;
  const canonicalUrl = `${siteOrigin}${urlPath}`;
  const editUrl = `https://github.com/Parell/parell.github.io/issues/new?template=correction.yml&page_path=${encodeURIComponent(toPosix(path.relative(repoRoot, sourcePath)))}&title=${encodeURIComponent(`[Correction]: ${title}`)}`;
  const provenanceHistory = await getGitFileHistory(toPosix(path.relative(repoRoot, sourcePath)));
  const bodyHtml = renderBlocks(bodyForDisplay, `notes/${note.path}`);
  const interactiveDemoHtml = buildMathInteractiveDemo(note);
  const pageHtml = buildNoteHtml({
    title,
    description,
    metadataLabel,
    bodyHtml,
    interactiveDemoHtml,
    canonicalUrl,
    editUrl,
    structures,
    structure: note.structure,
    notePath: note.path,
    practiceUrl: practice ? getPracticeUrl(note.path) : null,
    outputDir: getNoteOutputDir(note.path),
    assetVersions,
    provenance: {
      sources: metadata?.sources ?? [],
      fileLinks: [
        {
          label: 'Note source file',
          path: toPosix(path.relative(repoRoot, sourcePath)),
        },
      ],
      authorSummary: provenanceHistory.authorSummary,
      reviewSnapshots: provenanceHistory.reviewSnapshots,
      commits: provenanceHistory.commits,
    },
  });
  const outputPath = path.join(getNoteOutputDir(note.path), 'index.html');

  await ensureDir(outputPath);
  await fs.writeFile(outputPath, pageHtml, 'utf8');

  return {
    title,
    subject: note.structureTitle,
    url: urlPath,
    text: trimMarkdownText(`${title} ${bodyForDisplay}`),
  };
}

async function buildPracticePage(practice, structures, assetVersions) {
  const sourcePath = practice.sourcePath;
  const note = practice.note;
  const noteMetadata = practice.noteMetadata;
  const noteTitle = typeof noteMetadata?.title === 'string' && noteMetadata.title.trim()
    ? noteMetadata.title.trim()
    : note.title;
  const title = `${noteTitle} Practice`;
  const description = `${practice.problems.length} practice problem${practice.problems.length === 1 ? '' : 's'}`;
  const canonicalUrl = `${siteOrigin}${getPracticeUrl(note.path)}`;
  const relativeSourcePath = toPosix(path.relative(repoRoot, sourcePath));
  const editUrl = `https://github.com/Parell/parell.github.io/issues/new?template=correction.yml&page_path=${encodeURIComponent(relativeSourcePath)}&title=${encodeURIComponent(`[Correction]: ${title}`)}`;
  const practiceHistory = await getGitFileHistory(relativeSourcePath);
  const noteHistory = await getGitFileHistory(toPosix(path.relative(repoRoot, getNoteSourcePath(note.path))));
  const pageHtml = buildPracticeHtml({
    title,
    description,
    canonicalUrl,
    noteUrl: getNoteUrl(note.path),
    noteMetadata,
    editUrl,
    notePath: note.path,
    practiceSourcePath: sourcePath,
    structures,
    structure: note.structure,
    outputDir: getPracticeOutputDir(note.path),
    assetVersions,
    problems: practice.problems,
    provenance: {
      sources: noteMetadata?.sources ?? [],
      fileLinks: [
        {
          label: 'Practice source file',
          path: relativeSourcePath,
        },
        {
          label: 'Note source file',
          path: toPosix(path.relative(repoRoot, getNoteSourcePath(note.path))),
        },
      ],
      authorSummary: practiceHistory.authorSummary,
      reviewSnapshots: noteHistory.reviewSnapshots,
      commits: practiceHistory.commits,
    },
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

async function buildSearchIndex(entries) {
  const json = `${JSON.stringify(entries, null, 2)}\n`;
  await fs.writeFile(path.join(notesRoot, 'search-index.json'), json, 'utf8');
}

async function buildSitemap(noteUrls, practiceUrls) {
  const urls = [
    `${siteOrigin}/`,
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
    notesCss: await getAssetVersion(path.join(notesRoot, 'notes.css')),
    notesJs: await getAssetVersion(path.join(notesRoot, 'notes.js')),
  };

  await validateManifestCoverage(notes);

  const urls = notes.map((note) => getNoteUrl(note.path));
  const practiceByNotePath = await loadPracticeProblems(notes);
  const practiceUrls = [];
  const searchEntries = [];
  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index];
    const practice = practiceByNotePath.get(note.path);

    searchEntries.push(await buildNotePage(note, urls[index], manifest.structures, assetVersions, practice));

    if (practice) {
      const practicePage = await buildPracticePage(practice, manifest.structures, assetVersions);
      practiceUrls.push(practicePage.url);
    }
  }

  await removeStaleGeneratedPages(notes, practiceByNotePath);

  await buildLandingPage(manifest.structures);
  await buildSearchIndex(searchEntries);
  await buildSitemap(urls, practiceUrls);
}

await main();

