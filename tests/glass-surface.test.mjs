import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  loadShowcaseCatalog,
  resolveShowcaseComponents,
} from '../scripts/resolve-showcase-components.mjs';
import { analyzeHtml } from '../scripts/validate-generated-web.mjs';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const resolverPath = fileURLToPath(
  new URL('../scripts/resolve-showcase-components.mjs', import.meta.url),
);
const sources = {
  react: {
    id: 'react-bits-glass-surface',
    commit: 'ca44b3f9ee180676a06d7de8ec6bea84cddff85b',
    repository: 'DavidHDev/react-bits',
    path: 'src/ts-default/Components/GlassSurface/GlassSurface.tsx',
  },
  vue: {
    id: 'vue-bits-glass-surface',
    commit: '07c0f76d5567db022c2e3185dd97a2311e056c0c',
    repository: 'DavidHDev/vue-bits',
    path: 'src/content/Components/GlassSurface/GlassSurface.vue',
  },
};
const options = (stack, extra = {}) => ({
  stack,
  pageType: 'product',
  effects: ['liquid-glass'],
  ...extra,
});

test('Glass Surface 目录锁定来源并准确记录条件许可', async () => {
  const catalog = await loadShowcaseCatalog();
  const ledger = JSON.parse(await read('references/external-source-map.json'));
  for (const [stack, source] of Object.entries(sources)) {
    assert.equal(catalog.policy.liquidGlassDefaults[stack], source.id);
    const entry = catalog.entries.find(({ id }) => id === source.id);
    assert.equal(entry.sourceVersion, `git@${source.commit}`);
    assert.equal(entry.licenseClass, 'conditional');
    assert.match(entry.license, /MIT \+ Commons Clause/);
    assert.match(entry.licenseEvidence, /再分发/);
    assert.equal(entry.verificationDate, '2026-10-07');
    assert.equal(entry.integrationMode, 'source-recipe');
    assert.deepEqual(entry.supportedStacks, [stack]);
    assert.deepEqual(entry.capabilities, ['liquid-glass']);
    assert.ok(entry.copyPaths.includes(source.path));
    assert.ok(entry.copyPaths.includes('LICENSE.md'));
    assert.deepEqual(entry.stackDependencies[stack], []);

    const record = ledger.sources.find(({ source: id }) => id === source.repository);
    assert.equal(record.commit, source.commit);
    assert.equal(record.license, entry.license);
    assert.equal(record.reviewed, '2026-10-07');
    assert.equal(record.nextReview, '2027-04-07');
    assert.ok(record.excluded.some((value) => value.includes('源码')));
  }
});

test('React/Vue 默认 Glass Surface 未批准时不静默替换 MIT 来源', async () => {
  const catalog = await loadShowcaseCatalog();
  for (const [stack, { id }] of Object.entries(sources)) {
    for (const extra of [{}, { approvedConditional: ['gsap-scrolltrigger'] }]) {
      assert.throws(
        () => resolveShowcaseComponents(catalog, options(stack, extra)),
        (error) => error.message.includes(id) &&
          error.message.includes('--approve-conditional') &&
          error.message.includes('--liquid-glass-source'),
      );
    }
  }
});

test('批准后默认来源的锁文件含取用路径、许可和三档回退，无虚构安装命令', async () => {
  const catalog = await loadShowcaseCatalog();
  for (const [stack, { id, commit, path }] of Object.entries(sources)) {
    for (const pageType of ['product', 'marketing', 'saas-ai-workspace']) {
      const lock = resolveShowcaseComponents(catalog, options(stack, {
        pageType,
        approvedConditional: [id],
      }));
      assert.deepEqual(lock.selected.map(({ id }) => id), [id]);
      const entry = lock.selected[0];
      assert.equal(entry.sourceVersion, `git@${commit}`);
      assert.ok(entry.copyPaths.includes(path));
      assert.equal(entry.approval.status, 'approved');
      assert.equal(entry.approval.scope, 'current-project');
      assert.deepEqual(Object.keys(entry.tiers), ['full', 'lite', 'static']);
      assert.ok(Object.values(entry.tiers).every(Boolean));
      assert.ok(entry.reducedMotionFallback);
      assert.deepEqual(lock.install.pinnedDependencies, []);
      assert.equal(lock.install.command, null);
      assert.equal(entry.packageName, undefined);
    }
  }
});

test('显式来源校验拒绝未知 ID、不匹配栈、非玻璃效果和受限许可', async () => {
  const catalog = await loadShowcaseCatalog();
  for (const id of ['missing-source', 'liquid-glass-vue', 'motion-core']) {
    assert.throws(
      () => resolveShowcaseComponents(catalog, options('react', { liquidGlassSource: id })),
      /液态玻璃来源/,
    );
  }
  assert.throws(
    () => resolveShowcaseComponents(catalog, options('react', {
      effects: ['scroll'],
      liquidGlassSource: 'liquid-glass-react',
    })),
    /liquid-glass/,
  );
  assert.throws(
    () => resolveShowcaseComponents(catalog, options('react', {
      liquidGlassSource: sources.react.id,
    })),
    /approve-conditional/,
  );
  const restricted = structuredClone(catalog);
  restricted.entries.find(({ id }) => id === sources.react.id).licenseClass = 'restricted';
  assert.throws(
    () => resolveShowcaseComponents(restricted, options('react', {
      approvedConditional: [sources.react.id],
    })),
    /受限/,
  );
});

