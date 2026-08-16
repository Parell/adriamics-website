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
const isPracticePage = document.querySelector('[data-practice-page]');
const practiceFilterButtons = Array.from(document.querySelectorAll('[data-practice-filter-button]'));
const practiceFilterSummary = document.querySelector('[data-practice-filter-summary]');
const practiceProgressBar = document.querySelector('[data-practice-progress]');
const practiceProgressSummary = document.querySelector('[data-practice-progress-summary]');
const practiceLevelSections = Array.from(document.querySelectorAll('[data-practice-level]'));
const practiceProblemCards = Array.from(document.querySelectorAll('[data-practice-problem]'));
const subjectHeaderLinks = Array.from(document.querySelectorAll('[data-subject-id]'));
const themeToggleButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
const pomodoroPresetButtons = Array.from(document.querySelectorAll('[data-pomodoro-trigger]'));
const pomodoroBar = document.querySelector('[data-pomodoro-bar]');
const pomodoroStatus = document.querySelector('[data-pomodoro-status]');
const notesScriptUrl = document.currentScript?.src
  || Array.from(document.scripts).find((script) => /\/notes\.js(?:\?|$)/.test(script.src))?.src
  || window.location.href;
const NOTES_BASE_URL = new URL('.', notesScriptUrl);
const SEARCH_INDEX_URL = new URL('search-index.json', NOTES_BASE_URL).href;
const NOTES_SESSION_STORAGE_KEY = 'ues-notes:last-pages-by-subject';
const NOTES_THEME_STORAGE_KEY = 'ues-notes:contrast-mode';
const PRACTICE_COMPLETION_STORAGE_KEY_PREFIX = 'ues-notes:practice-completion:';
const PRACTICE_FILTER_STORAGE_KEY_PREFIX = 'ues-notes:practice-filter:';
const POMODORO_TIMER_STORAGE_KEY = 'ues-notes:pomodoro-timer';
const POMODORO_COMPLETION_FLASH_MS = 2200;
const PRACTICE_FILTER_VALUES = new Set(['all', 'exam-i', 'exam-ii', 'final', 'marked', 'missed']);
const POMODORO_TIMER_MODES = new Map(Object.entries(window.NotesRuntime?.pomodoroModes ?? {}));

let searchIndex = [];
let searchIndexPromise = null;
let searchIndexReady = false;
let searchIndexFailed = false;
let activeSearchTrigger = searchTriggers[0] ?? null;
let activeTimerTrigger = timerTriggers[0] ?? null;
let activeSearchResultIndex = -1;
let activePracticeFilter = 'all';
let pomodoroTimerState = null;
let pomodoroTimerIntervalId = null;
let pomodoroTimerCompletionTimeoutId = null;
const contributorCopyResetTimers = new WeakMap();

function getSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readFromStorage(storageGetter, storageKey, reader, fallback = null) {
  try {
    const storage = storageGetter();
    if (!storage || !storageKey) return fallback;
    return reader(storage);
  } catch {
    return fallback;
  }
}

function writeToStorage(storageGetter, storageKey, writer) {
  try {
    const storage = storageGetter();
    if (!storage || !storageKey) return false;
    writer(storage);
    return true;
  } catch {
    return false;
  }
}

function readLastPagesBySubject() {
  return readFromStorage(getSessionStorage, NOTES_SESSION_STORAGE_KEY, (storage) => {
    const raw = storage.getItem(NOTES_SESSION_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  });
}

function writeLastPagesBySubject(state) {
  writeToStorage(getSessionStorage, NOTES_SESSION_STORAGE_KEY, (storage) => {
    storage.setItem(NOTES_SESSION_STORAGE_KEY, JSON.stringify(state));
  });
}

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getScopedStorageKey(prefix, scope) {
  const normalizedScope = String(scope ?? '').trim();
  return normalizedScope ? `${prefix}${normalizedScope}` : null;
}

function readStoredStringSet(storageKey, validate = null) {
  return readFromStorage(getLocalStorage, storageKey, (storage) => {
    const raw = storage.getItem(storageKey);

    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return new Set();
    }

    const values = parsed
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);

    return new Set(typeof validate === 'function' ? values.filter(validate) : values);
  }, new Set());
}

function writeStoredStringSet(storageKey, values) {
  writeToStorage(getLocalStorage, storageKey, (storage) => {
    storage.setItem(storageKey, JSON.stringify(Array.from(values)));
  });
}

function readStoredString(storageKey) {
  return readFromStorage(getLocalStorage, storageKey, (storage) => {
    return String(storage.getItem(storageKey) ?? '').trim();
  }, '');
}

function writeStoredString(storageKey, value) {
  writeToStorage(getLocalStorage, storageKey, (storage) => {
    storage.setItem(storageKey, String(value ?? ''));
  });
}

async function copyTextToClipboard(text) {
  const value = String(text ?? '');

  if (!value) {
    return false;
  }

  await navigator.clipboard.writeText(value);
  return true;
}

