import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { analyzeHtml } from '../scripts/validate-generated-web.mjs';

const workspaceRoot = new URL('../../', import.meta.url);
const readWorkspace = (relativePath) =>
  readFile(new URL(relativePath, workspaceRoot), 'utf8');
const readJson = async (relativePath) =>
  JSON.parse(await readWorkspace(relativePath));

test('React/Next AI 工作台标杆锁定运行时、元数据和自适应 3D 生命周期', async () => {
  const base = 'output/evals/showcase-react-ai-workspace/';
  const packageJson = await readJson(`${base}package.json`);
  const layout = await readWorkspace(`${base}app/layout.jsx`);
  const page = await readWorkspace(`${base}app/page.jsx`);
  const spatial = await readWorkspace(`${base}components/SpatialDecisionField.jsx`);
  const css = await readWorkspace(`${base}app/globals.css`);
  const lock = await readJson(`${base}oneseven-effects.lock.json`);

  assert.equal(packageJson.dependencies.next, '16.3.3');
  assert.equal(packageJson.dependencies.react, '19.2.8');
  assert.equal(packageJson.dependencies.motion, '13.1.1');
  assert.equal(packageJson.dependencies.three, '0.185.1');
  assert.match(layout, /data-ui-brand="oneseven"/);
  assert.match(layout, /data-ui-page-type="saas-ai-workspace"/);
  assert.match(layout, /data-ui-hero="none"/);
  assert.match(layout, /data-ui-visual-mode="showcase"/);
  assert.match(layout, /data-ui-motion-tier-policy="adaptive"/);
  assert.match(page, /data-ui-product-state="agent-spatial-decision"/);
  assert.doesNotMatch(page, /className="hero/);
  assert.match(spatial, /data-ui-effect-id="spatial-decision-field"/);
  assert.match(spatial, /data-ui-effect-source="threejs-core"/);
  assert.match(spatial, /data-ui-effect-runtime="webgl"/);
  assert.match(spatial, /data-ui-effect-fallback="static"/);
  assert.match(spatial, /WebGLRenderer/);
  assert.match(spatial, /IntersectionObserver/);
  assert.match(spatial, /visibilitychange/);
  assert.match(spatial, /dispose\(\)/);
  assert.match(spatial, /devicePixelRatio[\s\S]*1\.75/);
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /--radius-card:\s*36px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(page, /const reduceMotion = useReducedMotion\(\);[\s\S]*const reveal = reduceMotion\s*\?\s*\{ initial: false, animate: \{ opacity: 1, y: 0 \} \}/);
  assert.equal(lock.stack, 'react');
  assert.equal(lock.pageType, 'saas-ai-workspace');
});

test('Vue/Nuxt 发布页标杆锁定滚动排版、单 3D 场景和 Static 回退', async () => {
  const base = 'output/evals/showcase-vue-product-launch/';
  const packageJson = await readJson(`${base}package.json`);
  const app = await readWorkspace(`${base}app.vue`);
  const spatial = await readWorkspace(`${base}components/SpatialArtifact.client.vue`);
  const css = await readWorkspace(`${base}assets/css/main.css`);
  const lock = await readJson(`${base}oneseven-effects.lock.json`);

  assert.equal(packageJson.dependencies.nuxt, '4.5.2');
  assert.equal(packageJson.dependencies.vue, '3.5.42');
  assert.equal(packageJson.dependencies['motion-v'], '2.4.0');
  assert.equal(packageJson.dependencies['@vueuse/core'], '14.4.0');
  assert.equal(packageJson.dependencies.three, '0.185.1');
  assert.match(app, /data-ui-brand="oneseven"/);
  assert.match(app, /data-ui-page-type="product"/);
  assert.match(app, /data-ui-hero="approved"/);
  assert.match(app, /data-ui-product-state="release-workflow"/);
  assert.match(app, /data-ui-effect-id="release-type-sequence"/);
  assert.match(app, /data-ui-effect-source="motion-core"/);
  assert.match(spatial, /data-ui-effect-id="spatial-release-artifact"/);
  assert.match(spatial, /data-ui-effect-source="threejs-core"/);
  assert.match(spatial, /WebGLRenderer/);
  assert.match(spatial, /IntersectionObserver/);
  assert.match(spatial, /visibilitychange/);
  assert.match(spatial, /dispose\(\)/);
  assert.match(css, /--radius-card:\s*36px/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(app, /const chapterReveal\s*=\s*\{\s*initial:\s*false,\s*whileInView:\s*\{\s*opacity:\s*1,\s*y:\s*0\s*\}/);
  assert.match(app, /v-bind="chapterReveal"/);
  assert.equal(lock.stack, 'vue');
  assert.equal(lock.pageType, 'product');
  assert.ok(lock.install.dependencies.includes('motion-v'));
  assert.ok(lock.install.dependencies.includes('@vueuse/core'));
});

test('Vanilla 工程夹具提供可静态校验的三档降级和锁文件', async () => {
  const base = 'output/evals/showcase-vanilla-fixture/';
  const html = await readWorkspace(`${base}index.html`);
  const lock = await readJson(`${base}oneseven-effects.lock.json`);

  assert.match(html, /data-ui-brand="oneseven"/);
  assert.match(html, /data-ui-visual-mode="showcase"/);
  assert.match(html, /data-ui-motion-tier-policy="adaptive"/);
  assert.match(html, /data-ui-effect-id="vanilla-spatial-proof"/);
  assert.match(html, /data-ui-effect-source="threejs-core"/);
  assert.match(html, /data-ui-effect-fallback="static"/);
  assert.match(html, /prefers-reduced-motion:\s*reduce/);
  assert.match(html, /data-motion-tier/);
  assert.equal(lock.stack, 'vanilla');
  assert.equal(lock.pageType, 'product');
});

test('Vanilla 产品夹具遵守 OneSeven 产品页标题上限并通过 Showcase 校验', async () => {
  const base = 'output/evals/showcase-vanilla-fixture/';
  const html = await readWorkspace(`${base}index.html`);
  const lock = await readJson(`${base}oneseven-effects.lock.json`);
  const report = analyzeHtml(html, { pageType: 'product', effectsLock: lock });

  assert.equal(report.ok, true);
  assert.deepEqual(
    report.issues.filter(({ severity }) => severity === 'error'),
    [],
  );
});
