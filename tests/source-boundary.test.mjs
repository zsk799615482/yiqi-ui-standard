import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sources = JSON.parse(await readFile(new URL('../references/discovery-sources.json', import.meta.url), 'utf8'));
const ledger = JSON.parse(await readFile(new URL('../references/external-source-map.json', import.meta.url), 'utf8'));

test('Watermelon 只作为发现来源，不作为运行时平台', () => {
  assert.equal(sources.policy.discoveryOnly, true);
  assert.equal(sources.policy.runtimeDependency, false);
  const watermelon = sources.sources.find(({ id }) => id === 'watermelon-platform');
  assert.ok(watermelon);
  for (const forbidden of ['mcp', 'worker', 'wrangler.toml']) assert.ok(watermelon.forbiddenPaths.includes(forbidden));
  assert.ok(watermelon.allowedPaths.every((path) => path.startsWith('src/data/contents/')));
});

test('外部来源账本记录新增三个来源并保持许可证和复核日期', () => {
  for (const source of ['WatermelonCorp/watermelon-platform', 'Jakubantalik/Libraries', 'kvnkld/aicss']) {
    const record = ledger.sources.find(({ source: id }) => id === source);
    assert.ok(record, `missing ledger record: ${source}`);
    assert.equal(record.license, 'MIT');
    assert.equal(record.reviewed, '2026-09-02');
    assert.equal(record.nextReview, '2027-03-02');
  }
});

test('来源边界不把商业 AICSS Pro 或 Beautiful UI 图标依赖标为自动可用', () => {
  const aicss = ledger.sources.find(({ source }) => source === 'kvnkld/aicss');
  const beautiful = ledger.sources.find(({ source }) => source === 'beautifului.dev');
  assert.ok(aicss.excluded.some((value) => value.includes('Pro')));
  assert.ok(beautiful.excluded.some((value) => value.includes('commercial')));
});
