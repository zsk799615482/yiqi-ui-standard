import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const tracker = async () => {
  const { createTopDockScrollTracker } = await import('../assets/17-top-dock/top-dock-scroll-state.js');
  return createTopDockScrollTracker();
};

test('scroll direction uses accumulated movement, not individual event size', async () => {
  const state = await tracker();
  assert.equal(state.update(100), true);
  for (const y of [103, 106, 109]) assert.equal(state.update(y), true);
  assert.equal(state.update(112), false);
  for (const y of [109, 106, 103]) assert.equal(state.update(y), false);
  assert.equal(state.update(100), true);
});

test('top, active menu and focus/hover guards keep the dock visible', async () => {
  const state = await tracker();
  state.update(100);
  assert.equal(state.update(180), false);
  assert.equal(state.update(200, true), true);
  assert.equal(state.update(400, true), true);
  assert.equal(state.update(408), true);
  assert.equal(state.update(412), false);
  assert.equal(state.update(50), true);
  assert.equal(state.update(-30), true);
});

test('small alternating scroll jitter does not toggle visibility', async () => {
  const state = await tracker();
  state.update(100);
  for (const y of [104, 101, 105, 102, 106, 103]) {
    assert.equal(state.update(y), true);
  }
});

test('three adapters attach and configure the shared scroll controller', async () => {
  for (const path of [
    'assets/17-top-dock/TopDock.tsx',
    'assets/17-top-dock/TopDock.vue',
    'assets/17-top-dock/top-dock.js',
  ]) {
    const source = await read(path);
    assert.match(source, /attachTopDockScroll/);
    assert.match(source, /scrollBehavior/);
    assert.match(source, /data-scroll-behavior|dataset\.scrollBehavior/);
  }
});

test('scroll controller uses springs, immediate keyboard reveal and full cleanup', async () => {
  const source = await read('assets/17-top-dock/top-dock-scroll.js');
  assert.match(source, /motionValue/);
  assert.match(source, /type:\s*["']spring["']/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /focusin/);
  assert.match(source, /pointerenter/);
  assert.match(source, /passive:\s*true/);
  assert.match(source, /cancelAnimationFrame/);
  assert.match(source, /resizeObserver\.disconnect/);
  assert.match(source, /menuObserver\.disconnect/);
  assert.match(source, /unsubscribe\(\)/);
});

test('scroll integration guide lists every shared file and all three modes', async () => {
  const guide = await read('references/17-top-dock.md');
  assert.match(guide, /top-dock-scroll\.js/);
  assert.match(guide, /top-dock-scroll-state\.js/);
  assert.match(guide, /top-dock-scroll\.d\.ts/);
  assert.match(guide, /scrollBehavior/);
  assert.match(guide, /`smart`/);
  assert.match(guide, /`sticky`/);
  assert.match(guide, /`static`/);
  assert.match(guide, /默认.*`smart`/);
  assert.match(guide, /滚动容器/);
});