function showContributorCopiedState(button) {
  const originalLabel = String(button.dataset.copyLabel ?? button.textContent ?? '').trim();

  if (!originalLabel) {
    return;
  }

  const previousTimer = contributorCopyResetTimers.get(button);

  if (previousTimer) {
    window.clearTimeout(previousTimer);
  }

  button.textContent = 'Copied';
  button.setAttribute('aria-label', `Copied contributor email ${button.dataset.copyText ?? ''}`);
  button.setAttribute('title', 'Copied');

  const resetTimer = window.setTimeout(() => {
    button.textContent = originalLabel;
    button.setAttribute('aria-label', `Copy contributor email ${button.dataset.copyText ?? ''}`);
    button.setAttribute('title', 'Copy email');
    contributorCopyResetTimers.delete(button);
  }, 1500);

  contributorCopyResetTimers.set(button, resetTimer);
}

function readThemePreference() {
  return ['sepia', 'light'].includes(readStoredString(NOTES_THEME_STORAGE_KEY));
}

function getThemeToggleLabel(isSepia) {
  return isSepia ? 'Dark' : 'Light';
}

function getThemeToggleAriaLabel(isSepia) {
  return isSepia ? 'Switch to dark mode' : 'Switch to light mode';
}

function writeThemePreference(isSepia) {
  writeToStorage(getLocalStorage, NOTES_THEME_STORAGE_KEY, (storage) => {
    storage.setItem(NOTES_THEME_STORAGE_KEY, isSepia ? 'light' : 'default');
  });
}

function getPracticeCompletionStorageKey() {
  return isPracticePage ? getScopedStorageKey(PRACTICE_COMPLETION_STORAGE_KEY_PREFIX, window.location.pathname) : null;
}

function loadPracticeCompletionIds() {
  const storageKey = getPracticeCompletionStorageKey();
  return readStoredStringSet(storageKey);
}

function savePracticeCompletionIds(ids) {
  writeStoredStringSet(getPracticeCompletionStorageKey(), ids);
}

function getPracticeFilterStorageKey() {
  return isPracticePage ? getScopedStorageKey(PRACTICE_FILTER_STORAGE_KEY_PREFIX, window.location.pathname) : null;
}

function loadPracticeFilter() {
  const storageKey = getPracticeFilterStorageKey();

  const normalized = readStoredString(storageKey).toLowerCase();
  return PRACTICE_FILTER_VALUES.has(normalized) ? normalized : 'all';
}

function getPracticeFilterFromUrl() {
  const value = String(new URL(window.location.href).searchParams.get('filter') ?? '').trim().toLowerCase();
  return PRACTICE_FILTER_VALUES.has(value) ? value : null;
}

function savePracticeFilter(value) {
  writeStoredString(getPracticeFilterStorageKey(), value);
}

function getPracticeFilterLabel(value) {
  switch (value) {
    case 'exam-i':
      return 'Exam I';
    case 'exam-ii':
      return 'Exam II';
    case 'final':
      return 'Final';
    case 'marked':
      return 'Marked';
    case 'missed':
      return 'Missed';
    default:
      return 'All';
  }
}

function getPracticeCompletionToggle(card) {
  return card.querySelector('[data-practice-complete-toggle]');
}

function setPracticeCardCompletion(card, isComplete) {
  const toggle = getPracticeCompletionToggle(card);

  card.classList.toggle('is-complete', isComplete);

  if (toggle) {
    toggle.setAttribute('aria-pressed', isComplete ? 'true' : 'false');
  }
}

function isPracticeCardCompleted(card) {
  return card.classList.contains('is-complete');
}

function isPracticeCardVisible(card, value) {
  switch (value) {
    case 'exam-i':
    case 'exam-ii':
    case 'final':
      return (card.dataset.exam ?? '') === value;
    case 'marked':
      return isPracticeCardCompleted(card);
    case 'missed':
      return !isPracticeCardCompleted(card);
    case 'all':
    default:
      return true;
  }
}

function updatePracticeFilterSummary(visibleCount, totalCount, value) {
  if (!practiceFilterSummary) {
    return;
  }

  if (value === 'all') {
    practiceFilterSummary.textContent = `Showing all ${totalCount} problems`;
    return;
  }

  practiceFilterSummary.textContent = `Showing ${visibleCount} of ${totalCount} problems for ${getPracticeFilterLabel(value)}`;
}

