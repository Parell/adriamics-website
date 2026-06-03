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
const practicePage = document.querySelector('[data-practice-page]');
const practiceProgressBar = document.querySelector('[data-practice-progress]');
const practiceProgressSummary = document.querySelector('[data-practice-progress-summary]');
const practiceProblemCards = Array.from(document.querySelectorAll('[data-practice-problem]'));
const subjectHeaderLinks = Array.from(document.querySelectorAll('[data-subject-id]'));
const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
const pomodoroPresetButtons = Array.from(document.querySelectorAll('[data-pomodoro-trigger]'));
const pomodoroBar = document.querySelector('[data-pomodoro-bar]');
const pomodoroStatus = document.querySelector('[data-pomodoro-status]');
const SEARCH_INDEX_URL = '/notes/search-index.json';
const NOTES_SESSION_STORAGE_KEY = 'ues-notes:last-pages-by-subject';
const NOTES_THEME_STORAGE_KEY = 'ues-notes:contrast-mode';
const PRACTICE_COMPLETION_STORAGE_KEY_PREFIX = 'ues-notes:practice-completion:';
const POMODORO_TIMER_STORAGE_KEY = 'ues-notes:pomodoro-timer';
const POMODORO_COMPLETION_FLASH_MS = 2200;
const POMODORO_TIMER_MODES = new Map([
  ['focus', { minutes: 25, label: 'Focus' }],
  ['short', { minutes: 5, label: 'Short break' }],
  ['long', { minutes: 15, label: 'Long break' }],
]);

let searchIndex = [];
let searchIndexPromise = null;
let searchIndexReady = false;
let searchIndexFailed = false;
let activeSearchTrigger = searchTriggers[0] ?? null;
let activeTimerTrigger = timerTriggers[0] ?? null;
let activeSearchResultIndex = -1;
let pomodoroTimerState = null;
let pomodoroTimerIntervalId = null;
let pomodoroTimerCompletionTimeoutId = null;
let pomodoroTimerStorageWriteFailed = false;

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

function getPracticeCompletionStorageKey() {
  if (!practicePage) {
    return null;
  }

  return `${PRACTICE_COMPLETION_STORAGE_KEY_PREFIX}${window.location.pathname}`;
}

function readPracticeCompletionIds() {
  const storage = getLocalStorage();
  const storageKey = getPracticeCompletionStorageKey();

  if (!storage || !storageKey) {
    return new Set();
  }

  try {
    const raw = storage.getItem(storageKey);

    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean));
  } catch {
    return new Set();
  }
}

function writePracticeCompletionIds(ids) {
  const storage = getLocalStorage();
  const storageKey = getPracticeCompletionStorageKey();

  if (!storage || !storageKey) {
    return;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage quota or privacy-mode failures.
  }
}

function updatePracticeProgressUi(completedCount, totalCount) {
  if (practiceProgressBar) {
    const progress = totalCount > 0 ? completedCount / totalCount : 0;
    practiceProgressBar.style.setProperty('--practice-progress', String(Math.max(0, Math.min(1, progress))));
    practiceProgressBar.setAttribute('aria-valuenow', String(Math.round(Math.max(0, Math.min(100, progress * 100)))));
    practiceProgressBar.setAttribute('aria-valuetext', `${completedCount} of ${totalCount} problems completed`);
  }

  if (practiceProgressSummary) {
    practiceProgressSummary.textContent = `${completedCount} of ${totalCount} completed`;
  }
}

function applyPracticeCompletionState(completedIds) {
  if (!practicePage) {
    return;
  }

  const completedSet = completedIds instanceof Set ? completedIds : new Set(completedIds);
  let completedCount = 0;

  practiceProblemCards.forEach((card) => {
    const toggle = card.querySelector('[data-practice-complete-toggle]');
    const isComplete = Boolean(card.id) && completedSet.has(card.id);

    card.classList.toggle('is-complete', isComplete);

    if (toggle) {
      toggle.setAttribute('aria-pressed', isComplete ? 'true' : 'false');
    }

    if (isComplete) {
      completedCount += 1;
    }
  });

  updatePracticeProgressUi(completedCount, practiceProblemCards.length);
}

function syncPracticeCompletionState() {
  if (!practicePage) {
    return;
  }

  applyPracticeCompletionState(readPracticeCompletionIds());
}

function persistPracticeCompletionState() {
  if (!practicePage) {
    return;
  }

  const completedIds = new Set();
  let completedCount = 0;

  practiceProblemCards.forEach((card) => {
    const toggle = card.querySelector('[data-practice-complete-toggle]');
    const isComplete = toggle?.getAttribute('aria-pressed') === 'true';

    card.classList.toggle('is-complete', Boolean(isComplete));

    if (toggle) {
      toggle.setAttribute('aria-pressed', isComplete ? 'true' : 'false');
    }

    if (isComplete && card.id) {
      completedIds.add(card.id);
      completedCount += 1;
    }
  });

  writePracticeCompletionIds(completedIds);
  updatePracticeProgressUi(completedCount, practiceProblemCards.length);
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

function getPomodoroModeConfig(mode) {
  return POMODORO_TIMER_MODES.get(mode) ?? null;
}

function formatPomodoroTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function normalizePomodoroState(rawState) {
  if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) {
    return null;
  }

  const mode = typeof rawState.mode === 'string' ? rawState.mode : '';
  const config = getPomodoroModeConfig(mode);
  const startedAt = Number(rawState.startedAt);
  const endsAt = Number(rawState.endsAt);
  const completedAt = Number(rawState.completedAt);
  const status = rawState.status === 'completed' ? 'completed' : 'running';

  if (!config || !Number.isFinite(startedAt) || !Number.isFinite(endsAt) || endsAt <= startedAt) {
    return null;
  }

  if (status === 'completed' && !Number.isFinite(completedAt)) {
    return null;
  }

  return {
    mode,
    label: config.label,
    minutes: config.minutes,
    startedAt,
    endsAt,
    status,
    completedAt: Number.isFinite(completedAt) ? completedAt : null,
  };
}

function readPomodoroState() {
  const storage = getLocalStorage();

  if (!storage) {
    return pomodoroTimerState;
  }

  try {
    const raw = storage.getItem(POMODORO_TIMER_STORAGE_KEY);

    if (!raw) {
      return pomodoroTimerStorageWriteFailed ? pomodoroTimerState : null;
    }

    const state = normalizePomodoroState(JSON.parse(raw));

    if (!state) {
      storage.removeItem(POMODORO_TIMER_STORAGE_KEY);
    }

    return state ?? (pomodoroTimerStorageWriteFailed ? pomodoroTimerState : null);
  } catch {
    return pomodoroTimerStorageWriteFailed ? pomodoroTimerState : null;
  }
}

function writePomodoroState(state) {
  const storage = getLocalStorage();

  if (!storage) {
    pomodoroTimerState = state;
    return;
  }

  try {
    storage.setItem(POMODORO_TIMER_STORAGE_KEY, JSON.stringify(state));
    pomodoroTimerState = state;
    pomodoroTimerStorageWriteFailed = false;
  } catch {
    pomodoroTimerState = state;
    pomodoroTimerStorageWriteFailed = true;
  }
}

function clearPomodoroState() {
  const storage = getLocalStorage();

  pomodoroTimerState = null;

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(POMODORO_TIMER_STORAGE_KEY);
    pomodoroTimerStorageWriteFailed = false;
  } catch {
    // Ignore storage quota or privacy-mode failures.
  }
}

function getPomodoroSnapshot(now = Date.now()) {
  const state = readPomodoroState();

  if (!state) {
    return {
      status: 'idle',
      mode: null,
      label: null,
      minutes: null,
      startedAt: null,
      endsAt: null,
      completedAt: null,
      remainingMs: 0,
      progress: 0,
      valueNow: 0,
      valueText: 'Pomodoro timer is idle',
    };
  }

  if (state.status === 'completed') {
    const completedAt = state.completedAt ?? state.endsAt;
    const expiresAt = completedAt + POMODORO_COMPLETION_FLASH_MS;

    if (now >= expiresAt) {
      return {
        status: 'idle',
        mode: null,
        label: null,
        minutes: null,
        startedAt: null,
        endsAt: null,
        completedAt: null,
        remainingMs: 0,
        progress: 0,
        valueNow: 0,
        valueText: 'Pomodoro timer is idle',
      };
    }

    return {
      ...state,
      completedAt,
      remainingMs: 0,
      progress: 1,
      valueNow: 100,
      valueText: `${state.label} timer complete`,
    };
  }

  const remainingMs = Math.max(0, state.endsAt - now);

  if (remainingMs <= 0) {
    return {
      ...state,
      status: 'completed',
      completedAt: state.endsAt,
      remainingMs: 0,
      progress: 1,
      valueNow: 100,
      valueText: `${state.label} timer complete`,
    };
  }

  const progress = 1 - (remainingMs / ((state.endsAt - state.startedAt) || 1));

  return {
    ...state,
    remainingMs,
    progress: Math.max(0, Math.min(1, progress)),
    valueNow: Math.round(Math.max(0, Math.min(100, progress * 100))),
    valueText: `${state.label} timer, ${formatPomodoroTime(remainingMs)} remaining`,
  };
}

function setPomodoroTimerTicker(isActive) {
  if (isActive) {
    if (pomodoroTimerIntervalId !== null) {
      return;
    }

    pomodoroTimerIntervalId = window.setInterval(() => {
      syncPomodoroTimer();
    }, 250);
    return;
  }

  if (pomodoroTimerIntervalId !== null) {
    window.clearInterval(pomodoroTimerIntervalId);
    pomodoroTimerIntervalId = null;
  }
}

function setPomodoroCompletionTimeout(expiresAt) {
  if (pomodoroTimerCompletionTimeoutId !== null) {
    window.clearTimeout(pomodoroTimerCompletionTimeoutId);
    pomodoroTimerCompletionTimeoutId = null;
  }

  const delay = Math.max(0, expiresAt - Date.now() + 25);

  pomodoroTimerCompletionTimeoutId = window.setTimeout(() => {
    pomodoroTimerCompletionTimeoutId = null;
    syncPomodoroTimer();
  }, delay);
}

function clearPomodoroCompletionTimeout() {
  if (pomodoroTimerCompletionTimeoutId === null) {
    return;
  }

  window.clearTimeout(pomodoroTimerCompletionTimeoutId);
  pomodoroTimerCompletionTimeoutId = null;
}

