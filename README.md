# UI Standard Skill - 前端风格统一标准

**当前版本：** `1.1.0`

这是一个用于统一公司产品前端风格和标准的 Claude Code skill。

## 📋 功能概览

### 四种工作模式

1. **审查模式** - 检查代码是否符合设计规范
2. **生成模式** - 创建符合标准的组件代码
3. **提取模式** - 从现有代码反向提取设计规范
4. **引导模式** - 访谈式建立完整的设计系统

### 核心特性

- ✅ **跨技术栈支持**：React、Vue、小程序、传统页面、React Native
- ✅ **分级规范**：强制（品牌色）、推荐（间距）、参考（优化建议）
- ✅ **动效降级策略**：现代框架用真弹簧，受限平台用 CSS 近似
- ✅ **Before/After 输出**：清晰的代码修改建议
- ✅ **全中文**：所有内容和输出都是中文

## 📁 文件结构

```
ui-standard/
├── SKILL.md                           # 主文件（路由逻辑 + 核心原则）
├── VERSION                            # 当前版本号
├── design-tokens.json                 # OneSeven Design Tokens 唯一数据源
├── theme.css                          # 字体声明 + 可直接使用的 CSS 变量
├── assets/
│   ├── oneseven-logo.png              # OneSeven 正式图形 Logo
│   └── fonts/
│       ├── FONT-NOTICE.md             # 字体来源、许可提示与校验值
│       ├── AlibabaPuHuiTi-3-35-Thin.woff2
│       ├── AlibabaPuHuiTi-3-55-Regular.woff2
│       ├── AlibabaPuHuiTi-3-65-Medium.woff2
│       └── AlibabaPuHuiTi-3-75-SemiBold.woff2
└── references/
    ├── oneseven-guidance.md           # OneSeven 品牌与设计指导
    ├── visual-system.md               # 视觉设计系统规范
    ├── motion-standards.md            # 动效和交互规范
    ├── platform-implementations.md    # 分平台实现指南
    ├── review-checklist.md            # 代码审查检查清单
    ├── interview-workflow.md          # 访谈式引导工作流
    └── extraction-workflow.md         # 代码提取工作流
```

## 🚀 快速开始

### 安装到 Claude Code

将整个 `ui-standard` 目录复制到 Claude Code 的 skills 目录：

```bash
# macOS
cp -r ui-standard ~/.claude/skills/

# 或同步到 .cc-switch/skills/
rsync -a ui-standard/ ~/.cc-switch/skills/ui-standard/
```

### 字体使用

`theme.css` 已内置 4 个 `@font-face`，覆盖 `200 / 400 / 500 / 600` 字重。Web 项目复制 `theme.css` 时，需要同时保留 `assets/fonts/` 目录结构：

```css
@import "./theme.css";

html {
  font-family: var(--font-sans);
}
```

字体文件来自 Alibaba Fonts 官方 CDN，未做格式转换。来源、法律声明链接和 SHA-256 见 `assets/fonts/FONT-NOTICE.md`。

### 首次使用

调用 skill：

```
/ui-standard
```

如果尚未建立设计规范，skill 会自动提示你选择：
- A. **访谈式引导**（推荐）- 10分钟问答建立完整标准
- B. **从代码提取** - 分析现有组件总结规范

## 💡 使用示例

### 示例 1：审查代码

```
/ui-standard 检查这个按钮组件

<提供代码或文件路径>
```

**输出：**
```markdown
## 审查结果

### 🔴 强制问题（必须修复）
| 当前代码 | 应该改成 | 原因 |
|---------|---------|------|
| color: #3b83f7 | color: var(--color-primary) | 主色值不精确 |

### 🟡 推荐改进
| 当前代码 | 建议改成 | 原因 |
|---------|---------|------|
| padding: 17px | padding: 16px | 使用标准间距 |
```

### 示例 2：生成组件

```
/ui-standard 生成一个符合标准的主按钮组件，React + Tailwind
```

**输出：**
```jsx
// Button.tsx - 符合公司设计标准
export function Button({ children, size = 'md' }) {
  return (
    <button className="bg-primary-700 hover:brightness-95
                       active:scale-98 text-white rounded-md
                       px-5 h-10 text-sm font-medium
                       transition duration-200 ease-out-quick">
      {children}
    </button>
  );
}
```

### 示例 3：提取规范

```
/ui-standard 从这个文件提取设计规范

src/components/Button.tsx
```

**输出：**
提取结果表格，包含颜色、间距、圆角等统计数据。

### 示例 4：建立标准

```
/ui-standard 建立标准
```

skill 会引导你完成 5 个阶段的访谈，最终生成完整的 Design Tokens。

### 示例 5：审查 OneSeven 产品

