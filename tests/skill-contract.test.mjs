import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('SKILL entry asks brand mode before project stage', async () => {
  const skill = await read('SKILL.md');

  assert.match(skill, /第 0 步：品牌模式/);
  assert.match(skill, /使用品牌指导（默认）/);
  assert.match(skill, /第 1 步：项目阶段/);
  assert.match(skill, /规划与需求/);
  assert.match(skill, /代码实现/);
  assert.match(skill, /已有页面审查或改进/);
  assert.ok(
    skill.indexOf('第 0 步：品牌模式') <
      skill.indexOf('第 1 步：项目阶段'),
  );
});

test('planning mode has a dedicated approval-gated workflow', async () => {
  const planning = await read('references/planning-workflow.md');
  const skill = await read('SKILL.md');

  assert.match(skill, /references\/planning-workflow\.md/);
  assert.match(planning, /不询问技术栈/);
  assert.match(planning, /不生成代码/);
  assert.match(planning, /完整 UI 需求规范/);
  assert.match(planning, /2–3 个布局方向/);
  assert.match(planning, /用户批准[\s\S]*前[\s\S]*不进入代码实现/);
});