function updatePomodoroUi(snapshot) {
  if (pomodoroBar) {
    const mode = snapshot.status === 'idle' ? '' : snapshot.mode ?? '';

    if (mode) {
      pomodoroBar.dataset.mode = mode;
    } else {
      delete pomodoroBar.dataset.mode;
    }

    pomodoroBar.classList.toggle('is-running', snapshot.status === 'running');
    pomodoroBar.classList.toggle('is-complete', snapshot.status === 'completed');
    pomodoroBar.style.setProperty('--pomodoro-progress', String(snapshot.progress ?? 0));
    pomodoroBar.setAttribute('aria-valuenow', String(snapshot.valueNow ?? 0));
    pomodoroBar.setAttribute('aria-valuetext', snapshot.valueText ?? 'Pomodoro timer is idle');
  }

  pomodoroPresetButtons.forEach((button) => {
    const isActive = snapshot.status !== 'idle' && button.dataset.pomodoroMode === snapshot.mode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if (pomodoroStatus) {
    pomodoroStatus.textContent = snapshot.valueText ?? 'Pomodoro timer is idle';
  }
}

function startPomodoroTimer(mode) {
  const config = getPomodoroModeConfig(mode);

  if (!config) {
    return;
  }

  const now = Date.now();
  const durationMs = config.minutes * 60 * 1000;
  const state = {
    mode,
    label: config.label,
    minutes: config.minutes,
    startedAt: now,
    endsAt: now + durationMs,
    status: 'running',
    completedAt: null,
  };

  clearPomodoroCompletionTimeout();
  writePomodoroState(state);
  syncPomodoroTimer();
}

function syncPomodoroTimer() {
  const now = Date.now();
  let state = readPomodoroState();

  if (!state) {
    pomodoroTimerState = null;
    clearPomodoroCompletionTimeout();
    setPomodoroTimerTicker(false);
    updatePomodoroUi(getPomodoroSnapshot(now));
    return;
  }

  if (state.status === 'running' && now >= state.endsAt) {
    state = {
      ...state,
      status: 'completed',
      completedAt: state.endsAt,
    };
    writePomodoroState(state);
  }

  if (state.status === 'completed') {
    const completedAt = state.completedAt ?? state.endsAt;
    const expiresAt = completedAt + POMODORO_COMPLETION_FLASH_MS;

    if (now >= expiresAt) {
      clearPomodoroState();
      clearPomodoroCompletionTimeout();
      setPomodoroTimerTicker(false);
      updatePomodoroUi(getPomodoroSnapshot(now));
      return;
    }

    pomodoroTimerState = state;
    setPomodoroTimerTicker(true);
    setPomodoroCompletionTimeout(expiresAt);
    updatePomodoroUi({
      ...state,
      completedAt,
      remainingMs: 0,
      progress: 1,
      valueNow: 100,
      valueText: `${state.label} timer complete`,
    });
    return;
  }

  pomodoroTimerState = state;
  clearPomodoroCompletionTimeout();
  setPomodoroTimerTicker(true);
  updatePomodoroUi({
    ...state,
    remainingMs: Math.max(0, state.endsAt - now),
    progress: Math.max(0, Math.min(1, 1 - ((state.endsAt - now) / ((state.endsAt - state.startedAt) || 1)))),
    valueNow: Math.round(Math.max(0, Math.min(100, (1 - ((state.endsAt - now) / ((state.endsAt - state.startedAt) || 1))) * 100))),
    valueText: `${state.label} timer, ${formatPomodoroTime(Math.max(0, state.endsAt - now))} remaining`,
  });
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
    if (searchPanel && !searchPanel.hidden) {
      closeSearch();
    } else {
      openSearch();
    }
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

function initFormulaSliderDemo() {
  const root = document.getElementById('formula-slider-demo');

  if (!root || root.dataset.demoInitialized === 'true') {
    return;
  }

  const amplitude = root.querySelector('#wave-amplitude');
  const frequency = root.querySelector('#wave-frequency');
  const offset = root.querySelector('#wave-offset');
  const amplitudeValue = root.querySelector('#wave-amplitude-value');
  const frequencyValue = root.querySelector('#wave-frequency-value');
  const offsetValue = root.querySelector('#wave-offset-value');
  const formula = root.querySelector('#formula-readout');
  const path = root.querySelector('#wave-path');

  if (
    !amplitude
    || !frequency
    || !offset
    || !amplitudeValue
    || !frequencyValue
    || !offsetValue
    || !formula
    || !path
  ) {
    return;
  }

  root.dataset.demoInitialized = 'true';

  const width = 800;
  const height = 300;
  const centerY = height / 2;
  const samples = 220;

  const render = () => {
    const amplitudeValueNumber = Number(amplitude.value);
    const frequencyValueNumber = Number(frequency.value);
    const offsetValueNumber = Number(offset.value);

    amplitudeValue.textContent = amplitudeValueNumber.toFixed(1);
    frequencyValue.textContent = frequencyValueNumber.toFixed(1);
    offsetValue.textContent = offsetValueNumber.toFixed(1);
    formula.textContent = `y = ${amplitudeValueNumber.toFixed(1)} sin(${frequencyValueNumber.toFixed(1)}x) + ${offsetValueNumber.toFixed(1)}`;

    let d = '';

    for (let index = 0; index <= samples; index += 1) {
      const x = (-Math.PI * 2) + ((Math.PI * 4 * index) / samples);
      const y = (amplitudeValueNumber * Math.sin(frequencyValueNumber * x)) + offsetValueNumber;
      const px = (index / samples) * width;
      const py = centerY - (y * 30);
      d += `${index === 0 ? 'M' : 'L'}${px.toFixed(2)} ${py.toFixed(2)} `;
    }

    path.setAttribute('d', d.trim());
  };

  root.addEventListener('input', render);
  render();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value, digits = 1) {
  return Number(toNumber(value, 0).toFixed(digits)).toString();
}

function formatFixed(value, digits = 2) {
  return toNumber(value, 0).toFixed(digits);
}

function formatSignedFixed(value, digits = 1) {
  const fixed = formatFixed(value, digits);
  return fixed.startsWith('-') ? fixed : `+${fixed}`;
}

function setTextContent(element, value) {
  if (element) {
    element.textContent = String(value);
  }
}

function getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y) {
  return {
    x: ((x - xMin) / (xMax - xMin)) * width,
    y: height - (((y - yMin) / (yMax - yMin)) * height),
  };
}

function buildPathFromFunction(fn, xMin, xMax, samples, width, height, yMin, yMax) {
  let path = '';
  let previousWasFinite = false;

  for (let index = 0; index <= samples; index += 1) {
    const x = xMin + ((xMax - xMin) * index) / samples;
    const y = fn(x);

    if (!Number.isFinite(y)) {
      previousWasFinite = false;
      continue;
    }

    const point = getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);
    path += `${previousWasFinite ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
    previousWasFinite = true;
  }

  return path.trim();
}

function buildLineFromPoints(left, right) {
  return `${left.x.toFixed(2)} ${left.y.toFixed(2)} ${right.x.toFixed(2)} ${right.y.toFixed(2)}`;
}

function buildArrowMarkup(x1, y1, x2, y2, color, strokeWidth = 4) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = 12;
  const headWidth = 9;
  const baseX = x2 - (Math.cos(angle) * headLength);
  const baseY = y2 - (Math.sin(angle) * headLength);
  const spreadX = Math.sin(angle) * (headWidth / 2);
  const spreadY = Math.cos(angle) * (headWidth / 2);
  const leftX = baseX + spreadX;
  const leftY = baseY - spreadY;
  const rightX = baseX - spreadX;
  const rightY = baseY + spreadY;

  return [
    `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />`,
    `<polygon points="${x2.toFixed(2)},${y2.toFixed(2)} ${leftX.toFixed(2)},${leftY.toFixed(2)} ${rightX.toFixed(2)},${rightY.toFixed(2)}" fill="${color}" />`,
  ].join('');
}

function syncDemoControlOutputs(root) {
  root.querySelectorAll('input[id], select[id]').forEach((control) => {
    const output = document.getElementById(`${control.id}-value`);

    if (!output) {
      return;
    }

    if (control.tagName === 'SELECT') {
      output.textContent = control.selectedOptions[0]?.textContent ?? control.value;
      return;
    }

    output.textContent = control.value;
  });
}

function createMathDemoSvg(viewBox, innerHtml, label = 'Interactive visual') {
  return `<svg class="interactive-demo__svg" viewBox="${viewBox}" role="img" aria-label="${label}">
    ${innerHtml}
  </svg>`;
}

const MATH_INTERACTIVE_VISUALS = {
  arithmetic: createMathDemoSvg('0 0 800 180', `
    <line x1="50" y1="110" x2="750" y2="110" stroke="var(--border)" stroke-width="2" />
    <g id="math-demo-arithmetic-ticks"></g>
    <line id="math-demo-arithmetic-arrow" x1="160" y1="70" x2="240" y2="70" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" />
    <circle id="math-demo-arithmetic-start-point" cx="160" cy="70" r="10" fill="var(--accent-strong)" />
    <circle id="math-demo-arithmetic-end-point" cx="240" cy="70" r="10" fill="var(--pomodoro-short)" />
    <text id="math-demo-arithmetic-start-label" x="160" y="54" fill="var(--muted)" font-size="16" text-anchor="middle"></text>
    <text id="math-demo-arithmetic-end-label" x="240" y="54" fill="var(--muted)" font-size="16" text-anchor="middle"></text>
  `, 'Number line visual'),
  'line-graph': createMathDemoSvg('0 0 800 320', `
    <path id="math-demo-algebra-line" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <circle id="math-demo-algebra-y-intercept" cx="400" cy="160" r="8" fill="var(--pomodoro-short)" />
    <circle id="math-demo-algebra-x-intercept" cx="400" cy="160" r="8" fill="var(--pomodoro-long)" />
  `, 'Linear equation visual'),
  'function-family': createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-functions-axes"></g>
    <path id="math-demo-functions-base-path" fill="none" stroke="rgba(255,255,255,0.42)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    <path id="math-demo-functions-active-path" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  `, 'Function family visual'),
  probability: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-probability-axis"></g>
    <g id="math-demo-probability-bars"></g>
  `, 'Binomial distribution visual'),
  statistics: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-statistics-axis"></g>
    <g id="math-demo-statistics-ticks"></g>
    <line id="math-demo-statistics-mean-line" x1="60" y1="35" x2="60" y2="285" stroke="var(--pomodoro-long)" stroke-width="3" stroke-dasharray="8 6" />
    <g id="math-demo-statistics-points"></g>
  `, 'Dot plot visual'),
  trig: createMathDemoSvg('0 0 800 320', `
    <circle cx="170" cy="160" r="110" fill="none" stroke="var(--border)" stroke-width="2" opacity="0.9" />
    <line id="math-demo-trigonometry-radius" x1="170" y1="160" x2="280" y2="50" stroke="var(--accent-strong)" stroke-width="3" stroke-linecap="round" />
    <circle id="math-demo-trigonometry-point" cx="280" cy="50" r="7" fill="var(--pomodoro-short)" />
    <path id="math-demo-trigonometry-wave" d="" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <line id="math-demo-trigonometry-wave-marker" x1="350" y1="30" x2="350" y2="290" stroke="var(--pomodoro-long)" stroke-width="2" stroke-dasharray="6 6" />
  `, 'Unit circle and wave visual'),
  limits: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-limits-axes"></g>
    <path id="math-demo-limits-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <circle id="math-demo-limits-hole" cx="400" cy="160" r="7" fill="#090909" stroke="var(--accent-strong)" stroke-width="3" />
    <circle id="math-demo-limits-left-probe" cx="360" cy="140" r="6" fill="var(--accent-strong)" />
    <circle id="math-demo-limits-right-probe" cx="440" cy="140" r="6" fill="var(--pomodoro-short)" />
  `, 'Limit visual'),
  derivative: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-derivatives-axes"></g>
    <path id="math-demo-derivatives-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <line id="math-demo-derivatives-tangent" x1="120" y1="160" x2="200" y2="120" stroke="var(--pomodoro-long)" stroke-width="3" stroke-linecap="round" />
    <circle id="math-demo-derivatives-touch-point" cx="400" cy="160" r="7" fill="var(--pomodoro-short)" />
  `, 'Derivative visual'),
  integral: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-integrals-axes"></g>
    <path id="math-demo-integrals-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path id="math-demo-integrals-area-path" fill="rgba(255,255,255,0.08)" stroke="none" />
    <g id="math-demo-integrals-rectangles" fill="rgba(255,255,255,0.08)" stroke="var(--pomodoro-short)" stroke-width="1"></g>
  `, 'Integral visual'),
  series: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-series-axes"></g>
    <path id="math-demo-series-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <line id="math-demo-series-limit-line" x1="60" y1="100" x2="740" y2="100" stroke="var(--pomodoro-long)" stroke-width="3" stroke-dasharray="8 6" />
    <g id="math-demo-series-points"></g>
  `, 'Series visual'),
  vectors: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-vectors-axes"></g>
    <line id="math-demo-vectors-vector-a" x1="400" y1="160" x2="430" y2="130" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" />
    <line id="math-demo-vectors-vector-b" x1="430" y1="130" x2="490" y2="90" stroke="var(--pomodoro-short)" stroke-width="4" stroke-linecap="round" />
    <line id="math-demo-vectors-vector-r" x1="400" y1="160" x2="490" y2="90" stroke="var(--pomodoro-long)" stroke-width="5" stroke-linecap="round" />
    <circle id="math-demo-vectors-tip-a" cx="430" cy="130" r="6" fill="var(--accent-strong)" />
    <circle id="math-demo-vectors-tip-b" cx="490" cy="90" r="6" fill="var(--pomodoro-short)" />
    <circle id="math-demo-vectors-tip-r" cx="490" cy="90" r="7" fill="var(--pomodoro-long)" />
  `, 'Vector addition visual'),
  geometry: createMathDemoSvg('0 0 800 320', `
    <polygon id="math-demo-geometry-triangle" points="140,230 308,230 255,110" fill="rgba(255,255,255,0.05)" stroke="var(--accent-strong)" stroke-width="3" />
    <circle id="math-demo-geometry-vertex-a" cx="140" cy="230" r="7" fill="var(--accent-strong)" />
    <circle id="math-demo-geometry-vertex-b" cx="308" cy="230" r="7" fill="var(--pomodoro-short)" />
    <circle id="math-demo-geometry-vertex-c" cx="255" cy="110" r="7" fill="var(--pomodoro-long)" />
    <text id="math-demo-geometry-labels" x="40" y="40" fill="var(--text)" font-size="16"></text>
  `, 'Triangle visual'),
  matrix: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-matrices-grid" stroke="var(--border)" stroke-width="1" opacity="0.85" fill="none"></g>
    <path id="math-demo-matrices-square" fill="rgba(255,255,255,0.05)" stroke="var(--accent-strong)" stroke-width="3" stroke-linejoin="round" />
    <line id="math-demo-matrices-basis-x" x1="400" y1="160" x2="480" y2="160" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" />
    <line id="math-demo-matrices-basis-y" x1="400" y1="160" x2="400" y2="80" stroke="var(--pomodoro-short)" stroke-width="4" stroke-linecap="round" />
  `, 'Matrix transform visual'),
  eigenvalues: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-eigenvalues-grid" stroke="var(--border)" stroke-width="1" opacity="0.85" fill="none"></g>
    <path id="math-demo-eigenvalues-ellipse" fill="rgba(255,255,255,0.05)" stroke="var(--accent-strong)" stroke-width="3" stroke-linejoin="round" />
    <line id="math-demo-eigenvalues-evec-1" x1="400" y1="160" x2="480" y2="120" stroke="var(--pomodoro-short)" stroke-width="4" stroke-linecap="round" />
    <line id="math-demo-eigenvalues-evec-2" x1="400" y1="160" x2="360" y2="80" stroke="var(--pomodoro-long)" stroke-width="4" stroke-linecap="round" />
  `, 'Eigenvalues visual'),
  'recursion-tree': createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-discrete-math-links" stroke="var(--border)" stroke-width="2" fill="none"></g>
    <g id="math-demo-discrete-math-nodes" fill="var(--accent-strong)"></g>
  `, 'Recursion tree visual'),
  'growth-model': createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-modeling-axes"></g>
    <path id="math-demo-modeling-curve" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <g id="math-demo-modeling-points"></g>
  `, 'Growth model visual'),
  'slope-field': createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-first-order-odes-field" stroke="var(--border)" stroke-width="1.5" opacity="0.9" fill="none"></g>
    <path id="math-demo-first-order-odes-solution-path" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <circle id="math-demo-first-order-odes-initial-point" cx="400" cy="160" r="7" fill="var(--pomodoro-short)" />
  `, 'Slope field visual'),
  oscillator: createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-second-order-odes-axes"></g>
    <path id="math-demo-second-order-odes-oscillation" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path id="math-demo-second-order-odes-envelope" fill="none" stroke="var(--pomodoro-long)" stroke-width="2.5" stroke-dasharray="8 6" />
  `, 'Oscillator visual'),
  'phase-portrait': createMathDemoSvg('0 0 800 320', `
    <g id="math-demo-systems-of-odes-field" stroke="var(--border)" stroke-width="1.5" opacity="0.9" fill="none"></g>
    <path id="math-demo-systems-of-odes-trajectory" fill="none" stroke="var(--accent-strong)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <circle id="math-demo-systems-of-odes-phase-point" cx="430" cy="140" r="7" fill="var(--pomodoro-short)" />
  `, 'Phase portrait visual'),
};

function initMathInteractiveVisuals() {
  const roots = Array.from(document.querySelectorAll('[data-math-demo]'));

  roots.forEach((root) => {
    if (!(root instanceof HTMLElement) || root.dataset.demoInitialized === 'true') {
      return;
    }

    const kind = root.dataset.mathDemo ?? '';
    const demo = getMathInteractiveDemoConfig(kind);

    if (!demo) {
      return;
    }

    if (demo.skeleton) {
      const figure = root.querySelector('.interactive-demo__figure');
      if (figure && demo.sentinelId && !root.querySelector(demo.sentinelId)) {
        const note = figure.querySelector('.interactive-demo__note');
        if (note) {
          note.insertAdjacentHTML('beforebegin', demo.skeleton);
        } else {
          figure.insertAdjacentHTML('beforeend', demo.skeleton);
        }
      }
    }

    let render;

    try {
      render = demo.renderer(root);
    } catch (error) {
      console.error(`Failed to initialize interactive demo "${kind}"`, error);
      return;
    }

    if (typeof render !== 'function') {
      root.dataset.demoInitialized = 'true';
      return;
    }

    const rerender = () => {
      try {
        syncDemoControlOutputs(root);
        render();
      } catch (error) {
        console.error(`Failed to render interactive demo "${demo.kind}"`, error);
      }
    };

    root.addEventListener('input', rerender);
    root.addEventListener('change', rerender);
    root.addEventListener('click', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('.interactive-demo__toggle')) {
        rerender();
      }
    });
    root.dataset.demoInitialized = 'true';
    rerender();
  });
}

function renderArithmeticDemo(root) {
  const startInput = root.querySelector('#math-demo-arithmetic-start');
  const stepInput = root.querySelector('#math-demo-arithmetic-step');
  const equation = root.querySelector('#math-demo-arithmetic-equation');
  const distance = root.querySelector('#math-demo-arithmetic-distance');
  const startPoint = root.querySelector('#math-demo-arithmetic-start-point');
  const endPoint = root.querySelector('#math-demo-arithmetic-end-point');
  const arrow = root.querySelector('#math-demo-arithmetic-arrow');
  const startLabel = root.querySelector('#math-demo-arithmetic-start-label');
  const endLabel = root.querySelector('#math-demo-arithmetic-end-label');
  const ticks = root.querySelector('#math-demo-arithmetic-ticks');

  if (!startInput || !stepInput || !equation || !distance || !startPoint || !endPoint || !arrow || !startLabel || !endLabel || !ticks) {
    return () => {};
  }

  const width = 800;
  const xMin = -10;
  const xMax = 10;
  const tickMarks = Array.from({ length: 21 }, (_, index) => -10 + index);

  ticks.innerHTML = tickMarks.map((value) => {
    const x = 50 + (((value - xMin) / (xMax - xMin)) * 700);
    return `<line x1="${x.toFixed(2)}" y1="98" x2="${x.toFixed(2)}" y2="122"></line><text x="${x.toFixed(2)}" y="150" fill="var(--muted)" font-size="14" text-anchor="middle">${value}</text>`;
  }).join('');

  return () => {
    const start = toNumber(startInput.value, 0);
    const step = toNumber(stepInput.value, 0);
    const end = start + step;
    const startPointX = 50 + (((start - xMin) / (xMax - xMin)) * 700);
    const endPointX = 50 + (((end - xMin) / (xMax - xMin)) * 700);

    startPoint.setAttribute('cx', startPointX.toFixed(2));
    endPoint.setAttribute('cx', endPointX.toFixed(2));
    arrow.setAttribute('x1', startPointX.toFixed(2));
    arrow.setAttribute('x2', endPointX.toFixed(2));
    equation.textContent = `${formatNumber(start, 0)} + ${formatNumber(step, 0)} = ${formatNumber(end, 0)}`;
    distance.textContent = formatNumber(Math.abs(end), 0);
    startLabel.setAttribute('x', startPointX.toFixed(2));
    endLabel.setAttribute('x', endPointX.toFixed(2));
    startLabel.textContent = formatNumber(start, 0);
    endLabel.textContent = formatNumber(end, 0);
  };
}

function renderAlgebraDemo(root) {
  const slopeInput = root.querySelector('#math-demo-algebra-slope');
  const interceptInput = root.querySelector('#math-demo-algebra-intercept');
  const equation = root.querySelector('#math-demo-algebra-equation');
  const intercepts = root.querySelector('#math-demo-algebra-intercepts');
  const line = root.querySelector('#math-demo-algebra-line');
  const yIntercept = root.querySelector('#math-demo-algebra-y-intercept');
  const xIntercept = root.querySelector('#math-demo-algebra-x-intercept');

  if (!slopeInput || !interceptInput || !equation || !intercepts || !line || !yIntercept || !xIntercept) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = -5;
  const xMax = 5;
  const yMin = -5;
  const yMax = 5;

  const mapX = (x) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, 0).x;
  const mapY = (y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, 0, y).y;

  return () => {
    const m = toNumber(slopeInput.value, 0);
    const b = toNumber(interceptInput.value, 0);
    const x1 = xMin;
    const x2 = xMax;
    const y1 = (m * x1) + b;
    const y2 = (m * x2) + b;
    const yInterceptPoint = getPlotPoint(width, height, xMin, xMax, yMin, yMax, 0, b);
    const xInterceptValue = m === 0 ? null : (-b / m);
    const xInterceptPoint = xInterceptValue === null
      ? { x: yInterceptPoint.x, y: yInterceptPoint.y }
      : getPlotPoint(width, height, xMin, xMax, yMin, yMax, xInterceptValue, 0);

    line.setAttribute('d', `M ${mapX(x1).toFixed(2)} ${mapY(y1).toFixed(2)} L ${mapX(x2).toFixed(2)} ${mapY(y2).toFixed(2)}`);
    yIntercept.setAttribute('cx', yInterceptPoint.x.toFixed(2));
    yIntercept.setAttribute('cy', yInterceptPoint.y.toFixed(2));
    xIntercept.setAttribute('cx', xInterceptPoint.x.toFixed(2));
    xIntercept.setAttribute('cy', xInterceptPoint.y.toFixed(2));
    equation.textContent = `y = ${formatFixed(m, 1)}x ${formatSignedFixed(b, 1)}`;
    intercepts.textContent = xInterceptValue === null ? 'x = none, y = ' + formatFixed(b, 1) : `x = ${formatFixed(xInterceptValue, 1)}, y = ${formatFixed(b, 1)}`;
  };
}

function renderTrigDemo(root) {
  const angleInput = root.querySelector('#math-demo-trigonometry-angle');
  const sinValue = root.querySelector('#math-demo-trigonometry-sin');
  const cosValue = root.querySelector('#math-demo-trigonometry-cos');
  const tanValue = root.querySelector('#math-demo-trigonometry-tan');
  const point = root.querySelector('#math-demo-trigonometry-point');
  const radius = root.querySelector('#math-demo-trigonometry-radius');
  const wave = root.querySelector('#math-demo-trigonometry-wave');
  const waveMarker = root.querySelector('#math-demo-trigonometry-wave-marker');

  if (!angleInput || !sinValue || !cosValue || !tanValue || !point || !radius || !wave || !waveMarker) {
    return () => {};
  }

  const circleCenterX = 170;
  const circleCenterY = 160;
  const circleRadius = 110;
  const waveX = 350;
  const waveWidth = 390;
  const waveHeight = 110;
  const waveCenterY = 160;

  return () => {
    const angleDegrees = toNumber(angleInput.value, 0);
    const theta = (angleDegrees * Math.PI) / 180;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const tanTheta = Math.tan(theta);
    const pointX = circleCenterX + (circleRadius * cosTheta);
    const pointY = circleCenterY - (circleRadius * sinTheta);
    const radiusEndX = pointX;
    const radiusEndY = pointY;

    point.setAttribute('cx', pointX.toFixed(2));
    point.setAttribute('cy', pointY.toFixed(2));
    radius.setAttribute('x2', radiusEndX.toFixed(2));
    radius.setAttribute('y2', radiusEndY.toFixed(2));
    sinValue.textContent = formatFixed(sinTheta, 3);
    cosValue.textContent = formatFixed(cosTheta, 3);
    tanValue.textContent = Math.abs(cosTheta) < 1e-4 ? 'undefined' : formatFixed(tanTheta, 3);

    let d = '';
    for (let index = 0; index <= 120; index += 1) {
      const x = (index / 120) * (Math.PI * 2);
      const y = Math.sin(x);
      const px = waveX + ((index / 120) * waveWidth);
      const py = waveCenterY - (y * waveHeight);
      d += `${index === 0 ? 'M' : 'L'}${px.toFixed(2)} ${py.toFixed(2)} `;
    }
    wave.setAttribute('d', d.trim());
    const markerX = waveX + (((theta % (Math.PI * 2)) / (Math.PI * 2)) * waveWidth);
    waveMarker.setAttribute('x1', markerX.toFixed(2));
    waveMarker.setAttribute('x2', markerX.toFixed(2));
    waveMarker.setAttribute('y1', (waveCenterY - waveHeight - 20).toFixed(2));
    waveMarker.setAttribute('y2', (waveCenterY + waveHeight + 20).toFixed(2));
  };
}

const MATH_INTERACTIVE_RENDERERS = {
  arithmetic: renderArithmeticDemo,
  algebra: renderAlgebraDemo,
  trig: renderTrigDemo,
};

function renderFunctionFamilyDemo(root) {
  const familyInput = root.querySelector('#math-demo-functions-family');
  const stretchInput = root.querySelector('#math-demo-functions-stretch');
  const shiftXInput = root.querySelector('#math-demo-functions-shift-x');
  const shiftYInput = root.querySelector('#math-demo-functions-shift-y');
  const formula = root.querySelector('#math-demo-functions-formula');
  const domain = root.querySelector('#math-demo-functions-domain');
  const basePath = root.querySelector('#math-demo-functions-base-path');
  const activePath = root.querySelector('#math-demo-functions-active-path');
  const axes = root.querySelector('#math-demo-functions-axes');

  if (!familyInput || !stretchInput || !shiftXInput || !shiftYInput || !formula || !domain || !basePath || !activePath || !axes) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = -5;
  const xMax = 5;
  const yMin = -4;
  const yMax = 4;

  const map = (x, y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);

  const baseFunctions = {
    linear: (x) => x,
    quadratic: (x) => x * x,
    absolute: (x) => Math.abs(x),
    rational: (x) => (Math.abs(x) < 0.15 ? Number.NaN : 1 / x),
    exponential: (x) => Math.exp(x / 2),
  };

  axes.innerHTML = [
    `<line x1="0" y1="${map(0, yMin).y.toFixed(2)}" x2="800" y2="${map(0, yMin).y.toFixed(2)}" stroke="var(--border)" stroke-width="1" />`,
    `<line x1="${map(xMin, 0).x.toFixed(2)}" y1="0" x2="${map(xMin, 0).x.toFixed(2)}" y2="320" stroke="var(--border)" stroke-width="1" />`,
  ].join('');

  return () => {
    const family = familyInput.value;
    const a = toNumber(stretchInput.value, 1);
    const h = toNumber(shiftXInput.value, 0);
    const k = toNumber(shiftYInput.value, 0);
    const baseFn = baseFunctions[family] ?? baseFunctions.quadratic;
    const transformed = (x) => (a * baseFn(x - h)) + k;
    const base = (x) => baseFn(x);

    basePath.setAttribute('d', buildPathFromFunction(base, xMin, xMax, 300, width, height, yMin, yMax));
    activePath.setAttribute('d', buildPathFromFunction(transformed, xMin, xMax, 300, width, height, yMin, yMax));
    formula.textContent = `y = ${formatFixed(a, 1)} f(x - ${formatFixed(h, 1)}) ${k >= 0 ? '+ ' : '- '}${formatFixed(Math.abs(k), 1)}`;
    domain.textContent = family === 'rational' ? 'x != 0 after the shift' : 'All real numbers';
  };
}

function renderProbabilityDemo(root) {
  const probabilityInput = root.querySelector('#math-demo-probability-probability');
  const trialsInput = root.querySelector('#math-demo-probability-trials');
  const expected = root.querySelector('#math-demo-probability-expected');
  const variance = root.querySelector('#math-demo-probability-variance');
  const bars = root.querySelector('#math-demo-probability-bars');
  const axis = root.querySelector('#math-demo-probability-axis');

  if (!probabilityInput || !trialsInput || !expected || !variance || !bars || !axis) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const chartLeft = 60;
  const chartTop = 30;
  const chartWidth = 700;
  const chartHeight = 240;

  axis.innerHTML = `<line x1="${chartLeft}" y1="${chartTop + chartHeight}" x2="${chartLeft + chartWidth}" y2="${chartTop + chartHeight}" stroke="var(--border)" stroke-width="2" />`;

  function binomial(n, k) {
    let result = 1;
    for (let i = 1; i <= k; i += 1) {
      result *= (n + 1 - i) / i;
    }
    return result;
  }

  return () => {
    const p = clamp(toNumber(probabilityInput.value, 0.5), 0.01, 0.99);
    const n = Math.round(toNumber(trialsInput.value, 1));
    const barWidth = chartWidth / Math.max(1, n + 1);
    const maxProbability = Math.max(...Array.from({ length: n + 1 }, (_, k) => binomial(n, k) * (p ** k) * ((1 - p) ** (n - k))));

    expected.textContent = formatFixed(n * p, 1);
    variance.textContent = formatFixed(n * p * (1 - p), 1);

    bars.innerHTML = Array.from({ length: n + 1 }, (_, k) => {
      const probability = binomial(n, k) * (p ** k) * ((1 - p) ** (n - k));
      const barHeight = (probability / maxProbability) * chartHeight;
      const x = chartLeft + (barWidth * k) + (barWidth * 0.15);
      const y = chartTop + chartHeight - barHeight;
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(barWidth * 0.7).toFixed(2)}" height="${barHeight.toFixed(2)}" fill="${k === Math.round(n * p) ? 'var(--pomodoro-short)' : 'var(--accent-strong)'}" opacity="${k === Math.round(n * p) ? '1' : '0.88'}" /><text x="${(x + (barWidth * 0.35)).toFixed(2)}" y="${(chartTop + chartHeight + 20).toFixed(2)}" text-anchor="middle" fill="var(--muted)" font-size="14">${k}</text>`;
    }).join('');
  };
}