```
/ui-standard 按 OneSeven 品牌方向审查这个 AI 对话工作台
```

OneSeven 模式不会强制不同产品使用同一套尺寸和组件。报告重点包括：

- 品牌基础问题
- 产品内部一致性
- 体验与可用性建议
- Apple Design 参考建议

官网、AI 工具和管理后台可以使用不同的信息密度和布局，只需保持 Logo、字体、紫色点缀方向和体验品质的关联。

## 📖 详细文档

### Visual System（视觉设计系统）

定义了完整的 Design Tokens 体系：
- 颜色系统（主色、语义色、中性色）
- 间距系统（基于 4px 单位）
- 字体系统（字号、行高、字重）
- 圆角、阴影、层级（z-index）
- 组件规范（按钮、输入框、卡片、模态框等）

### Motion Standards（动效规范）

- 弹簧参数标准（Framer Motion 语法）
- 平台降级策略（CSS cubic-bezier 近似）
- 时长速查表（150ms/250ms/400ms）
- 交互反馈完整性清单
- 性能优化原则

### Platform Implementations（平台实现）

为 6 种技术栈提供完整配置模板：
1. React + Tailwind CSS
2. React/Vue + CSS 变量
3. 小程序（微信/支付宝/抖音）
4. Vue + Element Plus / Ant Design Vue
5. 传统页面（HTML + CSS）
6. React Native

### Review Checklist（审查清单）

- 🔴 强制检查项（品牌色、品牌字体、Logo）
- 🟡 推荐检查项（间距、圆角、动效、交互状态）
- 🟢 参考检查项（组件复用、暗色模式、可访问性）
- Before/After 对比表格输出格式

### Interview Workflow（访谈工作流）

5 个阶段建立完整设计系统：
1. 品牌基础访谈（主色、字体、风格定位）
2. 色阶生成与确认
3. 间距和尺寸访谈
4. 动效偏好访谈
5. 生成完整规范

### Extraction Workflow（提取工作流）

5 个步骤从代码反向提取规范：
1. 目标识别
2. 代码分析（颜色、间距、圆角、字体、动效）
3. 规范总结（统计频率、识别异常值）
4. 用户确认
5. 生成规范

## 🎯 设计理念

### 平台无关的 Design Tokens

先定义设计意图（"主色是 #3B82F6"），再转换为各平台实现：
- React + Tailwind: `className="bg-primary-600"`
- CSS 变量: `background: var(--color-primary-600)`
- 小程序: `background: var(--color-primary-600)`
- React Native: `backgroundColor: theme.colors.primary[600]`

### 分级规范体系

- **🔴 强制**：违反会影响品牌识别（品牌色、品牌字体）
- **🟡 推荐**：最佳实践，可有例外（间距、动效时长）
- **🟢 参考**：优化建议，团队自行判断（可访问性、性能）

加载品牌配置后，品牌配置优先于通用数值示例。OneSeven 不会因为局部间距、圆角或断点不同而直接判定违规。

### 动效降级策略

- **现代框架**：使用 Framer Motion 或 Motion One 的真实弹簧
- **受限平台**：使用精心调校的 cubic-bezier 曲线近似
- **目标**：保证设计意图一致，实现方式因地制宜

## 🔧 自定义和扩展

### 修改品牌基础

编辑 `references/visual-system.md` 的"品牌基础层"部分：

```markdown
### 品牌主色

**主色：** #你的颜色

**完整色阶：**
primary: {
  50: '#...',
  // ... 其他色阶
}
```

### 添加新的组件规范

在 `visual-system.md` 的"组件规范"部分添加新组件：

```markdown
### 你的组件名

| 属性 | 规范 |
|------|------|
| 尺寸 | ... |
| 颜色 | ... |
```

### 调整审查清单

编辑 `references/review-checklist.md`，添加或修改检查项。

## 📊 统计信息

- **总行数**：约 3,000 行
- **主文件**：126 行（符合 writing-skills 简洁要求）
- **References**：6 个文件，涵盖视觉、动效、平台、工作流
- **支持平台**：6 种技术栈
- **组件规范**：5 种核心组件（按钮、输入框、卡片、模态框、表格）

## 🤝 贡献指南

这个 skill 是为你的公司定制的。建议：

1. **首次使用后**，将生成的 Design Tokens 提交到 Git，全团队共享
2. **定期审查**，确保规范随业务发展而更新
3. **记录例外**，当某个场景需要突破规范时，记录原因
4. **培训团队**，让所有成员了解如何使用这个 skill

## 📝 许可

本 skill 为公司内部使用工具，不对外分发。

---

**创建时间**：2026-08-10  
**版本**：1.0.0  
**维护者**：前端团队
