import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(await readFile(new URL('../references/ai-component-catalog.json', import.meta.url), 'utf8'));

test('AI 组件目录遵守任务优先、单一推荐和无自动安装策略', () => {
  assert.equal(catalog.policy.taskFirst, true);
  assert.equal(catalog.policy.singleRecommendationPerTask, true);
  assert.equal(catalog.policy.freeOrPermissiveOnly, true);
  assert.equal(catalog.policy.automaticInstall, false);
  assert.equal(catalog.policy.vendorStylesMustBeRewritten, true);
});

test('AI 组件目录覆盖 AICSS、Beautiful UI 和 Thinking Orbs，并保留回退', () => {
  const ids = new Set(catalog.entries.map(({ id }) => id));
  for (const id of ['aicss-thinking-state', 'aicss-streaming-text', 'aicss-approval-card', 'beautiful-ui-prompt-context', 'beautiful-ui-task-diff', 'thinking-orbs']) {
    assert.ok(ids.has(id), `missing AI component: ${id}`);
  }
  for (const entry of catalog.entries) {
    for (const key of ['source', 'name', 'task', 'sourceUrl', 'sourceVersion', 'license', 'licenseClass', 'supportedStacks', 'integrationMode', 'dependencies', 'recommendedContexts', 'forbiddenContexts', 'brandRecipe', 'fallback', 'verificationSteps']) {
      assert.ok(entry[key] !== undefined, `${entry.id} missing ${key}`);
    }
    assert.equal(entry.licenseClass, 'permissive');
    assert.ok(entry.fallback.length > 0);
    assert.ok(entry.verificationSteps.length > 0);
  }
});

test('AI 状态来源不会自动并列推荐', () => {
  const thinkingEntries = catalog.entries.filter(({ task }) => ['ai-thinking-state', 'ai-thinking-indicator'].includes(task));
  assert.equal(thinkingEntries.length, 2);
  assert.ok(thinkingEntries.some(({ source }) => source === 'aicss'));
  assert.ok(thinkingEntries.some(({ source }) => source === 'jakubantalik-libraries'));
  assert.ok(thinkingEntries.every(({ forbiddenContexts }) => forbiddenContexts.some((value) => value.includes('Thinking') || value.includes('AICSS'))));
});
