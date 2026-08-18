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
    element
      && element instanceof HTMLElement
      && !element.hidden
      && element.getClientRects().length > 0
      && !element.closest('[hidden]'),
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
  });
})();
