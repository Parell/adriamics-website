const searchTriggers = Array.from(document.querySelectorAll('[data-search-trigger]'));
const timerTriggers = Array.from(document.querySelectorAll('[data-timer-trigger]'));
const searchPanel = document.getElementById('search-panel');
const timerPanel = document.getElementById('timer-panel');
const timerCard = timerPanel?.querySelector('.timer-panel__card');
const searchCloseButton = document.getElementById('search-close');
const searchInput = document.getElementById('search-input');
const searchStatus = document.getElementById('search-status');
const searchResults = document.getElementById('search-results');
const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
const pomodoroPresetButtons = Array.from(document.querySelectorAll('[data-pomodoro-trigger]'));
const pomodoroBar = document.querySelector('[data-pomodoro-bar]');
const pomodoroStatus = document.querySelector('[data-pomodoro-status]');

const SEARCH_INDEX_URL = '/notes/search-index.json';
const NOTES_THEME_STORAGE_KEY = 'ues-notes:contrast-mode';
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
let pomodoroTimerState = null;
let pomodoroTimerIntervalId = null;
let pomodoroTimerCompletionTimeoutId = null;
let pomodoroTimerStorageWriteFailed = false;

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeWhitespace(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

function tokenize(query) {
  return normalizeWhitespace(query).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readFromStorage(storageKey, fallbackValue, reader) {
  const storage = getLocalStorage();

  if (!storage || !storageKey) {
    return fallbackValue;
  }

  try {
    return reader(storage);
  } catch {
    return fallbackValue;
  }
}

function writeToStorage(storageKey, writer) {
  const storage = getLocalStorage();

  if (!storage || !storageKey) {
    return false;
  }

  try {
    writer(storage);
    return true;
  } catch {
    return false;
  }
}

function readStoredString(storageKey, fallback = '') {
  return readFromStorage(storageKey, fallback, (storage) => {
    const value = String(storage.getItem(storageKey) ?? '').trim();
    return value || fallback;
  });
}

function writeStoredString(storageKey, value) {
  writeToStorage(storageKey, (storage) => {
    storage.setItem(storageKey, String(value ?? ''));
  });
}

function readThemePreference() {
  return ['sepia', 'light'].includes(readStoredString(NOTES_THEME_STORAGE_KEY, ''));
}

function getThemeToggleLabel(isSepia) {
  return isSepia ? 'Dark' : 'Light';
}

function getThemeToggleAriaLabel(isSepia) {
  return isSepia ? 'Switch to dark mode' : 'Switch to light mode';
}

function writeThemePreference(isSepia) {
  writeStoredString(NOTES_THEME_STORAGE_KEY, isSepia ? 'light' : 'default');
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

function isVisibleElement(element) {
  return Boolean(element && element instanceof HTMLElement && element.getClientRects().length > 0);
}

function setSearchTriggerState(isOpen) {
  searchTriggers.forEach((trigger) => {
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

function setTimerTriggerState(isOpen) {
  timerTriggers.forEach((trigger) => {
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

function getVisibleSearchTrigger() {
  return searchTriggers.find(isVisibleElement) ?? null;
}

function getVisibleTimerTrigger() {
  return timerTriggers.find(isVisibleElement) ?? null;
}

function updateSearchStatus(message) {
  if (searchStatus) {
    searchStatus.textContent = message;
  }
}

function renderPlaceholder(message) {
  if (searchResults) {
    searchResults.innerHTML = `<p class="search-result__snippet">${escapeHtml(message)}</p>`;
  }
}

function renderSearchResults(results, query) {
  if (!searchResults) {
    return;
  }

  const terms = tokenize(query);

  if (!results.length) {
    renderPlaceholder(query.trim() ? 'No notes matched your search.' : 'Type to search across all notes.');
    return;
  }

  searchResults.innerHTML = results.map((result) => {
    const title = escapeHtml(result.title ?? '');
    const subject = escapeHtml(result.subject ?? '');
    const href = escapeHtml(result.url ?? '#');
    const text = normalizeWhitespace(result.text ?? '');
    let snippet = escapeHtml(text);

    for (const term of terms) {
      if (!term) {
        continue;
      }

      const pattern = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
      snippet = snippet.replace(pattern, '<mark>$1</mark>');
    }

    return `<a class="search-result" href="${href}" data-search-result>
      <p class="search-result__title">${title} <span class="search-result__subject">${subject}</span></p>
      <p class="search-result__snippet">${snippet}</p>
    </a>`;
  }).join('');
}

function searchNotes(query) {
  if (!searchResults) {
    return;
  }

  const normalizedQuery = normalizeWhitespace(query);

  if (searchIndexFailed) {
    updateSearchStatus('The generated search index could not be loaded.');
    renderPlaceholder('The generated search index could not be loaded.');
    return;
  }

  if (!normalizedQuery) {
    updateSearchStatus(searchIndexReady ? 'Type to search across all notes.' : 'Loading search index...');
    renderPlaceholder(searchIndexReady ? 'Type to search across all notes.' : 'Loading search index...');
    return;
  }

  if (!searchIndexReady) {
    updateSearchStatus('Loading search index...');
    renderPlaceholder('Loading search index...');
    return;
  }

  const terms = tokenize(normalizedQuery);
  const results = searchIndex.filter((entry) => {
    const searchable = normalizeWhitespace(`${entry.title ?? ''} ${entry.subject ?? ''} ${entry.text ?? ''}`).toLowerCase();
    return terms.every((term) => searchable.includes(term));
  }).slice(0, 8);

  updateSearchStatus(results.length ? `${results.length} result${results.length === 1 ? '' : 's'} found.` : 'No notes matched your search.');
  renderSearchResults(results, normalizedQuery);
}

async function loadSearchIndex() {
  if (searchIndexPromise) {
    return searchIndexPromise;
  }

  searchIndexPromise = fetch(SEARCH_INDEX_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Search index request failed with ${response.status}.`);
      }

      return response.json();
    })
    .then((entries) => {
      searchIndex = Array.isArray(entries) ? entries : [];
      searchIndexReady = true;
      searchNotes(searchInput?.value ?? '');
      return searchIndex;
    })
    .catch(() => {
      searchIndexFailed = true;
      searchNotes(searchInput?.value ?? '');
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

  activeSearchTrigger = (trigger && isVisibleElement(trigger)) ? trigger : getVisibleSearchTrigger() ?? activeSearchTrigger;
  searchPanel.hidden = false;
  setSearchTriggerState(true);
  searchNotes(searchInput.value);
  searchInput.focus();
  searchInput.select();
  void loadSearchIndex();
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

  const returnTrigger = isVisibleElement(activeSearchTrigger) ? activeSearchTrigger : getVisibleSearchTrigger();
  returnTrigger?.focus();
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

  const mode = String(rawState.mode ?? '').trim();
  const config = getPomodoroModeConfig(mode);

  if (!config) {
    return null;
  }

  const status = String(rawState.status ?? '').trim();
  const startedAt = Number(rawState.startedAt);
  const endsAt = Number(rawState.endsAt);
  const completedAt = Number(rawState.completedAt);
  const durationMs = Number(rawState.durationMs);

  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return null;
  }

  const normalized = {
    mode,
    status: ['running', 'completed'].includes(status) ? status : 'running',
    startedAt: Number.isFinite(startedAt) ? startedAt : Date.now(),
    endsAt: Number.isFinite(endsAt) ? endsAt : Date.now() + durationMs,
    durationMs,
    completedAt: Number.isFinite(completedAt) ? completedAt : null,
  };

  if (normalized.status === 'completed' && normalized.completedAt === null) {
    normalized.completedAt = normalized.endsAt;
  }

  return normalized;
}

function readPomodoroState() {
  return readFromStorage(POMODORO_TIMER_STORAGE_KEY, null, (storage) => {
    const raw = storage.getItem(POMODORO_TIMER_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      return normalizePomodoroState(JSON.parse(raw));
    } catch {
      return null;
    }
  });
}

function writePomodoroState(state) {
  if (!state) {
    pomodoroTimerStorageWriteFailed = !writeToStorage(POMODORO_TIMER_STORAGE_KEY, (storage) => {
      storage.removeItem(POMODORO_TIMER_STORAGE_KEY);
    });
    return;
  }

  pomodoroTimerStorageWriteFailed = !writeToStorage(POMODORO_TIMER_STORAGE_KEY, (storage) => {
    storage.setItem(POMODORO_TIMER_STORAGE_KEY, JSON.stringify(state));
  });
}

function clearPomodoroState() {
  pomodoroTimerState = null;
  pomodoroTimerStorageWriteFailed = false;
  writePomodoroState(null);
}

function setPomodoroState(state) {
  pomodoroTimerState = state;
  writePomodoroState(state);
}

function getPomodoroSnapshot() {
  if (!pomodoroTimerState) {
    return {
      status: 'idle',
      mode: '',
      progress: 0,
      valueNow: 0,
      valueText: 'Pomodoro timer is idle',
    };
  }

  const state = pomodoroTimerState;
  const config = getPomodoroModeConfig(state.mode);
  const now = Date.now();
  const remainingMs = Math.max(0, state.endsAt - now);
  const totalMs = Math.max(1, state.durationMs || (config?.minutes ?? 0) * 60 * 1000);
  const progress = Math.min(100, Math.max(0, 100 - ((remainingMs / totalMs) * 100)));

  if (state.status === 'completed') {
    return {
      status: 'completed',
      mode: state.mode,
      progress: 100,
      valueNow: 100,
      valueText: `${config?.label ?? 'Timer'} timer complete`,
    };
  }

  if (remainingMs <= 0) {
    return {
      status: 'completed',
      mode: state.mode,
      progress: 100,
      valueNow: 100,
      valueText: `${config?.label ?? 'Timer'} timer complete`,
    };
  }

  return {
    status: 'running',
    mode: state.mode,
    progress,
    valueNow: Math.round(progress),
    valueText: `${config?.label ?? 'Timer'} timer, ${formatPomodoroTime(remainingMs)} remaining`,
  };
}

function syncPomodoroUI() {
  if (pomodoroBar) {
    const snapshot = getPomodoroSnapshot();

    if (snapshot.mode) {
      pomodoroBar.dataset.mode = snapshot.mode;
    } else {
      delete pomodoroBar.dataset.mode;
    }

    pomodoroBar.classList.toggle('is-running', snapshot.status === 'running');
    pomodoroBar.classList.toggle('is-complete', snapshot.status === 'completed');
    pomodoroBar.style.setProperty('--pomodoro-progress', String(snapshot.progress ?? 0));
    pomodoroBar.setAttribute('aria-valuenow', String(snapshot.valueNow ?? 0));
    pomodoroBar.setAttribute('aria-valuetext', snapshot.valueText ?? 'Pomodoro timer is idle');
  }

  const activeMode = pomodoroTimerState?.mode ?? '';
  pomodoroPresetButtons.forEach((button) => {
    button.setAttribute('aria-pressed', activeMode && button.dataset.pomodoroMode === activeMode ? 'true' : 'false');
  });

  if (pomodoroStatus) {
    pomodoroStatus.textContent = getPomodoroSnapshot().valueText ?? 'Pomodoro timer is idle';
  }
}

function stopPomodoroTimer() {
  if (pomodoroTimerIntervalId !== null) {
    window.clearInterval(pomodoroTimerIntervalId);
    pomodoroTimerIntervalId = null;
  }

  if (pomodoroTimerCompletionTimeoutId !== null) {
    window.clearTimeout(pomodoroTimerCompletionTimeoutId);
    pomodoroTimerCompletionTimeoutId = null;
  }
}

function schedulePomodoroCompletionSync(expiresAt) {
  if (pomodoroTimerCompletionTimeoutId !== null) {
    window.clearTimeout(pomodoroTimerCompletionTimeoutId);
  }

  const delay = Math.max(0, expiresAt - Date.now() + 25);
  pomodoroTimerCompletionTimeoutId = window.setTimeout(() => {
    pomodoroTimerCompletionTimeoutId = null;
    finalizePomodoroTimer();
  }, delay);
}

function finalizePomodoroTimer() {
  if (!pomodoroTimerState) {
    return;
  }

  const completedAt = pomodoroTimerState.endsAt;
  pomodoroTimerState = {
    ...pomodoroTimerState,
    status: 'completed',
    completedAt,
  };
  writePomodoroState(pomodoroTimerState);
  syncPomodoroUI();

  window.setTimeout(() => {
    if (pomodoroTimerState?.status === 'completed' && (pomodoroTimerState.completedAt ?? 0) === completedAt) {
      clearPomodoroState();
      syncPomodoroUI();
    }
  }, POMODORO_COMPLETION_FLASH_MS);
}

function startPomodoroTicker() {
  stopPomodoroTimer();

  if (!pomodoroTimerState || pomodoroTimerState.status !== 'running') {
    syncPomodoroUI();
    return;
  }

  const remainingMs = pomodoroTimerState.endsAt - Date.now();

  if (remainingMs <= 0) {
    finalizePomodoroTimer();
    return;
  }

  pomodoroTimerIntervalId = window.setInterval(() => {
    if (!pomodoroTimerState) {
      stopPomodoroTimer();
      return;
    }

    if (pomodoroTimerState.endsAt <= Date.now()) {
      stopPomodoroTimer();
      finalizePomodoroTimer();
      return;
    }

    syncPomodoroUI();
  }, 1000);

  schedulePomodoroCompletionSync(pomodoroTimerState.endsAt);
  syncPomodoroUI();
}

function beginPomodoroTimer(mode) {
  const config = getPomodoroModeConfig(mode);

  if (!config) {
    return;
  }

  const durationMs = config.minutes * 60 * 1000;
  const startedAt = Date.now();
  const state = {
    mode,
    status: 'running',
    startedAt,
    endsAt: startedAt + durationMs,
    durationMs,
    completedAt: null,
  };

  setPomodoroState(state);
  startPomodoroTicker();
}

function openTimer(trigger = activeTimerTrigger) {
  if (!timerPanel) {
    return;
  }

  if (searchPanel && !searchPanel.hidden) {
    closeSearch({ restoreFocus: false });
  }

  activeTimerTrigger = (trigger && isVisibleElement(trigger)) ? trigger : getVisibleTimerTrigger() ?? activeTimerTrigger;
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

  const returnTrigger = isVisibleElement(activeTimerTrigger) ? activeTimerTrigger : getVisibleTimerTrigger();
  returnTrigger?.focus();
}

pomodoroTimerState = normalizePomodoroState(readPomodoroState());

if (pomodoroTimerState?.status === 'running' && pomodoroTimerState.endsAt <= Date.now()) {
  finalizePomodoroTimer();
} else if (pomodoroTimerState?.status === 'running') {
  startPomodoroTicker();
}

syncThemePreference();
searchNotes('');
syncPomodoroUI();

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

themeToggleButtons.forEach((button) => {
  button.addEventListener('click', toggleThemePreference);
});

searchCloseButton?.addEventListener('click', () => closeSearch());
searchInput?.addEventListener('input', (event) => searchNotes(event.target.value));
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
    beginPomodoroTimer(button.dataset.pomodoroMode ?? '');
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') {
    return;
  }

  if (searchPanel && !searchPanel.hidden) {
    closeSearch();
    return;
  }

  if (timerPanel && !timerPanel.hidden) {
    closeTimer();
  }
});
