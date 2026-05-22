const structureContainer = document.getElementById('structure-buttons');
const guideTitleEl = document.getElementById('guide-tree-title');
const guidePanelNoteEl = document.getElementById('guide-panel-note');
const guideTreeEl = document.getElementById('guide-tree');
const titleEl = document.getElementById('current-title');
const metaEl = document.getElementById('current-meta');
const statusEl = document.getElementById('load-status');
const contentEl = document.getElementById('note-content');
const tocPanel = document.getElementById('toc-panel');
const tocList = document.getElementById('toc-list');
const suggestEditLink = document.getElementById('suggest-edit-link');
const notesLayout = document.querySelector('.notes-layout');
const searchTrigger = document.getElementById('search-trigger');
const searchPanel = document.getElementById('search-panel');
const searchCloseButton = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');
const searchStatusEl = document.getElementById('search-status');
const searchResultsEl = document.getElementById('search-results');
const storageKey = 'notes-page-state';
const manifestGlobalName = 'UES_GUIDE_MANIFEST';
const githubIssueBaseUrl = 'https://github.com/Parell/parell.github.io/issues/new';

let guideStructures = [];
let currentStructureId = null;
let currentPagePath = null;
let isRestoringScroll = false;
let saveScrollTimer = null;
let searchIndex = [];
let searchIndexPromise = null;
let searchIndexReady = false;
let searchIndexError = null;
let pendingSearchFocus = false;

function slugifyHeading(text) {
  const base = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['".,()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || 'section';
}

function titleCaseToken(token) {
  const lower = token.toLowerCase();

  if (/^\d+$/.test(lower)) {
    return lower;
  }

  if (['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'].includes(lower)) {
    return lower.toUpperCase();
  }

  if (lower === 'ode' || lower === 'odes') {
    return lower.toUpperCase();
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function titleFromSlug(slug) {
  const cleanSlug = String(slug ?? '').replace(/\.md$/i, '').replace(/\/+$/g, '');
  const numberedPageMatch = cleanSlug.match(/^(\d+)-(.*)$/);
  const levelMatch = cleanSlug.match(/^level-(\d+)-(.*)$/i);

  if (numberedPageMatch) {
    const [, pageNumber, remainder] = numberedPageMatch;
    const remainderTitle = remainder
      .split('-')
      .filter(Boolean)
      .map(titleCaseToken)
      .join(' ');

    return remainderTitle ? `${pageNumber} ${remainderTitle}` : pageNumber;
  }

  if (levelMatch) {
    const [, levelNumber, remainder] = levelMatch;
    const remainderTitle = remainder
      .split('-')
      .filter(Boolean)
      .map(titleCaseToken)
      .join(' ');

    return `Level ${levelNumber}: ${remainderTitle}`;
  }

  return cleanSlug
    .split('-')
    .filter(Boolean)
    .map(titleCaseToken)
    .join(' ');
}

function normalizeStoredPagePath(pagePath) {
  if (typeof pagePath !== 'string' || !pagePath.trim()) {
    return null;
  }

  const normalized = pagePath
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^subjects\/math\/\d+-/, 'subjects/math/');

  if (!normalized.endsWith('.md')) {
    return null;
  }

  if (normalized.startsWith('subjects/')) {
    return normalized;
  }

  return `subjects/${normalized.replace(/^\/+/, '').replace(/^subjects\//, '')}`;
}

function getDefaultState() {
  return {
    structure: null,
    page: null,
    positions: {},
  };
}

function normalizePositionMap(positions) {
  if (!positions || typeof positions !== 'object') {
    return {};
  }

  const nextPositions = {};

  Object.entries(positions).forEach(([key, value]) => {
    const path = normalizeStoredPagePath(key);

    if (path && Number.isFinite(value) && value >= 0) {
      nextPositions[path] = value;
    }
  });

  return nextPositions;
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return getDefaultState();
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return getDefaultState();
    }

    return {
      structure: typeof parsed.structure === 'string' && parsed.structure.trim() ? parsed.structure.trim() : null,
      page: normalizeStoredPagePath(parsed.page) ?? normalizeStoredPagePath(parsed.subject),
      positions: normalizePositionMap(parsed.positions),
    };
  } catch {
    return getDefaultState();
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Ignore storage failures in private modes or locked-down browsers.
  }
}

