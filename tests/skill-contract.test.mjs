import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const markdownSection = (markdown, heading) => {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  assert.notEqual(start, -1, `missing markdown section: ${heading}`);

  const contentStart = start + marker.length;
  const nextSection = markdown.indexOf('\n## ', contentStart);
  return markdown.slice(
    contentStart,
    nextSection === -1 ? markdown.length : nextSection,
  );
};

const markdownSubsection = (markdown, heading) => {
  const marker = `### ${heading}`;
  const start = markdown.indexOf(marker);
  assert.notEqual(start, -1, `missing markdown subsection: ${heading}`);

  const contentStart = start + marker.length;
  const nextSubsection = markdown.indexOf('\n### ', contentStart);
  return markdown.slice(
    contentStart,
    nextSubsection === -1 ? markdown.length : nextSubsection,
  );
};

const assertMarkdownListItems = (section, items, label) => {
  for (const item of items) {
    assert.match(
      section,
      new RegExp(`^- ${escapeRegExp(item)}。?$`, 'm'),
      `missing exact ${label} list item: ${item}`,
    );
  }
};

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
  assert.ok(
    skill.indexOf('第 1 步：项目阶段') <
      skill.indexOf('第 2 步：产品画像'),
    'project stage selection must precede product profiling',
  );
  assert.match(
    skill,
    /规划与需求阶段按 `references\/planning-workflow\.md` 的访谈顺序，在目标用户和主要任务之后确认产品画像/,
  );
  assert.match(
    skill,
    /代码实现和已有页面审查或改进阶段，在进入对应工作前确认产品画像/,
  );

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
    /approved layout（已批准布局方向）[\s\S]*当前页面对应的 Hero、SaaS 或其他产品规范[\s\S]*经用户批准的结构方向[\s\S]*不是固定全局模板/,
  );

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