function renderStatisticsDemo(root) {
  const inputs = [
    root.querySelector('#math-demo-statistics-x1'),
    root.querySelector('#math-demo-statistics-x2'),
    root.querySelector('#math-demo-statistics-x3'),
    root.querySelector('#math-demo-statistics-x4'),
    root.querySelector('#math-demo-statistics-x5'),
  ];
  const mean = root.querySelector('#math-demo-statistics-mean');
  const median = root.querySelector('#math-demo-statistics-median');
  const range = root.querySelector('#math-demo-statistics-range');
  const points = root.querySelector('#math-demo-statistics-points');
  const axis = root.querySelector('#math-demo-statistics-axis');
  const ticks = root.querySelector('#math-demo-statistics-ticks');
  const meanLine = root.querySelector('#math-demo-statistics-mean-line');

  if (inputs.some((input) => !input) || !mean || !median || !range || !points || !axis || !ticks || !meanLine) {
    return () => {};
  }

  const chartLeft = 60;
  const chartTop = 35;
  const chartWidth = 700;
  const chartHeight = 230;
  const scale = (value) => chartLeft + ((value / 100) * chartWidth);

  axis.innerHTML = `<line x1="${chartLeft}" y1="${chartTop + chartHeight}" x2="${chartLeft + chartWidth}" y2="${chartTop + chartHeight}" stroke="var(--border)" stroke-width="2" />`;
  ticks.innerHTML = Array.from({ length: 6 }, (_, index) => {
    const value = index * 20;
    const x = scale(value);
    return `<line x1="${x.toFixed(2)}" y1="${chartTop + chartHeight}" x2="${x.toFixed(2)}" y2="${chartTop + chartHeight + 12}" stroke="var(--muted)" stroke-width="1" /><text x="${x.toFixed(2)}" y="${chartTop + chartHeight + 28}" text-anchor="middle" fill="var(--muted)" font-size="14">${value}</text>`;
  }).join('');

  return () => {
    const values = inputs.map((input) => toNumber(input.value, 0));
    const sorted = [...values].sort((left, right) => left - right);
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    const mid = sorted[2];
    const spread = sorted[sorted.length - 1] - sorted[0];

    mean.textContent = formatFixed(avg, 1);
    median.textContent = formatFixed(mid, 0);
    range.textContent = formatFixed(spread, 0);
    meanLine.setAttribute('x1', scale(avg).toFixed(2));
    meanLine.setAttribute('x2', scale(avg).toFixed(2));
    points.innerHTML = values.map((value, index) => {
      const x = scale(value);
      const y = chartTop + 70 + (index * 28);
      return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="9" fill="${index === 2 ? 'var(--pomodoro-long)' : 'var(--accent-strong)'}" /><text x="${(x + 14).toFixed(2)}" y="${(y + 5).toFixed(2)}" fill="var(--text)" font-size="14">${formatFixed(value, 0)}</text>`;
    }).join('');
  };
}

function renderLimitsDemo(root) {
  const holeInput = root.querySelector('#math-demo-limits-a');
  const probeInput = root.querySelector('#math-demo-limits-probe');
  const limit = root.querySelector('#math-demo-limits-limit');
  const leftRight = root.querySelector('#math-demo-limits-left-right');
  const curve = root.querySelector('#math-demo-limits-curve');
  const hole = root.querySelector('#math-demo-limits-hole');
  const leftProbe = root.querySelector('#math-demo-limits-left-probe');
  const rightProbe = root.querySelector('#math-demo-limits-right-probe');
  const axes = root.querySelector('#math-demo-limits-axes');

  if (!holeInput || !probeInput || !limit || !leftRight || !curve || !hole || !leftProbe || !rightProbe || !axes) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = -4;
  const xMax = 4;
  const yMin = -4;
  const yMax = 4;
  const map = (x, y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);

  axes.innerHTML = [
    `<line x1="0" y1="${map(0, 0).y.toFixed(2)}" x2="800" y2="${map(0, 0).y.toFixed(2)}" stroke="var(--border)" stroke-width="1" />`,
    `<line x1="${map(0, 0).x.toFixed(2)}" y1="0" x2="${map(0, 0).x.toFixed(2)}" y2="320" stroke="var(--border)" stroke-width="1" />`,
  ].join('');

  return () => {
    const a = toNumber(holeInput.value, 1);
    const probe = clamp(toNumber(probeInput.value, 0.6), 0.1, 2);
    const fn = (x) => {
      const numerator = (x * x) - (a * a);
      const denominator = x - a;
      if (Math.abs(denominator) < 0.0001) {
        return Number.NaN;
      }
      return numerator / denominator;
    };

    curve.setAttribute('d', buildPathFromFunction(fn, xMin, xMax, 300, width, height, yMin, yMax));
    const limitValue = 2 * a;
    limit.textContent = formatFixed(limitValue, 1);
    leftRight.textContent = `approach ${formatFixed(limitValue, 1)} from both sides`;

    const leftX = a - probe;
    const rightX = a + probe;
    const leftPoint = map(leftX, fn(leftX));
    const rightPoint = map(rightX, fn(rightX));
    const holePoint = map(a, limitValue);

    hole.setAttribute('cx', holePoint.x.toFixed(2));
    hole.setAttribute('cy', holePoint.y.toFixed(2));
    leftProbe.setAttribute('cx', leftPoint.x.toFixed(2));
    leftProbe.setAttribute('cy', leftPoint.y.toFixed(2));
    rightProbe.setAttribute('cx', rightPoint.x.toFixed(2));
    rightProbe.setAttribute('cy', rightPoint.y.toFixed(2));
  };
}

function renderDerivativeDemo(root) {
  const x0Input = root.querySelector('#math-demo-derivatives-x0');
  const slope = root.querySelector('#math-demo-derivatives-slope');
  const derivative = root.querySelector('#math-demo-derivatives-derivative');
  const curve = root.querySelector('#math-demo-derivatives-curve');
  const tangent = root.querySelector('#math-demo-derivatives-tangent');
  const touchPoint = root.querySelector('#math-demo-derivatives-touch-point');
  const axes = root.querySelector('#math-demo-derivatives-axes');

  if (!x0Input || !slope || !derivative || !curve || !tangent || !touchPoint || !axes) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = -3;
  const xMax = 3;
  const yMin = -5;
  const yMax = 5;
  const map = (x, y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);

  axes.innerHTML = [
    `<line x1="0" y1="${map(0, 0).y.toFixed(2)}" x2="800" y2="${map(0, 0).y.toFixed(2)}" stroke="var(--border)" stroke-width="1" />`,
    `<line x1="${map(0, 0).x.toFixed(2)}" y1="0" x2="${map(0, 0).x.toFixed(2)}" y2="320" stroke="var(--border)" stroke-width="1" />`,
  ].join('');

  const f = (x) => (x ** 3) - (3 * x);
  const fp = (x) => (3 * (x ** 2)) - 3;

  return () => {
    const x0 = toNumber(x0Input.value, 0);
    const y0 = f(x0);
    const m = fp(x0);
    const left = x0 - 1.5;
    const right = x0 + 1.5;

    curve.setAttribute('d', buildPathFromFunction(f, xMin, xMax, 300, width, height, yMin, yMax));
    const leftPoint = map(left, y0 + (m * (left - x0)));
    const rightPoint = map(right, y0 + (m * (right - x0)));
    tangent.setAttribute('x1', leftPoint.x.toFixed(2));
    tangent.setAttribute('y1', leftPoint.y.toFixed(2));
    tangent.setAttribute('x2', rightPoint.x.toFixed(2));
    tangent.setAttribute('y2', rightPoint.y.toFixed(2));
    const touch = map(x0, y0);
    touchPoint.setAttribute('cx', touch.x.toFixed(2));
    touchPoint.setAttribute('cy', touch.y.toFixed(2));
    slope.textContent = formatFixed(m, 2);
    derivative.textContent = `f'( ${formatFixed(x0, 1)} ) = ${formatFixed(m, 2)}`;
  };
}

function renderIntegralsDemo(root) {
  const leftInput = root.querySelector('#math-demo-integrals-left');
  const rightInput = root.querySelector('#math-demo-integrals-right');
  const area = root.querySelector('#math-demo-integrals-area');
  const estimate = root.querySelector('#math-demo-integrals-estimate');
  const curve = root.querySelector('#math-demo-integrals-curve');
  const areaPath = root.querySelector('#math-demo-integrals-area-path');
  const rectangles = root.querySelector('#math-demo-integrals-rectangles');
  const axes = root.querySelector('#math-demo-integrals-axes');

  if (!leftInput || !rightInput || !area || !estimate || !curve || !areaPath || !rectangles || !axes) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = -3;
  const xMax = 3;
  const yMin = -1;
  const yMax = 12;
  const map = (x, y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);
  const f = (x) => 1 + (x * x);

  axes.innerHTML = [
    `<line x1="0" y1="${map(0, 0).y.toFixed(2)}" x2="800" y2="${map(0, 0).y.toFixed(2)}" stroke="var(--border)" stroke-width="1" />`,
    `<line x1="${map(0, 0).x.toFixed(2)}" y1="0" x2="${map(0, 0).x.toFixed(2)}" y2="320" stroke="var(--border)" stroke-width="1" />`,
  ].join('');

  return () => {
    const a = Math.min(toNumber(leftInput.value, -1), toNumber(rightInput.value, 1));
    const b = Math.max(toNumber(leftInput.value, -1), toNumber(rightInput.value, 1));
    const samples = 6;
    const exactArea = (b - a) + ((b ** 3) - (a ** 3)) / 3;
    const dx = (b - a) / samples;

    curve.setAttribute('d', buildPathFromFunction(f, xMin, xMax, 300, width, height, yMin, yMax));
    areaPath.setAttribute('d', `M ${map(a, 0).x.toFixed(2)} ${map(a, 0).y.toFixed(2)} ${Array.from({ length: 301 }, (_, index) => {
      const x = a + (((b - a) * index) / 300);
      const point = map(x, f(x));
      return `${index === 0 ? 'L' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)} `;
    }).join('')} L ${map(b, 0).x.toFixed(2)} ${map(b, 0).y.toFixed(2)} Z`);
    rectangles.innerHTML = Array.from({ length: samples }, (_, index) => {
      const x1 = a + (index * dx);
      const x2 = x1 + dx;
      const mid = (x1 + x2) / 2;
      const heightValue = f(mid);
      const p1 = map(x1, 0);
      const p2 = map(x2, heightValue);
      return `<rect x="${p1.x.toFixed(2)}" y="${p2.y.toFixed(2)}" width="${(p2.x - p1.x).toFixed(2)}" height="${(p1.y - p2.y).toFixed(2)}" fill="rgba(255,255,255,0.08)" stroke="var(--pomodoro-short)" stroke-width="1" />`;
    }).join('');
    area.textContent = formatFixed(exactArea, 2);
    estimate.textContent = formatFixed(exactArea, 2);
  };
}

function renderSeriesDemo(root) {
  const ratioInput = root.querySelector('#math-demo-series-ratio');
  const termsInput = root.querySelector('#math-demo-series-terms');
  const partialSum = root.querySelector('#math-demo-series-partial-sum');
  const limit = root.querySelector('#math-demo-series-limit');
  const curve = root.querySelector('#math-demo-series-curve');
  const line = root.querySelector('#math-demo-series-limit-line');
  const points = root.querySelector('#math-demo-series-points');
  const axes = root.querySelector('#math-demo-series-axes');

  if (!ratioInput || !termsInput || !partialSum || !limit || !curve || !line || !points || !axes) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = 0;
  const xMax = 12;
  const yMin = 0;
  const yMax = 2.4;
  const map = (x, y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);
  const sumAt = (r, n) => {
    let total = 0;
    for (let index = 0; index <= n; index += 1) {
      total += r ** index;
    }
    return total;
  };

  axes.innerHTML = [
    `<line x1="0" y1="${map(0, 0).y.toFixed(2)}" x2="800" y2="${map(0, 0).y.toFixed(2)}" stroke="var(--border)" stroke-width="1" />`,
    `<line x1="${map(0, 0).x.toFixed(2)}" y1="0" x2="${map(0, 0).x.toFixed(2)}" y2="320" stroke="var(--border)" stroke-width="1" />`,
  ].join('');

  return () => {
    const r = clamp(toNumber(ratioInput.value, 0.5), 0.1, 0.95);
    const n = Math.round(toNumber(termsInput.value, 1));
    const total = sumAt(r, n - 1);
    const limitValue = 1 / (1 - r);

    partialSum.textContent = formatFixed(total, 3);
    limit.textContent = formatFixed(limitValue, 3);
    line.setAttribute('x1', map(xMin, limitValue).x.toFixed(2));
    line.setAttribute('x2', map(xMax, limitValue).x.toFixed(2));
    curve.setAttribute('d', buildPathFromFunction((x) => sumAt(r, Math.floor(x)), xMin, xMax, 80, width, height, yMin, yMax));
    points.innerHTML = Array.from({ length: n }, (_, index) => {
      const value = sumAt(r, index);
      const point = map(index + 1, value);
      return `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="7" fill="${index + 1 === n ? 'var(--pomodoro-short)' : 'var(--accent-strong)'}" />`;
    }).join('');
  };
}

function renderVectorsDemo(root) {
  const inputs = [
    root.querySelector('#math-demo-vectors-ax'),
    root.querySelector('#math-demo-vectors-ay'),
    root.querySelector('#math-demo-vectors-bx'),
    root.querySelector('#math-demo-vectors-by'),
  ];
  const result = root.querySelector('#math-demo-vectors-result');
  const magnitude = root.querySelector('#math-demo-vectors-magnitude');
  const vectorA = root.querySelector('#math-demo-vectors-vector-a');
  const vectorB = root.querySelector('#math-demo-vectors-vector-b');
  const vectorR = root.querySelector('#math-demo-vectors-vector-r');
  const tipA = root.querySelector('#math-demo-vectors-tip-a');
  const tipB = root.querySelector('#math-demo-vectors-tip-b');
  const tipR = root.querySelector('#math-demo-vectors-tip-r');
  const axes = root.querySelector('#math-demo-vectors-axes');

  if (inputs.some((input) => !input) || !result || !magnitude || !vectorA || !vectorB || !vectorR || !tipA || !tipB || !tipR || !axes) {
    return () => {};
  }

  const centerX = 400;
  const centerY = 160;
  const scale = 20;
  axes.innerHTML = [
    `<line x1="0" y1="${centerY}" x2="800" y2="${centerY}" stroke="var(--border)" stroke-width="1" />`,
    `<line x1="${centerX}" y1="0" x2="${centerX}" y2="320" stroke="var(--border)" stroke-width="1" />`,
  ].join('');

  return () => {
    const [ax, ay, bx, by] = inputs.map((input) => toNumber(input.value, 0));
    const rx = ax + bx;
    const ry = ay + by;
    const pointA = { x: centerX + (ax * scale), y: centerY - (ay * scale) };
    const pointB = { x: centerX + (bx * scale), y: centerY - (by * scale) };
    const pointR = { x: centerX + (rx * scale), y: centerY - (ry * scale) };

    vectorA.setAttribute('x2', pointA.x.toFixed(2));
    vectorA.setAttribute('y2', pointA.y.toFixed(2));
    vectorB.setAttribute('x1', pointA.x.toFixed(2));
    vectorB.setAttribute('y1', pointA.y.toFixed(2));
    vectorB.setAttribute('x2', pointR.x.toFixed(2));
    vectorB.setAttribute('y2', pointR.y.toFixed(2));
    vectorR.setAttribute('x2', pointR.x.toFixed(2));
    vectorR.setAttribute('y2', pointR.y.toFixed(2));
    tipA.setAttribute('cx', pointA.x.toFixed(2));
    tipA.setAttribute('cy', pointA.y.toFixed(2));
    tipB.setAttribute('cx', pointB.x.toFixed(2));
    tipB.setAttribute('cy', pointB.y.toFixed(2));
    tipR.setAttribute('cx', pointR.x.toFixed(2));
    tipR.setAttribute('cy', pointR.y.toFixed(2));
    result.textContent = `(${formatNumber(rx, 0)}, ${formatNumber(ry, 0)})`;
    magnitude.textContent = formatFixed(Math.hypot(rx, ry), 2);
  };
}

function renderLogicDemo(root) {
  const connectiveInput = root.querySelector('#math-demo-logic-connective');
  const pToggle = root.querySelector('#math-demo-logic-p');
  const qToggle = root.querySelector('#math-demo-logic-q');
  const statement = root.querySelector('#math-demo-logic-statement');
  const result = root.querySelector('#math-demo-logic-result');
  const rowCells = {
    ff: root.querySelector('#math-demo-logic-row-ff'),
    ft: root.querySelector('#math-demo-logic-row-ft'),
    tf: root.querySelector('#math-demo-logic-row-tf'),
    tt: root.querySelector('#math-demo-logic-row-tt'),
  };
  const rows = {
    ff: root.querySelector('[data-row="tt-ff"]'),
    ft: root.querySelector('[data-row="tt-ft"]'),
    tf: root.querySelector('[data-row="tt-tf"]'),
    tt: root.querySelector('[data-row="tt-tt"]'),
  };

  if (!connectiveInput || !pToggle || !qToggle || !statement || !result || Object.values(rowCells).some((cell) => !cell) || Object.values(rows).some((row) => !row)) {
    return () => {};
  }

  const toggles = [pToggle, qToggle];

  const getToggleValue = (button) => button.classList.contains('is-active');

  const compute = (p, q, connective) => {
    switch (connective) {
      case 'or':
        return p || q;
      case 'implies':
        return (!p) || q;
      case 'iff':
        return p === q;
      default:
        return p && q;
    }
  };

  const applyToggle = (button) => {
    const isActive = button.classList.contains('is-active');
    button.classList.toggle('is-active', !isActive);
    button.setAttribute('aria-pressed', !isActive ? 'true' : 'false');
  };

  root.addEventListener('click', (event) => {
    const toggle = event.target.closest('.interactive-demo__toggle');
    if (!toggle) {
      return;
    }

    if (toggle === pToggle || toggle === qToggle) {
      applyToggle(toggle);
    }
  });

  return () => {
    const connective = connectiveInput.value;
    const p = getToggleValue(pToggle);
    const q = getToggleValue(qToggle);

    statement.textContent = {
      and: 'P and Q',
      or: 'P or Q',
      implies: 'P implies Q',
      iff: 'P iff Q',
    }[connective] ?? 'P and Q';

    const values = {
      ff: compute(false, false, connective),
      ft: compute(false, true, connective),
      tf: compute(true, false, connective),
      tt: compute(true, true, connective),
    };

    Object.entries(values).forEach(([key, value]) => {
      rowCells[key].textContent = value ? 'T' : 'F';
      rows[key].classList.toggle('is-active', key === `${p ? 't' : 'f'}${q ? 't' : 'f'}`);
    });

    const current = compute(p, q, connective);
    result.textContent = current ? 'true' : 'false';
    result.style.color = current ? 'var(--pomodoro-short)' : 'var(--pomodoro-long)';
  };
}

function renderGeometryDemo(root) {
  const sideAInput = root.querySelector('#math-demo-geometry-side-a');
  const sideBInput = root.querySelector('#math-demo-geometry-side-b');
  const angleInput = root.querySelector('#math-demo-geometry-angle-c');
  const area = root.querySelector('#math-demo-geometry-area');
  const sideC = root.querySelector('#math-demo-geometry-side-c');
  const triangle = root.querySelector('#math-demo-geometry-triangle');
  const vertexA = root.querySelector('#math-demo-geometry-vertex-a');
  const vertexB = root.querySelector('#math-demo-geometry-vertex-b');
  const vertexC = root.querySelector('#math-demo-geometry-vertex-c');
  const labels = root.querySelector('#math-demo-geometry-labels');

  if (!sideAInput || !sideBInput || !angleInput || !area || !sideC || !triangle || !vertexA || !vertexB || !vertexC || !labels) {
    return () => {};
  }

  const origin = { x: 140, y: 230 };
  const scale = 24;

  return () => {
    const a = toNumber(sideAInput.value, 7);
    const b = toNumber(sideBInput.value, 8);
    const angleDegrees = toNumber(angleInput.value, 62);
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const c = Math.sqrt((a * a) + (b * b) - (2 * a * b * Math.cos(angleRadians)));
    const areaValue = 0.5 * a * b * Math.sin(angleRadians);
    const pointA = origin;
    const pointB = { x: origin.x + (a * scale), y: origin.y };
    const pointC = {
      x: origin.x + (b * scale * Math.cos(angleRadians)),
      y: origin.y - (b * scale * Math.sin(angleRadians)),
    };

    triangle.setAttribute('points', `${pointA.x.toFixed(2)},${pointA.y.toFixed(2)} ${pointB.x.toFixed(2)},${pointB.y.toFixed(2)} ${pointC.x.toFixed(2)},${pointC.y.toFixed(2)}`);
    vertexA.setAttribute('cx', pointA.x.toFixed(2));
    vertexA.setAttribute('cy', pointA.y.toFixed(2));
    vertexB.setAttribute('cx', pointB.x.toFixed(2));
    vertexB.setAttribute('cy', pointB.y.toFixed(2));
    vertexC.setAttribute('cx', pointC.x.toFixed(2));
    vertexC.setAttribute('cy', pointC.y.toFixed(2));
    area.textContent = formatFixed(areaValue, 2);
    sideC.textContent = formatFixed(c, 2);
    labels.textContent = `Area = 1/2 ab sin(C), C = ${formatFixed(angleDegrees, 0)} deg`;
  };
}

function renderMatrixDemo(root) {
  const inputs = [
    root.querySelector('#math-demo-matrices-a'),
    root.querySelector('#math-demo-matrices-b'),
    root.querySelector('#math-demo-matrices-c'),
    root.querySelector('#math-demo-matrices-d'),
  ];
  const det = root.querySelector('#math-demo-matrices-det');
  const trace = root.querySelector('#math-demo-matrices-trace');
  const square = root.querySelector('#math-demo-matrices-square');
  const basisX = root.querySelector('#math-demo-matrices-basis-x');
  const basisY = root.querySelector('#math-demo-matrices-basis-y');
  const grid = root.querySelector('#math-demo-matrices-grid');

  if (inputs.some((input) => !input) || !det || !trace || !square || !basisX || !basisY || !grid) {
    return () => {};
  }

  const center = { x: 400, y: 160 };
  const scale = 80;
  const basePoints = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
  ];

  const transform = (x, y, matrix) => ({
    x: (matrix.a * x) + (matrix.b * y),
    y: (matrix.c * x) + (matrix.d * y),
  });

  const toSvg = (point) => ({
    x: center.x + (point.x * scale),
    y: center.y - (point.y * scale),
  });

  grid.innerHTML = Array.from({ length: 9 }, (_, index) => {
    const offset = -4 + index;
    const left = toSvg({ x: -4, y: offset });
    const right = toSvg({ x: 4, y: offset });
    const bottom = toSvg({ x: offset, y: -4 });
    const top = toSvg({ x: offset, y: 4 });
    return `<line x1="${left.x.toFixed(2)}" y1="${left.y.toFixed(2)}" x2="${right.x.toFixed(2)}" y2="${right.y.toFixed(2)}" /><line x1="${bottom.x.toFixed(2)}" y1="${bottom.y.toFixed(2)}" x2="${top.x.toFixed(2)}" y2="${top.y.toFixed(2)}" />`;
  }).join('');

  return () => {
    const matrix = {
      a: toNumber(inputs[0].value, 1),
      b: toNumber(inputs[1].value, 0),
      c: toNumber(inputs[2].value, 0),
      d: toNumber(inputs[3].value, 1),
    };

    const transformedPoints = basePoints.map((point) => toSvg(transform(point.x, point.y, matrix)));
    square.setAttribute('d', `M ${transformedPoints.map((point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')} Z`);
    basisX.setAttribute('x2', (center.x + (matrix.a * scale)).toFixed(2));
    basisX.setAttribute('y2', (center.y - (matrix.c * scale)).toFixed(2));
    basisY.setAttribute('x2', (center.x + (matrix.b * scale)).toFixed(2));
    basisY.setAttribute('y2', (center.y - (matrix.d * scale)).toFixed(2));
    det.textContent = formatFixed((matrix.a * matrix.d) - (matrix.b * matrix.c), 3);
    trace.textContent = formatFixed(matrix.a + matrix.d, 3);
  };
}

