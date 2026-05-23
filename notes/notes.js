const searchTrigger = document.getElementById('search-trigger');
const searchPanel = document.getElementById('search-panel');
const searchCloseButton = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');
const searchStatus = document.getElementById('search-status');
const searchResults = document.getElementById('search-results');
const noteContent = document.getElementById('note-content') ?? document.querySelector('.markdown-body');
const SEARCH_INDEX_URL = '/notes/search-index.json';

let searchIndex = [];
let searchIndexPromise = null;
let searchIndexReady = false;
let searchIndexFailed = false;

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

function openSearch() {
  if (!searchPanel || !searchTrigger || !searchInput) {
    return;
  }

  searchPanel.hidden = false;
  searchTrigger.setAttribute('aria-expanded', 'true');
  void loadSearchIndex();
  runSearch(searchInput.value);
  searchInput.focus();
  searchInput.select();
}

function closeSearch() {
  if (!searchPanel || !searchTrigger) {
    return;
  }

  searchPanel.hidden = true;
  searchTrigger.setAttribute('aria-expanded', 'false');
  searchTrigger.focus();
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

searchTrigger?.addEventListener('click', () => {
  if (searchPanel?.hidden) {
    openSearch();
  } else {
    closeSearch();
  }
});

document.addEventListener('click', (event) => {
  const leaveButton = event.target.closest('[data-leave-notes]');

  if (!leaveButton) {
    return;
  }

  window.location.href = '/';
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

renderPlaceholder('Search note titles and note content.');
revealQueryMatch();