test('Hero rules constrain type scale and reject decorative split layouts', async () => {
  const skill = await read('SKILL.md');
  const hero = await read('references/hero-standards.md');
  const routing = markdownSection(hero, '路由原则');
  const prohibitions = markdownSection(hero, '禁止');

  assert.match(skill, /references\/hero-standards\.md/);
  assert.match(skill, /### 第 3 步：Hero \/ No Hero/);
  assert.ok(
    skill.indexOf('第 2 步：产品画像') <
      skill.indexOf('第 3 步：Hero / No Hero'),
    'product profiling must precede Hero / No Hero routing',
  );
  assert.match(
    skill,
    /规划与需求阶段[\s\S]*references\/planning-workflow\.md[\s\S]*页面地图[\s\S]*密度[\s\S]*素材状态[\s\S]*第 7 项决定 Hero/,
  );
  assert.match(
    skill,
    /代码实现和已有页面审查或改进阶段，在产品画像和页面主要任务确认后执行 Hero 路由/,
  );

  const routingRule =
    '同时判断当前页面主要任务和页面类型，自动选择 Hero 或 No Hero；冲突时遵循 `references/product-archetypes.md` 的优先级，当前页面主要任务优先于页面类型。';
  assert.ok(skill.includes(routingRule));
  assert.ok(routing.includes(routingRule));
  assert.match(
    routing,
    /持续操作、数据或任务壳层默认使用 No Hero/,
  );
  assert.match(skill, /允许用户覆盖/);
  assert.match(skill, /不得默认生成左右分栏 Hero/);
  assert.match(routing, /允许用户覆盖/);

  const allowedHeroPages = [
    '品牌官网',
    '产品介绍',
    '发布页面',
    '部分低密度服务页',
  ];

  assert.match(
    routing,
    /允许 Hero 的页面包括品牌官网、产品介绍、发布页面和部分低密度服务页/,
  );

  for (const page of allowedHeroPages) {
    assert.match(
      routing,
      new RegExp(page),
      `missing allowed Hero page: ${page}`,
    );
  }

  assert.match(
    routing,
    /部分低密度服务页[\s\S]*主要任务为浏览、理解或咨询转化/,
  );
  assert.match(routing, /低信息密度/);
  assert.match(routing, /非持续工作/);
  assert.match(routing, /无数据管理或批量操作壳层/);
  assert.match(
    routing,
    /若存在持续任务、数据或操作，则使用 No Hero/,
  );

  assert.match(hero, /36–42px/);
  assert.match(hero, /30–36px/);
  assert.match(hero, /H1 使用品牌、产品名或明确服务类别/);
  assert.match(hero, /同一视口不连续出现多个 H1/);
  assert.match(hero, /字号不得随视口无限放大/);

  assert.match(hero, /真实产品或对象的?全幅媒体/);
  assert.match(hero, /可检查的?产品界面或工作状态/);
  assert.match(hero, /编辑式内容构图/);

  assert.match(hero, /品牌或产品必须成为第一信号/);
  assert.match(hero, /首屏[\s\S]*露出下一业务内容/);
  assert.match(hero, /主要视觉承载产品、服务过程或真实状态/);
  assert.match(hero, /无真实素材时采用内容主导的构图，并输出素材需求/);
  assert.match(hero, /data-ui-hero-media/);
  assert.match(hero, /data-ui-product-state/);

  const forbiddenPatterns = [
    '默认左右文案/装饰图分栏',
    '大型抽象圆形、轨道、光球和无信息几何',
    '装饰图冒充产品视觉',
    'Hero 主内容放进装饰卡片',
    '超大标题和大空白代替层级',
  ];

  for (const pattern of forbiddenPatterns) {
    assert.match(
      prohibitions,
      new RegExp(
        `^- (?:禁止|不得)[^\\n]*${escapeRegExp(pattern)}[^\\n]*$`,
        'm',
      ),
      `missing prohibition or wrong semantic polarity: ${pattern}`,
    );
  }
});

test('operational products route to No Hero', async () => {
  const hero = await read('references/hero-standards.md');
  const noHero = markdownSection(hero, 'No Hero 默认页面');
  const noHeroProducts = [
    'SaaS 工作台',
    'AI 持续操作工具',
    '管理后台',
    '数据分析和监控页面',
    '表格/审批/项目/批量操作页面',
    '个人中心/钱包/账户操作页面',
  ];

  assert.match(noHero, /以下页面默认使用 No Hero/);

  for (const product of noHeroProducts) {
    assert.match(
      noHero,
      new RegExp(`^- ${escapeRegExp(product)}$`, 'm'),
      `missing No Hero product route: ${product}`,
    );
  }

  assert.match(
    noHero,
    /No Hero 页面直接显示导航、当前任务、数据、状态和主要操作/,
  );
});

test('SaaS reference includes all approved workbench shells', async () => {
  const skill = await read('SKILL.md');
  const saas = await read('references/saas-workbench-standards.md');
  const commonRules = markdownSection(saas, '共同规则');
  const operations = markdownSection(saas, '运营管理型');
  const aiCreation = markdownSection(saas, 'AI 创作型');
  const analytics = markdownSection(saas, '数据分析型');

  assert.match(skill, /references\/saas-workbench-standards\.md/);
  assert.match(skill, /### 第 4 步：SaaS 壳层/);
  assert.ok(
    skill.indexOf('第 3 步：Hero / No Hero') <
      skill.indexOf('第 4 步：SaaS 壳层'),
    'Hero / No Hero routing must precede SaaS shell selection',
  );
  assert.match(
    skill,
    /运营管理、AI 创作或数据分析[\s\S]*读取 `references\/saas-workbench-standards\.md`[\s\S]*选择对应壳层/,
  );
  assert.match(skill, /三类都 No Hero/);
  assert.match(
    skill,
    /规划阶段只记录已批准壳层方向，不生成工作台实现/,
  );
  assert.match(
    skill,
    /代码实现\/审查阶段在页面主要任务和 Hero 路由后应用壳层/,
  );

  const sharedRules = [
    '默认暗色',
    '不生成营销 Hero',
    '页面标题 20–24px',
    '面板标题 16–18px',
    '卡片标题 16–18px',
    '正文和控件 13–16px',
    '主要任务、数据和状态进入第一视口',
    '控件和固定格式区域稳定尺寸',
    '不用装饰卡片填充页面，不堆叠装饰卡片',
    '连续大圆角不能损害表格、筛选和高密度信息空间效率',
    '表格、列表行、筛选栏、工具栏、数据网格、停靠面板是工作台结构区域，不定义为卡片，可使用直边或控件级圆角',
    '只有独立、可识别的内容容器才是卡片，并继续使用统一连续大圆角',
    '不得为了应用大圆角把每个区域包成卡片，也不得通过缩小卡片圆角建立另一套卡片语言',
    '三类都 No Hero',
  ];

  assertMarkdownListItems(commonRules, sharedRules, 'SaaS common rule');

  const operationalRules = [
    '固定或可折叠侧栏',
    '上下文工具栏',
    '搜索、筛选和批量操作',
    '表格、列表、审批和项目状态',
    '优先保证扫描、比较和操作效率',
  ];

  assertMarkdownListItems(
    operations,
    operationalRules,
    'operational workbench rule',
  );

  const aiCreationRules = [
    '导航栏或项目栏',
    '主画布、对话区或输出工作区',
    '参数检查器或上下文面板',
    '明确运行、等待、完成、错误和恢复状态',
    '输入输出保持空间和任务关联',
  ];

  assertMarkdownListItems(
    aiCreation,
    aiCreationRules,
    'AI creation workbench rule',
  );

  const analyticsRules = [
    '导航与时间范围',
    '维度和筛选控制',
    '指标、趋势、比较和明细',
    '异常状态和数据解释',
    '数字对齐、单位和时间范围清晰',
  ];

  assertMarkdownListItems(
    analytics,
    analyticsRules,
    'analytics workbench rule',
  );
});

test('v2 tokens are dark-first and include role typography', async () => {
  const tokens = JSON.parse(await read('design-tokens.json'));
  const serializedTokens = JSON.stringify(tokens);

  assert.equal(tokens.meta.version, '2.0.0');
  assert.equal(tokens.theme.default, 'dark');
  assert.equal(tokens.theme.lightGeneratedOnlyWhenRequested, true);
  assert.equal(tokens.darkColors.surfaceElevated, '#1B1B20');
  assert.equal(tokens.darkColors.elevated, undefined);
  assert.doesNotMatch(serializedTokens, /\{darkColors\.elevated\}/);
  assert.equal(
    tokens.semanticColors.background.elevated,
    '{darkColors.surfaceElevated}',
  );
  assert.equal(tokens.semanticColors.background.page, '{darkColors.page}');
  assert.equal(tokens.semanticColors.text.inverse, '{colors.common.white}');
  assert.equal(tokens.semanticColors.status.info.foreground, '#D7BCE8');
  assert.equal(
    tokens.semanticColors.background.success,
    'rgba(50, 122, 91, 0.18)',
  );
  assert.equal(
    tokens.semanticColors.background.danger,
    'rgba(185, 74, 90, 0.18)',
  );
  assert.equal(
    tokens.semanticColors.border.success,
    '{colors.success.500}',
  );
  assert.equal(
    tokens.semanticColors.border.danger,
    '{colors.danger.500}',
  );

  assert.deepEqual(tokens.typography.roles.marketingH1, {
    desktop: { min: '36px', max: '42px' },
    mobile: { min: '30px', max: '36px' },
  });
  assert.deepEqual(tokens.typography.roles.pageTitle, {
    desktop: { min: '28px', max: '32px' },
    mobile: { min: '24px', max: '28px' },
  });
  assert.deepEqual(tokens.typography.roles.sectionTitle, {
    desktop: { min: '22px', max: '24px' },
    mobile: { min: '20px', max: '22px' },
  });
  assert.deepEqual(tokens.typography.roles.cardTitle, {
    desktop: { min: '16px', max: '20px' },
    mobile: { min: '16px', max: '18px' },
  });
  assert.deepEqual(tokens.typography.roles.saasPageTitle, {
    min: '20px',
    max: '24px',
  });
  assert.deepEqual(tokens.typography.roles.saasPanelTitle, {
    min: '16px',
    max: '18px',
  });
  assert.deepEqual(tokens.typography.roles.saasBody, {
    min: '13px',
    max: '16px',
  });
});

test('cards use one continuous large-radius token and two materials', async () => {
  const tokens = JSON.parse(await read('design-tokens.json'));
  const theme = await read('theme.css');

  assert.equal(tokens.borderRadius.card, '36px');
  assert.deepEqual(tokens.cardMaterials, {
    defaultQuestionRequired: true,
    solid: {
      background: '{darkColors.surface}',
      border: '{darkColors.border}',
      shadow: '0 18px 60px rgba(0, 0, 0, 0.22)',
    },
    liquidGlass: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.16)',
      backdropBlur: '24px',
      backdropSaturation: '140%',
      reducedTransparencyFallback: '{darkColors.surface}',
    },
  });

  assert.match(theme, /color-scheme:\s*dark/);
  assert.match(theme, /--radius-card:\s*36px/);
  assert.match(
    theme,
    /\[data-ui-card\]\s*\{[\s\S]*border-radius:\s*var\(--radius-card\)[\s\S]*corner-shape:\s*squircle/,
  );
  assert.match(theme, /:root\[data-ui-card-material="solid"\]/);
  assert.match(theme, /:root\[data-ui-card-material="liquid-glass"\]/);
  assert.doesNotMatch(theme, /data-card-material=/);
  assert.match(
    theme,
    /:root\[data-ui-card-material="liquid-glass"\]\s*\{[^}]*--card-shadow:\s*none;/,
  );
  assert.match(
    theme,
    /backdrop-filter:\s*blur\(var\(--card-glass-blur\)\)\s+saturate\(var\(--card-glass-saturation\)\)/,
  );
  assert.match(
    theme,
    /@media\s*\(prefers-reduced-transparency:\s*reduce\)[\s\S]*:root\[data-ui-card-material="liquid-glass"\]\s*\{[^}]*--card-shadow:\s*var\(--card-solid-shadow\);/,
  );
});

test('theme CSS exposes the approved v2 public token interface', async () => {
  const theme = await read('theme.css');
  const expectedVariables = {
    '--text-marketing-h1-min': '36px',
    '--text-marketing-h1-max': '42px',
    '--text-marketing-h1-mobile-min': '30px',
    '--text-marketing-h1-mobile-max': '36px',
    '--text-page-title-desktop-min': '28px',
    '--text-page-title-desktop-max': '32px',
    '--text-page-title-mobile-min': '24px',
    '--text-page-title-mobile-max': '28px',
    '--text-section-title-desktop-min': '22px',
    '--text-section-title-desktop-max': '24px',
    '--text-section-title-mobile-min': '20px',
    '--text-section-title-mobile-max': '22px',
    '--text-card-title-desktop-min': '16px',
    '--text-card-title-desktop-max': '20px',
    '--text-card-title-mobile-min': '16px',
    '--text-card-title-mobile-max': '18px',
    '--text-saas-page-title-min': '20px',
    '--text-saas-page-title-max': '24px',
    '--text-saas-panel-title-min': '16px',
    '--text-saas-panel-title-max': '18px',
    '--text-saas-body-min': '13px',
    '--text-saas-body-max': '16px',
    '--card-solid-bg': 'var(--color-bg-surface)',
    '--card-solid-border': 'var(--color-border-default)',
    '--card-solid-shadow': '0 18px 60px rgba(0, 0, 0, 0.22)',
    '--card-glass-bg': 'rgba(255, 255, 255, 0.08)',
    '--card-glass-border': 'rgba(255, 255, 255, 0.16)',
    '--card-glass-blur': '24px',
    '--card-glass-saturation': '140%',
  };

  for (const [name, value] of Object.entries(expectedVariables)) {
    assert.match(
      theme,
      new RegExp(`${escapeRegExp(name)}:\\s*${escapeRegExp(value)};`),
      `missing or incorrect public CSS variable: ${name}`,
    );
  }

  assert.doesNotMatch(theme, /--type-/);
  assert.doesNotMatch(theme, /--text-page-title-(?:min|max):/);
  assert.doesNotMatch(theme, /--text-section-title-(?:min|max):/);
  assert.doesNotMatch(theme, /--text-card-title-(?:min|max):/);
  assert.doesNotMatch(theme, /--color-dark-elevated/);
  assert.match(theme, /--color-dark-surface-elevated:\s*#1b1b20/i);
  assert.match(
    theme,
    /--color-bg-elevated:\s*var\(--color-dark-surface-elevated\)/,
  );
  assert.match(theme, /--color-text-inverse:\s*#fff(?:fff)?;/i);
  assert.match(
    theme,
    /--color-bg-success:\s*rgba\(50,\s*122,\s*91,\s*0\.18\)/,
  );
  assert.match(
    theme,
    /--color-bg-danger:\s*rgba\(185,\s*74,\s*90,\s*0\.18\)/,
  );
  assert.match(theme, /--color-border-success:\s*#327a5b/i);
  assert.match(theme, /--color-border-danger:\s*#b94a5a/i);
  assert.match(theme, /--color-info-text:\s*#d7bce8;/i);
});

test('SKILL treats v2 visual boundaries as mandatory', async () => {
  const skill = await read('SKILL.md');

  assert.match(skill, /3\. \*\*共享硬边界与产品校准\*\*/);
  assert.match(
    skill,
    /默认暗色、排版角色范围和卡片连续大圆角是生成硬边界/,
  );
  assert.match(
    skill,
    /产品主类型、页面任务和信息密度决定布局、控件尺寸和局部密度/,
  );
  assert.match(
    skill,
    /不要求不同产品复制相同组件，但不得突破标题、Hero、卡片规则/,
  );
  assert.doesNotMatch(
    skill,
    /圆角、字号、断点和动效数值默认是建议/,
  );
});

test('visual references document dark typography and card boundaries', async () => {
  const visual = await read('references/visual-system.md');
  const guidance = await read('references/oneseven-guidance.md');
  const card = markdownSubsection(visual, '卡片（Card）');

  for (const document of [visual, guidance]) {
    assert.match(document, /默认暗色/);
    assert.match(document, /36–42px/);
    assert.match(document, /30–36px/);
    assert.match(document, /28–32px/);
    assert.match(document, /24–28px/);
    assert.match(document, /22–24px/);
    assert.match(document, /20–22px/);
    assert.match(document, /16–20px/);
    assert.match(document, /16–18px/);
    assert.match(document, /20–24px/);
    assert.match(document, /13–16px/);
    assert.match(document, /36px/);
    assert.match(document, /实体材质[\s\S]*液态玻璃|液态玻璃[\s\S]*实体材质/);
    assert.match(document, /生成前必须询问/);
    assert.match(document, /玻璃卡片不得嵌套|玻璃材质不得嵌套/);
    assert.match(document, /减少透明[\s\S]*实体背景/);
  }

  assert.match(card, /16–24px/);
  assert.match(card, /radius-card/);
  assert.match(card, /36px/);
  assert.match(card, /corner-shape:\s*squircle/);
  assert.match(card, /标题[\s\S]*16–20px[\s\S]*16–18px/);
  assert.match(card, /同一页面使用同一种卡片材质/);
  assert.match(card, /不得嵌套/);
  assert.match(card, /高密度[\s\S]*减少卡片数量[\s\S]*内边距/);
  assert.match(card, /hover/);
  assert.match(card, /focus-visible/);
  assert.doesNotMatch(card, /12px/);
  assert.doesNotMatch(card, /radius-lg/);
  assert.match(
    visual,
    /\| `color-text-inverse` \| white \| 浅色或品牌实心背景上的反色文本 \|/,
  );
  assert.doesNotMatch(
    visual,
    /\| `color-text-inverse` \| dark page \|/,
  );
});

test('OneSeven review language enforces shared boundaries', async () => {
  const guidance = await read('references/oneseven-guidance.md');

  assert.match(
    guidance,
    /默认暗色、排版角色、Hero、卡片等共享硬边界冲突必须作为强制问题/,
  );
  assert.match(
    guidance,
    /只有布局、控件尺寸、局部密度等合理产品差异使用“建议”措辞/,
  );
  assert.doesNotMatch(
    guidance,
    /除明确品牌冲突外，优先使用“建议”“可以考虑”“需要确认局部规则”等措辞/,
  );
});
