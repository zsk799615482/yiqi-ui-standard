import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { analyzeHtml } from '../scripts/validate-generated-web.mjs';

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const section = (markdown, heading) => {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  assert.notEqual(start, -1, `missing section: ${heading}`);
  const next = markdown.indexOf('\n## ', start + marker.length);
  return markdown.slice(start, next === -1 ? undefined : next);
};

test('Skill 入口要求项目级版心，不把对齐偏好变成共享硬边界', async () => {
  const skill = await read('SKILL.md');
  const layout = section(skill, '版心与排版对齐');

  assert.match(layout, /references\/visual-system\.md/);
  assert.match(layout, /唯一新增的强制规范是明确设置版心/);
  assert.match(layout, /不统一规定固定宽度、居中或栅格列数/);
  assert.match(layout, /原有品牌与可用性规范保持不变/);
  assert.match(layout, /自动推荐[\s\S]*完整 UI 规范[\s\S]*确认/);
  assert.match(layout, /实现采用已批准的项目规则/);
  assert.match(layout, /审查以项目规则为依据/);
});

test('规划交付物包含版心与对齐方案，不改变十项访谈顺序', async () => {
  const planning = await read('references/planning-workflow.md');
  const interview = section(planning, '访谈顺序');
  const items = [...interview.matchAll(/^\d+\. (.+)$/gm)].map(
    (match) => match[1],
  );

  assert.deepEqual(items, [
    '目标用户与场景',
    '主要任务',
    '主类型和 0–3 次类型',
    '页面地图',
    '密度与节奏',
    '内容与真实素材',
    'Hero',
    '实体暗色/液态玻璃',
    '响应式平台',
    '可访问性风险状态',
  ]);
  assert.match(section(planning, '默认交付物'), /^- 版心与排版对齐$/m);
  const layout = section(planning, '版心与排版对齐');
  assert.match(layout, /不新增独立访谈项/);
  assert.match(layout, /自动推荐[\s\S]*完整 UI 规范[\s\S]*确认/);
  assert.match(layout, /references\/visual-system\.md/);
});

test('视觉规范定义项目版心输出及理由，而非跨项目固定尺寸', async () => {
  const visual = await read('references/visual-system.md');
  const layout = section(visual, '版心与排版对齐');

  assert.match(layout, /唯一新增的强制规范是明确设置版心/);
  for (const field of [
    '主要内容区域',
    '宽度策略',
    '页面留白',
    '响应式变化',
    '对齐关系',
    '选择理由',
    '例外',
  ]) {
    assert.match(layout, new RegExp(`\\| ${field} \\|`));
  }
  assert.match(layout, /已有设计系统/);
  assert.match(layout, /标题、正文、图片、组件及操作区/);
  assert.match(layout, /不统一规定固定宽度、居中或栅格列数/);
  assert.match(layout, /不对称布局、视觉补偿和局部突破版心/);
  assert.match(layout, /左对齐、居中或右对齐不是跨项目的强制偏好/);
});

test('内容、展示和全宽工作台示例保留不同布局及移动适配', async () => {
  const visual = await read('references/visual-system.md');
  const layout = section(visual, '版心与排版对齐');

  for (const kind of ['内容页', '展示页', '全宽工作台 / 画布']) {
    assert.ok(layout.includes(`| ${kind} |`), `missing example: ${kind}`);
  }
  assert.match(layout, /阅读列[\s\S]*可读行长/);
  assert.match(layout, /全幅媒体[\s\S]*非对称/);
  assert.match(layout, /扣除导航与停靠面板[\s\S]*剩余空间/);
  assert.match(layout, /移动端单列[\s\S]*局部滚动/);
  assert.match(layout, /示例是选型参考，不是默认模板/);
});

test('审查阻塞版心缺失，对齐差异依据项目规则而非统一方向', async () => {
  const review = await read('references/review-checklist.md');

  assert.match(section(review, '审查入口'), /项目版心与排版对齐规则/);
  assert.match(section(review, '阻塞问题'), /未明确设置版心/);
  assert.match(
    section(review, '产品内部一致性'),
    /项目规则[\s\S]*对齐关系[\s\S]*合理例外/,
  );
  assert.match(review, /缺少项目规则时先规划推荐方案/);
  assert.match(review, /不因采用左对齐、居中、右对齐或非对称布局直接判错/);
});

test('质量门槛在浏览器复核版心，不扩展静态脚本猜测对齐', async () => {
  const gate = await read('references/generation-quality-gate.md');

  assert.match(section(gate, '生成前决策'), /已明确设置项目版心/);
  assert.match(section(gate, '静态不确定性'), /版心与排版对齐/);
  const browser = section(gate, '浏览器验收');
  assert.match(browser, /版心的实际内容边界、宽度、留白和响应式变化/);
  assert.match(browser, /项目对齐关系与合理例外/);
  assert.match(browser, /长文本、换行及动态内容/);
  assert.match(gate, /不新增静态脚本猜测版心或对齐是否正确/);
  assert.match(section(gate, '完成标准'), /版心已明确设置并在桌面和移动端复核/);
});

test('静态校验兼容不同方向、流式宽度和有意错位，不要求版心元数据', async () => {
  const fixture = await read('tests/fixtures/saas-valid.html');
  const variations = [
    'main { max-width: 65ch; margin-inline: auto; text-align: left; }',
    'main { width: 100%; text-align: center; }',
    'main { width: calc(100% - var(--panel-width)); text-align: right; }',
    'main { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }',
    'main h1 { transform: translateX(-0.05em); }',
  ];

  for (const css of variations) {
    const report = analyzeHtml(fixture.replace('</style>', `${css}\n</style>`));
    assert.equal(report.ok, true, css);
    assert.deepEqual(report.issues, [], css);
  }
});
