# Yiqi UI Standard

**当前版本：** `3.2.0`

`yiqi-ui-standard` 是一个快速帮助开发人员统一 UI 规范的决策型 Skill，覆盖 UI 规划、代码生成和已有页面审查。它以 OneSeven / 壹柒研究所品牌规范为默认基线，通过产品画像、页面级路由、Design Tokens、静态校验和桌面/移动浏览器验收，控制生成结果的一致性与实际可用性。v3 新增 OneSeven 展示模式，作为 OneSeven 品牌的默认视觉模式，用于可审计地取用高级组件、代码生成 3D、排版动画与滚动叙事；明确效率优先或普通后台需求时可切换为标准模式。动效与依赖选择参考 Emil Kowalski 的方法，但不直接安装或复制外部 skills。

它不是一套要求所有产品复制相同组件的 UI 模板。共享硬边界负责维持品牌关联，产品类型、页面任务、信息密度和操作风险负责决定具体布局。

## 适用场景

- 为新产品建立完整 UI 需求规范
- 按 OneSeven 品牌方向生成页面或组件
- OneSeven 默认生成展示模式；明确要求效率优先、普通后台或不需要高级效果时切换为标准模式
- 在现有项目设计系统内继续实现
- 审查已有页面的品牌一致性、可用性和响应式质量
- 从代表性代码中提取设计规律
- 通过访谈建立新的品牌规范
- 按具体功能选择或拒绝通用工程依赖

## 快速开始

### 安装

将整个 `yiqi-ui-standard` 目录同步到当前 Agent 使用的 Skills 目录。按运行环境选择一个目标即可：

```bash
# cc-switch
rsync -a yiqi-ui-standard/ "$HOME/.cc-switch/skills/yiqi-ui-standard/"

# Codex
rsync -a yiqi-ui-standard/ "$HOME/.codex/skills/yiqi-ui-standard/"

# Claude Code
rsync -a yiqi-ui-standard/ "$HOME/.claude/skills/yiqi-ui-standard/"
```

安装时必须保留 `agents/`、`assets/`、`references/`、`scripts/` 和 `tests/`，不能只复制 `SKILL.md`。

### 调用

可以直接描述任务并明确引用 Skill：

```text
使用 yiqi-ui-standard 规划一个 AI 商业平台
使用 yiqi-ui-standard 生成一个 OneSeven 产品官网
使用 yiqi-ui-standard 为 OneSeven AI 工作台启用展示模式，加入代码生成 3D 和排版动画
使用 yiqi-ui-standard 审查 src/pages/dashboard.tsx
使用 yiqi-ui-standard 从现有组件提取设计规范
```

支持 Slash Command 的客户端也可以使用：

```text
/yiqi-ui-standard 审查这个 CRM 工作台
```

## 决策入口

每次规划、创建、生成、审查或改进 UI 时，Skill 会先完成以下决策。用户已在同一请求中明确答案时，记录后继续，不重复提问。

| 顺序 | 决策 | 可选项 |
|---|---|---|
| 0 | 品牌模式 | OneSeven（默认）/ 当前项目设计系统 / 新品牌规范 |
| 1 | 项目阶段 | 规划与需求 / 代码实现 / 已有页面审查或改进 |
| 1.5 | 视觉模式 | OneSeven 展示模式（默认）/ 标准模式（明确切换） |
| 2 | 产品画像 | 1 个主类型、0–3 个次类型、当前页面级类型 |
| 3 | 页面结构 | 根据主要任务和页面类型选择 Hero / No Hero |
| 4 | SaaS 壳层 | 运营管理型 / AI 创作型 / 数据分析型 |

冲突时依次优先考虑：

1. 安全、可用性和任务效率
2. 当前页面的主要任务
3. 当前页面类型
4. 产品主类型
5. 产品次类型
6. 品牌视觉表达

## 三种工作阶段

### 规划与需求

- 不询问技术栈，不生成生产实现代码
- 按顺序确认目标用户、主要任务、产品画像、页面地图、信息密度、素材、Hero、卡片材质、响应式和风险状态
- 需要比较结构时，在浏览器中展示 2–3 个临时布局方向
- 输出完整 UI 需求规范
- 用户批准书面规范前不进入代码实现

### 代码实现

- 优先读取已批准的 UI 需求规范
- 确认产品画像、页面任务、Hero / No Hero、卡片材质、技术栈和平台
- 展示模式先输出一个推荐提案；确认后运行目录解析器并生成效果锁文件
- Web 页面写入质量门槛所需的根元素元数据
- 运行轻量静态校验
- 完成 `1440 × 1000` 和 `390 × 844` 浏览器验收
- 静态 error 和未复核的 warning 都会阻塞最终验收

