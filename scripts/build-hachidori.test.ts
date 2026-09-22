import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('Hachidori staging configures Electron without changing the fork source', async () => {
  const files = ['overlay-mode.js', 'manifest.json'];
  const source = (file: string) =>
    new URL(`../vendor/hachidori/extension/${file}`, import.meta.url);
  const before = files.map((file) => readFileSync(source(file), 'utf8'));

  execFileSync(process.execPath, [
    fileURLToPath(new URL('./build-hachidori.mjs', import.meta.url)),
  ]);

  assert.deepEqual(
    files.map((file) => readFileSync(source(file), 'utf8')),
    before,
  );
  const staged = await import(new URL('../build/hachidori/overlay-mode.js', import.meta.url).href);
  assert.equal(staged.OVERLAY_MODE, true);
  assert.equal(staged.HOST_CAPABILITIES.customJavaScript, false);
  const original = await import(source('overlay-mode.js').href);
  assert.equal(original.OVERLAY_MODE, false);
  assert.equal(original.HOST_CAPABILITIES.customJavaScript, true);
  const manifest = JSON.parse(
    readFileSync(new URL('../build/hachidori/manifest.json', import.meta.url), 'utf8'),
  );
  const originalManifest = JSON.parse(readFileSync(source('manifest.json'), 'utf8'));
  assert.deepEqual(manifest, {
    ...originalManifest,
    permissions: originalManifest.permissions.filter(
      (permission: string) => permission !== 'userScripts',
    ),
  });
});
