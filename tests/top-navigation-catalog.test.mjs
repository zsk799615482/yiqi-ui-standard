import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(
  await readFile(new URL('../references/top-navigation-catalog.json', import.meta.url), 'utf8'),
);

test('top navigation catalog keeps one OneSeven default and two non-brand candidates', () => {
  assert.equal(catalog.policy.taskFirst, true);
  assert.equal(catalog.policy.automaticInstall, false);
  assert.equal(catalog.entries.filter(({ defaultFor }) => defaultFor === 'oneseven').length, 1);

  const ids = new Set(catalog.entries.map(({ id }) => id));
  for (const id of ['17-top-dock', 'preline-website-headers', 'resizable-navbar']) {
    assert.ok(ids.has(id), `missing top navigation candidate: ${id}`);
  }

  const brandDefault = catalog.entries.find(({ id }) => id === '17-top-dock');
  assert.equal(brandDefault.defaultFor, 'oneseven');
  assert.equal(brandDefault.integrationMode, 'internal-template');

  for (const id of ['preline-website-headers', 'resizable-navbar']) {
    const candidate = catalog.entries.find((entry) => entry.id === id);
    assert.equal(candidate.defaultFor, 'none');
    assert.ok(candidate.recommendedContexts.length > 0);
    assert.ok(candidate.forbiddenContexts.length > 0);
    assert.ok(candidate.verificationSteps.length > 0);
    assert.ok(candidate.brandRecipe.length > 0);
  }
});

test('top navigation candidates preserve source and license boundaries', () => {
  for (const entry of catalog.entries) {
    for (const key of [
      'sourceUrl',
      'sourceVersion',
      'license',
      'licenseClass',
      'supportedStacks',
      'integrationMode',
      'dependencies',
      'recommendedContexts',
      'forbiddenContexts',
      'brandRecipe',
      'fallback',
      'verificationSteps',
    ]) {
      assert.ok(entry[key] !== undefined, `${entry.id} missing ${key}`);
    }
    assert.equal(entry.automaticInstall, false);
  }

  const preline = catalog.entries.find(({ id }) => id === 'preline-website-headers');
  assert.match(preline.license, /MIT/);
  assert.match(preline.license, /Fair Use/);

  const resizable = catalog.entries.find(({ id }) => id === 'resizable-navbar');
  assert.equal(resizable.licenseClass, 'review-required');
  assert.match(resizable.license, /项目级核验/);
});
