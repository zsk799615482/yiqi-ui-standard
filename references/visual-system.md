# OneSeven 视觉设计系统规范

本文档定义壹柒研究所跨产品共享的品牌基础和可复用设计意图。Logo、品牌字体、品牌紫定位和语义一致性属于品牌级规则；布局密度、组件尺寸、圆角和信息结构由产品场景决定。

---

## 品牌基础层

### 品牌定位

**当前定位：** 安静、清晰、克制、任务导向。

不同产品应保持相同品牌气质，但不复制同一套页面模板：

- 官网可以宽松、有更强的品牌叙事
- AI 工具可以采用标准密度和持续操作界面
- 管理后台可以紧凑，以扫描、比较和批量操作效率为先
- 同一产品内部的颜色角色、组件状态和交互方式必须稳定

### 品牌主色

**品牌紫：** `#9A6ABA`

品牌紫用于焦点、选中、关键操作、信息状态和少量品牌强调，不作为大面积背景的默认颜色。

**精简色阶：**
```javascript
primary: {
  100: '#F3ECF7', // 浅色背景、选中态背景
  500: '#9A6ABA', // 品牌基准、图标、大号文字
  700: '#68447F', // 小号文字、按钮、强调状态
}
```

### 语义色

只保留三组有彩色，避免状态色过多：

| 语义 | 浅色背景 | 基准强调 | 深色文字/按钮 | 用途 |
|------|---------|---------|---------------|------|
| primary / info | `#F3ECF7` | `#9A6ABA` | `#68447F` | 品牌、信息、焦点、选中 |
| success | `#E7F2EC` | `#327A5B` | `#21513D` | 成功、通过、完成 |
| danger | `#F8E8EB` | `#B94A5A` | `#7D303B` | 错误、删除、不可逆操作 |

**警告状态不新增橙色：**

- 使用中性背景和高对比正文
- 配合明确的警告图标、标题和操作文案
- 风险升级为错误或不可逆操作时，使用 danger
- 状态不能只依赖颜色传达

### 中性色

中性色承担页面、文字、边框、禁用和普通提示等主要视觉工作。

```javascript
neutral: {
  50:  '#FAFAFA', // 页面背景
  100: '#F5F5F5', // 次级背景、悬停背景
  200: '#E5E5E5', // 边框、分隔线
  400: '#A3A3A3', // 占位符、弱化信息
  700: '#525252', // 正文、次要标题
  900: '#171717', // 标题、高强调文字
}
```

### 字体

**品牌与中文主字体：** `Alibaba PuHuiTi`
**英文回退字体：** 系统字体
**代码字体：** `SF Mono`

字体文件已内置在 `../assets/fonts/`：

| 字体文件 | CSS 字重 | 用途 |
|----------|----------|------|
| `AlibabaPuHuiTi-3-35-Thin.woff2` | 200 | 品牌展示、大字号标题 |
| `AlibabaPuHuiTi-3-55-Regular.woff2` | 400 | 正文 |
| `AlibabaPuHuiTi-3-65-Medium.woff2` | 500 | 按钮、强调文字 |
| `AlibabaPuHuiTi-3-75-SemiBold.woff2` | 600 | 标题、关键状态 |

`theme.css` 已包含对应 `@font-face`。复制主题文件时必须保持 `assets/fonts/` 相对路径，或同步调整字体 URL。

**完整字体栈：**
```css
--font-sans: "Alibaba PuHuiTi", -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "SF Mono", Consolas, Menlo, Monaco, "Courier New", monospace;
```

### Logo 使用规范

| 项目 | 规范 |
|------|------|
| 正式资产 | `../assets/oneseven-logo.png` |
| 颜色 | 浅色背景使用黑色，暗色背景使用白色反相 |
| 尺寸 | 以轮廓清晰、不拥挤为准；24px 高可作为常规界面的起始参考 |
| 安全间距 | 建议至少保留 Logo 高度 50% 的空白，狭窄场景可按清晰度调整 |
| 禁止操作 | 拉伸、旋转、描边、渐变填充、发光、无意义阴影、默认紫色填充 |

---

## Design Tokens 体系

Tokens 是平台无关的设计决策。各平台通过 `platform-implementations.md` 中的方式落地。

### 命名原则

- **语义化优先**：用 `primary` 而非 `blue`，用 `danger` 而非 `red`
- **精简层级**：100 为浅色背景，500 为基准强调，700 为深色文字和按钮
- **业务代码使用 token**：特殊视觉实验应先形成产品级 token，再进入业务代码

### 颜色 Tokens

