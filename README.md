# UI Standard

**当前版本：** `2.0.0`

`ui-standard` 是用于 UI 规划、代码生成和已有页面审查的决策型 Skill。它默认加载 OneSeven 品牌指导，默认生成暗色界面，并通过轻量静态校验与桌面/移动浏览器验收控制实际生成质量。

## 强制入口

每次任务先确认：

1. 品牌模式：OneSeven（默认）/ 当前项目设计系统 / 新品牌规范
2. 项目阶段：规划与需求 / 代码实现 / 已有页面审查或改进

用户已在同一请求中明确答案时记录并继续，不重复提问。

## 三种阶段

### 规划与需求

- 不询问技术栈
- 不生成生产实现代码
- 确认产品画像、页面地图、工作流、Hero、卡片材质和响应式约束
- 输出完整 UI 需求规范
- 通过浏览器展示 2–3 个临时布局方向
- 用户批准书面规范前不进入实现

### 代码实现

- 优先读取已批准的 UI 需求规范
- 确认技术栈和平台
- 按产品级和页面级画像生成
- 运行静态校验
- 完成 `1440 × 1000` 和 `390 × 844` 浏览器验收

### 审查与改进

- 识别品牌、产品类型、页面任务、信息密度、Hero 和卡片材质
- 输出品牌基础、产品内部一致性、体验可用性、Apple Design 参考和做得好的地方
- 优先报告阻塞问题，不用通用模板抹平产品差异

## 产品画像

- 1 个主类型
- 0–3 个次类型
- 每个页面或路由独立校准

内置十二类产品原型，覆盖营销、内容、交易、社区、C 端工具、运营 SaaS、AI 工作台、数据分析、平台、账户和流程产品。

## 视觉基线

- 默认只生成暗色主题
- 品牌/产品页 H1：桌面 `36–42px`，移动端 `30–36px`
- SaaS 页面标题：`20–24px`
- 卡片使用 `36px` Web 降级圆角和 `corner-shape: squircle`
- 生成卡片前询问实体暗色或 Apple 风格液态玻璃
- SaaS、AI 持续操作、管理、分析和账户页面默认 No Hero
- Hero 必须使用真实媒体、可检查产品状态或有证据的编辑式构图

## SaaS 壳层

1. 运营管理型
2. AI 创作型
3. 数据分析型

三类都不生成营销 Hero，主要任务、数据和状态必须进入第一视口。

## 文件

```text
ui-standard/
├── SKILL.md
├── VERSION
├── design-tokens.json
├── theme.css
├── assets/
├── references/
├── scripts/validate-generated-web.mjs
└── tests/
```

字体包内置 Alibaba PuHuiTi `200 / 400 / 500 / 600` WOFF2。来源和 SHA-256 见 `assets/fonts/FONT-NOTICE.md`。

## 静态校验

```bash
node scripts/validate-generated-web.mjs \
  --file ../index.html \
  --page-type marketing
```

静态校验存在 error 时阻塞，必须修复后重跑。warning 不是静态阻塞项，但必须在浏览器中复核并记录结果；未完成复核和记录时，验收流程仍未完成。

轻量静态校验器只判断当前 HTML 和内联 CSS 中能够直接、确定证明的问题。它不能证明外部样式表、复杂 CSS 级联与继承、非 px 单位或长度计算、字体加载与回退结果，也不能证明视觉质量。上述内容必须交给浏览器验收。

旧的根目录 `index.html` 是故意保留的失败回归基线。

## 浏览器验收

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

静态测试通过不能代替截图和视觉审查。浏览器验收必须覆盖桌面、移动端，以及每条静态 warning 的观察和结论。

## 安装

```bash
rsync -a --exclude .git ui-standard/ \
  /Users/m2/.cc-switch/skills/ui-standard/
```