function updateStoredState(updater) {
  const nextState = updater(loadState());
  saveState(nextState);
  return nextState;
}

function getScrollPositionForPage(pagePath) {
  const state = loadState();
  const position = state.positions?.[pagePath];
  return Number.isFinite(position) && position >= 0 ? position : 0;
}

function saveCurrentScrollPosition() {
  if (!currentPagePath) {
    return;
  }

  updateStoredState((state) => ({
    structure: currentStructureId ?? state.structure ?? null,
    page: currentPagePath,
    positions: {
      ...state.positions,
      [currentPagePath]: window.scrollY,
    },
  }));
}

function scheduleScrollSave() {
  if (isRestoringScroll || !currentPagePath) {
    return;
  }

  window.clearTimeout(saveScrollTimer);
  saveScrollTimer = window.setTimeout(() => {
    saveCurrentScrollPosition();
  }, 150);
}

function restoreScrollPosition(pagePath) {
  const savedScroll = getScrollPositionForPage(pagePath);
  isRestoringScroll = true;

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: savedScroll, behavior: 'auto' });
    window.setTimeout(() => {
      isRestoringScroll = false;
    }, 0);
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeRegExp(text) {
  return String(text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeWhitespace(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

function parseFrontmatterValue(value) {
  const trimmed = String(value ?? '').trim();

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

function splitFrontmatter(markdown) {
  const text = String(markdown ?? '');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return {
      metadata: null,
      body: text,
    };
  }

  return {
    metadata: parseFrontmatter(match[1]),
    body: text.slice(match[0].length),
  };
}

function buildMetadataLabel(metadata, fallbackPath) {
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

  return parts.length ? parts.join(' • ') : fallbackPath;
}

function buildSuggestEditUrl(pagePath, noteTitle) {
  const normalizedPath = normalizeStoredPagePath(pagePath);
  const params = new URLSearchParams({
    template: 'correction.yml',
  });

  if (normalizedPath) {
    params.set('page_path', `notes/${normalizedPath}`);
  }

  if (noteTitle) {
    params.set('title', `[Correction]: ${noteTitle}`);
  }

  return `${githubIssueBaseUrl}?${params.toString()}`;
}

function updateSuggestEditLink(pagePath, noteTitle) {
  if (!suggestEditLink) {
    return;
  }

  suggestEditLink.href = buildSuggestEditUrl(pagePath, noteTitle);
}

function tokenizeSearchQuery(query) {
  return normalizeWhitespace(query)
    .toLowerCase()
    .split(' ')
    .filter(Boolean);
}

function stripMarkdownForSearch(markdown) {
  const { body } = splitFrontmatter(markdown);

  return normalizeWhitespace(
    String(body ?? '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, ' $1 ')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/^\s{0,3}#{1,6}\s+/gm, ' ')
      .replace(/^\s{0,3}>\s?/gm, ' ')
      .replace(/^\s*[-*+]\s+/gm, ' ')
      .replace(/^\s*\d+\.\s+/gm, ' ')
      .replace(/\|/g, ' ')
      .replace(/[*_~]/g, ' ')
  );
}

function flattenStructureNodes(structures) {
  const nodesByPath = new Map();

  function visit(node, structure) {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.path) {
      nodesByPath.set(node.path, {
        structureId: structure.id,
        title: node.title,
        path: node.path,
      });
    }

    (node.children ?? []).forEach((child) => visit(child, structure));
  }

  structures.forEach((structure) => visit(structure, structure));
  return Array.from(nodesByPath.values());
}

function buildSnippet(text, matchIndex, matchLength) {
  const normalizedText = normalizeWhitespace(text);

  if (!normalizedText) {
    return '';
  }

  const snippetRadius = 70;
  const safeIndex = Math.max(0, matchIndex);
  const start = Math.max(0, safeIndex - snippetRadius);
  const end = Math.min(normalizedText.length, safeIndex + Math.max(matchLength, 1) + snippetRadius);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < normalizedText.length ? '...' : '';

  return `${prefix}${normalizedText.slice(start, end).trim()}${suffix}`;
}

function highlightSnippet(snippet, terms) {
  if (!snippet) {
    return '';
  }

  let html = escapeHtml(snippet);
  const uniqueTerms = Array.from(new Set(terms)).sort((a, b) => b.length - a.length);

  uniqueTerms.forEach((term) => {
    if (!term) {
      return;
    }

    const matcher = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    html = html.replace(matcher, '<mark>$1</mark>');
  });

  return html;
}

function renderSearchPlaceholder(message) {
  searchResultsEl.innerHTML = `<p class="search-result__snippet">${escapeHtml(message)}</p>`;
}

function renderSearchResults(results, terms) {
  if (!results.length) {
    renderSearchPlaceholder('No matching notes yet.');
    return;
  }

  const fragment = document.createDocumentFragment();

  results.forEach((result) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result';
    button.dataset.path = result.path;
    button.dataset.structureId = result.structureId;
    button.dataset.query = searchInput.value;
    button.innerHTML = `
      <p class="search-result__title">${escapeHtml(result.title)}</p>
      <p class="search-result__snippet">${highlightSnippet(result.snippet, terms)}</p>
    `;
    button.addEventListener('click', () => {
      const query = searchInput.value;
      closeSearchPanel();
      void loadPage(result.path, {
        structureId: result.structureId,
        jumpToQuery: query,
      });
    });
    fragment.appendChild(button);
  });

  searchResultsEl.innerHTML = '';
  searchResultsEl.appendChild(fragment);
}

function updateSearchStatus(message) {
  searchStatusEl.textContent = message;
}

function performSearch(query) {
  const normalizedQuery = normalizeWhitespace(query);
  const terms = tokenizeSearchQuery(normalizedQuery);

  if (searchIndexError) {
    updateSearchStatus('Search is unavailable right now.');
    renderSearchPlaceholder('The note index could not be built.');
    return;
  }

  if (!normalizedQuery) {
    updateSearchStatus(searchIndexReady ? 'Type to search across all notes.' : 'Indexing notes...');
    renderSearchPlaceholder('Search note titles and note content.');
    return;
  }

  if (!searchIndexReady) {
    updateSearchStatus('Indexing notes...');
    renderSearchPlaceholder('Results will appear as soon as indexing finishes.');
    return;
  }

  const results = searchIndex
    .map((entry) => {
      const combined = `${entry.titleLower}\n${entry.contentLower}`;
      const positions = terms.map((term) => combined.indexOf(term));

      if (positions.some((position) => position === -1)) {
        return null;
      }

      const contentPositions = terms
        .map((term) => entry.contentLower.indexOf(term))
        .filter((position) => position >= 0);
      const titlePositions = terms
        .map((term) => entry.titleLower.indexOf(term))
        .filter((position) => position >= 0);
      const titleBoost = titlePositions.length * 1000;
      const earliestContent = contentPositions.length ? Math.min(...contentPositions) : Number.MAX_SAFE_INTEGER;
      const earliestTitle = titlePositions.length ? Math.min(...titlePositions) : Number.MAX_SAFE_INTEGER;
      const bestTextIndex = contentPositions.length ? earliestContent : earliestTitle;
      const snippetSource = contentPositions.length ? entry.contentText : entry.title;
      const snippet = buildSnippet(
        snippetSource,
        bestTextIndex === Number.MAX_SAFE_INTEGER ? 0 : bestTextIndex,
        terms[0]?.length ?? normalizedQuery.length,
      );

      return {
        title: entry.title,
        path: entry.path,
        structureId: entry.structureId,
        snippet,
        score: titleBoost - Math.min(earliestContent, 500) - Math.min(earliestTitle, 200),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 25);

  updateSearchStatus(results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'No results');
  renderSearchResults(results, terms);
}

function syncSearchTriggerState() {
  const isOpen = !searchPanel.hidden;
  searchTrigger.setAttribute('aria-expanded', String(isOpen));
}

function openSearchPanel() {
  searchPanel.hidden = false;
  syncSearchTriggerState();
  pendingSearchFocus = true;
  void ensureSearchIndex();
  performSearch(searchInput.value);

  window.requestAnimationFrame(() => {
    if (pendingSearchFocus) {
      searchInput.focus();
      searchInput.select();
    }
  });
}

function closeSearchPanel() {
  pendingSearchFocus = false;
  searchPanel.hidden = true;
  syncSearchTriggerState();
  searchTrigger.focus();
}

async function ensureSearchIndex() {
  if (!guideStructures.length) {
    updateSearchStatus('Loading note catalog...');
    renderSearchPlaceholder('Search will be ready once the guide list finishes loading.');
    return [];
  }

  if (searchIndexPromise) {
    return searchIndexPromise;
  }

  searchIndexError = null;
  updateSearchStatus('Indexing notes...');

  searchIndexPromise = (async () => {
    const documents = flattenStructureNodes(guideStructures);
    const loadedDocuments = await Promise.all(documents.map(async (document) => {
      try {
        const response = await fetch(`./${document.path}`, { cache: 'no-store' });

        if (!response.ok) {
          return null;
        }

        const markdown = await response.text();
        const contentText = stripMarkdownForSearch(markdown);

        return {
          ...document,
          contentText,
          contentLower: contentText.toLowerCase(),
          titleLower: document.title.toLowerCase(),
        };
      } catch {
        return null;
      }
    }));

    searchIndex = loadedDocuments.filter(Boolean);
    searchIndexReady = true;
    performSearch(searchInput.value);
    return searchIndex;
  })().catch((error) => {
    searchIndexError = error;
    searchIndexReady = false;
    searchIndexPromise = null;
    performSearch(searchInput.value);
    return [];
  });

  return searchIndexPromise;
}

function clearSearchMatch() {
  const matches = contentEl.querySelectorAll('.notes-search-match');

  matches.forEach((match) => {
    const parent = match.parentNode;

    if (!parent) {
      return;
    }

    parent.replaceChild(document.createTextNode(match.textContent ?? ''), match);
    parent.normalize();
  });
}

function findFirstTextNodeMatch(root, query) {
  const terms = [normalizeWhitespace(query).toLowerCase(), ...tokenizeSearchQuery(query)]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  if (!terms.length) {
    return null;
  }

  for (const term of terms) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const text = normalizeWhitespace(node.textContent);
        const parent = node.parentElement;

        if (!text || !parent || parent.closest('script, style, code, pre, mjx-container')) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let currentNode = walker.nextNode();

    while (currentNode) {
      const haystack = currentNode.textContent.toLowerCase();
      const index = haystack.indexOf(term);

      if (index >= 0) {
        return {
          node: currentNode,
          index,
          length: term.length,
        };
      }

      currentNode = walker.nextNode();
    }
  }

  return null;
}

function revealTextMatch(match) {
  const source = match.node;
  const text = source.textContent ?? '';
  const before = text.slice(0, match.index);
  const found = text.slice(match.index, match.index + match.length);
  const after = text.slice(match.index + match.length);
  const mark = document.createElement('mark');

  mark.className = 'notes-search-match';
  mark.textContent = found;

  const fragment = document.createDocumentFragment();

  if (before) {
    fragment.appendChild(document.createTextNode(before));
  }

  fragment.appendChild(mark);

  if (after) {
    fragment.appendChild(document.createTextNode(after));
  }

  source.parentNode.replaceChild(fragment, source);
  mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return mark;
}

function jumpToSearchQuery(query) {
  clearSearchMatch();

  const match = findFirstTextNodeMatch(contentEl, query);

  if (!match) {
    return false;
  }

  revealTextMatch(match);
  return true;
}

searchTrigger.addEventListener('click', () => {
  if (searchPanel.hidden) {
    openSearchPanel();
    return;
  }

  closeSearchPanel();
});

searchCloseButton.addEventListener('click', () => {
  closeSearchPanel();
});

searchInput.addEventListener('input', (event) => {
  performSearch(event.target.value);
});

searchPanel.addEventListener('click', (event) => {
  if (event.target === searchPanel) {
    closeSearchPanel();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !searchPanel.hidden) {
    closeSearchPanel();
  }
});

function dedentLines(lines) {
  const indentWidths = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => (line.match(/^[ \t]*/)?.[0].length ?? 0));

  const indent = indentWidths.length ? Math.min(...indentWidths) : 0;
  return lines.map((line) => line.slice(indent));
}

function normalizeDisplayMath(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tokens = [];
  const output = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const startMatch = line.match(/^[ \t]*\$\$\s*$/);

    if (!startMatch) {
      output.push(line);
      continue;
    }

    const body = [];
    index += 1;

    while (index < lines.length && !/^[ \t]*\$\$\s*$/.test(lines[index])) {
      body.push(lines[index]);
      index += 1;
    }

    const cleanedBody = dedentLines(body)
      .join('\n')
      .replace(/^\s*\n|\n\s*$/g, '');

    const token = `@@MATH_BLOCK_${tokens.length}@@`;
    tokens.push({
      token,
      html: `<div class="math-block">$$\n${escapeHtml(cleanedBody)}\n$$</div>`,
    });
    output.push(token);
  }

  return {
    markdown: output.join('\n'),
    tokens,
  };
}

function restoreDisplayMath(html, tokens) {
  return tokens.reduce((accumulator, token) => accumulator.replaceAll(token.token, token.html), html);
}

function normalizeHeadingText(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function clearTableOfContents() {
  if (tocList) {
    tocList.innerHTML = '';
  }

  if (tocPanel) {
    tocPanel.hidden = true;
  }

  if (notesLayout) {
    notesLayout.classList.remove('notes-layout--has-toc');
  }
}

function assignHeadingId(heading, usedIds, fallbackIndex) {
  const previous = heading.previousElementSibling;

  if (!heading.id && previous?.tagName === 'A' && previous.id && !previous.textContent.trim()) {
    heading.id = previous.id;
    previous.remove();
  }

  if (!heading.id) {
    const baseId = slugifyHeading(heading.textContent || `section ${fallbackIndex + 1}`);
    let candidate = baseId;
    let suffix = 2;

    while (usedIds.has(candidate)) {
      candidate = `${baseId}-${suffix}`;
      suffix += 1;
    }

    heading.id = candidate;
  }

  usedIds.add(heading.id);
  heading.setAttribute('tabindex', '-1');
  return heading.id;
}

function buildTableOfContents() {
  if (!tocList || !tocPanel || !notesLayout) {
    return;
  }

  const headings = Array.from(contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const usedIds = new Set();
  const entries = [];
  const titleText = normalizeHeadingText(titleEl.textContent || '');

  headings.forEach((heading, index) => {
    const id = assignHeadingId(heading, usedIds, index);
    const headingText = normalizeHeadingText(heading.textContent || '');

    if (!headingText || headingText === 'table of contents' || headingText === 'contents') {
      return;
    }

    if (index === 0 && headingText === titleText) {
      return;
    }

    entries.push({
      id,
      level: Number.parseInt(heading.tagName.slice(1), 10),
      text: heading.textContent?.trim() || `Section ${entries.length + 1}`,
    });
  });

  tocList.innerHTML = '';

  if (!entries.length) {
    clearTableOfContents();
    return;
  }

  const fragment = document.createDocumentFragment();

  entries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'notes-toc__item';
    item.style.setProperty('--toc-indent', String(Math.max(0, entry.level - 1)));

    const link = document.createElement('a');
    link.className = 'notes-toc__link';
    link.href = `#${entry.id}`;
    link.textContent = entry.text;

    item.appendChild(link);
    fragment.appendChild(item);
  });

  tocList.appendChild(fragment);
  tocPanel.hidden = false;
  notesLayout.classList.add('notes-layout--has-toc');
}

async function renderMarkdown(markdown) {
  if (!window.marked) {
    contentEl.textContent = markdown;
    clearTableOfContents();
    return;
  }

  const prepared = normalizeDisplayMath(markdown);
  contentEl.innerHTML = restoreDisplayMath(window.marked.parse(prepared.markdown), prepared.tokens);
  buildTableOfContents();

  if (window.MathJax?.typesetPromise) {
    await window.MathJax.typesetPromise([contentEl]).catch(() => {
      // MathJax can fail quietly if a formula is malformed; the Markdown still renders.
    });
  }
}

function firstDescendantPath(node) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  const ownPath = normalizeStoredPagePath(node.path);

  if (ownPath) {
    return ownPath;
  }

  if (!Array.isArray(node.children)) {
    return null;
  }

  for (const child of node.children) {
    const path = firstDescendantPath(child);

    if (path) {
      return path;
    }
  }

  return null;
}