**结构：**
```
color-{语义}-{强度}

示例：
color-primary-500
color-neutral-200
color-danger-700
```

**语义别名（推荐在业务代码中使用）：**

| 别名 | 指向 | 用途 |
|------|------|------|
| `color-text-primary` | neutral-900 | 标题、重点文本 |
| `color-text-secondary` | neutral-700 | 正文、说明文本 |
| `color-text-tertiary` | neutral-400 | 辅助文本、占位符 |
| `color-text-inverse` | white | 深色背景上的文本 |
| `color-bg-page` | neutral-50 | 页面背景 |
| `color-bg-surface` | white | 卡片、面板背景 |
| `color-bg-hover` | neutral-100 | 悬停背景 |
| `color-bg-active` | primary-100 | 选中、按下背景 |
| `color-border-default` | neutral-200 | 默认边框 |
| `color-border-strong` | neutral-400 | 强调边框 |
| `color-border-focus` | primary-700 | 焦点边框 |

使用别名的好处：切换暗色模式时只需重新映射别名，业务代码无需改动。

### 间距 Tokens

**参考基础单位：4px。** 共享 token 优先使用 4px 级进，但具体产品可以为排版、栅格或平台适配建立局部值。

| Token | 数值 | 典型用途 |
|-------|------|---------|
| `spacing-0` | 0 | 重置间距 |
| `spacing-1` | 4px | 图标与文字间隙、极小间距 |
| `spacing-2` | 8px | 紧凑内边距、标签内边距 |
| `spacing-3` | 12px | 小按钮内边距、列表项间距 |
| `spacing-4` | 16px | **标准内边距（最常用）** |
| `spacing-5` | 20px | 中等间距 |
| `spacing-6` | 24px | 卡片内边距、组件间距 |
| `spacing-8` | 32px | 区块间距 |
| `spacing-10` | 40px | 大区块间距 |
| `spacing-12` | 48px | Section 间距 |
| `spacing-16` | 64px | 页面级间距 |
| `spacing-20` | 80px | 大页面留白 |
| `spacing-24` | 96px | 首屏留白 |

**判断原则：**

- 不因单个值不是 4px 倍数直接判错
- 同类元素出现无理由的细小差异时，应收敛为局部 token
- 数值变化造成对齐、响应式或维护问题时，优先修复
- 1px 边框、负边距对齐和高清屏细线可以独立使用

### 密度 Profiles

| Profile | 典型产品 | 控件高度参考 | 组件内边距 | 组件间距 | 栅格间隙 |
|---------|---------|-------------|-----------|---------|---------|
| compact | 管理后台、密集工具栏 | 32px | 8px / 12px | 12px | 16px |
| standard | AI 工具、个人中心 | 40px | 12px / 16px | 16px | 24px |
| spacious | 官网、内容展示 | 48px | 16px / 24px | 24px | 32px |

Profile 是产品级起点，不是跨产品硬性尺寸。移动端触控目标应保证足够点击区域，可通过外层 hit area 补足。

### 字号 Tokens

| Token | 字号 | 行高 | 字重 | 典型用途 |
|-------|------|------|------|---------|
| `text-xs` | 12px | 16px | 400 | 辅助信息、时间戳、角标 |
| `text-sm` | 14px | 20px | 400 | 正文、按钮文字、表单标签 |
| `text-base` | 16px | 24px | 400 | **标准正文** |
| `text-lg` | 18px | 28px | 500 | 小标题、强调文本 |
| `text-xl` | 20px | 28px | 600 | 卡片标题 |
| `text-2xl` | 24px | 32px | 600 | 页面副标题 |
| `text-3xl` | 30px | 36px | 700 | 页面标题 |
| `text-4xl` | 36px | 40px | 700 | 大标题 |
| `text-5xl` | 48px | 52px | 700 | 营销页大标题 |

**行高规则：**
- 正文（12-18px）：行高约为字号的 1.4-1.5 倍，保证可读性
- 标题（20px+）：行高约为字号的 1.2-1.3 倍，避免过于松散
- 中文内容建议行高比英文略大（+2px）

**字重规则：**
- 200 (ExtraLight)：品牌展示、大字号品牌标题
- 400 (Regular)：正文
- 500 (Medium)：强调文本、按钮
- 600 (Semibold)：小标题
- 700 (Bold)：标题
- 小字号正文不使用 200，避免损害中文可读性

### 圆角 Tokens

