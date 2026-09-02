# Yiqi UI Standard 参考集成设计

**日期：** 2026-09-02  
**状态：** 已获方案批准，待 spec review  
**来源：** `emilkowalski/skills`，参考快照 `d23d7f8`，MIT License  

## 目标

在不直接安装或复制 `emilkowalski/skills` 的前提下，将其中稳定、可迁移的设计判断内化到 `yiqi-ui-standard`，强化动效质量、依赖选择、来源治理和验证能力，同时保持 OneSeven 品牌规范为最终约束。

## 非目标

- 不把外部仓库作为运行时依赖。
- 不复制外部仓库的完整 `SKILL.md` 或固定库名单。
- 不自动安装、升级或替换业务项目依赖。
- 不让通用 Emil / Apple 建议覆盖用户明确要求、可访问性或已批准的项目设计系统。
- 不把普通工程依赖目录和 Showcase 高级视觉目录合并。

## 设计原则

1. `yiqi-ui-standard` 是唯一总入口和规范权威。
2. 外部 skill 只作为参考来源，提取方法、判断框架和可审计数值。
3. 规则先判断产品任务和使用频率，再判断视觉表现。
4. 原生能力或项目已有依赖优先于新增库。
5. 第三方库只提供行为、运行时或算法，不决定 OneSeven 的视觉身份。
6. 每项引入都必须可解释、可降级、可回退、可验证。

## 规则优先级

```text
安全性与可访问性
> 用户明确要求
> 项目现有设计系统与依赖
> Yiqi / OneSeven 规则
> 产品类型与页面任务
> Emil / Apple 通用建议
> 第三方库默认行为
```

例如，项目已经使用 Radix 或其他等价 primitive 时，不因为 `pick-ui-library` 推荐 Base UI 而迁移；用户明确关闭动画时，不继续套用动效建议；`prefers-reduced-motion` 始终覆盖 Showcase 效果。

## 分层架构

```text
Yiqi 总入口
├── 规范层
│   ├── OneSeven 品牌与产品画像
│   ├── animation-craft.md
│   └── library-selection.md
├── 专项工作流层
│   ├── 动效构建
│   ├── 动效审查
│   ├── 动效审计
│   ├── 动效机会发现
│   └── 依赖选择
├── 来源目录层
│   ├── showcase-catalog.json（高级视觉）
│   ├── library-catalog.json（通用工程依赖）
│   └── external-source-map.json（来源账本）
└── 验证层
    ├── 页面质量校验
    ├── 动效审计
    ├── 依赖边界测试
    └── 浏览器与降级验收
```

## 动效参考集成

新增 `references/animation-craft.md`，作为动效原则的单一事实来源。文档必须包含：

- 动画存在性决策：频率、目的、操作风险和理解收益。
- easing：进入使用强 ease-out，屏内移动使用 ease-in-out，UI 进入不得使用 ease-in。
- duration：按钮、Tooltip、Dropdown、Modal/Drawer 和 Showcase 叙事的语义化范围。
- 反模式：`transition: all`、`scale(0)` 入场、布局属性位移、不可中断 keyframes。
- Apple 流体交互：pointer-down 反馈、1:1 跟手、可中断、速度交接、动量投影。
- reduced motion、reduced transparency、粗指针和低性能环境降级。
- Standard 与 Showcase 的例外：Standard 以效率为先，Showcase 才可使用较重的空间和叙事效果。
- 每项通用建议对应的 OneSeven 约束和明确例外。

`motion-standards.md`、`review-checklist.md` 和 `showcase-mode.md` 改为引用该文件中的规范，避免同一数值在多个文件中漂移。

## 通用库选择集成

新增 `references/library-selection.md` 和 `references/library-catalog.json`。该层只处理完成产品功能所需的通用工程依赖，例如 Dialog、Toast、Command Menu、Chart、Drag and Drop、Virtualization、Number Animation、State 和样式工具。

### 选择流程

代码实现阶段，在确认技术栈后执行：

```text
识别功能任务
→ 检查 package.json 与项目现有设计系统
→ 判断原生能力是否足够
→ 过滤技术栈不匹配项
→ 检查许可证、无障碍、性能和 SSR/移动端风险
→ 只给一个首选方案
→ 给出不迁移理由与无库回退方案
→ 用户明确要求时才安装
```

### 目录字段

每个候选至少包含：

```json
{
  "id": "toast",
  "task": "toast",
  "name": "Sonner",
  "supportedStacks": ["react"],
  "licenseClass": "permissive",
  "whenToUse": [],
  "whenNotToUse": [],
  "accessibility": "requires-verification",
  "performance": "light",
  "brandRule": "只使用行为和 API，不复制供应商视觉",
  "fallback": "使用项目现有通知系统或原生状态提示"
}
```

版本、许可证和维护状态在实际项目实现时重新核验。目录中的推荐不构成永久版本承诺。

### 与 Showcase 目录的边界