function renderEigenvaluesDemo(root) {
  const inputs = [
    root.querySelector('#math-demo-eigenvalues-a'),
    root.querySelector('#math-demo-eigenvalues-b'),
    root.querySelector('#math-demo-eigenvalues-d'),
  ];
  const lambda1 = root.querySelector('#math-demo-eigenvalues-lambda1');
  const lambda2 = root.querySelector('#math-demo-eigenvalues-lambda2');
  const ellipse = root.querySelector('#math-demo-eigenvalues-ellipse');
  const evec1 = root.querySelector('#math-demo-eigenvalues-evec-1');
  const evec2 = root.querySelector('#math-demo-eigenvalues-evec-2');
  const grid = root.querySelector('#math-demo-eigenvalues-grid');

  if (inputs.some((input) => !input) || !lambda1 || !lambda2 || !ellipse || !evec1 || !evec2 || !grid) {
    return () => {};
  }

  const center = { x: 400, y: 160 };
  const scale = 80;

  grid.innerHTML = Array.from({ length: 9 }, (_, index) => {
    const offset = -4 + index;
    return `<line x1="${(center.x - (4 * scale)).toFixed(2)}" y1="${(center.y - (offset * scale)).toFixed(2)}" x2="${(center.x + (4 * scale)).toFixed(2)}" y2="${(center.y - (offset * scale)).toFixed(2)}" /><line x1="${(center.x + (offset * scale)).toFixed(2)}" y1="${(center.y - (4 * scale)).toFixed(2)}" x2="${(center.x + (offset * scale)).toFixed(2)}" y2="${(center.y + (4 * scale)).toFixed(2)}" />`;
  }).join('');

  return () => {
    const a = toNumber(inputs[0].value, 1);
    const b = toNumber(inputs[1].value, 0);
    const d = toNumber(inputs[2].value, 1);
    const traceValue = a + d;
    const discriminant = Math.sqrt(Math.max(0, ((a - d) ** 2) + (4 * (b ** 2))));
    const l1 = (traceValue + discriminant) / 2;
    const l2 = (traceValue - discriminant) / 2;
    const theta = 0.5 * Math.atan2((2 * b), (a - d));
    const major = 1.2 + Math.abs(l1) / 2;
    const minor = 1.2 + Math.abs(l2) / 2;

    lambda1.textContent = formatFixed(l1, 2);
    lambda2.textContent = formatFixed(l2, 2);
    ellipse.setAttribute('d', `M ${center.x.toFixed(2)} ${(center.y - (minor * scale)).toFixed(2)} A ${(major * scale).toFixed(2)} ${(minor * scale).toFixed(2)} 0 1 1 ${center.x.toFixed(2)} ${(center.y + (minor * scale)).toFixed(2)} A ${(major * scale).toFixed(2)} ${(minor * scale).toFixed(2)} 0 1 1 ${center.x.toFixed(2)} ${(center.y - (minor * scale)).toFixed(2)} Z`);
    const vector1 = {
      x: center.x + (Math.cos(theta) * major * scale),
      y: center.y - (Math.sin(theta) * major * scale),
    };
    const vector2 = {
      x: center.x - (Math.sin(theta) * minor * scale),
      y: center.y - (Math.cos(theta) * minor * scale),
    };
    evec1.setAttribute('x2', vector1.x.toFixed(2));
    evec1.setAttribute('y2', vector1.y.toFixed(2));
    evec2.setAttribute('x2', vector2.x.toFixed(2));
    evec2.setAttribute('y2', vector2.y.toFixed(2));
  };
}