| Token | 数值 | 典型用途 |
|-------|------|---------|
| `radius-none` | 0 | 表格、贯穿式分隔区块 |
| `radius-sm` | 4px | 标签、徽章、小输入框 |
| `radius-md` | 8px | **按钮、输入框、小卡片（最常用）** |
| `radius-lg` | 12px | 卡片、面板 |
| `radius-xl` | 16px | 大卡片、模态框 |
| `radius-2xl` | 24px | 特殊容器、营销卡片 |
| `radius-full` | 9999px | 头像、胶囊按钮、开关 |

**一致性规则：** 圆角由产品局部系统选择。同一产品中的同类组件应使用相同圆角，嵌套元素的内外圆角关系应稳定。

### 阴影 Tokens

| Token | 定义 | 典型用途 |
|-------|------|---------|
| `shadow-none` | none | 扁平元素 |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | 轻微凸起、卡片默认态 |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.06)` | 卡片悬停、下拉菜单 |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)` | 浮层、Popover |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)` | 模态框、抽屉 |
| `shadow-inner` | `inset 0 2px 4px rgba(0,0,0,0.05)` | 输入框内凹、按下态 |

**阴影原则：**
- 阴影颜色统一使用透明黑（`rgba(0,0,0,x)`），不使用彩色阴影（除品牌强调场景）
- 层级越高的元素阴影范围越大、越柔和
- 阴影必须配合 z-index 层级使用，视觉层级与逻辑层级保持一致

### 层级 Tokens（z-index）

| Token | 数值 | 用途 |
|-------|------|------|
| `z-base` | 0 | 常规内容 |
| `z-dropdown` | 1000 | 下拉菜单、Select |
| `z-sticky` | 1100 | 吸顶导航 |
| `z-overlay` | 1200 | 遮罩层 |
| `z-modal` | 1300 | 模态框、抽屉 |
| `z-popover` | 1400 | Popover、Tooltip |
| `z-toast` | 1500 | 全局消息提示 |

**禁止：** 使用 `z-index: 9999` 等魔法数字。所有层级必须通过 token 定义。

### 断点 Tokens

| Token | 最小宽度 | 目标设备 |
|-------|---------|---------|
| `screen-sm` | 640px | 大手机横屏 |
| `screen-md` | 768px | 平板竖屏 |
| `screen-lg` | 1024px | 平板横屏、小笔记本 |
| `screen-xl` | 1280px | 桌面显示器 |
| `screen-2xl` | 1536px | 大屏显示器 |

**移动优先原则：** 默认样式面向移动端，通过 `min-width` 媒体查询向上适配。

---

## 组件规范

以下规范定义组件的视觉标准。动效部分参考 `motion-standards.md`。

### 按钮（Button）

**尺寸系统：**

| 尺寸 | 高度 | 内边距 | 字号 | 圆角 | 典型场景 |
|------|------|--------|------|------|---------|
| xs | 28px | 4px 12px | text-xs | radius-sm | 表格行内操作 |
| sm | 32px | 6px 16px | text-sm | 产品级 | compact Profile |
| md | 40px | 10px 20px | text-sm | 产品级 | standard Profile |
| lg | 48px | 12px 24px | text-base | 产品级 | spacious Profile |
| xl | 56px | 16px 32px | text-lg | radius-lg | 移动端、落地页 CTA |

**变体（Variant）：**

| 变体 | 背景 | 文字 | 边框 | 用途 |
|------|------|------|------|------|
| primary | primary-700 | white | none | 当前任务的主操作 |
| secondary | white | neutral-700 | neutral-200 | 次要操作 |
| tertiary | transparent | neutral-700 | none | 弱化操作、图标按钮 |
| danger | danger-700 | white | none | 删除等破坏性操作 |
| ghost | transparent | primary-700 | none | 链接式按钮 |

**状态定义（必须全部实现）：**

| 状态 | 视觉变化 |
|------|---------|
| default | 基准样式 |
| hover | 基准色与深色之间做轻微明度变化，可选 `translateY(-1px)` |
| active | `scale(0.98)`，背景再加深一档 |
| focus-visible | `outline: 2px solid primary-700; outline-offset: 2px` |
| disabled | `opacity: 0.5; cursor: not-allowed; pointer-events: none` |
| loading | 显示 spinner，文字改为进行时（如"提交中..."），禁用交互 |

**规则：**
- 移动端按钮需要足够的触控区域；视觉高度较小时使用透明 hit area 补足
- 图标 + 文字按钮，图标与文字间距为 `spacing-2`（8px）
- 同一任务区应有明确主操作，避免多个同权 primary 竞争视觉焦点
- 按钮文案使用动词，不超过 4 个中文字（如"保存"、"立即购买"）

### 输入框（Input）

| 属性 | 规范 |
|------|------|
| 高度 | 与同尺寸按钮一致（sm 32px / md 40px / lg 48px） |
| 内边距 | 水平 `spacing-3`（12px），垂直居中 |
| 字号 | text-sm（14px）或 text-base（16px） |
| 圆角 | radius-md（8px） |
| 边框 | 1px solid `color-border-default` |
| 背景 | `color-bg-surface`（白） |

**状态定义：**

| 状态 | 视觉变化 |
|------|---------|
| default | 边框 neutral-200 |
| hover | 边框 neutral-400 |
| focus | 边框 primary-700 + `box-shadow: 0 0 0 3px primary-500/15%` |
| error | 边框 danger-500 + 下方错误文本（text-xs, danger-700） |
| success | 边框 success-500 |
| disabled | 背景 neutral-100，文字 neutral-400，禁用交互 |
| readonly | 背景 neutral-50，边框 neutral-200 |

**规则：**
- 移动端字号不小于 16px，避免 iOS Safari 自动缩放
- 占位符使用 `color-text-tertiary`，不得承载必要信息
- 必填标记使用 danger-700 的星号，置于标签后
- 错误信息即时显示（blur 时校验），不使用 alert 弹窗

### 卡片（Card）

| 属性 | 规范 |
|------|------|
| 内边距 | `spacing-4`（16px）紧凑 / `spacing-6`（24px）标准 |
| 圆角 | radius-lg（12px） |
| 背景 | `color-bg-surface` |
| 边框 | 1px solid `color-border-default`（扁平风格）或 none（阴影风格） |
| 阴影 | shadow-sm（默认）→ shadow-md（悬停，仅可点击卡片） |

**规则：**
- 边框和阴影二选一，不同时使用（避免视觉噪音）
- 卡片内部元素间距使用 `spacing-3` 或 `spacing-4`
- 可点击卡片必须有 hover 反馈，不可点击卡片不得有 hover 效果（避免误导）
- 卡片标题使用 text-lg 或 text-xl，与正文有明确层级差

### 模态框（Modal）

| 属性 | 规范 |
|------|------|
| 最大宽度 | sm 400px / md 560px / lg 720px / xl 960px |
| 内边距 | `spacing-6`（24px） |
| 圆角 | radius-xl（16px） |
| 阴影 | shadow-xl |
| 遮罩 | `rgba(0, 0, 0, 0.5)`，可选 `backdrop-filter: blur(4px)` |
| 层级 | z-modal（1300），遮罩 z-overlay（1200） |

**结构规范：**
- 标题区：text-xl，字重 600，底部间距 `spacing-4`
- 内容区：text-sm 或 text-base，最大高度 `70vh` 并可滚动
- 操作区：右对齐，按钮间距 `spacing-3`，主操作在右

**规则：**
- 必须支持 ESC 键关闭（除非是强制确认场景）
- 点击遮罩关闭（破坏性操作除外，需明确点击按钮）
- 打开时锁定 body 滚动，关闭后恢复滚动位置
- 焦点必须锁定在模态框内（focus trap），关闭后归还给触发元素

### 表格（Table）

| 属性 | 规范 |
|------|------|
| 行高 | 紧凑 40px / 标准 48px / 宽松 56px |
| 单元格内边距 | 水平 `spacing-4`，垂直居中 |
| 表头 | 背景 neutral-50，字重 600，字号 text-sm |
| 分隔线 | 1px solid neutral-200（仅水平线，避免网格感） |
| 行悬停 | 背景 `color-bg-hover` |

**规则：**
- 数字列右对齐，文本列左对齐，操作列居中或右对齐
- 表头吸顶时使用 z-sticky 层级
- 空状态必须有明确提示，不显示空表格
- 加载状态使用骨架屏，行数与预期数据量接近

### 标签（Tag / Badge）

| 属性 | 规范 |
|------|------|
| 高度 | 20px（小）/ 24px（默认） |
| 内边距 | 2px 8px（小）/ 4px 10px（默认） |
| 字号 | text-xs |
| 圆角 | radius-sm（方形风格）或 radius-full（胶囊风格） |
| 背景 | primary / success / danger 的 100 色阶，或 neutral-100 |
| 文字 | 对应语义色的 700 色阶，或 neutral-700 |

**规则：**
- 成功、错误和信息标签使用对应语义色；警告标签使用中性色并配合警告图标和明确文案
- 分类标签使用中性色或品牌色浅色阶
- 可删除标签的关闭图标尺寸 12px，与文字间距 `spacing-1`

---

## 精简色板维护

共享品牌色只维护 `100 / 500 / 700` 三档：

- `100`：低强调背景，不承载主要正文
- `500`：品牌识别、图标、大号文字和非文本强调
- `700`：小号文字、实心按钮和高对比状态

扩展颜色前需要确认它解决的是稳定、重复出现的角色。单次页面装饰不进入品牌级色板，可在产品局部定义。

### 色彩质量校验

- [ ] 彩色正文与背景满足目标字号的对比度要求
- [ ] 实心按钮使用白字时，背景色达到 WCAG AA 常规文本对比度
- [ ] 状态同时提供图标、文字或结构提示，不只依赖颜色
- [ ] 同一产品中相同颜色表达相同语义
- [ ] 新颜色没有与现有品牌紫、成功绿或危险红重复角色

---

## 平台映射概览

Tokens 到各平台的具体落地方式，完整模板见 `platform-implementations.md`。

| 平台 | Token 载体 | 引用方式 |
|------|-----------|---------|
| React + Tailwind | `tailwind.config.js` | `className="bg-primary-700 p-4"` |
| React/Vue + CSS 变量 | `theme.css` 的 `:root` | `background: var(--color-primary-700)` |
| Vue + Element Plus | SCSS 变量覆盖 | `$--color-primary: #9A6ABA` |
| 小程序 | `app.wxss` 的 `page` 选择器 | `background: var(--color-primary-700)` |
| React Native | `theme.ts` 常量对象 | `backgroundColor: theme.colors.primary[700]` |
| 传统页面 | `theme.css` 的 `:root` | `background: var(--color-primary-700)` |