### 已有页面审查或改进

- 先识别品牌、产品类型、页面任务、信息密度、风险等级、Hero 和卡片材质
- OneSeven 审查使用五段式报告：品牌基础、产品内部一致性、体验与可用性、Apple Design 参考、做得好的地方
- 每项问题包含位置、当前状态、修复方向和规则依据
- 首次审查最多输出 Top 5 阻塞问题和 Top 3 推荐改进

## 产品画像

内置十二类产品原型，并允许复合产品按路由覆盖产品级默认值：

| 页面类型元数据 | 产品原型 |
|---|---|
| `marketing` | 品牌官网 / 营销转化 |
| `product` | 产品介绍 / 发布页面 |
| `content` | 内容 / 知识 / 文档 |
| `commerce` | 电商 / 交易 / 支付 |
| `community` | 社区 / 协作 / 消息 |
| `consumer-tool` | C 端工具 / 移动应用 |
| `saas-operations` | 运营管理 SaaS |
| `saas-ai-workspace` | AI 创作 / 对话工作台 |
| `saas-analytics` | 数据分析 / 监控看板 |
| `platform` | 平台 / 市场 / 多角色系统 |
| `account` | 个人中心 / 钱包 / 账户 |
| `workflow` | 表单流程 / 向导 / 申请系统 |

SaaS、AI 持续操作、管理、分析和账户页面默认使用 No Hero。三种 SaaS 壳层都要求主要任务、数据、状态和主要操作进入第一视口。

## OneSeven 视觉基线

- 默认只生成暗色主题；只有用户明确要求时才生成浅色版本
- 品牌紫为 `#9A6ABA`，用于焦点、选中、关键操作和少量品牌强调
- Web 优先使用包内 Alibaba PuHuiTi，包含 `200 / 400 / 500 / 600` 四个 WOFF2 字重
- 品牌或产品页 H1：桌面 `36–42px`，移动端 `30–36px`
- SaaS 页面标题：`20–24px`
- Web 卡片使用 `36px` 降级圆角和 `corner-shape: squircle`
- 卡片材质必须先确认：实体暗色或 Apple 风格液态玻璃
- 液态玻璃必须提供减少透明度和不支持背景模糊时的实体回退
- 不使用无信息的大型圆形、光球、轨道或默认装饰分栏代替真实产品视觉
- Hero 必须使用真实媒体、可检查的产品状态，或包含实际成果与证据的编辑式构图
- 动效必须可理解、可中断，并尊重 `prefers-reduced-motion`

完整规则分别位于 `references/oneseven-guidance.md`、`references/visual-system.md`、`references/hero-standards.md`、`references/motion-standards.md` 和 `references/animation-craft.md`。通用工程库选择位于 `references/library-selection.md`；高级视觉来源仍由 `references/showcase-catalog.json` 管理。

## OneSeven 展示模式

展示模式是 OneSeven 默认视觉风格。品牌模式为 OneSeven 时默认进入展示模式；用户明确要求效率优先、普通 CRM、管理后台、数据任务或不需要高级视觉效果时，切换为标准模式。

展示模式的固定流程：

1. 用真实内容判断高级效果是否必要。
2. 确认 React / Next、Vue / Nuxt 或原生 Web。
3. 普通工程依赖读取 `references/library-catalog.json`；高级视觉效果读取 `references/showcase-catalog.json`。
4. 输出一个推荐提案，说明品牌改造、依赖、授权与 Full / Lite / Static。
5. 用户确认后运行解析器并生成 `oneseven-effects.lock.json`。
6. 完成静态、桌面、移动、reduced-motion 和 WebGL 失败验收。

```bash
node scripts/resolve-showcase-components.mjs \
  --stack react \
  --page-type saas-ai-workspace \
  --effects 3d,typography,scroll \
  --output oneseven-effects.lock.json
```

首批 Showcase 核心候选包括 Motion、Three.js、Magic UI 源码配方、Reka UI，以及按需启用的 Liquid Glass 专用来源：`liquid-glass-react`（React）、`liquid-glass-vue`（Vue）和 `liquid-glass-vanilla-source`（CSS/SVG 源码配方）。通用工程库由 `references/library-catalog.json` 管理；两类目录不得合并。GSAP / ScrollTrigger 属于条件许可项，只有显式批准并写入锁文件时才能使用。React Bits、Aceternity、付费或许可不明确来源不进入核心自动推荐。

液态玻璃专用来源只提供折射、滤镜和容器行为，不替代 OneSeven 材质规范。必须先确认卡片材质，再通过 `--effects liquid-glass` 解析；React 使用 `liquid-glass-react@1.1.1`，Vue 使用 `@wxperia/liquid-glass-vue@1.0.9`，Vanilla 只复制锁定 commit 的 CSS/SVG 文件。不要安装与 Vanilla 仓库无关的同名 npm `liquid-glass@1.0.0`，也不得保留供应商 999px 圆角、Logo、Demo 文案或全屏 shader。

