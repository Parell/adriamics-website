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
