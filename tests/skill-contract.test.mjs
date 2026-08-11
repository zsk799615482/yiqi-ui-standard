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
  assert.match(skill, /### 第 2 步：产品画像/);
  assert.match(skill, /一个产品主类型/);
  assert.match(skill, /零到三个次类型/);
  assert.match(skill, /当前页面或路由的页面级类型/);
  assert.match(skill, /复合产品不得强行归为单一类型/);
  assert.match(skill, /布局和密度按页面主要任务校准/);

  assert.match(archetypes, /1 个主类型/);
  assert.match(archetypes, /0–3 个次类型/);
  assert.match(archetypes, /页面级画像/);
  assert.match(
    archetypes,
    /主类型决定整体导航、默认信息密度、核心工作节奏和主要壳层/,
  );
  assert.match(archetypes, /次类型只补充其对应功能/);
  assert.match(
    archetypes,
    /品牌、暗色主题、字体范围、连续圆角和卡片材质保持产品级关联/,
  );

  assert.match(archetypes, /主要任务：浏览、创建、管理、分析、交易、协作/);
  assert.match(archetypes, /信息密度：低、中、高/);
  assert.match(archetypes, /使用节奏：一次性、周期性、持续工作/);
  assert.match(archetypes, /操作风险：普通、敏感、不可逆/);
  assert.match(archetypes, /Hero \/ No Hero/);
  assert.match(archetypes, /approved layout/);

  assert.match(
    archetypes,
    /品牌信号继续保留，但不能破坏高密度工作流、数据辨识和关键操作/,
  );

  assert.match(archetypes, /一个 AI 商业平台可以采用以下画像/);
  assert.match(archetypes, /主类型：AI 创作 \/ 对话工作台/);
  assert.match(
    archetypes,
    /次类型：运营管理 SaaS、数据分析 \/ 监控看板、电商 \/ 交易 \/ 支付/,
  );
  assert.match(archetypes, /官网：品牌官网 \/ 营销转化，有 Hero/);
  assert.match(archetypes, /创作区：AI 创作 \/ 对话工作台，无 Hero/);
  assert.match(archetypes, /项目管理：运营管理 SaaS/);
  assert.match(archetypes, /数据中心：数据分析 \/ 监控看板/);
  assert.match(
    archetypes,
    /订阅结算：电商 \/ 交易 \/ 支付，并按敏感或不可逆操作处理交易与风险/,
  );

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
    assert.match(
      archetypes,
      new RegExp(archetype),
      `missing product archetype: ${archetype}`,
    );
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
    assert.ok(
      priorityIndex > previousPriorityIndex,
      `conflict priority is missing or out of order: ${priority}`,
    );
    previousPriorityIndex = priorityIndex;
  }
});