function titleFromPath(path, fallback = 'Untitled') {
  const normalizedPath = normalizeStoredPagePath(path);

  if (!normalizedPath) {
    return fallback;
  }

  const segments = normalizedPath.split('/');
  const file = segments.at(-1);

  if (/^index\.md$/i.test(file) && segments.length >= 2) {
    return titleFromSlug(segments.at(-2));
  }

  return titleFromSlug(file);
}

function normalizeStructureId(id, title, path, index) {
  if (typeof id === 'string' && id.trim()) {
    return slugifyHeading(id.trim());
  }

  return slugifyHeading(title || path || `structure ${index + 1}`);
}

function sanitizeNode(node, isStructure = false, index = 0) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  const children = Array.isArray(node.children)
    ? node.children.map((child, childIndex) => sanitizeNode(child, false, childIndex)).filter(Boolean)
    : [];
  const explicitPath = normalizeStoredPagePath(node.path);
  const derivedPath = firstDescendantPath({ children });
  const path = explicitPath ?? (isStructure ? null : derivedPath);
  const title = typeof node.title === 'string' && node.title.trim()
    ? node.title.trim()
    : titleFromPath(explicitPath ?? derivedPath, isStructure ? `Guide ${index + 1}` : 'Untitled');

  if (!(path ?? derivedPath)) {
    return null;
  }

  const normalizedNode = {
    title,
    path,
    children,
  };

  if (isStructure) {
    normalizedNode.id = normalizeStructureId(node.id, title, path, index);
  }

  return normalizedNode;
}

