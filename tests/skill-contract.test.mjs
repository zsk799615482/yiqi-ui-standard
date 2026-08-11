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
  assert.match(planning, /不生成面向产品交付或运行的生产实现代码/);
  assert.match(planning, /允许创建隔离的临时浏览器决策稿/);
  assert.match(planning, /临时稿不得进入产品源码/);
  assert.match(planning, /临时稿不得绑定技术栈/);
  assert.match(planning, /用户批准后应丢弃或重新实现/);
});

test('product profiles support composite products and page overrides', async () => {
  const skill = await read('SKILL.md');
  const archetypes = await read('references/product-archetypes.md');

  assert.match(skill, /references\/product-archetypes\.md/);
  assert.match(archetypes, /1 个主类型/);
  assert.match(archetypes, /0–3 个次类型/);
  assert.match(archetypes, /页面级画像/);

  const productArchetypes = [
    '品牌官网 / 营销转化',
    '产品介绍 / 发布页面',
    '内容 / 知识 / 文档',
    '电商 / 交易 / 支付',
    '社区 / 协作 / 消息',
    'C 端工具 / 移动应用',
    '运营管理 SaaS',
    'AI 创作 / 对话工作台',
    '数据分析 / 监控看板',
    '平台 / 市场 / 多角色系统',
    '个人中心 / 钱包 / 账户',
    '表单流程 / 向导 / 申请系统',
  ];

  for (const archetype of productArchetypes) {
    assert.match(archetypes, new RegExp(archetype));
  }

  const conflictPriority = [
    '安全、可用性和任务效率',
    '当前页面的主要任务',
    '当前页面类型',
    '产品主类型',
    '产品次类型',
    '品牌视觉表达',
  ];

  let previousPriorityIndex = -1;
  for (const priority of conflictPriority) {
    const priorityIndex = archetypes.indexOf(priority);
    assert.ok(priorityIndex > previousPriorityIndex);
    previousPriorityIndex = priorityIndex;
  }
});
