const searchTriggers = Array.from(document.querySelectorAll('[data-search-trigger]'));
const timerTriggers = Array.from(document.querySelectorAll('[data-timer-trigger]'));
const searchPanel = document.getElementById('search-panel');
const timerPanel = document.getElementById('timer-panel');
const timerCard = timerPanel?.querySelector('.timer-panel__card');
const searchCloseButton = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');
const searchStatus = document.getElementById('search-status');
const searchResults = document.getElementById('search-results');
const noteContent = document.getElementById('note-content');
const subjectHeaderLinks = Array.from(document.querySelectorAll('[data-subject-id]'));
const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
const SEARCH_INDEX_URL = '/notes/search-index.json';
const NOTES_SESSION_STORAGE_KEY = 'ues-notes:last-pages-by-subject';
const NOTES_THEME_STORAGE_KEY = 'ues-notes:contrast-mode';

let searchIndex = [];
let searchIndexPromise = null;
let searchIndexReady = false;
let searchIndexFailed = false;
let activeSearchTrigger = searchTriggers[0] ?? null;
let activeTimerTrigger = timerTriggers[0] ?? null;
let activeSearchResultIndex = -1;

function getSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readLastPagesBySubject() {
  const storage = getSessionStorage();

  if (!storage) {
    return {};
  }

  try {
    const raw = storage.getItem(NOTES_SESSION_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeLastPagesBySubject(state) {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(NOTES_SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or privacy-mode failures.
  }
}

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readThemePreference() {
  const storage = getLocalStorage();

  if (!storage) {
    return false;
  }

  try {
    return ['sepia', 'light'].includes(storage.getItem(NOTES_THEME_STORAGE_KEY));
  } catch {
    return false;
  }
}

function getThemeToggleLabel(isSepia) {
  return isSepia ? 'Dark Mode' : 'Light Mode';
}

function getThemeToggleAriaLabel(isSepia) {
  return isSepia ? 'Switch to dark mode' : 'Switch to light mode';
}

function writeThemePreference(isSepia) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(NOTES_THEME_STORAGE_KEY, isSepia ? 'light' : 'default');
  } catch {
    // Ignore storage quota or privacy-mode failures.
  }
}

function applyThemePreference(isSepia) {
  const enabled = Boolean(isSepia);

  document.documentElement.classList.toggle('notes-page--sepia', enabled);

  if (document.body) {
    document.body.classList.toggle('notes-page--sepia', enabled);
  }

  themeToggleButtons.forEach((button) => {
    button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    button.setAttribute('aria-label', getThemeToggleAriaLabel(enabled));
    button.textContent = getThemeToggleLabel(enabled);
  });
}

function syncThemePreference() {
  applyThemePreference(readThemePreference());
}

function toggleThemePreference() {
  const nextValue = !document.documentElement.classList.contains('notes-page--sepia');
  applyThemePreference(nextValue);
  writeThemePreference(nextValue);
}

function getCurrentSubjectPageInfo() {
  const match = window.location.pathname.match(/^\/notes\/subjects\/([^/]+)\/([^/]+)\/(?:practice\/)?$/);

  if (!match) {
    return null;
  }

  const subjectId = match[1];
  const noteSlug = match[2];

  return {
    subjectId,
    pagePath: `/notes/subjects/${subjectId}/${noteSlug}/`,
  };
}

function rememberCurrentSubjectPage() {
  const currentPage = getCurrentSubjectPageInfo();

  if (!currentPage) {
    return;
  }

  const state = readLastPagesBySubject();

  if (state[currentPage.subjectId] === currentPage.pagePath) {
    return;
  }

  state[currentPage.subjectId] = currentPage.pagePath;
  writeLastPagesBySubject(state);
}

function updateSubjectHeaderLinks() {
  const lastPagesBySubject = readLastPagesBySubject();

  subjectHeaderLinks.forEach((link) => {
    const subjectId = link.dataset.subjectId;
    const defaultHref = link.dataset.defaultHref;

    if (!subjectId || !defaultHref) {
      return;
    }

    link.href = lastPagesBySubject[subjectId] || defaultHref;
  });
}

function syncSubjectNavigation() {
  rememberCurrentSubjectPage();
  updateSubjectHeaderLinks();
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

function normalizeWhitespace(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

const LATEX_COMMAND_MAP = new Map([
  ['frac', 'fraction'],
  ['dfrac', 'fraction'],
  ['tfrac', 'fraction'],
  ['sqrt', 'square root'],
  ['operatorname', ''],
  ['mathrm', ''],
  ['mathit', ''],
  ['mathbf', ''],
  ['mathcal', ''],
  ['mathbb', ''],
  ['cdot', 'times'],
  ['times', 'times'],
  ['pm', 'plus minus'],
  ['le', 'less than or equal to'],
  ['ge', 'greater than or equal to'],
  ['neq', 'not equal to'],
  ['approx', 'approximately'],
  ['sim', 'approximately'],
  ['to', 'to'],
  ['Rightarrow', 'implies'],
  ['rightarrow', 'to'],
  ['leftrightarrow', 'if and only if'],
  ['infty', 'infinity'],
  ['sum', 'sum'],
  ['prod', 'product'],
  ['int', 'integral'],
  ['lim', 'limit'],
  ['ln', 'ln'],
  ['log', 'log'],
  ['exp', 'exp'],
  ['sin', 'sin'],
  ['cos', 'cos'],
  ['tan', 'tan'],
  ['sec', 'sec'],
  ['csc', 'csc'],
  ['cot', 'cot'],
  ['arcsin', 'arcsin'],
  ['arccos', 'arccos'],
  ['arctan', 'arctan'],
  ['Delta', 'delta'],
  ['delta', 'delta'],
  ['alpha', 'alpha'],
  ['beta', 'beta'],
  ['gamma', 'gamma'],
  ['theta', 'theta'],
  ['lambda', 'lambda'],
  ['mu', 'mu'],
  ['pi', 'pi'],
  ['rho', 'rho'],
  ['sigma', 'sigma'],
  ['phi', 'phi'],
  ['omega', 'omega'],
  ['epsilon', 'epsilon'],
  ['Omega', 'omega'],
  ['Phi', 'phi'],
  ['Sigma', 'sigma'],
  ['Theta', 'theta'],
  ['Lambda', 'lambda'],
  ['Pi', 'pi'],
]);

const LATEX_SET_MAP = new Map([
  ['R', 'real numbers'],
  ['N', 'natural numbers'],
  ['Z', 'integers'],
  ['Q', 'rational numbers'],
  ['C', 'complex numbers'],
  ['P', 'power set'],
]);

function normalizeLatexSearchText(text) {
  return normalizeWhitespace(String(text ?? '')
    .replace(/\\(?:left|right|bigl|bigr|Bigl|Bigr|biggl|biggr|lvert|rvert|langle|rangle|lceil|rceil|lfloor|rfloor|quad|qquad)\b/g, ' ')
    .replace(/\\[,;:!]/g, ' ')
    .replace(/\\(?:d)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1 over $2')
    .replace(/\\sqrt(?:\[(.*?)\])?\s*\{([^{}]+)\}/g, (_, degree, radicand) => {
      return degree ? `root ${degree} ${radicand}` : `square root ${radicand}`;
    })
    .replace(/\\binom\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1 choose $2')
    .replace(/\\(?:operatorname|mathrm|mathit|mathbf|mathcal|text)\s*\{([^{}]+)\}/g, '$1')
    .replace(/\\mathbb\s*\{([^{}]+)\}/g, (_, symbol) => LATEX_SET_MAP.get(symbol) ?? symbol)
    .replace(/\\begin\{([A-Za-z*]+)\}/g, ' ')
    .replace(/\\end\{([A-Za-z*]+)\}/g, ' ')
    .replace(/\\(?:sum|prod|int|lim)(?:_\{([^{}]+)\}|_([^\s^{}]+))?(?:\^\{([^{}]+)\}|\^([^\s^{}]+))?/g, (_, command, lowerBlock, lowerBare, upperBlock, upperBare) => {
      const lower = lowerBlock ?? lowerBare ?? '';
      const upper = upperBlock ?? upperBare ?? '';
      const lowerText = lower ? ` from ${lower.replace(/\\to/g, ' to ')}` : '';
      const upperText = upper ? ` to ${upper}` : '';

      if (command === 'lim') {
        return `limit${lowerText}`;
      }

      if (command === 'int') {
        return `integral${lowerText}${upperText}`;
      }

      return `${command}${lowerText}${upperText}`;
    })
    .replace(/\\([A-Za-z]+)\b/g, (_, command) => {
      return LATEX_COMMAND_MAP.get(command) ?? command;
    })
    .replace(/([A-Za-z0-9])\^\{([^{}]+)\}/g, '$1 $2')
    .replace(/([A-Za-z0-9])\^([A-Za-z0-9+\-]+)/g, '$1 $2')
    .replace(/([A-Za-z0-9])_\{([^{}]+)\}/g, '$1 $2')
    .replace(/([A-Za-z0-9])_([A-Za-z0-9+\-]+)/g, '$1 $2')
    .replace(/\\(?:cdots|ldots|dots)/g, ' ellipsis ')
    .replace(/\\&/g, ' and ')
    .replace(/&/g, ' ')
    .replace(/\\/g, ' ')
    .replace(/[{}]/g, ' '));
}

function tokenize(query) {
  return normalizeLatexSearchText(query).toLowerCase().split(' ').filter(Boolean);
}

function updateStatus(message) {
  if (searchStatus) {
    searchStatus.textContent = message;
  }
}

function setSearchTriggerState(isExpanded) {
  searchTriggers.forEach((trigger) => {
    trigger.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  });
}

function setTimerTriggerState(isExpanded) {
  timerTriggers.forEach((trigger) => {
    trigger.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  });
}

function isVisibleElement(element) {
  return element instanceof HTMLElement
    && !element.hidden
    && element.getClientRects().length > 0
    && !element.closest('[hidden]');
}

function getVisibleSearchTrigger() {
  return searchTriggers.find(isVisibleElement) ?? null;
}

function getVisibleTimerTrigger() {
  return timerTriggers.find(isVisibleElement) ?? null;
}

function getPageNavItems() {
  return Array.from(document.querySelectorAll('[data-notes-nav-item]')).filter(isVisibleElement);
}

function getSearchResultItems() {
  if (!searchResults) {
    return [];
  }

  return Array.from(searchResults.querySelectorAll('[data-search-result]')).filter(isVisibleElement);
}

function updateSearchResultState(nextIndex, { focus = false } = {}) {
  const results = getSearchResultItems();

  if (!results.length) {
    activeSearchResultIndex = -1;
    return null;
  }

  activeSearchResultIndex = ((nextIndex % results.length) + results.length) % results.length;

  results.forEach((result, index) => {
    const isActive = index === activeSearchResultIndex;
    result.classList.toggle('is-active', isActive);

    if (isActive) {
      result.setAttribute('aria-current', 'true');
    } else {
      result.removeAttribute('aria-current');
    }
  });

  const activeResult = results[activeSearchResultIndex] ?? null;

  if (activeResult && searchPanel && !searchPanel.hidden) {
    activeResult.scrollIntoView({ block: 'nearest' });

    if (focus) {
      activeResult.focus();
    }
  }

  return activeResult;
}

function moveSearchResultState(step, focus = false) {
  const results = getSearchResultItems();

  if (!results.length) {
    return null;
  }

  const baseIndex = activeSearchResultIndex >= 0
    ? activeSearchResultIndex
    : (step > 0 ? -1 : 0);

  return updateSearchResultState(baseIndex + step, { focus });
}

function activateFocusedSearchResult() {
  const activeResult = getSearchResultItems()[activeSearchResultIndex] ?? getSearchResultItems()[0] ?? null;

  if (!activeResult) {
    return;
  }

  window.location.href = activeResult.href;
}

function movePageNavFocus(step, currentTarget) {
  const items = getPageNavItems();

  if (!items.length) {
    return;
  }

  const currentIndex = items.indexOf(currentTarget);

  if (currentIndex < 0) {
    return;
  }

  const nextIndex = (currentIndex + step + items.length) % items.length;
  const nextItem = items[nextIndex];

  if (!nextItem) {
    return;
  }

  nextItem.focus();
  nextItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function handleSearchPanelKeydown(event) {
  if (!searchPanel || searchPanel.hidden || !(event.target instanceof HTMLElement)) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeSearch();
    return;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const isSearchInputFocused = event.target === searchInput;
    const isSearchResultFocused = Boolean(event.target.closest('[data-search-result]'));

    if (!isSearchInputFocused && !isSearchResultFocused) {
      return;
    }

    event.preventDefault();
    moveSearchResultState(step, isSearchResultFocused);
    return;
  }

  if (event.key === 'Enter' && event.target === searchInput && activeSearchResultIndex >= 0) {
    event.preventDefault();
    activateFocusedSearchResult();
  }
}

function handleTimerPanelKeydown(event) {
  if (!timerPanel || timerPanel.hidden || !(event.target instanceof HTMLElement)) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeTimer();
    return;
  }

  if (event.key === 'Tab') {
    event.preventDefault();
    timerCard?.focus();
  }
}

function handlePageNavKeydown(event) {
  if (searchPanel && !searchPanel.hidden) {
    return;
  }

  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  const stepByKey = {
    ArrowDown: 1,
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -1,
  };

  const step = stepByKey[event.key];

  if (!step || !event.target.matches('[data-notes-nav-item]')) {
    return;
  }

  event.preventDefault();
  movePageNavFocus(step, event.target);
}

function handleGlobalKeyboardShortcuts(event) {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') {
    event.preventDefault();
    openSearch();
    return;
  }

  if (timerPanel && !timerPanel.hidden) {
    handleTimerPanelKeydown(event);
    return;
  }

  if (searchPanel && !searchPanel.hidden) {
    handleSearchPanelKeydown(event);
    return;
  }

  handlePageNavKeydown(event);
}

function renderPlaceholder(message) {
  if (searchResults) {
    searchResults.innerHTML = `<p class="search-result__snippet">${escapeHtml(message)}</p>`;
  }
}

function buildSnippet(text, index, matchLength) {
  const normalizedText = normalizeWhitespace(text);

  if (!normalizedText) {
    return '';
  }

  const radius = 70;
  const start = Math.max(0, index - radius);
  const end = Math.min(normalizedText.length, index + Math.max(matchLength, 1) + radius);
  return `${start ? '...' : ''}${normalizedText.slice(start, end).trim()}${end < normalizedText.length ? '...' : ''}`;
}

function highlightText(text, terms) {
  let html = escapeHtml(text);

  [...new Set(terms)].sort((left, right) => right.length - left.length).forEach((term) => {
    if (term) {
      html = html.replace(new RegExp(`(${escapeRegExp(term)})`, 'gi'), '<mark>$1</mark>');
    }
  });

  return html;
}

function resultForEntry(entry, terms) {
  const title = String(entry.title ?? '');
  const text = String(entry.text ?? '');
  const titleLower = normalizeLatexSearchText(title).toLowerCase();
  const textLower = normalizeLatexSearchText(text).toLowerCase();
  const searchable = `${titleLower} ${textLower}`;

  if (!terms.every((term) => searchable.includes(term))) {
    return null;
  }

  const titleHits = terms.filter((term) => titleLower.includes(term)).length;
  const firstTextPosition = terms
    .map((term) => textLower.indexOf(term))
    .filter((position) => position >= 0)
    .sort((left, right) => left - right)[0] ?? 0;

  return {
    ...entry,
    snippet: buildSnippet(normalizeLatexSearchText(text || title), firstTextPosition, terms[0]?.length ?? 0),
    score: (titleHits * 1000) - firstTextPosition,
  };
}

function runSearch(query) {
  if (!searchResults) {
    return;
  }

  const normalizedQuery = normalizeLatexSearchText(query);
  const terms = tokenize(normalizedQuery);

  if (searchIndexFailed) {
    updateStatus('Search is unavailable right now.');
    renderPlaceholder('The generated search index could not be loaded.');
    activeSearchResultIndex = -1;
    return;
  }

  if (!normalizedQuery) {
    updateStatus(searchIndexReady ? 'Type to search across all notes.' : 'Loading search index...');
    renderPlaceholder('Search note titles and note content.');
    activeSearchResultIndex = -1;
    return;
  }

  if (!searchIndexReady) {
    updateStatus('Loading search index...');
    renderPlaceholder('Results will appear when the index is ready.');
    activeSearchResultIndex = -1;
    return;
  }

  const results = searchIndex
    .map((entry) => resultForEntry(entry, terms))
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 25);

  if (!results.length) {
    updateStatus('No results');
    renderPlaceholder('No matching notes found.');
    activeSearchResultIndex = -1;
    return;
  }

  updateStatus(`${results.length} result${results.length === 1 ? '' : 's'}`);
  searchResults.innerHTML = results.map((result) => {
    const href = `${result.url}?q=${encodeURIComponent(normalizedQuery)}`;
    return `<a class="search-result" href="${escapeHtml(href)}" data-search-result>
      <p class="search-result__title">${escapeHtml(result.title)} <span class="search-result__subject">${escapeHtml(result.subject)}</span></p>
      <p class="search-result__snippet">${highlightText(result.snippet, terms)}</p>
    </a>`;
  }).join('');

  updateSearchResultState(results.length ? 0 : -1);
}

async function loadSearchIndex() {
  if (searchIndexPromise) {
    return searchIndexPromise;
  }

  searchIndexPromise = fetch(SEARCH_INDEX_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Search index returned ${response.status}`);
      }

      return response.json();
    })
    .then((entries) => {
      searchIndex = Array.isArray(entries) ? entries : [];
      searchIndexReady = true;
      runSearch(searchInput?.value ?? '');
      return searchIndex;
    })
    .catch(() => {
      searchIndexFailed = true;
      runSearch(searchInput?.value ?? '');
      return [];
    });

  return searchIndexPromise;
}

function openSearch(trigger = activeSearchTrigger) {
  if (!searchPanel || !searchInput) {
    return;
  }

  if (timerPanel && !timerPanel.hidden) {
    closeTimer({ restoreFocus: false });
  }

  activeSearchTrigger = (trigger && isVisibleElement(trigger))
    ? trigger
    : getVisibleSearchTrigger()
      ?? activeSearchTrigger;
  searchPanel.hidden = false;
  setSearchTriggerState(true);
  void loadSearchIndex();
  runSearch(searchInput.value);
  searchInput.focus();
  searchInput.select();
}

function closeSearch({ restoreFocus = true } = {}) {
  if (!searchPanel) {
    return;
  }

  searchPanel.hidden = true;
  setSearchTriggerState(false);

  if (!restoreFocus) {
    return;
  }

  const returnTrigger = isVisibleElement(activeSearchTrigger)
    ? activeSearchTrigger
    : getVisibleSearchTrigger();

  returnTrigger?.focus();
}

function openTimer(trigger = activeTimerTrigger) {
  if (!timerPanel) {
    return;
  }

  if (searchPanel && !searchPanel.hidden) {
    closeSearch({ restoreFocus: false });
  }

  activeTimerTrigger = (trigger && isVisibleElement(trigger))
    ? trigger
    : getVisibleTimerTrigger()
      ?? activeTimerTrigger;
  timerPanel.hidden = false;
  setTimerTriggerState(true);
  timerCard?.focus();
}

function closeTimer({ restoreFocus = true } = {}) {
  if (!timerPanel) {
    return;
  }

  timerPanel.hidden = true;
  setTimerTriggerState(false);

  if (!restoreFocus) {
    return;
  }

  const returnTrigger = isVisibleElement(activeTimerTrigger)
    ? activeTimerTrigger
    : getVisibleTimerTrigger();

  returnTrigger?.focus();
}

function findTextMatch(root, query) {
  const terms = [normalizeWhitespace(query).toLowerCase(), ...tokenize(query)]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);

  for (const term of terms) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        return parent && !parent.closest('script, style, code, pre, mjx-container')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    let node = walker.nextNode();

    while (node) {
      const index = (node.textContent ?? '').toLowerCase().indexOf(term);

      if (index >= 0) {
        return { node, index, length: term.length };
      }

      node = walker.nextNode();
    }
  }

  return null;
}

function clipStudyText(text, maxLength = 1800) {
  const normalized = normalizeWhitespace(text);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function getPracticeStudyPrompt(problemCard, userWork) {
  const title = clipStudyText(problemCard.querySelector('.practice-problem__title-text')?.textContent ?? '');
  const prompt = clipStudyText(problemCard.querySelector('[data-practice-prompt]')?.textContent ?? '', 2200);
  const referenceAnswer = clipStudyText(problemCard.dataset.problemAnswer ?? '', 800);
  const referenceSolution = clipStudyText(problemCard.querySelector('[data-practice-solution] .markdown-body')?.textContent ?? '', 2200);
  const studyWork = clipStudyText(userWork || '', 3000) || '(no work entered)';

  return [
    'Study mode.',
    '',
    'You are helping a student talk through a practice problem.',
    'Use a supportive tutoring tone and focus on reasoning, not just the final answer.',
    'Compare the student work against the reference answer and solution.',
    'If the work is correct, say why. If it is wrong, identify the mistake and show the next step.',
    'End with one short follow-up question that keeps the conversation going.',
    '',
    `Problem title: ${title || '(untitled)'}`,
    `Problem prompt: ${prompt || '(no prompt text available)'}`,
    `Student work: ${studyWork}`,
    `Reference answer: ${referenceAnswer || '(no answer provided)'}`,
    `Reference solution: ${referenceSolution || '(no solution text provided)'}`,
  ].join('\n');
}

function openPracticeStudyMode(problemCard, userWork) {
  const prompt = getPracticeStudyPrompt(problemCard, userWork);
  const chatGptUrl = new URL('https://chatgpt.com/');
  chatGptUrl.searchParams.set('q', prompt);

  const opened = window.open(chatGptUrl.toString(), '_blank', 'noopener,noreferrer');

  if (opened) {
    opened.opener = null;
  }
}

function revealQueryMatch() {
  const query = new URLSearchParams(window.location.search).get('q');

  if (!noteContent || !query) {
    return;
  }

  const match = findTextMatch(noteContent, query);

  if (!match) {
    return;
  }

  const source = match.node;
  const text = source.textContent ?? '';
  const mark = document.createElement('mark');
  const fragment = document.createDocumentFragment();

  mark.className = 'notes-search-match';
  mark.textContent = text.slice(match.index, match.index + match.length);
  fragment.appendChild(document.createTextNode(text.slice(0, match.index)));
  fragment.appendChild(mark);
  fragment.appendChild(document.createTextNode(text.slice(match.index + match.length)));
  source.parentNode.replaceChild(fragment, source);
  mark.scrollIntoView({ block: 'center' });
}

searchTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    if (searchPanel?.hidden) {
      openSearch(trigger);
    } else {
      closeSearch();
    }
  });
});

timerTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    if (timerPanel?.hidden) {
      openTimer(trigger);
    } else {
      closeTimer();
    }
  });
});

document.addEventListener('click', (event) => {
  const themeButton = event.target.closest('[data-theme-toggle]');

  if (themeButton) {
    toggleThemePreference();
    return;
  }

  const leaveButton = event.target.closest('[data-leave-notes]');

  if (leaveButton) {
    window.location.href = '/';
    return;
  }

  const studyButton = event.target.closest('[data-practice-study-submit]');

  if (studyButton) {
    const problemCard = studyButton.closest('[data-practice-problem]');
    const studyInput = problemCard?.querySelector('[data-practice-study-input]');

    if (problemCard) {
      openPracticeStudyMode(problemCard, studyInput?.value ?? '');
    }

    return;
  }

  const solutionButton = event.target.closest('[data-practice-solution-toggle]');

  if (!solutionButton) {
    return;
  }

  const problemCard = solutionButton.closest('[data-practice-problem]');
  const solution = problemCard?.querySelector('[data-practice-solution]');
  const isHidden = solution?.hidden ?? true;

  if (solution) {
    solution.hidden = !isHidden;
  }

  solutionButton.textContent = isHidden ? 'Hide solutions' : 'Show solutions';
});

searchCloseButton?.addEventListener('click', closeSearch);
searchInput?.addEventListener('input', (event) => runSearch(event.target.value));
searchPanel?.addEventListener('click', (event) => {
  if (event.target === searchPanel) {
    closeSearch();
  }
});

timerPanel?.addEventListener('click', (event) => {
  if (event.target === timerPanel) {
    closeTimer();
  }
});

window.addEventListener('keydown', (event) => {
  handleGlobalKeyboardShortcuts(event);
});

syncThemePreference();
renderPlaceholder('Search note titles and note content.');
revealQueryMatch();

syncSubjectNavigation();
window.addEventListener('storage', (event) => {
  if (event.key === NOTES_THEME_STORAGE_KEY) {
    syncThemePreference();
  }
});
window.addEventListener('pageshow', syncSubjectNavigation);
window.addEventListener('pageshow', syncThemePreference);