## Web 接入

### 使用主题变量

复制或引用 `theme.css` 时，必须保持字体资源的相对目录结构：

```css
@import "./yiqi-ui-standard/theme.css";

html {
  color-scheme: dark;
  color: var(--color-text-primary);
  background: var(--color-bg-page);
  font-family: var(--font-sans);
}
```

`design-tokens.json` 是结构化设计令牌来源，`theme.css` 提供可直接用于 Web 的 CSS 变量、字体声明、卡片材质和无障碍降级。

### 页面元数据

生成的 Web 页面必须在 `html` 根元素声明页面类型和 Hero 状态；存在卡片时还必须声明卡片材质：

```html
<html
  lang="zh-CN"
  data-ui-brand="oneseven"
  data-ui-page-type="marketing"
  data-ui-hero="approved"
  data-ui-card-material="solid"
>
```

展示模式额外声明：

```html
<html
  data-ui-brand="oneseven"
  data-ui-page-type="product"
  data-ui-hero="approved"
  data-ui-visual-mode="showcase"
  data-ui-motion-tier-policy="adaptive"
>

<section
  data-ui-effect-id="spatial-product-orbit"
  data-ui-effect-source="threejs-core"
  data-ui-effect-runtime="webgl"
  data-ui-effect-fallback="static"
></section>
```

Approved Hero 的真实媒体或产品状态需要额外标记：

```html
<img
  data-ui-hero-media
  src="./product.webp"
  alt="产品实际工作界面"
>

<section data-ui-product-state="live-workspace">
  <!-- 可检查的真实产品状态 -->
</section>
```

独立卡片容器使用 `data-ui-card`。不要嵌套卡片，也不要为了套用圆角而把工具栏、表格行、筛选栏或数据网格包装成装饰卡片。

## 静态校验

要求 Node.js 18 或更高版本。校验器没有第三方运行时依赖：

```bash
node scripts/validate-generated-web.mjs \
  --file ../index.html \
  --page-type marketing
```

可选参数：

| 参数 | 说明 |
|---|---|
| `--file <path>` | 必填，待检查的 HTML 文件 |
| `--page-type <type>` | 可选，覆盖根元素中的页面类型 |
| `--effects-lock <path>` | 展示模式必填，读取效果来源、版本、许可证和三档回退 |
| `--json` | 可选，输出结构化 JSON 报告 |

示例：

```bash
node scripts/validate-generated-web.mjs \
  --file ../index.html \
  --page-type marketing \
  --json
```

静态校验存在 error 时阻塞，必须修复后重跑。warning 不是静态阻塞项，但必须在浏览器中复核并记录结果；未完成复核和记录时，整体验收仍未完成。

轻量静态校验器只判断当前 HTML 和内联 CSS 中能够直接、确定证明的问题。它不能证明外部样式表、复杂 CSS 级联与继承、非 px 单位或长度计算、字体加载与回退结果，也不能证明视觉质量。这些内容必须交给浏览器验收。

## 浏览器验收

静态测试通过不能代替截图和视觉审查。浏览器验收至少覆盖桌面、移动端、控制台信息，以及每条静态 warning 的观察和结论。

```bash
command -v npx >/dev/null 2>&1
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"

"$PWCLI" open http://localhost:4173 --headed
"$PWCLI" resize 1440 1000
"$PWCLI" screenshot
"$PWCLI" resize 390 844
"$PWCLI" screenshot
"$PWCLI" console warning
```

验收时重点检查：

- 第一视口是否显示品牌、当前任务、关键数据或主要操作
- 真实素材、字体和外部样式是否正确加载
- 文本、按钮、表格、固定格式控件是否溢出或遮挡
- 键盘焦点、等待、完成、错误、恢复和危险操作状态是否完整
- Hero、卡片材质和响应式布局是否符合当前页面类型
- 减少动态效果与减少透明度偏好是否正确降级

## 测试

在 `yiqi-ui-standard/` 目录运行：

```bash
node --test tests/skill-contract.test.mjs
node --test tests/validate-generated-web.test.mjs
node --test tests/showcase-catalog.test.mjs
```

也可以一次运行全部 Node.js 测试：

```bash
node --test tests/*.test.mjs
```

`tests/evals/yiqi-ui-standard-v2-cases.json` 保留 v2 回归，并增加 React 展示模式、Vue 展示模式、标准模式负例、许可证压力和 reduced-motion 等 v3 压力用例。

## 文件结构

