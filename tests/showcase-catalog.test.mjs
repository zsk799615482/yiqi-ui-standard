import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  loadShowcaseCatalog,
  resolveShowcaseComponents,
} from '../scripts/resolve-showcase-components.mjs';

const catalogUrl = new URL(
  '../references/showcase-catalog.json',
  import.meta.url,
);
const resolverPath = fileURLToPath(
  new URL('../scripts/resolve-showcase-components.mjs', import.meta.url),
);

const requiredFields = [
  'id',
  'name',
  'category',
  'sourceUrl',
  'sourceVersion',
  'license',
  'licenseClass',
  'supportedStacks',
  'dependencies',
  'capabilities',
  'recommendedContexts',
  'forbiddenContexts',
  'brandRecipe',
  'fullTier',
  'liteTier',
  'staticFallback',
  'reducedMotionFallback',
  'verificationSteps',
];

test('Showcase 目录条目具有完整、可审计的公共契约', async () => {
  const document = JSON.parse(await readFile(catalogUrl, 'utf8'));

  assert.equal(document.schemaVersion, 1);
  assert.equal(document.snapshotDate, '2026-09-02');
  assert.ok(document.entries.length >= 5);

  const ids = new Set(document.entries.map(({ id }) => id));
  for (const id of [
    'motion-core',
    'threejs-core',
    'magic-ui-source',
    'reka-ui-core',
    'gsap-scrolltrigger',
    'liquid-glass-react',
    'liquid-glass-vue',
    'liquid-glass-vanilla-source',
    'border-beam',
    'liquid-gooey',
  ]) {
    assert.ok(ids.has(id), `missing catalog entry: ${id}`);
  }

  for (const entry of document.entries) {
    assert.deepEqual(
      requiredFields.filter((field) => !(field in entry)),
      [],
      `${entry.id} is missing required fields`,
    );
    assert.match(entry.sourceUrl, /^https:\/\//);
    assert.match(entry.sourceVersion, /\S/);
    assert.ok(['permissive', 'conditional', 'restricted'].includes(entry.licenseClass));
    assert.ok(entry.supportedStacks.length > 0);
    assert.ok(entry.capabilities.length > 0);
    assert.ok(entry.verificationSteps.length > 0);
    assert.match(entry.brandRecipe, /OneSeven|壹柒/);
    assert.match(entry.fullTier, /\S/);
    assert.match(entry.liteTier, /\S/);
    assert.match(entry.staticFallback, /\S/);
    assert.match(entry.reducedMotionFallback, /\S/);
  }

  const liquidGlassReact = document.entries.find(({ id }) => id === 'liquid-glass-react');
  assert.equal(liquidGlassReact.packageName, 'liquid-glass-react');
  assert.equal(liquidGlassReact.packageVersion, '1.1.1');
  assert.equal(liquidGlassReact.integrationMode, 'package');
  assert.equal(liquidGlassReact.licenseClass, 'permissive');

  const liquidGlassVue = document.entries.find(({ id }) => id === 'liquid-glass-vue');
  assert.equal(liquidGlassVue.packageName, '@wxperia/liquid-glass-vue');
  assert.equal(liquidGlassVue.packageVersion, '1.0.9');
  assert.equal(liquidGlassVue.licenseClass, 'permissive');
  assert.match(liquidGlassVue.licenseEvidence, /许可证|LICENSE/);

  const liquidGlassVanilla = document.entries.find(({ id }) => id === 'liquid-glass-vanilla-source');
  assert.equal(liquidGlassVanilla.integrationMode, 'source-recipe');
  assert.deepEqual(liquidGlassVanilla.stackDependencies.vanilla, []);
  assert.ok(liquidGlassVanilla.copyPaths.length > 0);
});

test('解析器为 React 3D 工作台返回唯一、宽松授权的推荐组合', async () => {
  const catalog = await loadShowcaseCatalog();
  const lock = resolveShowcaseComponents(catalog, {
    stack: 'react',
    pageType: 'saas-ai-workspace',
    effects: ['3d', 'typography', 'scroll'],
  });

  assert.equal(lock.schemaVersion, 1);
  assert.equal(lock.catalogSnapshot, '2026-09-02');
  assert.equal(lock.stack, 'react');
  assert.equal(lock.pageType, 'saas-ai-workspace');
  assert.deepEqual(lock.requestedEffects, ['3d', 'typography', 'scroll']);
  assert.ok(lock.selected.some(({ id }) => id === 'motion-core'));
  assert.ok(lock.selected.some(({ id }) => id === 'threejs-core'));
  assert.ok(lock.selected.every(({ licenseClass }) => licenseClass === 'permissive'));
  assert.ok(lock.selected.every(({ sourceVersion }) => sourceVersion.length > 0));
  assert.ok(lock.selected.every(({ tiers }) => Object.keys(tiers).length === 3));
  assert.ok(lock.selected.every(({ reducedMotionFallback }) => reducedMotionFallback));
  assert.ok(!lock.selected.some(({ id }) => id === 'gsap-scrolltrigger'));
});

test('解析器覆盖 Vue 与 Vanilla，并拒绝未知技术栈', async () => {
  const catalog = await loadShowcaseCatalog();

  for (const stack of ['vue', 'vanilla']) {
    const lock = resolveShowcaseComponents(catalog, {
      stack,
      pageType: 'product',
      effects: ['3d', 'typography', 'scroll'],
    });
    assert.equal(lock.stack, stack);
    assert.ok(lock.selected.some(({ id }) => id === 'motion-core'));
    assert.ok(lock.selected.some(({ id }) => id === 'threejs-core'));
  }

  assert.throws(
    () =>
      resolveShowcaseComponents(catalog, {
        stack: 'svelte',
        pageType: 'product',
        effects: ['scroll'],
      }),
    /不支持的技术栈：svelte/,
  );
});

test('CLI 生成可复现的效果锁文件', () => {
  const result = spawnSync(
    process.execPath,
    [
      resolverPath,
      '--stack',
      'vue',
      '--page-type',
      'product',
      '--effects',
      '3d,typography,scroll',
      '--json',
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  const lock = JSON.parse(result.stdout);
  assert.equal(lock.stack, 'vue');
  assert.equal(lock.pageType, 'product');
  assert.ok(lock.selected.length >= 2);
  assert.ok(lock.install.dependencies.includes('three'));
  assert.ok(lock.install.dependencies.includes('motion-v'));
  assert.ok(lock.install.dependencies.includes('@vueuse/core'));
});

test('条件许可组件只有显式批准后才能进入锁文件', async () => {
  const catalog = await loadShowcaseCatalog();
  const defaultLock = resolveShowcaseComponents(catalog, {
    stack: 'react',
    pageType: 'product',
    effects: ['scroll'],
  });
  assert.ok(!defaultLock.selected.some(({ id }) => id === 'gsap-scrolltrigger'));

  const approvedLock = resolveShowcaseComponents(catalog, {
    stack: 'react',
    pageType: 'product',
    effects: ['scroll'],
    approvedConditional: ['gsap-scrolltrigger'],
  });
  const gsap = approvedLock.selected.find(({ id }) => id === 'gsap-scrolltrigger');
  assert.equal(gsap?.approval?.status, 'approved');
  assert.equal(gsap?.licenseClass, 'conditional');
});

test('liquid-glass 效果按技术栈返回专用来源并保持版本锁定', async () => {
  const catalog = await loadShowcaseCatalog();

  const reactLock = resolveShowcaseComponents(catalog, {
    stack: 'react',
    pageType: 'product',
    effects: ['liquid-glass'],
  });
  assert.deepEqual(reactLock.selected.map(({ id }) => id), ['liquid-glass-react']);
  assert.deepEqual(reactLock.install.pinnedDependencies, ['liquid-glass-react@1.1.1']);
  assert.match(reactLock.install.command, /liquid-glass-react@1\.1\.1/);

  const vanillaLock = resolveShowcaseComponents(catalog, {
    stack: 'vanilla',
    pageType: 'product',
    effects: ['liquid-glass'],
  });
  assert.deepEqual(vanillaLock.selected.map(({ id }) => id), ['liquid-glass-vanilla-source']);
  assert.deepEqual(vanillaLock.install.dependencies, []);
  assert.deepEqual(vanillaLock.selected[0].copyPaths.length > 0, true);
  assert.ok(!vanillaLock.install.command);

  const vueLock = resolveShowcaseComponents(catalog, {
    stack: 'vue',
    pageType: 'product',
    effects: ['liquid-glass'],
  });
  assert.deepEqual(vueLock.selected.map(({ id }) => id), ['liquid-glass-vue']);
  assert.equal(vueLock.selected[0].licenseClass, 'permissive');
  assert.equal(vueLock.selected[0].approval, undefined);
  assert.deepEqual(vueLock.install.pinnedDependencies, ['@wxperia/liquid-glass-vue@1.0.9']);
});