function renderDiscreteMathDemo(root) {
  const depthInput = root.querySelector('#math-demo-discrete-math-depth');
  const branchInput = root.querySelector('#math-demo-discrete-math-branching');
  const leaves = root.querySelector('#math-demo-discrete-math-leaves');
  const formula = root.querySelector('#math-demo-discrete-math-formula');
  const links = root.querySelector('#math-demo-discrete-math-links');
  const nodes = root.querySelector('#math-demo-discrete-math-nodes');

  if (!depthInput || !branchInput || !leaves || !formula || !links || !nodes) {
    return () => {};
  }

  return () => {
    const depth = Math.round(toNumber(depthInput.value, 4));
    const branch = Math.max(2, Math.round(toNumber(branchInput.value, 2)));
    const totalLeaves = branch ** depth;

    leaves.textContent = formatNumber(totalLeaves, 0);
    formula.textContent = `${branch}^${depth}`;

    const width = 800;
    const height = 320;
    const topY = 40;
    const levelGap = 40;
    const nodesByLevel = [];
    for (let level = 0; level <= depth; level += 1) {
      nodesByLevel[level] = Array.from({ length: branch ** level }, (_, index) => index);
    }

    const points = [];
    for (let level = 0; level <= depth; level += 1) {
      const count = branch ** level;
      const y = topY + (level * levelGap);
      for (let index = 0; index < count; index += 1) {
        const x = ((index + 0.5) / count) * width;
        points.push({ level, index, x, y });
      }
    }

    const pointAt = (level, index) => points.find((point) => point.level === level && point.index === index);
    links.innerHTML = [];
    nodes.innerHTML = [];

    const linkParts = [];
    for (let level = 0; level < depth; level += 1) {
      const count = branch ** level;
      for (let index = 0; index < count; index += 1) {
        const parent = pointAt(level, index);
        for (let childIndex = 0; childIndex < branch; childIndex += 1) {
          const child = pointAt(level + 1, (index * branch) + childIndex);
          linkParts.push(`<line x1="${parent.x.toFixed(2)}" y1="${parent.y.toFixed(2)}" x2="${child.x.toFixed(2)}" y2="${child.y.toFixed(2)}" stroke="var(--border)" stroke-width="2" />`);
        }
      }
    }

    const nodeParts = points.map((point) => `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${point.level === depth ? 7 : 6}" fill="${point.level === depth ? 'var(--pomodoro-short)' : 'var(--accent-strong)'}" />`);
    links.innerHTML = linkParts.join('');
    nodes.innerHTML = nodeParts.join('');
  };
}

