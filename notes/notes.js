const searchTriggers = Array.from(document.querySelectorAll('[data-search-trigger]'));
const searchPanel = document.getElementById('search-panel');
const searchCloseButton = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');
const searchStatus = document.getElementById('search-status');
const searchResults = document.getElementById('search-results');
const noteContent = document.getElementById('note-content');
const subjectHeaderLinks = Array.from(document.querySelectorAll('[data-subject-id]'));
const SEARCH_INDEX_URL = '/notes/search-index.json';
const CHATGPT_BASE_URL = 'https://chatgpt.com/?q=';
const NOTES_SESSION_STORAGE_KEY = 'ues-notes:last-pages-by-subject';

let searchIndex = [];
let searchIndexPromise = null;
let searchIndexReady = false;
let searchIndexFailed = false;
let activeSearchTrigger = searchTriggers[0] ?? null;
let scrollStateFrame = 0;

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

function normalizePracticeAnswer(text) {
  return String(text ?? '').trim();
}

function buildChatGptPrompt(problemCard, submittedAnswer) {
  const title = normalizeWhitespace(problemCard.querySelector('h2')?.textContent ?? '');
  const prompt = normalizeWhitespace(problemCard.querySelector('[data-practice-prompt]')?.textContent ?? '');
  const problemType = normalizeWhitespace(problemCard.dataset.problemType ?? 'unknown');
  const answer = normalizePracticeAnswer(submittedAnswer);

  return [
    'You are a study partner helping me think through this practice problem.',
    `Title: ${title || '(untitled)'}`,
    `Type: ${problemType}`,
    `Problem: ${prompt || '(no problem text found)'}`,
    `Student response: ${answer || '(blank)'}`,
    'Ask exactly one follow-up question that helps me reason about the same problem or a close variation.',
    'Use the student response as context, even if it is incomplete or phrased as a question.',
    'Do not grade the answer, reveal the full solution, or answer with multiple questions.',
    'Keep the question specific and useful. Variations like changing coefficients, using decimals, or testing a nearby case are good when relevant.',
  ].join('\n\n');
}

function openChatGptPrompt(promptText) {
  const url = `${CHATGPT_BASE_URL}${encodeURIComponent(promptText)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
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

function updateFloatingActionsState() {
  document.body.classList.toggle('notes-page--scrolled', window.scrollY > 0);
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
    return;
  }

  if (!normalizedQuery) {
    updateStatus(searchIndexReady ? 'Type to search across all notes.' : 'Loading search index...');
    renderPlaceholder('Search note titles and note content.');
    return;
  }

  if (!searchIndexReady) {
    updateStatus('Loading search index...');
    renderPlaceholder('Results will appear when the index is ready.');
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
    return;
  }

  updateStatus(`${results.length} result${results.length === 1 ? '' : 's'}`);
  searchResults.innerHTML = results.map((result) => {
    const href = `${result.url}?q=${encodeURIComponent(normalizedQuery)}`;
    return `<a class="search-result" href="${escapeHtml(href)}">
      <p class="search-result__title">${escapeHtml(result.title)} <span class="search-result__subject">${escapeHtml(result.subject)}</span></p>
      <p class="search-result__snippet">${highlightText(result.snippet, terms)}</p>
    </a>`;
  }).join('');
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

  activeSearchTrigger = trigger ?? activeSearchTrigger;
  searchPanel.hidden = false;
  setSearchTriggerState(true);
  void loadSearchIndex();
  runSearch(searchInput.value);
  searchInput.focus();
  searchInput.select();
}

function closeSearch() {
  if (!searchPanel) {
    return;
  }

  searchPanel.hidden = true;
  setSearchTriggerState(false);
  activeSearchTrigger?.focus();
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

document.addEventListener('click', (event) => {
  const leaveButton = event.target.closest('[data-leave-notes]');

  if (leaveButton) {
    window.location.href = '/';
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

document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-practice-form]');

  if (!form) {
    return;
  }

  event.preventDefault();

  const problemCard = form.closest('[data-practice-problem]');
  const input = form.querySelector('[data-practice-answer]');

  if (!problemCard || !input) {
    return;
  }

  const promptText = buildChatGptPrompt(problemCard, input.value);
  openChatGptPrompt(promptText);
});

searchCloseButton?.addEventListener('click', closeSearch);
searchInput?.addEventListener('input', (event) => runSearch(event.target.value));
searchPanel?.addEventListener('click', (event) => {
  if (event.target === searchPanel) {
    closeSearch();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && searchPanel && !searchPanel.hidden) {
    closeSearch();
  }
});

window.addEventListener('scroll', () => {
  if (scrollStateFrame) {
    return;
  }

  scrollStateFrame = window.requestAnimationFrame(() => {
    scrollStateFrame = 0;
    updateFloatingActionsState();
  });
}, { passive: true });

updateFloatingActionsState();
renderPlaceholder('Search note titles and note content.');
revealQueryMatch();

syncSubjectNavigation();
window.addEventListener('pageshow', syncSubjectNavigation);