**跨平台一致性要求：**
- 所有平台的 token 名称保持一致（`primary-700` 在任何平台都叫 `primary-700`）
- 数值单位按平台转换：Web 用 px，小程序可用 rpx，RN 用无单位数字
- 单一数据源：`design-tokens.json` 为唯一真源，各平台配置由它派生

---

## 暗色模式扩展

暗色模式不是简单反转颜色，而是重新映射语义别名。

### 映射策略

| 语义别名 | 亮色模式 | 暗色模式 |
|---------|---------|---------|
| `color-bg-page` | neutral-50 | neutral-900 |
| `color-bg-surface` | white | 产品级暗色 surface |
| `color-bg-hover` | neutral-100 | neutral-700 |
| `color-text-primary` | neutral-900 | neutral-50 |
| `color-text-secondary` | neutral-700 | neutral-200 |
| `color-text-tertiary` | neutral-400 | neutral-400 |
| `color-border-default` | neutral-200 | neutral-700 |
| `color-primary` | primary-700 | primary-500（暗背景上使用基准色） |

### 暗色模式规则

- 暗色模式优先重新校验品牌色对比度，不做机械反色
- 阴影在暗色模式下几乎不可见，改用边框区分层级
- 纯黑背景（#000）容易造成 OLED 屏幕上的拖影，建议使用 neutral-900
- 图片和插画需要单独处理（降低亮度或提供暗色版本）