function renderModelingDemo(root) {
  const initialInput = root.querySelector('#math-demo-modeling-initial');
  const rateInput = root.querySelector('#math-demo-modeling-rate');
  const year5 = root.querySelector('#math-demo-modeling-year-5');
  const trend = root.querySelector('#math-demo-modeling-trend');
  const curve = root.querySelector('#math-demo-modeling-curve');
  const points = root.querySelector('#math-demo-modeling-points');
  const axes = root.querySelector('#math-demo-modeling-axes');

  if (!initialInput || !rateInput || !year5 || !trend || !curve || !points || !axes) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = 0;
  const xMax = 10;
  const yMin = 0;
  const yMax = 30;
  const map = (x, y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);

  axes.innerHTML = [
    `<line x1="0" y1="${map(0, 0).y.toFixed(2)}" x2="800" y2="${map(0, 0).y.toFixed(2)}" stroke="var(--border)" stroke-width="1" />`,
    `<line x1="${map(0, 0).x.toFixed(2)}" y1="0" x2="${map(0, 0).x.toFixed(2)}" y2="320" stroke="var(--border)" stroke-width="1" />`,
  ].join('');

  return () => {
    const initial = Math.max(0.1, toNumber(initialInput.value, 5));
    const rate = toNumber(rateInput.value, 0.08);
    const growth = (t) => initial * ((1 + rate) ** t);
    curve.setAttribute('d', buildPathFromFunction(growth, xMin, xMax, 200, width, height, yMin, yMax));
    year5.textContent = formatFixed(growth(5), 2);
    trend.textContent = rate >= 0 ? 'growth' : 'decay';
    points.innerHTML = Array.from({ length: 6 }, (_, index) => {
      const value = growth(index * 2);
      const point = map(index * 2, value);
      return `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="6" fill="${index === 5 ? 'var(--pomodoro-short)' : 'var(--accent-strong)'}" />`;
    }).join('');
  };
}

function renderFirstOrderOdeDemo(root) {
  const equilibriumInput = root.querySelector('#math-demo-first-order-odes-equilibrium');
  const initialInput = root.querySelector('#math-demo-first-order-odes-initial');
  const solution = root.querySelector('#math-demo-first-order-odes-solution');
  const level = root.querySelector('#math-demo-first-order-odes-level');
  const field = root.querySelector('#math-demo-first-order-odes-field');
  const solutionPath = root.querySelector('#math-demo-first-order-odes-solution-path');
  const initialPoint = root.querySelector('#math-demo-first-order-odes-initial-point');

  if (!equilibriumInput || !initialInput || !solution || !level || !field || !solutionPath || !initialPoint) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = -4;
  const xMax = 4;
  const yMin = -4;
  const yMax = 4;
  const map = (x, y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);

  field.innerHTML = Array.from({ length: 8 }, (_, xIndex) => {
    const x = -3.5 + xIndex;
    return Array.from({ length: 6 }, (_, yIndex) => {
      const y = -2.5 + (yIndex * 1);
      const slope = x - y;
      const start = map(x - 0.18, y - (slope * 0.18));
      const end = map(x + 0.18, y + (slope * 0.18));
      return `<line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" />`;
    }).join('');
  }).join('');

  return () => {
    const equilibrium = toNumber(equilibriumInput.value, 1);
    const initial = toNumber(initialInput.value, -1);
    const solutionFn = (x) => equilibrium + ((initial - equilibrium) * Math.exp(-x));

    solution.textContent = `y(x) = ${formatFixed(equilibrium, 1)} + C e^-x`;
    level.textContent = formatFixed(equilibrium, 1);
    solutionPath.setAttribute('d', buildPathFromFunction(solutionFn, xMin, xMax, 240, width, height, yMin, yMax));
    const point = map(0, initial);
    initialPoint.setAttribute('cx', point.x.toFixed(2));
    initialPoint.setAttribute('cy', point.y.toFixed(2));
  };
}

function renderSecondOrderOdeDemo(root) {
  const dampingInput = root.querySelector('#math-demo-second-order-odes-damping');
  const frequencyInput = root.querySelector('#math-demo-second-order-odes-frequency');
  const period = root.querySelector('#math-demo-second-order-odes-period');
  const decay = root.querySelector('#math-demo-second-order-odes-decay');
  const oscillation = root.querySelector('#math-demo-second-order-odes-oscillation');
  const envelope = root.querySelector('#math-demo-second-order-odes-envelope');
  const axes = root.querySelector('#math-demo-second-order-odes-axes');

  if (!dampingInput || !frequencyInput || !period || !decay || !oscillation || !envelope || !axes) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = 0;
  const xMax = 10;
  const yMin = -2;
  const yMax = 2;
  const map = (x, y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);

  axes.innerHTML = `<line x1="0" y1="${map(0, 0).y.toFixed(2)}" x2="800" y2="${map(0, 0).y.toFixed(2)}" stroke="var(--border)" stroke-width="1" />`;

  return () => {
    const damping = clamp(toNumber(dampingInput.value, 0.18), 0, 1);
    const frequency = clamp(toNumber(frequencyInput.value, 2), 0.5, 4);
    const f = (x) => Math.exp(-damping * x) * Math.cos(frequency * x);

    oscillation.setAttribute('d', buildPathFromFunction(f, xMin, xMax, 250, width, height, yMin, yMax));
    envelope.setAttribute('d', buildPathFromFunction((x) => Math.exp(-damping * x), xMin, xMax, 100, width, height, yMin, yMax));
    period.textContent = formatFixed((2 * Math.PI) / frequency, 2);
    decay.textContent = damping < 0.2 ? 'slow' : damping < 0.5 ? 'medium' : 'fast';
  };
}