`showcase-catalog.json` 继续只管理 Motion、Three.js、Liquid Glass、GSAP 等高级视觉效果；`library-catalog.json` 不包含这些效果运行时。Standard 页面不得因为通用库目录存在而加载 Showcase 重型依赖。

## Yiqi 入口路由

在 `SKILL.md` 的代码实现阶段增加“依赖选择”步骤，在动效相关请求中增加以下内部路由：

| 用户意图 | 内部模式 | 输出重点 |
|---|---|---|
| 给组件加动效 | 动效构建 | 是否需要动画、精确曲线、时长、降级 |
| 审查已有动画 | 动效审查 | Before/After、位置、严重级别、证据 |
| 审计整个项目 | 动效审计 | Recon → Audit → Vet → Plan |
| 寻找动效机会 | 动效机会 | 最多 5–7 个高置信建议，并说明不动画项 |
| 选择工程依赖 | 依赖选择 | 当前依赖检查、单一推荐、许可证和回退 |

所有路由仍遵守 Yiqi 的品牌入口、产品画像、页面任务、中文输出和最终验收契约。

## 验证设计

### 动效审计器

新增只读脚本 `scripts/audit-motion.mjs`，输出机器可读和 Markdown 可读结果。首版检测：

- UI 进入使用 `ease-in`。
- 进入动画从 `scale(0)` 开始。
- 使用 `transition: all`。
- UI 动画超过语义化时长上限。
- 用 `top`、`left`、`width`、`height` 做可替代的位移动画。
- 动效缺少 `prefers-reduced-motion`。
- Popover 错误使用中心 transform origin。
- Hover 动效未限制在精细指针环境。

允许有理由的豁免，格式为：

```css
/* yiqi-motion: allow duration reason="marketing narrative" */
```

报告必须保留豁免原因，不能静默忽略。

### 测试

新增 `tests/motion-audit.test.mjs` 和有效/无效 fixture；增加库选择测试，覆盖：

- 已有等价依赖时不推荐替换。
- 技术栈不匹配时拒绝候选。
- 许可证不明确时不自动选择。
- Standard 模式拒绝 Showcase 重型依赖。
- 推荐结果包含回退方案。
- 选择过程不修改用户项目依赖。

现有 Showcase、生成质量和页面校验测试必须保持通过。

## 来源治理

新增 `references/external-source-map.json`，记录：

- 来源仓库和 commit。
- 许可证及核验日期。
- 已内化的 skill 和具体主题。
- 明确排除的内容。
- 与 OneSeven 冲突时的处理。
- 下次复核日期。

首条记录使用：

```json
{
  "source": "emilkowalski/skills",
  "commit": "d23d7f8",
  "license": "MIT",
  "reviewed": "2026-09-02",
  "nextReview": "2027-03-02"
}
```

## 文件职责

### 新增

- `references/animation-craft.md`：动效原则和数值的唯一来源。
- `references/library-selection.md`：通用依赖选择方法和输出契约。
- `references/library-catalog.json`：按功能和技术栈组织的候选库元数据。
- `references/external-source-map.json`：外部来源、许可证和内化范围账本。
- `scripts/audit-motion.mjs`：只读动效反模式审计器。
- `tests/motion-audit.test.mjs`：动效审计回归测试。
- `tests/fixtures/motion-valid.css`、`tests/fixtures/motion-invalid.css`：审计 fixture。

### 修改

- `SKILL.md`：增加依赖选择和动效专项路由。
- `references/motion-standards.md`：引用 `animation-craft.md`，消除重复规则。
- `references/review-checklist.md`：引用统一动效标准，保留 Yiqi 五段式输出。
- `references/showcase-mode.md`：明确其与通用库选择层的边界。
- `design-tokens.json`、`theme.css`：补齐语义化 motion tokens。
- `README.md`：说明参考集成、目录边界和来源治理。
- `VERSION`：基础参考集成完成后为 `3.1.0`；本次新增 AI 组件与发现来源层后升至 `3.2.0`。

## 分阶段交付

### Phase 1：规范核心

完成 `animation-craft.md`、`library-selection.md`，清理重复规则，修正历史缺失引用。

### Phase 2：目录与路由

完成 `library-catalog.json`、来源账本和 `SKILL.md` 路由；不执行自动安装。

### Phase 3：工具与测试

完成动效审计器、fixture、库选择边界测试和现有测试回归。

### Phase 4：发布准备

更新 README、版本号和维护说明，运行全套 Node 测试及必要的浏览器验收。

## 完成门槛

- 未复制或安装外部仓库 skill。
- 动效原则只有一个权威来源。
- 通用库目录与 Showcase 目录职责不重叠。
- 已有依赖不会被无理由替换。
- 动效审计器能捕获首版反模式并支持可审计豁免。
- Standard / Showcase 依赖边界测试通过。
- 外部来源均有版本、许可证和复核日期。
- `node --test tests/*.test.mjs` 全部通过。
