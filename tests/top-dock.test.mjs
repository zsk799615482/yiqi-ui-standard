import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('17 Top-dock is discoverable but preserves the project license gate', async () => {
  const skill = await read('SKILL.md');
  const guide = await read('references/17-top-dock.md');
  assert.match(skill, /17 Top-dock/);
  assert.match(guide, /React \/ Next/);
  assert.match(guide, /Vue \/ Nuxt/);
  assert.match(guide, /原生 Web/);
  assert.match(guide, /当前项目/);
  assert.match(guide, /MIT \+ Commons Clause/);
  assert.match(guide, /--approve-conditional/);
  assert.match(guide, /批准不自动扩展到未来业务项目/);
});

test('three adapters share full-width glass, theme, and spring behavior', async () => {
  const paths = [
    'assets/17-top-dock/TopDock.tsx',
    'assets/17-top-dock/TopDock.vue',
    'assets/17-top-dock/top-dock.js',
  ];
  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /top-dock__panel|top-dock__viewport/);
    assert.match(source, /top-dock\.css/);
    assert.match(source, /top-dock-motion/);
  }
  const css = await read('assets/17-top-dock/top-dock.css');
  const motion = await read('assets/17-top-dock/top-dock-motion.js');
  assert.match(css, /width:\s*100%/);
  assert.match(css, /left:\s*0/);
  assert.match(css, /\[data-theme=["']light["']\]/);
  assert.match(css, /prefers-reduced-transparency/);
  assert.match(css, /backdrop-filter/);
  assert.match(motion, /type:\s*["']spring["']/);
  assert.match(motion, /prefers-reduced-motion/);
});

test('vanilla navigation protects focused content and releases shared effects', async () => {
  const source = await read('assets/17-top-dock/top-dock.js');
  const motion = await read('assets/17-top-dock/top-dock-motion.js');
  assert.match(source, /!viewport\.contains\(document\.activeElement\)/);
  assert.match(source, /header\.addEventListener\("click", onLinkClick\)/);
  assert.match(source, /header\.removeEventListener\("click", onLinkClick\)/);
  assert.match(motion, /motionValue/);
  assert.match(motion, /observer\.disconnect\(\)/);
  assert.match(motion, /unsubscribe\(\)/);
});