function normalizeStructures(payload) {
  const rawStructures = Array.isArray(payload) ? payload : Array.isArray(payload?.structures) ? payload.structures : [];
  const structures = rawStructures
    .map((structure, index) => sanitizeNode(structure, true, index))
    .filter(Boolean);

  if (!structures.length) {
    throw new Error('No guide structures available.');
  }

  return structures;
}

async function loadGuideStructures() {
  const manifest = window[manifestGlobalName];

  if (!manifest) {
    throw new Error(`Could not load guide manifest from ${manifestGlobalName}.`);
  }

  return normalizeStructures(manifest);
}

function findStructureById(structureId) {
  return guideStructures.find((structure) => structure.id === structureId) ?? null;
}

function findNodeByPathInTree(node, pagePath) {
  if (!node || typeof node !== 'object') {
    return null;
  }

  if (node.path === pagePath) {
    return node;
  }

  for (const child of node.children ?? []) {
    const match = findNodeByPathInTree(child, pagePath);

    if (match) {
      return match;
    }
  }

  return null;
}

function findNodeByPath(pagePath) {
  for (const structure of guideStructures) {
    const match = findNodeByPathInTree(structure, pagePath);

    if (match) {
      return match;
    }
  }

  return null;
}

function nodeContainsPath(node, pagePath) {
  if (!node || typeof node !== 'object') {
    return false;
  }

  if (node.path === pagePath) {
    return true;
  }

  return (node.children ?? []).some((child) => nodeContainsPath(child, pagePath));
}

