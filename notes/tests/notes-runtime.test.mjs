import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = fs.readFileSync(new URL('../notes-runtime.js', import.meta.url), 'utf8');

function runtimeWith(storage = {}) {
  const localStorage = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => { storage[key] = String(value); },
    removeItem: (key) => { delete storage[key]; },
  };
  const context = { window: { localStorage }, Date, Math, String, Number, Object, Array };
  vm.runInNewContext(source, context);
  return context.window.NotesRuntime;
}

test('storage helpers fail when storage is unavailable', () => {
  const runtime = runtimeWith();
  assert.throws(() => runtime.readStorage('missingStorage', 'key'), /unavailable/);
  assert.throws(() => runtime.writeStorage('missingStorage', 'key', () => {}), /unavailable/);
});

test('theme preference accepts only the supported persisted values', () => {
  assert.equal(runtimeWith({ 'ues-notes:contrast-mode': 'sepia' }).readThemePreference(), true);
  assert.equal(runtimeWith({ 'ues-notes:contrast-mode': 'light' }).readThemePreference(), true);
  assert.equal(runtimeWith({ 'ues-notes:contrast-mode': 'default' }).readThemePreference(), false);
});

test('pomodoro state normalization and snapshots are deterministic', () => {
  const runtime = runtimeWith();
  const state = runtime.normalizePomodoroState({ mode: 'focus', durationMs: 60000, startedAt: 1000, endsAt: 61000 }, 1000);
  assert.equal(state.status, 'running');
  assert.equal(runtime.normalizePomodoroState({ mode: 'unknown', durationMs: 1 }, 1000), null);
  assert.equal(runtime.formatPomodoroTime(61000), '1:01');
  assert.equal(runtime.getPomodoroSnapshot(state, 31000).valueNow, 50);
  assert.equal(runtime.getPomodoroSnapshot({ ...state, status: 'completed' }, 31000).valueText, 'Focus timer complete');
});

test('pomodoro normalization keeps records written by the page scripts', () => {
  const runtime = runtimeWith();
  const state = runtime.normalizePomodoroState({
    mode: 'short',
    startedAt: 1000,
    endsAt: 301000,
    status: 'running',
  }, 1000);

  assert.equal(state.durationMs, 300000);
  assert.equal(state.label, 'Short break');
  assert.equal(state.minutes, 5);
});