test('玻璃来源选项不改变其他效果的推荐和许可批准范围', async () => {
  const catalog = await loadShowcaseCatalog();
  const before = resolveShowcaseComponents(catalog, options('react', {
    effects: ['3d', 'typography', 'scroll', 'interaction'],
  }));
  const after = resolveShowcaseComponents(catalog, options('react', {
    effects: [...before.requestedEffects, 'liquid-glass'],
    approvedConditional: [sources.react.id],
  }));
  assert.deepEqual(
    after.selected.filter(({ id }) => id !== sources.react.id),
    before.selected,
  );
  const fallback = resolveShowcaseComponents(catalog, options('react', {
    effects: ['scroll', 'liquid-glass'],
    liquidGlassSource: 'liquid-glass-react',
    approvedConditional: ['gsap-scrolltrigger'],
  }));
  assert.deepEqual(fallback.selected.map(({ id }) => id), [
    'gsap-scrolltrigger', 'liquid-glass-react',
  ]);
});

test('CLI 支持默认批准和显式备选，未批准时 stdout 不产生锁文件', () => {
  const base = ['--stack', 'react', '--page-type', 'product', '--effects', 'liquid-glass', '--json'];
  const pending = spawnSync(process.execPath, [resolverPath, ...base], { encoding: 'utf8' });
  assert.equal(pending.status, 1);
  assert.equal(pending.stdout, '');
  assert.match(pending.stderr, /react-bits-glass-surface/);
  for (const args of [
    ['--approve-conditional', sources.react.id],
    ['--liquid-glass-source', 'liquid-glass-react'],
  ]) {
    const result = spawnSync(process.execPath, [resolverPath, ...base, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const lock = JSON.parse(result.stdout);
    assert.equal(lock.selected[0].id, args[1]);
  }
  const missing = spawnSync(process.execPath, [
    resolverPath, ...base, '--liquid-glass-source',
  ], { encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /缺少值/);
});

test('未批准的 CLI 请求不创建或覆盖输出锁文件', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'yiqi-glass-pending-'));
  try {
    const existing = join(directory, 'existing.json');
    const missing = join(directory, 'missing.json');
    await writeFile(existing, '保留已有项目锁文件\n');
    for (const output of [existing, missing]) {
      const result = spawnSync(process.execPath, [
        resolverPath,
        '--stack', 'vue', '--page-type', 'product', '--effects', 'liquid-glass',
        '--output', output,
      ], { encoding: 'utf8' });
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /vue-bits-glass-surface/);
    }
    assert.equal(await readFile(existing, 'utf8'), '保留已有项目锁文件\n');
    await assert.rejects(readFile(missing), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('默认来源目录损坏时停止，显式备选仍可取用', async () => {
  const catalog = await loadShowcaseCatalog();
  catalog.policy.liquidGlassDefaults.react = 'missing-source';
  assert.throws(
    () => resolveShowcaseComponents(catalog, options('react')),
    /液态玻璃来源 missing-source/,
  );
  const lock = resolveShowcaseComponents(catalog, options('react', {
    liquidGlassSource: 'liquid-glass-react',
  }));
  assert.deepEqual(lock.selected.map(({ id }) => id), ['liquid-glass-react']);
});

test('生成的 Glass Surface 锁文件遵守现有 Web 许可门禁', async () => {
  const catalog = await loadShowcaseCatalog();
  const lock = resolveShowcaseComponents(catalog, options('react', {
    approvedConditional: [sources.react.id],
  }));
  const html = `<html data-ui-brand="oneseven" data-ui-page-type="product"
    data-ui-hero="none" data-ui-card-material="solid"
    data-ui-visual-mode="showcase" data-ui-motion-tier-policy="adaptive">
    <style>:root { color-scheme: dark; }
    @media (prefers-reduced-motion: reduce) { .effect { transition: none; } }</style>
    <div data-ui-effect-id="glass" data-ui-effect-source="${sources.react.id}"
      data-ui-effect-fallback="static">业务内容</div></html>`;
  assert.equal(analyzeHtml(html, { effectsLock: lock }).ok, true);
  const unapproved = structuredClone(lock);
  delete unapproved.selected[0].approval;
  assert.ok(analyzeHtml(html, { effectsLock: unapproved }).issues.some(
    ({ code }) => code === 'showcase-license-approval-required',
  ));
});

test('Skill 按需引用原创指南，不打包 Glass Surface 组件实现', async () => {
  const skill = await read('SKILL.md');
  const showcase = await read('references/showcase-mode.md');
  const guide = await read('references/glass-surface.md');
  assert.match(skill, /references\/glass-surface\.md/);
  assert.match(showcase, /react-bits-glass-surface/);
  assert.match(showcase, /vue-bits-glass-surface/);
  for (const term of [
    '不打包', '36px', 'Alibaba PuHuiTi', '无投影', 'SSR', '多实例',
    'ResizeObserver', '定时器', 'Tailwind', 'Full', 'Lite', 'Static',
    'prefers-reduced-transparency', '版权', '--liquid-glass-source',
  ]) {
    assert.ok(guide.includes(term), `missing guide rule: ${term}`);
  }
  const walk = async (url) => {
    const entries = await readdir(url, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git') continue;
      const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, url);
      if (entry.isDirectory()) {
        await walk(child);
      } else {
        assert.ok(!/^GlassSurface\.(tsx|jsx|vue|css)$/.test(entry.name),
          `bundled upstream component: ${child.pathname}`);
        if (/\.(tsx|jsx|vue)$/.test(entry.name)) {
          assert.doesNotMatch(await readFile(child, 'utf8'), /<feDisplacementMap/);
        }
      }
    }
  };
  await walk(new URL('../', import.meta.url));
});