function syncPracticeFilterButtons(value) {
  practiceFilterButtons.forEach((button) => {
    const isActive = button.dataset.practiceFilter === value;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function renderPracticeFilter(value) {
  if (!isPracticePage) {
    return;
  }

  const normalized = PRACTICE_FILTER_VALUES.has(value) ? value : 'all';
  let visibleCount = 0;
  const visibleLevelSections = new Set();

  practiceProblemCards.forEach((card) => {
    const isVisible = isPracticeCardVisible(card, normalized);
    card.hidden = !isVisible;

    if (isVisible) {
      visibleCount += 1;
    }

    const levelSection = card.closest('[data-practice-level]');

    if (levelSection && isVisible) {
      visibleLevelSections.add(levelSection);
    }
  });

  practiceLevelSections.forEach((section) => {
    section.hidden = normalized !== 'all' && !visibleLevelSections.has(section);
  });

  activePracticeFilter = normalized;
  syncPracticeFilterButtons(normalized);
  updatePracticeFilterSummary(visibleCount, practiceProblemCards.length, normalized);
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

function renderPracticeCompletionState(completedIds) {
  if (!isPracticePage) {
    return;
  }

  const completedSet = completedIds instanceof Set ? completedIds : new Set(completedIds);
  let completedCount = 0;

  practiceProblemCards.forEach((card) => {
    const isComplete = Boolean(card.id) && completedSet.has(card.id);

    setPracticeCardCompletion(card, isComplete);

    if (isComplete) {
      completedCount += 1;
    }
  });

  updatePracticeProgressUi(completedCount, practiceProblemCards.length);
}

function syncPracticeCompletionState() {
  if (!isPracticePage) {
    return;
  }

  renderPracticeCompletionState(loadPracticeCompletionIds());
  renderPracticeFilter(activePracticeFilter);
}

function savePracticeCompletionState() {
  if (!isPracticePage) {
    return;
  }

  const completedIds = new Set();
  let completedCount = 0;

  practiceProblemCards.forEach((card) => {
    const isComplete = getPracticeCompletionToggle(card)?.getAttribute('aria-pressed') === 'true';

    setPracticeCardCompletion(card, Boolean(isComplete));

    if (isComplete && card.id) {
      completedIds.add(card.id);
      completedCount += 1;
    }
  });

  savePracticeCompletionIds(completedIds);
  updatePracticeProgressUi(completedCount, practiceProblemCards.length);
  renderPracticeFilter(activePracticeFilter);
}

/*
function loadConceptDagState() {
  if (!isConceptDagPage || !conceptDagDataScript) {
    throw new Error('Invalid concept DAG data.');
  }

  if (conceptDagModel) {
    return conceptDagModel;
  }

  try {
    const parsed = JSON.parse(conceptDagDataScript.textContent ?? 'null');

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const orderedNodeIds = [];
    const nodesById = new Map();
    const nodeOrder = new Map();

    nodes.forEach((node, index) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        return;
      }

      const id = String(node.id ?? '').trim();

      if (!id) {
        return;
      }

      orderedNodeIds.push(id);
      nodesById.set(id, {
        id,
        title: String(node.title ?? '').trim(),
        level: String(node.level ?? '').trim(),
        requires: getConceptDagRequirements(node),
      });
      nodeOrder.set(id, index);
    });

    conceptDagModel = {
      id: String(parsed.id ?? 'concept-dag').trim(),
      description: String(parsed.description ?? '').trim(),
      defaultSubjectId: String(parsed.defaultSubjectId ?? orderedNodeIds[0] ?? '').trim(),
      nodes,
      orderedNodeIds,
      nodesById,
      nodeOrder,
    };

    return conceptDagModel;
}

function getConceptDagRequirements(node) {
  const requires = node?.requires && typeof node.requires === 'object' && !Array.isArray(node.requires)
    ? node.requires
    : {};

  return {
    hard: Array.isArray(requires.hard) ? requires.hard : [],
    soft: Array.isArray(requires.soft) ? requires.soft : [],
  };
}

function getConceptDagStorageScope() {
  const state = loadConceptDagState();
  const fallbackScope = String(window.location.pathname ?? '').trim();
  return String(state?.defaultSubjectId ?? fallbackScope ?? '').trim();
}

function getConceptDagStorageKey() {
  return getScopedStorageKey(CONCEPT_DAG_SELECTION_STORAGE_KEY + ':', getConceptDagStorageScope());
}

function getConceptDagSelection() {
  const state = loadConceptDagState();

  if (!state) {
    return '';
  }

  const storageKey = getConceptDagStorageKey();
  const fallback = state.defaultSubjectId || state.orderedNodeIds[0] || '';
  const raw = readStoredString(storageKey);
  return state.nodesById.has(raw) ? raw : fallback;
}

function setConceptDagSelection(subjectId) {
  writeStoredString(getConceptDagStorageKey(), subjectId);
}

function collectConceptDagAncestors(selectedId, nodesById) {
  const visited = new Set();
  const stack = [selectedId];

  while (stack.length) {
    const nodeId = stack.pop();

    if (visited.has(nodeId)) {
      continue;
    }

    visited.add(nodeId);

    const node = nodesById.get(nodeId);

    if (!node) {
      continue;
    }

    const requirements = [...node.requires.hard, ...node.requires.soft];

    requirements.forEach((dependencyId) => {
      if (nodesById.has(dependencyId)) {
        stack.push(dependencyId);
      }
    });
  }

  return visited;
}

function buildConceptDagChildMap(ancestorIds, nodesById, nodeOrder) {
  const childMap = new Map();

  ancestorIds.forEach((nodeId) => {
    childMap.set(nodeId, {
      hard: [],
      soft: [],
    });
  });

  ancestorIds.forEach((nodeId) => {
    const node = nodesById.get(nodeId);

    if (!node) {
      return;
    }

    const pushChildren = (dependencyIds, type) => {
      dependencyIds.forEach((dependencyId) => {
        if (!ancestorIds.has(dependencyId) || !childMap.has(dependencyId)) {
          return;
        }

        childMap.get(dependencyId)[type].push(nodeId);
      });
    };

    pushChildren(node.requires.hard, 'hard');
    pushChildren(node.requires.soft, 'soft');
  });

  childMap.forEach((relations) => {
    relations.hard.sort((left, right) => (nodeOrder.get(left) ?? 0) - (nodeOrder.get(right) ?? 0));
    relations.soft.sort((left, right) => (nodeOrder.get(left) ?? 0) - (nodeOrder.get(right) ?? 0));
  });

  return childMap;
}

function getConceptNoteUrlFromId(nodeId) {
  const normalizedId = String(nodeId ?? '').trim();
  const separatorIndex = normalizedId.indexOf('.');

  if (separatorIndex < 0) {
    return '';
  }

  const domain = normalizedId.slice(0, separatorIndex).trim();
  const slug = normalizedId.slice(separatorIndex + 1).trim();

  if (!domain || !slug) {
    return '';
  }

  return `/notes/subjects/${domain}/${slug}/`;
}

function renderConceptDagNodeLink(node, isSelected = false) {
  const selectedClass = isSelected ? ' is-selected' : '';
  const noteUrl = getConceptNoteUrlFromId(node.id);

  return `<a class="concept-dag-tree__node${selectedClass}" href="${escapeHtml(noteUrl)}" data-concept-dag-node-link data-concept-dag-note-url="${escapeHtml(noteUrl)}" data-notes-nav-item>${escapeHtml(node.title)}</a>`;
}

function collectConceptDagRootIds(ancestorIds, nodesById, nodeOrder) {
  const rootIds = [];

  ancestorIds.forEach((nodeId) => {
    const node = nodesById.get(nodeId);

    if (!node) {
      return;
    }

    const prerequisites = [...node.requires.hard, ...node.requires.soft]
      .filter((dependencyId) => ancestorIds.has(dependencyId) && nodesById.has(dependencyId));

    if (!prerequisites.length) {
      rootIds.push(nodeId);
    }
  });

  rootIds.sort((left, right) => (nodeOrder.get(left) ?? 0) - (nodeOrder.get(right) ?? 0));
  return rootIds;
}

function walkConceptDagTreeRows(nodeId, context, depth, pathStack, rows) {
  if (pathStack.has(nodeId)) {
    return;
  }

  const nextPathStack = new Set(pathStack);
  nextPathStack.add(nodeId);
  const node = context.nodesById.get(nodeId);

  if (!node) {
    return;
  }

  if (context.renderedIds.has(nodeId)) {
    return;
  }

  context.renderedIds.add(nodeId);
  if (!rows[depth]) {
    rows[depth] = [];
  }

  rows[depth].push(node);

  const children = context.childMap.get(nodeId) ?? { hard: [], soft: [] };
  const childIds = [...children.hard, ...children.soft].filter((childId) => context.ancestorIds.has(childId));
  childIds
    .filter((childId) => !context.renderedIds.has(childId))
    .forEach((childId) => walkConceptDagTreeRows(childId, context, depth + 1, nextPathStack, rows));
}

function renderConceptDagRows(rows, selectedId) {
  return rows.map((rowNodes, depth) => {
    const isLastRow = depth === rows.length - 1 && depth > 0;
    const connectorCells = depth
      ? Array.from({ length: depth }, (_, index) => {
        const type = isLastRow ? (index === 0 ? 'corner' : 'junction') : 'vertical';
        return `<span class="concept-dag-tree__connector-cell concept-dag-tree__connector-cell--${type}" aria-hidden="true"></span>`;
      }).join('')
      : '';
    const nodesHtml = rowNodes.map((node, index) => {
      const separator = index > 0 ? '<span class="concept-dag-tree__separator" aria-hidden="true"> - </span>' : '';

      return `${separator}${renderConceptDagNodeLink(node, node.id === selectedId)}`;
    }).join('');

    return `<div class="concept-dag-tree__row${isLastRow ? ' concept-dag-tree__row--tail' : ''}" data-concept-dag-depth="${escapeHtml(String(depth))}">${depth ? `<span class="concept-dag-tree__connector${isLastRow ? ' concept-dag-tree__connector--tail' : ''}" aria-hidden="true">${connectorCells}</span>` : ''}<span class="concept-dag-tree__nodes">${nodesHtml}</span></div>`;
  }).join('');
}

function syncConceptDagSubjectButtons(selectedId) {
  Array.from(document.querySelectorAll('[data-concept-dag-subject]')).forEach((button) => {
    const isActive = String(button.dataset.conceptDagSubject ?? '').trim() === selectedId;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function renderConceptDagTree() {
  const state = loadConceptDagState();

  if (!state || !conceptDagTree) {
    return;
  }

  const selectedId = selectedConceptDagSubjectId && state.nodesById.has(selectedConceptDagSubjectId)
    ? selectedConceptDagSubjectId
    : state.defaultSubjectId || state.orderedNodeIds[0] || '';

  if (!selectedId) {
    conceptDagTree.innerHTML = '<p class="concept-dag-tree__empty">No concept data available.</p>';
    return;
  }

  const ancestorIds = collectConceptDagAncestors(selectedId, state.nodesById);
  const rootIds = collectConceptDagRootIds(ancestorIds, state.nodesById, state.nodeOrder);
  const renderRootIds = rootIds.length ? rootIds : [selectedId];

  const context = {
    nodesById: state.nodesById,
    nodeOrder: state.nodeOrder,
    ancestorIds,
    selectedId,
    childMap: buildConceptDagChildMap(ancestorIds, state.nodesById, state.nodeOrder),
    renderedIds: new Set(),
  };

  const rows = [];

  renderRootIds.forEach((nodeId) => {
    walkConceptDagTreeRows(nodeId, context, 0, new Set(), rows);
  });

  conceptDagTree.innerHTML = rows.length
    ? `<div class="concept-dag-tree__lines">
        ${renderConceptDagRows(rows, selectedId)}
      </div>`
    : '<p class="concept-dag-tree__empty">No prerequisite chain available for this subject.</p>';

  syncConceptDagSubjectButtons(selectedId);
}

function syncConceptDagSelection() {
  const state = loadConceptDagState();

  if (!state || !isConceptDagPage) {
    return;
  }

  selectedConceptDagSubjectId = getConceptDagSelection();

  if (!state.nodesById.has(selectedConceptDagSubjectId)) {
    selectedConceptDagSubjectId = state.defaultSubjectId || state.orderedNodeIds[0] || '';
    setConceptDagSelection(selectedConceptDagSubjectId);
  }

  renderConceptDagTree();
}

function selectConceptDagSubject(subjectId) {
  const state = loadConceptDagState();

  if (!state || !state.nodesById.has(subjectId)) {
    return;
  }

  selectedConceptDagSubjectId = subjectId;
  setConceptDagSelection(subjectId);
  renderConceptDagTree();
}

*/

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
  return window.NotesRuntime?.getPomodoroMode(mode) ?? POMODORO_TIMER_MODES.get(mode) ?? null;
}

function formatPomodoroTime(milliseconds) {
  return window.NotesRuntime?.formatPomodoroTime(milliseconds) ?? '0:00';
}

function normalizePomodoroState(rawState) {
  if (window.NotesRuntime?.normalizePomodoroState) {
    return window.NotesRuntime.normalizePomodoroState(rawState);
  }
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

function createIdlePomodoroSnapshot() {
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

function loadPomodoroState() {
  return readFromStorage(getLocalStorage, POMODORO_TIMER_STORAGE_KEY, (storage) => {
    const raw = storage.getItem(POMODORO_TIMER_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const state = normalizePomodoroState(JSON.parse(raw));

    if (!state) {
      storage.removeItem(POMODORO_TIMER_STORAGE_KEY);
    }

    return state;
  });
}

function savePomodoroState(state) {
  if (writeToStorage(getLocalStorage, POMODORO_TIMER_STORAGE_KEY, (storage) => {
    storage.setItem(POMODORO_TIMER_STORAGE_KEY, JSON.stringify(state));
  })) {
    pomodoroTimerState = state;
  }
}

function resetPomodoroState() {
  pomodoroTimerState = null;
  writeToStorage(getLocalStorage, POMODORO_TIMER_STORAGE_KEY, (storage) => {
    storage.removeItem(POMODORO_TIMER_STORAGE_KEY);
  });
}

function buildPomodoroSnapshot(state, now = Date.now()) {
  if (!state) {
    return createIdlePomodoroSnapshot();
  }

  if (state.status === 'completed') {
    const completedAt = state.completedAt ?? state.endsAt;
    const expiresAt = completedAt + POMODORO_COMPLETION_FLASH_MS;

    if (now >= expiresAt) {
      return createIdlePomodoroSnapshot();
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

function togglePomodoroTicker(isActive) {
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

function schedulePomodoroCompletionSync(expiresAt) {
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

function cancelPomodoroCompletionSync() {
  if (pomodoroTimerCompletionTimeoutId === null) {
    return;
  }

  window.clearTimeout(pomodoroTimerCompletionTimeoutId);
  pomodoroTimerCompletionTimeoutId = null;
}

function renderPomodoroTimer(snapshot) {
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

function beginPomodoroTimer(mode) {
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

  cancelPomodoroCompletionSync();
  savePomodoroState(state);
  syncPomodoroTimer();
}

function syncPomodoroTimer() {
  const now = Date.now();
  let state = loadPomodoroState();

  if (!state) {
    pomodoroTimerState = null;
    cancelPomodoroCompletionSync();
    togglePomodoroTicker(false);
    renderPomodoroTimer(createIdlePomodoroSnapshot());
    return;
  }

  if (state.status === 'running' && now >= state.endsAt) {
    state = {
      ...state,
      status: 'completed',
      completedAt: state.endsAt,
    };
    savePomodoroState(state);
  }

  const snapshot = buildPomodoroSnapshot(state, now);

  if (snapshot.status === 'idle') {
    resetPomodoroState();
    cancelPomodoroCompletionSync();
    togglePomodoroTicker(false);
    renderPomodoroTimer(snapshot);
    return;
  }

  pomodoroTimerState = state;
  togglePomodoroTicker(true);
  if (snapshot.status === 'completed') {
    schedulePomodoroCompletionSync((state.completedAt ?? state.endsAt) + POMODORO_COMPLETION_FLASH_MS);
  } else {
    cancelPomodoroCompletionSync();
  }

  renderPomodoroTimer(snapshot);
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

function normalizeWhitespace(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
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
  const normalized = String(text ?? '')
    .replace(/\\(?:left|right|bigl|bigr|Bigl|Bigr|biggl|biggr|lvert|rvert|langle|rangle|lceil|rceil|lfloor|rfloor|quad|qquad)\b/g, ' ')
    .replace(/\\[,;:!]/g, ' ')
    ;

  return normalizeWhitespace(expandLatexSearchStructures(normalized));
}

function expandLatexSearchStructures(text) {
  return translateLatexSearchCommands(String(text ?? '')
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

function translateLatexSearchCommands(text) {
  return String(text ?? '').replace(/\\([A-Za-z]+)\b/g, (_, command) => {
    return LATEX_COMMAND_MAP.get(command) ?? command;
  }, {});
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

  const radius = 72;
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
  const summary = String(entry.summary ?? '');
  const text = String(entry.text ?? '');
  const titleLower = normalizeLatexSearchText(title).toLowerCase();
  const summaryNormalized = normalizeLatexSearchText(summary);
  const summaryLower = summaryNormalized.toLowerCase();
  const textLower = normalizeLatexSearchText(text).toLowerCase();
  const searchable = `${titleLower} ${summaryLower} ${textLower}`;

  if (!terms.every((term) => searchable.includes(term))) {
    return null;
  }

  const titleHits = terms.filter((term) => titleLower.includes(term)).length;
  const summaryHits = terms.filter((term) => summaryLower.includes(term)).length;
  const firstTextPosition = terms
    .map((term) => textLower.indexOf(term))
    .filter((position) => position >= 0)
    .sort((left, right) => left - right)[0] ?? 0;
  const snippet = (titleHits || summaryHits === terms.length) && summaryNormalized
    ? buildSnippet(summaryNormalized, 0, 0)
    : buildSnippet(normalizeLatexSearchText(text || summary || title), firstTextPosition, terms[0]?.length ?? 0);

  return {
    ...entry,
    snippet,
    score: (titleHits * 1000) + (summaryHits * 100) - firstTextPosition,
  };
}

function getSearchResultHref(url, query) {
  const relativePath = String(url ?? '').replace(/^\/notes\//, '');
  const href = new URL(relativePath, NOTES_BASE_URL);
  href.searchParams.set('q', query);
  return href.href;
}

function searchNotes(query) {
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
    const href = getSearchResultHref(result.url, normalizedQuery);
    return `<div class="search-result__item" role="listitem">
      <a class="search-result" href="${escapeHtml(href)}" data-search-result aria-label="Open ${escapeHtml(result.title)}">
        <span class="search-result__subject">${escapeHtml(result.subject)}</span>
        <span class="search-result__title">${escapeHtml(result.title)}</span>
        <span class="search-result__snippet">${highlightText(result.snippet, terms)}</span>
      </a>
    </div>`;
  }).join('');

  updateSearchResultState(results.length ? 0 : -1);
}

async function loadSearchIndex() {
  if (searchIndexPromise) {
    return searchIndexPromise;
  }

  const requestSearchIndex = window.NotesRuntime?.loadSearchIndex
    ?? ((url) => fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Search index returned ${response.status}`);
      return response.json();
    }));

  searchIndexPromise = requestSearchIndex(SEARCH_INDEX_URL)
    .then((entries) => {
      searchIndex = Array.isArray(entries) ? entries : [];
      searchIndexReady = true;
      searchNotes(searchInput?.value ?? '');
      return searchIndex;
    })
    .catch((error) => {
      console.error('[notes] Search index failed to load.', error);
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

  activeSearchTrigger = (trigger && isVisibleElement(trigger))
    ? trigger
    : getVisibleSearchTrigger()
    ?? activeSearchTrigger;
  searchPanel.hidden = false;
  setSearchTriggerState(true);
  void loadSearchIndex();
  searchNotes(searchInput.value);
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

let interactiveBoardIdCounter = 0;

function ensureInteractiveBoardId(element, type) {
  if (element.id) {
    return element.id;
  }

  let id;
  do {
    interactiveBoardIdCounter += 1;
    id = `notes-${type}-board-${interactiveBoardIdCounter}`;
  } while (document.getElementById(id));

  element.id = id;
  return id;
}

function initVectorCalculusGradient(root) {
  if (!root || root.dataset.gradientInitialized === 'true') {
    return;
  }

  root.dataset.gradientInitialized = 'true';
  const boardElement = root.querySelector('[data-gradient-board]');

  if (!window.JXG || !boardElement) {
    throw new Error('Gradient interactive failed to initialize.');
  }

  const boardId = ensureInteractiveBoardId(boardElement, 'gradient');

  const fieldSelect = root.querySelector('[data-gradient-field]');
  const angleInput = root.querySelector('[data-gradient-angle]');
  const angleOutput = root.querySelector('[data-gradient-angle-value]');
  const values = Object.fromEntries(Array.from(root.querySelectorAll('[data-gradient-value]')).map((element) => [element.dataset.gradientValue, element]));
  const fields = createGradientFields();
  let fieldKey = fieldSelect?.value in fields ? fieldSelect.value : 'quadratic';
  let angle = Number(angleInput?.value ?? 35) * Math.PI / 180;
  const board = JXG.JSXGraph.initBoard(boardId, { boundingbox: [-5, 5, 5, -5], axis: true, showCopyright: false, showNavigation: false, keepaspectratio: true });
  const probe = board.create('point', [2, 1], { name: 'P', size: 4, color: '#f4b942', fixed: false, snapSizeX: 0.05, snapSizeY: 0.05 });
  const pointCoords = () => [probe.X(), probe.Y()];
  const addCurve = (x, y, range, extra = {}) => board.create('curve', [x, y, ...range], { strokeColor: '#7d8794', strokeWidth: 1, strokeOpacity: 0.55, fixed: true, ...extra });
  const levelCurves = createGradientLevelCurves(addCurve);
  const gradientArrow = board.create('arrow', [[() => probe.X(), () => probe.Y()], [() => probe.X() + fields[fieldKey].gradient(probe.X(), probe.Y())[0] * 0.55, () => probe.Y() + fields[fieldKey].gradient(probe.X(), probe.Y())[1] * 0.55]], { strokeColor: '#444', fillColor: '#444', strokeWidth: 3 });
  const directionArrow = board.create('arrow', [[() => probe.X(), () => probe.Y()], [() => probe.X() + Math.cos(angle) * 1.5, () => probe.Y() + Math.sin(angle) * 1.5]], { strokeColor: '#777', fillColor: '#777', strokeWidth: 3 });
  const tangentLine = board.create('line', [[() => probe.X() - Math.sin(Math.atan2(fields[fieldKey].gradient(probe.X(), probe.Y())[1], fields[fieldKey].gradient(probe.X(), probe.Y())[0])) * 5, () => probe.Y() + Math.cos(Math.atan2(fields[fieldKey].gradient(probe.X(), probe.Y())[1], fields[fieldKey].gradient(probe.X(), probe.Y())[0])) * 5], [() => probe.X() + Math.sin(Math.atan2(fields[fieldKey].gradient(probe.X(), probe.Y())[1], fields[fieldKey].gradient(probe.X(), probe.Y())[0])) * 5, () => probe.Y() - Math.cos(Math.atan2(fields[fieldKey].gradient(probe.X(), probe.Y())[1], fields[fieldKey].gradient(probe.X(), probe.Y())[0])) * 5]], { strokeColor: '#c084fc', strokeWidth: 2, dash: 2 });
  const update = () => {
    const [x, y] = pointCoords();
    const [gx, gy] = fields[fieldKey].gradient(x, y);
    const magnitude = Math.hypot(gx, gy);
    const directional = gx * Math.cos(angle) + gy * Math.sin(angle);
    if (values.point) values.point.textContent = `(${x.toFixed(2)}, ${y.toFixed(2)})`;
    if (values.field) values.field.textContent = fields[fieldKey].f(x, y).toFixed(2);
    if (values.gradient) values.gradient.textContent = `⟨${gx.toFixed(2)}, ${gy.toFixed(2)}⟩`;
    if (values.magnitude) values.magnitude.textContent = magnitude.toFixed(2);
    if (values.directional) values.directional.textContent = directional.toFixed(2);
    if (angleOutput) angleOutput.textContent = `${Math.round(angle * 180 / Math.PI)}°`;
    board.update();
  };
  const updateFieldVisibility = () => levelCurves.forEach((curve, index) => curve.setAttribute({ visible: fieldKey === 'quadratic' ? index < 7 : index >= 7 }));
  fieldSelect?.addEventListener('change', () => { fieldKey = fields[fieldSelect.value] ? fieldSelect.value : 'quadratic'; updateFieldVisibility(); update(); });
  angleInput?.addEventListener('input', () => { angle = Number(angleInput.value) * Math.PI / 180; update(); });
  probe.on('drag', update);
  updateFieldVisibility();
  update();
  if (window.ResizeObserver) new ResizeObserver(() => board.resizeContainer(boardElement.clientWidth, boardElement.clientHeight, true)).observe(boardElement);
}

function createGradientFields() {
  return {
    quadratic: { f: (x, y) => 0.5 * x * x + y * y, gradient: (x, y) => [x, 2 * y] },
    saddle: { f: (x, y) => x * y, gradient: (x, y) => [y, x] },
  };
}

function createGradientLevelCurves(addCurve) {
  const curves = [];

  [1, 2, 3, 4, 6, 8, 10].forEach((level) => {
    curves.push(addCurve(
      (t) => Math.sqrt(2 * level) * Math.cos(t),
      (t) => Math.sqrt(level) * Math.sin(t),
      [0, 2 * Math.PI],
    ));
  });

  [1, 2, 3, 4].forEach((level) => {
    [-1, 1].forEach((sign) => {
      curves.push(addCurve((t) => sign * t, (t) => level / (sign * t), [0.2, 5]));
      curves.push(addCurve((t) => sign * t, (t) => -level / (sign * t), [0.2, 5]));
    });
  });

  curves.push(addCurve((t) => t, () => 0, [-5, 5]));
  curves.push(addCurve(() => 0, (t) => t, [-5, 5]));
  return curves;
}

function initVectorField3D(root) {
  if (!root || root.dataset.vectorFieldInitialized === 'true') {
    return;
  }

  root.dataset.vectorFieldInitialized = 'true';
  const boardElement = root.querySelector('[data-vector-field-board]');

  if (!window.JXG || !boardElement || !JXG.JSXGraph.initBoard) {
    throw new Error('Vector field interactive failed to initialize.');
  }

  const boardId = ensureInteractiveBoardId(boardElement, 'vector-field-3d');

  const choice = root.querySelector('[data-vector-field-choice]');
  const scaleInput = root.querySelector('[data-vector-field-scale]');
  const scaleValue = root.querySelector('[data-vector-field-scale-value]');
  const formula = root.querySelector('[data-vector-field-formula]');
  const fields = {
    rotation: { value: (x, y, z) => [-y, x, 0], description: 'Horizontal rotation around the z-axis.' },
    radial: { value: (x, y, z) => [x, y, z], description: 'Vectors point away from the origin.' },
  };
  let fieldKey = fields[choice?.value] ? choice.value : 'rotation';
  const board = JXG.JSXGraph.initBoard(boardId, { boundingbox: [-6, 6, 6, -6], axis: true, pan: { enabled: false }, showCopyright: false, showNavigation: false, keepaspectratio: true });
  let view;

  view = board.create('view3d', [[-5, -4], [9, 9], [[-3, 3], [-3, 3], [-3, 3]]], {
      projection: 'central',
      trackball: { enabled: true },
      xPlaneFront: { visible: false },
      xPlaneRear: { visible: false },
      yPlaneFront: { visible: false },
      yPlaneRear: { visible: false },
      zPlaneFront: { visible: false },
      zPlaneRear: { visible: false },
  });
    // JSXGraph element names are lowercase, including the trailing "3d".
    let vectorScale = 0.4;
    const vectorField = view.create('vectorfield3d', [fields[fieldKey].value, [-3, 2, 3], [-3, 2, 3], [-3, 2, 3]], { strokeColor: '#555', strokeWidth: 2.5, scale: () => vectorScale });
    const updateScale = () => {
      vectorScale = Number(scaleInput?.value ?? 0.4);
      vectorField.setAttribute({ scale: () => vectorScale });
      vectorField.update();
      if (scaleValue) scaleValue.value = vectorScale.toFixed(2);
      if (scaleValue) scaleValue.textContent = vectorScale.toFixed(2);
      board.fullUpdate();
    };
    const update = () => {
      fieldKey = fields[choice?.value] ? choice.value : 'rotation';
      vectorField.setF(fields[fieldKey].value);
      if (formula) formula.textContent = fields[fieldKey].description;
      board.update();
    };
    choice?.addEventListener('change', update);
    scaleInput?.addEventListener('input', updateScale);
    update();
    updateScale();
  if (window.ResizeObserver) new ResizeObserver(() => board.resizeContainer(boardElement.clientWidth, boardElement.clientHeight, true)).observe(boardElement);
}

const INTERACTIVE_INITIALIZERS = {
  'vector-calculus-gradient': (root) => initVectorCalculusGradient(root),
  'vector-calculus-vector-field-3d': (root) => initVectorField3D(root),
};

function initInteractiveExperiences() {
  Object.entries(INTERACTIVE_INITIALIZERS).forEach(([type, initializer]) => {
    document.querySelectorAll(`[data-interactive="${type}"]`).forEach(initializer);
  });
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

practiceFilterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextValue = String(button.dataset.practiceFilter ?? 'all').trim().toLowerCase();
    const normalized = PRACTICE_FILTER_VALUES.has(nextValue) ? nextValue : 'all';
    savePracticeFilter(normalized);
    renderPracticeFilter(normalized);
  });
});

document.addEventListener('click', async (event) => {
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
      savePracticeCompletionState();
    }

    return;
  }

  const leaveButton = event.target.closest('[data-leave-notes]');

  if (leaveButton) {
    window.location.href = '/';
    return;
  }

  const copyButton = event.target.closest('[data-copy-text]');

  if (copyButton) {
    const copied = await copyTextToClipboard(copyButton.dataset.copyText ?? '');

    if (copied) {
      showContributorCopiedState(copyButton);
    }

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

window.addEventListener('keydown', (event) => {
  handleGlobalKeyboardShortcuts(event);
});

syncThemePreference();
initInteractiveExperiences();
renderPlaceholder('Search note titles and note content.');
revealQueryMatch();
syncPracticeCompletionState();
const practiceFilterFromUrl = getPracticeFilterFromUrl();
const initialPracticeFilter = practiceFilterFromUrl ?? loadPracticeFilter();
if (practiceFilterFromUrl) {
  savePracticeFilter(initialPracticeFilter);
}
renderPracticeFilter(initialPracticeFilter);

syncSubjectNavigation();
syncPomodoroTimer();

window.addEventListener('storage', (event) => {
  if (event.key === NOTES_THEME_STORAGE_KEY) {
    syncThemePreference();
  }

  if (event.key === getPracticeCompletionStorageKey() || event.key === null) {
    syncPracticeCompletionState();
  }

  if (event.key === getPracticeFilterStorageKey() || event.key === null) {
    renderPracticeFilter(loadPracticeFilter());
  }

  if (event.key === POMODORO_TIMER_STORAGE_KEY) {
    syncPomodoroTimer();
  }

});
window.addEventListener('pageshow', syncSubjectNavigation);
window.addEventListener('pageshow', syncThemePreference);
window.addEventListener('pageshow', syncPomodoroTimer);
window.addEventListener('pageshow', syncPracticeCompletionState);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    syncPomodoroTimer();
  }
});