function renderSystemsOdeDemo(root) {
  const alphaInput = root.querySelector('#math-demo-systems-of-odes-alpha');
  const betaInput = root.querySelector('#math-demo-systems-of-odes-beta');
  const stability = root.querySelector('#math-demo-systems-of-odes-stability');
  const start = root.querySelector('#math-demo-systems-of-odes-start');
  const field = root.querySelector('#math-demo-systems-of-odes-field');
  const trajectory = root.querySelector('#math-demo-systems-of-odes-trajectory');
  const phasePoint = root.querySelector('#math-demo-systems-of-odes-phase-point');

  if (!alphaInput || !betaInput || !stability || !start || !field || !trajectory || !phasePoint) {
    return () => {};
  }

  const width = 800;
  const height = 320;
  const xMin = -3;
  const xMax = 3;
  const yMin = -3;
  const yMax = 3;
  const map = (x, y) => getPlotPoint(width, height, xMin, xMax, yMin, yMax, x, y);

  field.innerHTML = Array.from({ length: 7 }, (_, xIndex) => {
    const x = -3 + (xIndex * 1);
    return Array.from({ length: 7 }, (_, yIndex) => {
      const y = -3 + (yIndex * 1);
      const alpha = toNumber(alphaInput.value, 0.2);
      const beta = toNumber(betaInput.value, 1);
      const dx = (alpha * x) - (beta * y);
      const dy = (beta * x) + (alpha * y);
      const startPoint = map(x - (dx * 0.12), y - (dy * 0.12));
      const endPoint = map(x + (dx * 0.12), y + (dy * 0.12));
      return `<line x1="${startPoint.x.toFixed(2)}" y1="${startPoint.y.toFixed(2)}" x2="${endPoint.x.toFixed(2)}" y2="${endPoint.y.toFixed(2)}" />`;
    }).join('');
  }).join('');

  return () => {
    const alpha = toNumber(alphaInput.value, 0.2);
    const beta = toNumber(betaInput.value, 1);
    const trajectoryPath = [];

    for (let index = 0; index <= 240; index += 1) {
      const t = (index / 240) * 6;
      const x = Math.exp(alpha * t) * Math.cos(beta * t);
      const y = Math.exp(alpha * t) * Math.sin(beta * t);
      const point = map(x, y);
      trajectoryPath.push(`${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
    }

    trajectory.setAttribute('d', trajectoryPath.join(' '));
    const phase = map(Math.exp(alpha * 1.5) * Math.cos(beta * 1.5), Math.exp(alpha * 1.5) * Math.sin(beta * 1.5));
    phasePoint.setAttribute('cx', phase.x.toFixed(2));
    phasePoint.setAttribute('cy', phase.y.toFixed(2));
    stability.textContent = alpha > 0 ? 'unstable spiral' : alpha < 0 ? 'stable spiral' : 'center';
    start.textContent = '(1, -0.5)';
  };
}

function renderProofWritingDemo(root) {
  const nodes = root.querySelector('#math-demo-proof-writing-nodes');
  const links = root.querySelector('#math-demo-proof-writing-links');
  const direct = root.querySelector('#math-demo-proof-writing-direct');
  const contrapositive = root.querySelector('#math-demo-proof-writing-contrapositive');
  const contradiction = root.querySelector('#math-demo-proof-writing-contradiction');
  const cases = root.querySelector('#math-demo-proof-writing-cases');
  const goal = root.querySelector('#math-demo-proof-writing-goal');
  const hint = root.querySelector('#math-demo-proof-writing-hint');
  const strategyValue = root.querySelector('#math-demo-proof-writing-strategy-value');

  if (!nodes || !links || !direct || !contrapositive || !contradiction || !cases || !goal || !hint || !strategyValue) {
    return () => {};
  }

  const buttons = [direct, contrapositive, contradiction, cases];
  const stepPoints = [
    { label: 'Hypothesis', x: 100 },
    { label: 'Definition', x: 280 },
    { label: 'Algebra', x: 500 },
    { label: 'Conclusion', x: 690 },
  ];
  const stepPaths = {
    direct: [0, 1, 2, 3],
    contrapositive: [3, 2, 1, 0],
    contradiction: [0, 2, 1, 3],
    cases: [0, 1, 3],
  };

  function setActive(value) {
    buttons.forEach((button) => {
      const isActive = button.dataset.toggleValue === value;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    strategyValue.textContent = value;
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('.interactive-demo__toggle');
    if (!button || !buttons.includes(button)) {
      return;
    }
    setActive(button.dataset.toggleValue ?? 'direct');
  });

  return () => {
    const active = buttons.find((button) => button.classList.contains('is-active'))?.dataset.toggleValue ?? 'direct';
    const path = stepPaths[active] ?? stepPaths.direct;
    const linkParts = [];
    const nodeParts = [];

    for (let index = 0; index < path.length - 1; index += 1) {
      const current = stepPoints[path[index]];
      const next = stepPoints[path[index + 1]];
      linkParts.push(`<line x1="${current.x}" y1="120" x2="${next.x}" y2="120" stroke="var(--accent-strong)" stroke-width="4" />`);
    }

    stepPoints.forEach((point, index) => {
      const isActive = path.includes(index);
      nodeParts.push(`<circle cx="${point.x}" cy="120" r="18" fill="${isActive ? 'var(--pomodoro-short)' : 'var(--accent-strong)'}" /><text x="${point.x}" y="126" text-anchor="middle" fill="var(--bg)" font-size="12" font-weight="700">${index + 1}</text><text x="${point.x}" y="165" text-anchor="middle" fill="var(--text)" font-size="14">${point.label}</text>`);
    });

    links.innerHTML = linkParts.join('');
    nodes.innerHTML = nodeParts.join('');
    goal.textContent = 'If n is even, then n^2 is even';
    hint.textContent = {
      direct: 'Write n = 2k',
      contrapositive: 'Assume n^2 is odd',
      contradiction: 'Assume the opposite and reach a contradiction',
      cases: 'Split into even and odd cases',
    }[active] ?? 'Write n = 2k';
  };
}

function renderFreeBodyDiagramDemo(root) {
  const modeInput = root.querySelector('#math-demo-free-body-diagrams-mode');
  const beamControls = root.querySelector('#math-demo-free-body-diagrams-beam-controls');
  const blockControls = root.querySelector('#math-demo-free-body-diagrams-block-controls');
  const beamLoadInput = root.querySelector('#math-demo-free-body-diagrams-beam-load');
  const beamPositionInput = root.querySelector('#math-demo-free-body-diagrams-beam-position');
  const blockWeightInput = root.querySelector('#math-demo-free-body-diagrams-block-weight');
  const blockAngleInput = root.querySelector('#math-demo-free-body-diagrams-block-angle');
  const blockFrictionInput = root.querySelector('#math-demo-free-body-diagrams-block-friction');
  const modeLabel = root.querySelector('#math-demo-free-body-diagrams-mode-label');
  const primaryLabel = root.querySelector('#math-demo-free-body-diagrams-primary-label');
  const secondaryLabel = root.querySelector('#math-demo-free-body-diagrams-secondary-label');
  const summary = root.querySelector('#math-demo-free-body-diagrams-summary');
  const balance = root.querySelector('#math-demo-free-body-diagrams-balance');
  const scene = root.querySelector('#math-demo-free-body-diagrams-scene');

  if (
    !modeInput
    || !beamControls
    || !blockControls
    || !beamLoadInput
    || !beamPositionInput
    || !blockWeightInput
    || !blockAngleInput
    || !blockFrictionInput
    || !modeLabel
    || !primaryLabel
    || !secondaryLabel
    || !summary
    || !balance
    || !scene
  ) {
    return () => {};
  }

  const leftSupportX = 170;
  const rightSupportX = 630;
  const beamY = 155;
  const span = rightSupportX - leftSupportX;

  return () => {
    const mode = modeInput.value;

    beamControls.hidden = mode !== 'beam';
    blockControls.hidden = mode !== 'block';

    if (mode === 'beam') {
      const load = clamp(toNumber(beamLoadInput.value, 12), 4, 20);
      const loadPosition = clamp(toNumber(beamPositionInput.value, 2.5), 0.5, 4.5);
      const reactionLeft = load * ((5 - loadPosition) / 5);
      const reactionRight = load * (loadPosition / 5);
      const loadX = leftSupportX + ((loadPosition / 5) * span);
      const scale = 4.2;
      const loadTipY = beamY + (load * scale);
      const leftTipY = beamY - (reactionLeft * scale);
      const rightTipY = beamY - (reactionRight * scale);

      modeLabel.textContent = 'Beam';
      primaryLabel.textContent = `Point load P = ${formatFixed(load, 1)} kN`;
      secondaryLabel.textContent = `Load position x = ${formatFixed(loadPosition, 1)} m`;
      summary.textContent = `Ay = ${formatFixed(reactionLeft, 1)} kN, By = ${formatFixed(reactionRight, 1)} kN`;
      balance.textContent = `Moment check: ${formatFixed(reactionRight * 5, 1)} = ${formatFixed(load * loadPosition, 1)} kN m`;

      scene.innerHTML = [
        '<line x1="150" y1="250" x2="650" y2="250" stroke="var(--border)" stroke-width="2" stroke-dasharray="8 8" />',
        `<line x1="${leftSupportX}" y1="${beamY}" x2="${rightSupportX}" y2="${beamY}" stroke="var(--accent-strong)" stroke-width="12" stroke-linecap="round" />`,
        `<polygon points="${(leftSupportX - 18).toFixed(2)},${(beamY + 34).toFixed(2)} ${(leftSupportX + 18).toFixed(2)},${(beamY + 34).toFixed(2)} ${leftSupportX.toFixed(2)},${(beamY + 4).toFixed(2)}" fill="rgba(255,255,255,0.08)" stroke="var(--border)" />`,
        `<circle cx="${leftSupportX.toFixed(2)}" cy="${(beamY + 38).toFixed(2)}" r="8" fill="var(--accent-strong)" />`,
        `<polygon points="${(rightSupportX - 16).toFixed(2)},${(beamY + 34).toFixed(2)} ${(rightSupportX + 16).toFixed(2)},${(beamY + 34).toFixed(2)} ${rightSupportX.toFixed(2)},${(beamY + 4).toFixed(2)}" fill="rgba(255,255,255,0.08)" stroke="var(--border)" />`,
        `<circle cx="${rightSupportX.toFixed(2)}" cy="${(beamY + 38).toFixed(2)}" r="8" fill="var(--accent-strong)" />`,
        buildArrowMarkup(loadX, beamY - 88, loadX, loadTipY, 'var(--pomodoro-short)'),
        buildArrowMarkup(leftSupportX, beamY, leftSupportX, leftTipY, 'var(--accent-strong)'),
        buildArrowMarkup(rightSupportX, beamY, rightSupportX, rightTipY, 'var(--accent-strong)'),
        `<text x="${loadX.toFixed(2)}" y="${(beamY - 102).toFixed(2)}" text-anchor="middle" fill="var(--text)" font-size="15">P</text>`,
        `<text x="${leftSupportX.toFixed(2)}" y="${(beamY - 82).toFixed(2)}" text-anchor="middle" fill="var(--text)" font-size="15">Ay</text>`,
        `<text x="${rightSupportX.toFixed(2)}" y="${(beamY - 82).toFixed(2)}" text-anchor="middle" fill="var(--text)" font-size="15">By</text>`,
        `<text x="${loadX.toFixed(2)}" y="${(loadTipY + 22).toFixed(2)}" text-anchor="middle" fill="var(--text)" font-size="14">${formatFixed(load, 1)} kN</text>`,
        `<text x="${leftSupportX.toFixed(2)}" y="${(leftTipY - 10).toFixed(2)}" text-anchor="middle" fill="var(--text)" font-size="14">${formatFixed(reactionLeft, 1)} kN</text>`,
        `<text x="${rightSupportX.toFixed(2)}" y="${(rightTipY - 10).toFixed(2)}" text-anchor="middle" fill="var(--text)" font-size="14">${formatFixed(reactionRight, 1)} kN</text>`,
      ].join('');
      return;
    }

    const weight = clamp(toNumber(blockWeightInput.value, 10), 4, 20);
    const angle = clamp(toNumber(blockAngleInput.value, 25), 10, 35);
    const frictionCoefficient = clamp(toNumber(blockFrictionInput.value, 0.35), 0, 1);
    const theta = (angle * Math.PI) / 180;
    const planeLength = 390;
    const baseX = 150;
    const baseY = 235;
    const topX = baseX + (Math.cos(theta) * planeLength);
    const topY = baseY - (Math.sin(theta) * planeLength);
    const blockCenterX = baseX + (Math.cos(theta) * 220);
    const blockCenterY = baseY - (Math.sin(theta) * 220) - 18;
    const blockWidth = 96;
    const blockHeight = 54;
    const normalForce = weight * Math.cos(theta);
    const downslopeComponent = weight * Math.sin(theta);
    const frictionLimit = frictionCoefficient * normalForce;
    const frictionForce = Math.min(frictionLimit, downslopeComponent);
    const scale = 4.6;
    const weightTipY = blockCenterY + (weight * scale);
    const normalTipX = blockCenterX - (Math.sin(theta) * 82);
    const normalTipY = blockCenterY - (Math.cos(theta) * 82);
    const frictionTipX = blockCenterX + (Math.cos(theta) * 82);
    const frictionTipY = blockCenterY - (Math.sin(theta) * 82);
    const sliding = frictionLimit + 0.05 < downslopeComponent;

    modeLabel.textContent = 'Block on incline';
    primaryLabel.textContent = `Weight W = ${formatFixed(weight, 1)} kN`;
    secondaryLabel.textContent = `Incline angle = ${formatFixed(angle, 0)} deg`;
    summary.textContent = `N = ${formatFixed(normalForce, 1)} kN, friction = ${formatFixed(frictionForce, 1)} kN`;
    balance.textContent = sliding
      ? `Sliding tendency: ${formatFixed(downslopeComponent - frictionForce, 1)} kN downslope`
      : 'Static friction balances the downslope component';

    scene.innerHTML = [
      `<line x1="${baseX.toFixed(2)}" y1="${baseY.toFixed(2)}" x2="${topX.toFixed(2)}" y2="${topY.toFixed(2)}" stroke="var(--accent-strong)" stroke-width="10" stroke-linecap="round" />`,
      `<line x1="${(baseX - 24).toFixed(2)}" y1="${(baseY + 20).toFixed(2)}" x2="${(baseX + 24).toFixed(2)}" y2="${(baseY + 12).toFixed(2)}" stroke="var(--border)" stroke-width="2" />`,
      `<line x1="${(baseX + 64).toFixed(2)}" y1="${(baseY - 0).toFixed(2)}" x2="${(baseX + 98).toFixed(2)}" y2="${(baseY - 14).toFixed(2)}" stroke="var(--border)" stroke-width="2" />`,
      `<line x1="${(baseX + 136).toFixed(2)}" y1="${(baseY - 24).toFixed(2)}" x2="${(baseX + 170).toFixed(2)}" y2="${(baseY - 38).toFixed(2)}" stroke="var(--border)" stroke-width="2" />`,
      `<rect x="${(blockCenterX - (blockWidth / 2)).toFixed(2)}" y="${(blockCenterY - (blockHeight / 2)).toFixed(2)}" width="${blockWidth}" height="${blockHeight}" rx="4" fill="rgba(255,255,255,0.06)" stroke="var(--border)" transform="rotate(${-angle.toFixed(2)} ${blockCenterX.toFixed(2)} ${blockCenterY.toFixed(2)})" />`,
      buildArrowMarkup(blockCenterX, blockCenterY - 6, blockCenterX, weightTipY, 'var(--pomodoro-long)'),
      buildArrowMarkup(blockCenterX, blockCenterY - 2, normalTipX, normalTipY, 'var(--accent-strong)'),
      buildArrowMarkup(blockCenterX, blockCenterY - 2, frictionTipX, frictionTipY, 'var(--pomodoro-short)'),
      `<text x="${blockCenterX.toFixed(2)}" y="${(blockCenterY + 108).toFixed(2)}" text-anchor="middle" fill="var(--text)" font-size="15">W = ${formatFixed(weight, 1)} kN</text>`,
      `<text x="${normalTipX.toFixed(2)}" y="${(normalTipY - 8).toFixed(2)}" text-anchor="middle" fill="var(--text)" font-size="15">N = ${formatFixed(normalForce, 1)} kN</text>`,
      `<text x="${frictionTipX.toFixed(2)}" y="${(frictionTipY - 8).toFixed(2)}" text-anchor="middle" fill="var(--text)" font-size="15">f = ${formatFixed(frictionForce, 1)} kN</text>`,
      `<text x="${(topX - 10).toFixed(2)}" y="${(topY - 10).toFixed(2)}" text-anchor="end" fill="var(--text)" font-size="15">${formatFixed(angle, 0)} deg</text>`,
    ].join('');
  };
}

function renderTsDiagramDemo(root) {
  const modeInput = root.querySelector('#math-demo-ts-diagrams-mode');
  const processControls = root.querySelector('#math-demo-ts-diagrams-process-controls');
  const cycleControls = root.querySelector('#math-demo-ts-diagrams-cycle-controls');
  const processTypeInput = root.querySelector('#math-demo-ts-diagrams-process-type');
  const processTempInput = root.querySelector('#math-demo-ts-diagrams-process-temp');
  const processEntropyInput = root.querySelector('#math-demo-ts-diagrams-process-entropy');
  const processDeltaTInput = root.querySelector('#math-demo-ts-diagrams-process-delta-temp');
  const cycleHotInput = root.querySelector('#math-demo-ts-diagrams-cycle-hot');
  const cycleColdInput = root.querySelector('#math-demo-ts-diagrams-cycle-cold');
  const cycleEntropyInput = root.querySelector('#math-demo-ts-diagrams-cycle-entropy');
  const modeLabel = root.querySelector('#math-demo-ts-diagrams-mode-label');
  const primaryLabel = root.querySelector('#math-demo-ts-diagrams-primary-label');
  const secondaryLabel = root.querySelector('#math-demo-ts-diagrams-secondary-label');
  const summary = root.querySelector('#math-demo-ts-diagrams-summary');
  const balance = root.querySelector('#math-demo-ts-diagrams-balance');
  const caption = root.querySelector('#math-demo-ts-diagrams-caption');
  const grid = root.querySelector('#math-demo-ts-diagrams-grid');
  const fill = root.querySelector('#math-demo-ts-diagrams-fill');
  const path = root.querySelector('#math-demo-ts-diagrams-path');
  const states = root.querySelector('#math-demo-ts-diagrams-states');

  if (
    !modeInput
    || !processControls
    || !cycleControls
    || !processTypeInput
    || !processTempInput
    || !processEntropyInput
    || !processDeltaTInput
    || !cycleHotInput
    || !cycleColdInput
    || !cycleEntropyInput
    || !modeLabel
    || !primaryLabel
    || !secondaryLabel
    || !summary
    || !balance
    || !caption
    || !grid
    || !fill
    || !path
    || !states
  ) {
    return () => {};
  }

  const plotLeft = 100;
  const plotRight = 720;
  const plotTop = 40;
  const plotBottom = 270;
  const sMin = 0;
  const sMax = 3.4;
  const tMin = 240;
  const tMax = 780;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const map = (s, temperature) => ({
    x: plotLeft + (((s - sMin) / (sMax - sMin)) * plotWidth),
    y: plotBottom - (((temperature - tMin) / (tMax - tMin)) * plotHeight),
  });

  grid.innerHTML = [
    '<line x1="100" y1="270" x2="720" y2="270" stroke="var(--border)" stroke-width="2" />',
    '<line x1="100" y1="270" x2="100" y2="40" stroke="var(--border)" stroke-width="2" />',
    ...Array.from({ length: 7 }, (_, index) => {
      const sValue = index * 0.5;
      const x = plotLeft + (((sValue - sMin) / (sMax - sMin)) * plotWidth);
      return `<line x1="${x.toFixed(2)}" y1="40" x2="${x.toFixed(2)}" y2="270" stroke="var(--border)" stroke-width="1" opacity="0.45" /><text x="${x.toFixed(2)}" y="292" text-anchor="middle" fill="var(--muted)" font-size="13">${formatFixed(sValue, 1)}</text>`;
    }),
    ...Array.from({ length: 5 }, (_, index) => {
      const tValue = 300 + (index * 100);
      const y = plotBottom - (((tValue - tMin) / (tMax - tMin)) * plotHeight);
      return `<line x1="100" y1="${y.toFixed(2)}" x2="720" y2="${y.toFixed(2)}" stroke="var(--border)" stroke-width="1" opacity="0.45" /><text x="82" y="${(y + 4).toFixed(2)}" text-anchor="end" fill="var(--muted)" font-size="13">${tValue}</text>`;
    }),
    '<text x="410" y="312" text-anchor="middle" fill="var(--muted)" font-size="14">s</text>',
    '<text x="24" y="158" transform="rotate(-90 24 158)" text-anchor="middle" fill="var(--muted)" font-size="14">T</text>',
  ].join('');

  return () => {
    const mode = modeInput.value;

    processControls.hidden = mode !== 'process';
    cycleControls.hidden = mode !== 'cycle';

    if (mode === 'process') {
      const pathType = processTypeInput.value;
      const startTemperature = clamp(toNumber(processTempInput.value, 420), 300, 700);
      const entropySpan = clamp(toNumber(processEntropyInput.value, 0.9), 0.2, 1.6);
      const temperatureRise = clamp(toNumber(processDeltaTInput.value, 120), 20, 260);
      const entropyStart = 0.65;
      const samples = 140;
      const points = [];
      let area = 0;
      let previous = null;

      for (let index = 0; index <= samples; index += 1) {
        const t = index / samples;
        let s = entropyStart + (entropySpan * t);
        let temperature = startTemperature;

        if (pathType === 'isentropic') {
          s = entropyStart;
          temperature = startTemperature + (temperatureRise * t);
        } else if (pathType === 'isobaric') {
          temperature = startTemperature + (temperatureRise * t);
        } else if (pathType === 'polytropic') {
          temperature = startTemperature + (temperatureRise * (t ** 1.35));
        }

        points.push(map(s, temperature));
        const current = { s, temperature };

        if (previous) {
          area += ((previous.temperature + current.temperature) / 2) * (current.s - previous.s);
        }

        previous = current;
      }

      const endEntropy = pathType === 'isentropic' ? entropyStart : entropyStart + entropySpan;
      const endTemperature = pathType === 'isothermal' ? startTemperature : startTemperature + temperatureRise;
      const endPoint = map(endEntropy, endTemperature);
      const startPoint = map(entropyStart, startTemperature);

      modeLabel.textContent = 'Process path';
      primaryLabel.textContent = `Start T1 = ${formatFixed(startTemperature, 0)} K`;
      secondaryLabel.textContent = `Path type = ${pathType}`;
      caption.textContent = 'The filled region gives a simple heat-transfer proxy on the T-s plane.';
      path.setAttribute('d', points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' '));
      fill.setAttribute('d', [
        `M ${startPoint.x.toFixed(2)} ${plotBottom.toFixed(2)}`,
        `L ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)}`,
        ...points.slice(1).map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
        `L ${endPoint.x.toFixed(2)} ${plotBottom.toFixed(2)}`,
        'Z',
      ].join(' '));
      fill.setAttribute('opacity', '0.18');
      states.innerHTML = [
        `<circle cx="${startPoint.x.toFixed(2)}" cy="${startPoint.y.toFixed(2)}" r="7" fill="var(--pomodoro-short)" />`,
        `<circle cx="${endPoint.x.toFixed(2)}" cy="${endPoint.y.toFixed(2)}" r="7" fill="var(--accent-strong)" />`,
        `<text x="${(startPoint.x - 10).toFixed(2)}" y="${(startPoint.y - 12).toFixed(2)}" fill="var(--text)" font-size="14">1</text>`,
        `<text x="${(endPoint.x + 10).toFixed(2)}" y="${(endPoint.y - 12).toFixed(2)}" fill="var(--text)" font-size="14">2</text>`,
      ].join('');
      summary.textContent = `End state: T2 = ${formatFixed(endTemperature, 0)} K, s2 = ${formatFixed(endEntropy, 2)}`;
      balance.textContent = `q_rev proxy = ${formatFixed(area, 1)} kJ/kg`;
      return;
    }

    const hotTemperature = clamp(toNumber(cycleHotInput.value, 650), 380, 780);
    const coldTemperature = clamp(toNumber(cycleColdInput.value, 320), 260, 520);
    const entropySpan = clamp(toNumber(cycleEntropyInput.value, 0.9), 0.25, 1.5);
    const entropyStart = 0.7;
    const entropyEnd = entropyStart + entropySpan;
    const lowPointLeft = map(entropyStart, coldTemperature);
    const highPointLeft = map(entropyStart, hotTemperature);
    const highPointRight = map(entropyEnd, hotTemperature);
    const lowPointRight = map(entropyEnd, coldTemperature);
    const loopArea = (hotTemperature - coldTemperature) * entropySpan;

    modeLabel.textContent = 'Cycle loop';
    primaryLabel.textContent = `Th = ${formatFixed(hotTemperature, 0)} K`;
    secondaryLabel.textContent = `Tl = ${formatFixed(coldTemperature, 0)} K`;
    caption.textContent = 'The enclosed area represents the net cycle work in this schematic T-s loop.';
    path.setAttribute('d', [
      `M ${highPointLeft.x.toFixed(2)} ${highPointLeft.y.toFixed(2)}`,
      `L ${lowPointLeft.x.toFixed(2)} ${lowPointLeft.y.toFixed(2)}`,
      `L ${lowPointRight.x.toFixed(2)} ${lowPointRight.y.toFixed(2)}`,
      `L ${highPointRight.x.toFixed(2)} ${highPointRight.y.toFixed(2)}`,
      `L ${highPointLeft.x.toFixed(2)} ${highPointLeft.y.toFixed(2)}`,
    ].join(' '));
    fill.setAttribute('d', [
      `M ${lowPointLeft.x.toFixed(2)} ${lowPointLeft.y.toFixed(2)}`,
      `L ${highPointLeft.x.toFixed(2)} ${highPointLeft.y.toFixed(2)}`,
      `L ${highPointRight.x.toFixed(2)} ${highPointRight.y.toFixed(2)}`,
      `L ${lowPointRight.x.toFixed(2)} ${lowPointRight.y.toFixed(2)}`,
      'Z',
    ].join(' '));
    fill.setAttribute('opacity', '0.16');
    states.innerHTML = [
      `<circle cx="${lowPointLeft.x.toFixed(2)}" cy="${lowPointLeft.y.toFixed(2)}" r="7" fill="var(--pomodoro-short)" />`,
      `<circle cx="${highPointLeft.x.toFixed(2)}" cy="${highPointLeft.y.toFixed(2)}" r="7" fill="var(--accent-strong)" />`,
      `<circle cx="${highPointRight.x.toFixed(2)}" cy="${highPointRight.y.toFixed(2)}" r="7" fill="var(--pomodoro-long)" />`,
      `<circle cx="${lowPointRight.x.toFixed(2)}" cy="${lowPointRight.y.toFixed(2)}" r="7" fill="var(--accent-strong)" />`,
      `<text x="${(lowPointLeft.x - 12).toFixed(2)}" y="${(lowPointLeft.y + 18).toFixed(2)}" fill="var(--text)" font-size="14">A</text>`,
      `<text x="${(highPointLeft.x - 12).toFixed(2)}" y="${(highPointLeft.y - 10).toFixed(2)}" fill="var(--text)" font-size="14">B</text>`,
      `<text x="${(highPointRight.x + 12).toFixed(2)}" y="${(highPointRight.y - 10).toFixed(2)}" fill="var(--text)" font-size="14">C</text>`,
      `<text x="${(lowPointRight.x + 12).toFixed(2)}" y="${(lowPointRight.y + 18).toFixed(2)}" fill="var(--text)" font-size="14">D</text>`,
    ].join('');
    summary.textContent = `Entropy width = ${formatFixed(entropySpan, 2)} kJ/(kg K)`;
    balance.textContent = `Loop area = ${formatFixed(loopArea, 1)} kJ/kg`;
  };
}

Object.assign(MATH_INTERACTIVE_RENDERERS, {
  arithmetic: renderArithmeticDemo,
  logic: renderLogicDemo,
  geometry: renderGeometryDemo,
  'line-graph': renderAlgebraDemo,
  algebra: renderAlgebraDemo,
  'function-family': renderFunctionFamilyDemo,
  functions: renderFunctionFamilyDemo,
  probability: renderProbabilityDemo,
  statistics: renderStatisticsDemo,
  trig: renderTrigDemo,
  limit: renderLimitsDemo,
  derivative: renderDerivativeDemo,
  integral: renderIntegralsDemo,
  series: renderSeriesDemo,
  vectors: renderVectorsDemo,
  matrix: renderMatrixDemo,
  eigenvalues: renderEigenvaluesDemo,
  'recursion-tree': renderDiscreteMathDemo,
  'growth-model': renderModelingDemo,
  'slope-field': renderFirstOrderOdeDemo,
  oscillator: renderSecondOrderOdeDemo,
  'phase-portrait': renderSystemsOdeDemo,
  'proof-strategy': renderProofWritingDemo,
  'free-body-diagrams': renderFreeBodyDiagramDemo,
  'ts-diagrams': renderTsDiagramDemo,
});

function getMathInteractiveDemoConfig(kind) {
  const resolvedKind = {
    algebra: 'line-graph',
    functions: 'function-family',
  }[kind] ?? kind;
  const renderer = MATH_INTERACTIVE_RENDERERS[resolvedKind] ?? null;

  if (!renderer) {
    return null;
  }

  const skeleton = MATH_INTERACTIVE_VISUALS[resolvedKind] ?? null;
  const sentinelId = {
    arithmetic: '#math-demo-arithmetic-arrow',
    'line-graph': '#math-demo-algebra-line',
    'function-family': '#math-demo-functions-base-path',
    probability: '#math-demo-probability-bars',
    statistics: '#math-demo-statistics-points',
    trig: '#math-demo-trigonometry-wave',
    limit: '#math-demo-limits-curve',
    derivative: '#math-demo-derivatives-curve',
    integral: '#math-demo-integrals-curve',
    series: '#math-demo-series-curve',
    vectors: '#math-demo-vectors-vector-a',
    geometry: '#math-demo-geometry-triangle',
    matrix: '#math-demo-matrices-square',
    eigenvalues: '#math-demo-eigenvalues-ellipse',
    'recursion-tree': '#math-demo-discrete-math-links',
    'growth-model': '#math-demo-modeling-curve',
    'slope-field': '#math-demo-first-order-odes-solution-path',
    oscillator: '#math-demo-second-order-odes-oscillation',
    'phase-portrait': '#math-demo-systems-of-odes-trajectory',
  }[resolvedKind] ?? null;

  return {
    kind: resolvedKind,
    renderer,
    skeleton,
    sentinelId,
  };
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

  const completionButton = event.target.closest('[data-practice-complete-toggle]');

  if (completionButton) {
    const problemCard = completionButton.closest('[data-practice-problem]');

    if (problemCard) {
      completionButton.setAttribute(
        'aria-pressed',
        completionButton.getAttribute('aria-pressed') === 'true' ? 'false' : 'true',
      );
      persistPracticeCompletionState();
    }

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

pomodoroPresetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    startPomodoroTimer(button.dataset.pomodoroMode ?? '');
  });
});

window.addEventListener('keydown', (event) => {
  handleGlobalKeyboardShortcuts(event);
});

syncThemePreference();
renderPlaceholder('Search note titles and note content.');
revealQueryMatch();
initFormulaSliderDemo();
initMathInteractiveVisuals();
syncPracticeCompletionState();

syncSubjectNavigation();
syncPomodoroTimer();

window.addEventListener('storage', (event) => {
  if (event.key === NOTES_THEME_STORAGE_KEY) {
    syncThemePreference();
  }

  if (event.key === getPracticeCompletionStorageKey() || event.key === null) {
    syncPracticeCompletionState();
  }

  if (event.key === POMODORO_TIMER_STORAGE_KEY) {
    syncPomodoroTimer();
  }
});
window.addEventListener('pageshow', syncSubjectNavigation);
window.addEventListener('pageshow', syncThemePreference);
window.addEventListener('pageshow', syncPomodoroTimer);
window.addEventListener('pageshow', syncPracticeCompletionState);
window.addEventListener('pageshow', initFormulaSliderDemo);
window.addEventListener('pageshow', initMathInteractiveVisuals);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    syncPomodoroTimer();
  }
});