function findStructureForPage(pagePath) {
  return guideStructures.find((structure) => nodeContainsPath(structure, pagePath)) ?? null;
}

function getDefaultPagePathForStructure(structure) {
  return normalizeStoredPagePath(structure?.path) ?? firstDescendantPath(structure);
}

function createStructureButton(structure, index) {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('role', 'tab');
  button.textContent = structure.title;
  button.id = `structure-${index}`;
  button.dataset.structureId = structure.id;
  button.setAttribute('aria-selected', 'false');
  button.tabIndex = -1;
  button.addEventListener('click', () => {
    const defaultPath = getDefaultPagePathForStructure(structure);

    if (defaultPath) {
      void loadPage(defaultPath, { structureId: structure.id });
    }
  });
  item.appendChild(button);
  return item;
}

function setActiveStructureButton(activeStructureId) {
  structureContainer.querySelectorAll('button').forEach((button) => {
    const isActive = button.dataset.structureId === activeStructureId;
    button.setAttribute('aria-selected', String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });
}

function createGuideTreeItem(node, depth) {
  const item = document.createElement('li');
  item.className = 'guide-tree__item';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'guide-tree__button';
  button.style.setProperty('--guide-depth', String(depth));
  button.textContent = node.title;
  button.dataset.path = node.path;

  if (node.children?.length) {
    button.classList.add('guide-tree__button--folder');
  } else {
    button.classList.add('guide-tree__button--page');
  }

  if (node.path === currentPagePath) {
    button.classList.add('is-active');
    button.setAttribute('aria-current', 'page');
  } else if (nodeContainsPath(node, currentPagePath)) {
    button.classList.add('is-ancestor');
  }

  button.addEventListener('click', () => {
    void loadPage(node.path, { structureId: currentStructureId });
  });

  item.appendChild(button);

  if (node.children?.length) {
    const branch = document.createElement('ul');
    branch.className = 'guide-tree__branch';
    node.children.forEach((child) => {
      branch.appendChild(createGuideTreeItem(child, depth + 1));
    });
    item.appendChild(branch);
  }

  return item;
}

function renderGuideTree(structure) {
  guideTitleEl.textContent = structure.title;
  if (guidePanelNoteEl) {
    guidePanelNoteEl.textContent = 'Browse the selected structure';
  }
  guideTreeEl.innerHTML = '';

  if (structure.path) {
    guideTreeEl.appendChild(createGuideTreeItem(structure, 0));
    return;
  }

  (structure.children ?? []).forEach((child) => {
    guideTreeEl.appendChild(createGuideTreeItem(child, 0));
  });
}

async function loadPage(pagePath, options = {}) {
  const normalizedPath = normalizeStoredPagePath(pagePath);

  if (!normalizedPath) {
    throw new Error('Invalid guide path.');
  }

  saveCurrentScrollPosition();

  const structure = findStructureById(options.structureId) ?? findStructureForPage(normalizedPath) ?? guideStructures[0];
  const node = findNodeByPathInTree(structure, normalizedPath)
    ?? findNodeByPath(normalizedPath)
    ?? {
      title: titleFromPath(normalizedPath),
      path: normalizedPath,
      children: [],
    };
  const filePath = `./${normalizedPath}`;

  currentStructureId = structure.id;
  currentPagePath = normalizedPath;
  clearSearchMatch();
  titleEl.textContent = node.title;
  metaEl.textContent = normalizedPath;
  updateSuggestEditLink(normalizedPath, node.title);
  statusEl.textContent = 'Loading...';
  setActiveStructureButton(structure.id);
  renderGuideTree(structure);
  updateStoredState((state) => ({
    structure: structure.id,
    page: normalizedPath,
    positions: state.positions ?? {},
  }));

  try {
    const response = await fetch(filePath, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Could not load ${filePath}`);
    }

    const markdown = await response.text();
    const { metadata, body } = splitFrontmatter(markdown);
    const resolvedTitle = typeof metadata?.title === 'string' && metadata.title.trim() ? metadata.title.trim() : node.title;
    titleEl.textContent = resolvedTitle;
    metaEl.textContent = buildMetadataLabel(metadata, normalizedPath);
    updateSuggestEditLink(normalizedPath, resolvedTitle);
    await renderMarkdown(body);
    if (options.jumpToQuery) {
      const jumpedToMatch = jumpToSearchQuery(options.jumpToQuery);

      if (!jumpedToMatch) {
        restoreScrollPosition(normalizedPath);
      }
    } else {
      restoreScrollPosition(normalizedPath);
    }
    statusEl.textContent = 'Loaded';
  } catch {
    await renderMarkdown(`# ${node.title}\n\nThis note file is missing.\n\nCreate it at \`${normalizedPath}\` and the page will render it here.\n`);
    restoreScrollPosition(normalizedPath);
    statusEl.textContent = 'Missing file';
  }
}

function resolveInitialSelection(state) {
  if (state.page) {
    const structure = findStructureForPage(state.page);

    if (structure) {
      return {
        structureId: structure.id,
        pagePath: state.page,
      };
    }
  }

  if (state.structure) {
    const structure = findStructureById(state.structure);

    if (structure) {
      return {
        structureId: structure.id,
        pagePath: getDefaultPagePathForStructure(structure),
      };
    }
  }

  const firstStructure = guideStructures[0];

  return {
    structureId: firstStructure.id,
    pagePath: getDefaultPagePathForStructure(firstStructure),
  };
}

async function init() {
  syncSearchTriggerState();
  renderSearchPlaceholder('Search note titles and note content.');
  updateSearchStatus('Indexing notes...');

  if (window.location.protocol === 'file:') {
    guideTitleEl.textContent = 'Open via a web server';
    if (guidePanelNoteEl) {
      guidePanelNoteEl.textContent = 'Folder-based guide loading needs HTTP or HTTPS.';
    }
    titleEl.textContent = 'Open via a web server';
    metaEl.textContent = 'Fetching local Markdown files is blocked when the page is opened directly from disk.';
    statusEl.textContent = 'Use GitHub Pages or a local server';
    contentEl.innerHTML = '<p>This page needs <code>http://</code> or <code>https://</code> to load the Markdown files.</p>';
    clearTableOfContents();
    updateSearchStatus('Search needs HTTP or HTTPS.');
    renderSearchPlaceholder('Open the notes page through a web server to build the search index.');
    return;
  }

  try {
    guideStructures = await loadGuideStructures();
    structureContainer.innerHTML = '';
    guideStructures.forEach((structure, index) => {
      structureContainer.appendChild(createStructureButton(structure, index));
    });

    void ensureSearchIndex();
    const selection = resolveInitialSelection(loadState());
    await loadPage(selection.pagePath, { structureId: selection.structureId });
  } catch (error) {
    guideTitleEl.textContent = 'Unable to load guide';
    if (guidePanelNoteEl) {
      guidePanelNoteEl.textContent = 'Check the guide structure files.';
    }
    titleEl.textContent = 'Unable to load notes';
    metaEl.textContent = 'Check the guide manifest and Markdown file paths.';
    statusEl.textContent = 'Initialization failed';
    contentEl.innerHTML = `<p>${error.message}</p>`;
    clearTableOfContents();
    updateSearchStatus('Search is unavailable right now.');
    renderSearchPlaceholder('Fix the guide manifest before search can load.');
  }
}

window.addEventListener('scroll', scheduleScrollSave, { passive: true });
window.addEventListener('beforeunload', saveCurrentScrollPosition);
window.addEventListener('pagehide', saveCurrentScrollPosition);

void init();