```text
yiqi-ui-standard/
├── README.md
├── SKILL.md
├── VERSION
├── design-tokens.json
├── theme.css
├── agents/
│   └── openai.yaml
├── assets/
│   ├── oneseven-logo.png
│   └── fonts/
│       ├── FONT-NOTICE.md
│       └── AlibabaPuHuiTi-3-*.woff2
├── references/
│   ├── planning-workflow.md
│   ├── product-archetypes.md
│   ├── hero-standards.md
│   ├── saas-workbench-standards.md
│   ├── generation-quality-gate.md
│   ├── showcase-mode.md
│   ├── showcase-catalog.json
│   ├── oneseven-guidance.md
│   ├── visual-system.md
│   ├── animation-craft.md
│   ├── motion-standards.md
│   ├── library-selection.md
│   ├── library-catalog.json
│   ├── ai-component-catalog.json
│   ├── discovery-sources.json
│   ├── external-source-map.json
│   ├── platform-implementations.md
│   ├── review-checklist.md
│   ├── interview-workflow.md
│   └── extraction-workflow.md
├── scripts/
│   ├── audit-motion.mjs
│   ├── resolve-showcase-components.mjs
│   └── validate-generated-web.mjs
└── tests/
    ├── evals/yiqi-ui-standard-v2-cases.json
    ├── fixtures/
    ├── library-catalog.test.mjs
    ├── motion-audit.test.mjs
    ├── ai-component-catalog.test.mjs
    ├── source-boundary.test.mjs
    ├── showcase-catalog.test.mjs
    ├── skill-contract.test.mjs
    └── validate-generated-web.test.mjs
```

## 文档索引

| 文件 | 用途 |
|---|---|
| `SKILL.md` | Skill 入口、路由逻辑和核心执行规则 |
| `agents/openai.yaml` | 客户端显示名称、简介和默认调用提示 |
| `references/planning-workflow.md` | 规划访谈顺序、交付物和批准门槛 |
| `references/product-archetypes.md` | 十二类产品原型、复合产品和冲突优先级 |
| `references/hero-standards.md` | Hero / No Hero 路由、证据和标题规则 |
| `references/saas-workbench-standards.md` | 三类 SaaS 工作台壳层 |
| `references/generation-quality-gate.md` | Web 元数据、静态校验和浏览器验收 |
| `references/showcase-mode.md` | OneSeven 展示模式启用、提案、品牌化与三档性能流程 |
| `references/showcase-catalog.json` | 高级组件、运行时、版本、许可证与跨栈配方目录 |
| `references/oneseven-guidance.md` | OneSeven 品牌适用范围和品牌硬规则 |
| `references/visual-system.md` | 颜色、字体、间距、圆角、材质和组件意图 |
| `references/motion-standards.md` | 反馈、动效、等待状态和无障碍降级 |
| `references/animation-craft.md` | 动效决策、曲线、时长、流体交互和降级的单一事实来源 |
| `references/library-selection.md` | 通用工程依赖选择方法、输出契约和 OneSeven 适配 |
| `references/library-catalog.json` | 按任务和技术栈组织的通用工程库候选目录 |
| `references/ai-component-catalog.json` | AICSS、Beautiful UI 和 AI 状态组件的任务级来源目录 |
| `references/discovery-sources.json` | Watermelon 等组件发现来源的允许路径和禁止边界 |
| `references/external-source-map.json` | 外部参考来源、commit、许可证和复核日期账本 |
| `references/platform-implementations.md` | Web、小程序和 React Native 等平台实现 |
| `references/review-checklist.md` | 审查入口、阻塞项和报告格式 |
| `references/interview-workflow.md` | 从零建立品牌标准的访谈流程 |
| `references/extraction-workflow.md` | 从现有代码反向提取规范 |

## 维护说明

- 修改版本时同步更新 `VERSION`、`design-tokens.json` 的 `meta.version` 和本 README
- 修改结构化令牌后同步检查 `theme.css` 的 CSS 变量映射
- 修改 Skill 契约或参考规则后运行全部 Node.js 测试
- 参考外部 skills 时只内化方法，来源 commit、许可证和复核日期记录在 `references/external-source-map.json`
- 更新展示模式目录时核验来源、固定版本、许可证和当前核验日期；现有目录保留 `2026-08-28` 基线快照，新加入的 Liquid Glass 条目记录 `2026-09-02` 核验日期
- 字体来源、法律声明和 SHA-256 位于 `assets/fonts/FONT-NOTICE.md`
- `references/` 默认由 Skill 只读；只有提取或引导模式明确需要时才更新

在当前开发工作区中，`yiqi-ui-standard/` 外层的 `index.html` 是故意保留的失败回归基线，用于验证审查流程，不代表符合 v3 规范的示例实现。
