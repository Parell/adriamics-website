/* Shared browser helpers for the notes entrypoints. */
(() => {
  const storage = (kind) => {
    return window[kind];
  };

  const readStorage = (kind, key, reader = (value) => value.getItem(key)) => {
    const target = storage(kind);
    if (!target || !key) throw new Error(`Storage ${kind} is unavailable.`);
    return reader(target);
  };

  const writeStorage = (kind, key, writer) => {
    const target = storage(kind);
    if (!target || !key) throw new Error(`Storage ${kind} is unavailable.`);
    writer(target);
    return true;
  };

  const themeKey = 'ues-notes:contrast-mode';
  const readThemePreference = () => ['sepia', 'light'].includes(
    String(readStorage('localStorage', themeKey) ?? '').trim(),
  );
  const writeThemePreference = (isSepia) => writeStorage(
    'localStorage',
    themeKey,
    (target) => target.setItem(themeKey, isSepia ? 'light' : 'default'),
  );
  const isVisibleElement = (element) => Boolean(
    element && element instanceof HTMLElement && element.getClientRects().length > 0,
  );
  const setExpanded = (elements, expanded) => elements.forEach((element) => {
    element.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  });
  const restoreFocus = (element) => {
    if (isVisibleElement(element)) element.focus();
  };
  const loadSearchIndex = (url, fetchImpl = window.fetch) => fetchImpl(url).then((response) => {
    if (!response.ok) throw new Error(`Search index request failed with ${response.status}.`);
    return response.json();
  }).then((entries) => (Array.isArray(entries) ? entries : []));

  const pomodoroModes = Object.freeze({
    focus: Object.freeze({ minutes: 25, label: 'Focus' }),
    short: Object.freeze({ minutes: 5, label: 'Short break' }),
    long: Object.freeze({ minutes: 15, label: 'Long break' }),
  });
  const pomodoroKey = 'ues-notes:pomodoro-timer';
  const getPomodoroMode = (mode) => pomodoroModes[String(mode ?? '').trim()] ?? null;
  const formatPomodoroTime = (milliseconds) => {
    const totalSeconds = Math.max(0, Math.ceil(Number(milliseconds) / 1000));
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
  };
  const normalizePomodoroState = (rawState, now = Date.now()) => {
    if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) return null;
    const mode = String(rawState.mode ?? '').trim();
    if (!getPomodoroMode(mode)) return null;
    const startedAt = Number(rawState.startedAt);
    const endsAt = Number(rawState.endsAt);
    const completedAt = Number(rawState.completedAt);
    const storedDurationMs = Number(rawState.durationMs);
    const inferredDurationMs = Number.isFinite(startedAt) && Number.isFinite(endsAt)
      ? endsAt - startedAt
      : NaN;
    const durationMs = Number.isFinite(storedDurationMs) && storedDurationMs > 0
      ? storedDurationMs
      : inferredDurationMs;
    if (!Number.isFinite(durationMs) || durationMs <= 0) return null;
    const config = getPomodoroMode(mode);
    const state = {
      mode,
      label: config.label,
      minutes: config.minutes,
      status: ['running', 'completed'].includes(rawState.status) ? rawState.status : 'running',
      startedAt: Number.isFinite(startedAt) ? startedAt : now,
      endsAt: Number.isFinite(endsAt) ? endsAt : now + durationMs,
      durationMs,
      completedAt: Number.isFinite(completedAt) ? completedAt : null,
    };
    if (state.status === 'completed' && state.completedAt === null) state.completedAt = state.endsAt;
    return state;
  };
  const getPomodoroSnapshot = (state, now = Date.now()) => {
    if (!state) return { status: 'idle', mode: '', progress: 0, valueNow: 0, valueText: 'Pomodoro timer is idle' };
    const config = getPomodoroMode(state.mode);
    const remainingMs = Math.max(0, state.endsAt - now);
    const progress = Math.min(100, Math.max(0, 100 - (remainingMs / Math.max(1, state.durationMs)) * 100));
    if (state.status === 'completed' || remainingMs <= 0) {
      return { status: 'completed', mode: state.mode, progress: 100, valueNow: 100, valueText: `${config?.label ?? 'Timer'} timer complete` };
    }
    return { status: 'running', mode: state.mode, progress, valueNow: Math.round(progress), valueText: `${config?.label ?? 'Timer'} timer, ${formatPomodoroTime(remainingMs)} remaining` };
  };

  window.NotesRuntime = Object.freeze({
    storage,
    readStorage,
    writeStorage,
    themeKey,
    readThemePreference,
    writeThemePreference,
    isVisibleElement,
    setExpanded,
    restoreFocus,
    loadSearchIndex,
    pomodoroKey,
    pomodoroModes,
    getPomodoroMode,
    formatPomodoroTime,
    normalizePomodoroState,
    getPomodoroSnapshot,
  });
})();