### 实现方式

```css
:root {
  --color-bg-page: var(--color-neutral-50);
  --color-text-primary: var(--color-neutral-900);
}

[data-theme="dark"] {
  --color-bg-page: var(--color-neutral-900);
  --color-text-primary: var(--color-neutral-50);
}
```

业务代码始终使用语义别名，切换主题时无需改动任何组件代码。

---

## 常见问题

### Q1: 设计稿给的颜色不在标准色阶里怎么办？

先判断偏差程度。如果与最近的标准色阶差异很小（人眼难辨），直接使用标准色阶。如果差异明显，与设计师确认是有意为之还是取色误差。确认是有意的特殊场景后，考虑扩展标准而非在代码里硬编码。

### Q2: 间距必须严格 4px 倍数吗？

不要求机械取整。共享 token 以 4px 为参考步进；产品可以保留有明确排版、栅格或平台原因的局部值。审查重点是同类元素是否稳定、是否造成对齐或维护问题。

### Q3: 什么时候该扩展标准而不是遵守？

当同一个"违规"需求在 3 个以上场景重复出现时，说明标准存在缺口，应该讨论扩展标准。单次的特殊需求应该服从标准。

### Q4: 一屏只能有一个 primary 按钮，那表单里有"保存"和"提交"怎么办？

明确主次：真正的主操作用 primary，其他用 secondary。如果两个操作确实同等重要，说明信息架构需要调整，或者拆分为两个步骤。
