import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(await readFile(new URL('../references/library-catalog.json', import.meta.url), 'utf8'));

test('library catalog has a native-first, no-auto-install policy', () => {
  assert.equal(catalog.policy.nativeFirst, true);
  assert.equal(catalog.policy.existingDependencyWins, true);
  assert.equal(catalog.policy.automaticInstall, false);
  assert.equal(catalog.policy.singleRecommendation, true);
});

test('library catalog entries are task-scoped and include fallbacks', () => {
  assert.ok(catalog.entries.length >= 6);
  for (const entry of catalog.entries) {
    for (const key of ['id', 'task', 'name', 'supportedStacks', 'licenseClass', 'whenToUse', 'whenNotToUse', 'accessibility', 'performance', 'brandRule', 'fallback']) {
      assert.ok(entry[key] !== undefined, `${entry.id} missing ${key}`);
    }
    assert.ok(!entry.name.includes('Three.js'));
    assert.ok(!entry.name.includes('Liquid Glass'));
    assert.ok(entry.supportedStacks.length > 0);
  }
});
