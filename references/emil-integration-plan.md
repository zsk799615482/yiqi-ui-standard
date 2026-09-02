# Emil Skills 参考集成方案

**版本**: 1.0.0  
**创建日期**: 2026-09-02  
**来源**: [emilkowalski/skills](https://github.com/emilkowalski/skills) MIT License  
**集成目标**: 强化 yiqi-ui-standard 的动效质量和设计决策能力，同时保持 OneSeven 品牌约束

---

## 执行摘要

**不建议直接依赖 `emilkowalski/skills` 作为外部 skill**，原因如下：

1. **架构冲突**: yiqi-ui-standard 是决策型 skill（强制入口 + 分级执行），Emil skills 是指导型（通用建议）
2. **品牌约束**: Emil 提供通用最佳实践，OneSeven 有明确品牌硬边界，可能产生建议冲突
3. **维护负担**: 需要持续同步更新，处理建议差异

**推荐方案**: **参考集成** — 提炼 Emil 的核心原则和具体数值，融入现有 `references/` 文档体系，作为 OneSeven 规范的底层依据和审查标准。

---

## 核心价值提取

### 从 `emil-design-eng` 提取的核心价值

#### 1. 动效决策框架（直接可用）

| 决策点 | Emil 原则 | OneSeven 适配 |
|---|---|---|
| **是否该动画** | 高频操作（100+ 次/天）不动画 | 同意。CRM 工具栏、键盘快捷操作禁止动画 |
| **Easing 选择** | 进入用 ease-out，移动用 ease-in-out，绝不用 ease-in | 同意。标准模式和展示模式都遵循 |
| **时长范围** | UI 元素 < 300ms，按钮 100-160ms，弹层 150-250ms | 同意。记录到 motion-standards.md |
| **Spring 参数** | 默认 damping 1.0（无弹跳），有动量时 0.8 | 同意。Motion 配方默认值 |

#### 2. 具体数值标准（可直接引用）

```css
/* Emil 推荐的 Cubic Bezier（强化版） */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);

/* 时长标准 */
--duration-press: 160ms;
--duration-tooltip: 125ms;
--duration-dropdown: 200ms;
--duration-modal: 350ms;
```

#### 3. 常见错误检查清单

| 错误模式 | 修复方向 | 严重级别 |
|---|---|---|
| `transition: all` | 指定具体属性 | 🔴 Error |
| `scale(0)` 入场 | 改为 `scale(0.95) + opacity: 0` | 🔴 Error |
| UI 元素使用 `ease-in` | 改为 `ease-out` 或自定义曲线 | 🔴 Error |
| 弹出层 `transform-origin: center` | 改为锚定触发点（模态除外） | 🟡 Warning |
| 键盘操作有动画 | 完全移除动画 | 🔴 Error |
| 时长 > 300ms | 缩短到 150-250ms | 🟡 Warning |

### 从 `apple-design` 提取的核心价值

#### 4. 流体交互原则

| 原则 | 具体要求 | OneSeven 实现路径 |
|---|---|---|
| **响应性** | pointer-down 立即反馈，不等 click | 按钮 `:active` 必须有 `scale(0.97)` |
| **1:1 跟踪** | 拖拽时元素粘在指针，记录抓取偏移 | Showcase 拖拽交互必须实现 |
| **可中断性** | 动画可随时反向，不锁定输入 | 优先 CSS transitions > keyframes |
| **速度交接** | 手势释放后动画继续手指速度 | Motion Spring 传递 velocity |
| **动量投影** | 根据速度预测落点，不只看位置 | 抽屉、卡片组件标准 |

#### 5. 材质与深度

```css
/* Apple 玻璃材质配方 */
.toolbar {
  background: rgba(18, 18, 18, 0.7);  /* OneSeven 暗色适配 */
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 层级规则 */
- 大表面用强模糊（20px+）+ 深阴影
- 小控件用轻模糊（8-12px）+ 浅阴影
- 禁止浅玻璃叠浅玻璃
```

#### 6. Reduced Motion 降级策略

| 原始效果 | Reduced Motion 替代 |
|---|---|
| 滑动、弹簧、视差 | 短透明度 crossfade（200ms） |
| 缩放、旋转、位移 | 仅保留透明度和颜色 |
| 固定叙事、scrub | 立即展开，取消滚动联动 |
| WebGL 3D 场景 | 切换到 Static 预渲染海报 |

### 从 `improve-animations` 提取的核心价值

#### 7. 审查工作流

```
1. Recon（侦察）
   - 识别技术栈、动效库、已有 Token
   - 绘制频率地图（高频/偶尔/罕见）
   
2. Audit（审计）
   - 按 8 个类别并行审查
   - 记录 file:line + 证据
   
3. Vet（验证）
   - 复查代码，排除误报和设计意图
   - 按影响/工作量排序
   
4. Plan（计划）
   - 输出自包含实现计划
   - 包含精确值、验证步骤、感受检查
```

---

## 集成实施方案

### 方案 A：增强现有文档（推荐，立即执行）

**目标**: 将 Emil 的数值标准和检查清单融入现有 `references/` 文档

#### 步骤 1：更新 `motion-standards.md`

**新增章节**:

1. **动效决策树**（从 Emil 的 4 步框架改编）
2. **精确数值标准**（引入 Emil 的 cubic-bezier 和时长表）
3. **常见错误模式**（Emil 的 Review Checklist 改编为 OneSeven 分级）
4. **Spring 配置指南**（Apple 的 damping + response 映射到 Motion API）

**保留 OneSeven 约束**:
- 品牌紫 `#9A6ABA` 的强调用法
- 36px 连续圆角卡片
- Alibaba PuHuiTi 排版节奏
- 标准模式默认不使用弹簧（展示模式可选）

#### 步骤 2：更新 `review-checklist.md`

**新增审查维度**:

```markdown
## 2. 动效与交互质量

### 2.1 Easing 与时长（🔴 强制）

| 检查项 | 错误示例 | 修复目标 |
|---|---|---|
| UI 元素使用 ease-in | `transition: transform 300ms ease-in` | `cubic-bezier(0.23, 1, 0.32, 1)` |
| 入场动画从 scale(0) | `@starting-style { transform: scale(0); }` | `scale(0.95); opacity: 0;` |
| 时长超过 300ms | `transition: all 500ms` | 按钮 160ms，弹层 200ms，模态 350ms |
| 使用 transition: all | `transition: all 200ms` | 指定 `transform, opacity` |

### 2.2 交互响应性（🟡 推荐）

| 检查项 | 当前状态 | 改进方向 |
|---|---|---|
| 按钮无 :active 状态 | 点击无反馈 | 添加 `scale(0.97)` 100-160ms |
| 弹出层从中心缩放 | `transform-origin: center` | 锚定触发点（模态除外） |
| 工具提示无即时模式 | 每次都延迟 | 首次延迟，后续立即 + 无动画 |

### 2.3 可访问性（🔴 强制）

- `prefers-reduced-motion: reduce` 必须移除位移、缩放，保留透明度
- `prefers-reduced-transparency: reduce` 必须提供实体回退
- 键盘快捷操作和命令面板切换禁止任何动画
```

#### 步骤 3：新增 `references/animation-craft.md`

**内容结构**:

```markdown
# 动效工艺标准

本文档融合 Emil Kowalski 的设计工程哲学和 Apple 的流体交互原则，
作为 OneSeven 动效实现的底层依据。

## 一、核心哲学

1. 品味可训练
2. 不可见细节的复合效应
3. 美是杠杆

## 二、决策框架

[引入 Emil 的 4 步决策树 + OneSeven 产品类型校准]

## 三、精确数值

[引入 cubic-bezier、时长表、Spring 配置]

## 四、CSS Transform 精通

[引入 translateY(100%)、clip-path、@starting-style]

## 五、手势与拖拽

[引入速度交接、动量投影、橡皮筋边界]

## 六、性能规则

[只动画 transform 和 opacity、CSS 变量继承成本、WAAPI]

## 七、Apple 材质系统

[玻璃材质配方 + 层级规则 + OneSeven 暗色适配]

## 八、降级策略

[Reduced Motion / Transparency / Contrast 三重响应]
```

**关键**: 每个原则后面都附上 "OneSeven 约束"，说明哪些情况下品牌硬规则优先。

### 方案 B：建立审查子 Agent（中期，3-6 个月）

**目标**: 创建一个专门的动效审查 Agent，使用 Emil 的工作流

**实现路径**:

1. 在 `agents/` 下新增 `animation-auditor.yaml`
2. Agent 流程：
   - Phase 1: Recon（识别栈、Token、频率）
   - Phase 2: Audit（8 维度并行检查）
   - Phase 3: Vet（按 OneSeven 分级过滤）
   - Phase 4: Report（五段式报告 + 优先级表）

**触发时机**:
- 用户调用 `/yiqi-ui-standard` 审查模式
- 自动识别需要动效深度审查的场景

**输出格式**:
```markdown
## OneSeven 动效审查报告

### 品牌基础问题（🔴 强制）
[ease-in、scale(0)、transition: all 等 Emil 清单]

### 产品内部一致性（🟡 推荐）
[Token 未复用、时长不统一]

### 体验与可用性建议（🟢 参考）
[Emil 的按钮反馈、工具提示即时模式]

### Apple Design 参考（🟢 参考）
[速度交接、材质层级、可中断性]

### 做得好的地方
[...]
```

### 方案 C：展示模式专用增强（立即执行，配合方案 A）

**目标**: 在 `showcase-mode.md` 中明确引入 Apple 流体交互标准

**新增章节**:

```markdown
## 流体交互要求

展示模式的拖拽、手势、弹簧动画必须符合 Apple 流体交互标准：

### 1. 响应性
- `:active` 状态必须在 pointer-down 立即触发
- 拖拽元素必须 1:1 跟踪指针，记录抓取偏移

### 2. 可中断性
- 所有动画可随时反向，不锁定输入
- 优先使用 Motion Spring，避免 CSS keyframes

### 3. 速度交接
```js
// 手势释放时传递速度给 Spring
animate(element, 
  { y: targetY },
  { 
    type: 'spring',
    bounce: 0.2,
    duration: 0.4,
    velocity: releaseVelocity  // px/s
  }
);
```

### 4. 动量投影
```js
// Apple 的投影函数
function project(velocity, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

const projected = currentY + project(releaseVelocity);
const target = nearestSnapPoint(projected);
```

### 5. 橡皮筋边界
```js
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / 
         (dimension + constant * Math.abs(overshoot));
}
```

### 验收要求

Full 和 Lite 档都必须通过：
- 拖拽中途反向无跳变
- 快速滑动能触发动量投影
- 边界有渐进阻力，不硬停
- Reduced Motion 时切换到短 Crossfade
```

---

## 具体执行计划

### 阶段 1：立即执行（本周完成）

**优先级 P0**:

1. ✅ 创建 `references/emil-integration-plan.md`（本文件）
2. 🔲 更新 `references/motion-standards.md`
   - 新增 "动效决策树" 章节
   - 新增 "精确数值标准" 章节（Emil 的 cubic-bezier）
   - 新增 "常见错误模式" 表格
3. 🔲 更新 `references/review-checklist.md`
   - 在第 2 节插入 "动效与交互质量" 子节
   - 引入 Emil 的 Review Checklist 作为检查项
4. 🔲 更新 `references/showcase-mode.md`
   - 新增 "流体交互要求" 章节
   - 引入 Apple 的 5 个核心原则（响应、1:1、可中断、速度、动量）

### 阶段 2：中期补充（1-2 周）

**优先级 P1**:

5. 🔲 创建 `references/animation-craft.md`
   - 完整融合 Emil + Apple 的原则
   - 每个原则附 OneSeven 品牌约束说明
6. 🔲 更新 `design-tokens.json`
   - 新增 `motion.easing` 节点（Emil 的 cubic-bezier）
   - 新增 `motion.duration` 节点（按组件类型分级）
7. 🔲 更新 `theme.css`
   - 新增动效 CSS 变量映射

### 阶段 3：工具链增强（1-3 个月）

**优先级 P2**:

8. 🔲 增强 `scripts/validate-generated-web.mjs`
   - 新增动效静态检查：`ease-in` 检测、`scale(0)` 检测、时长超标
9. 🔲 创建 `agents/animation-auditor.yaml`
   - 实现 Emil 的 4 阶段审查工作流
10. 🔲 更新 `tests/evals/` 
    - 新增动效回归用例（错误 easing、错误 origin、缺失 reduced-motion）

---

## 参考集成后的边界

### 1. 动效相关 Skills

**处理**: 不复制完整 skill；原则已内化到 `animation-craft.md`、`motion-standards.md`、`review-checklist.md`，并由 Yiqi 内部路由统一输出。

**边界**: `animate`、`review-animations`、`improve-animations` 和 `find-animation-opportunities` 只作为方法来源，不成为外部运行时依赖。

### 2. `pick-ui-library` Skill

**处理**: 吸收其任务优先、先查已有依赖、原生优先、单一推荐、许可证/无障碍/性能检查和不自动安装的方法，落入 `library-selection.md` 与 `library-catalog.json`。

**边界**: `library-catalog.json` 管理 Toast、Dialog、Chart、Virtualization 等通用工程能力；`showcase-catalog.json` 继续管理 Motion、Three.js、Liquid Glass 和 GSAP，两者不得合并。

### 3. `animation-vocabulary` Skill

**原因**: 这是术语反查工具，不是设计规范。

**处理**: 不进入主流程；只有用户明确询问动效术语时才参考。

### 4. Expo / Swift 相关 Skills

**原因**: yiqi-ui-standard 当前只覆盖 Web、小程序、React Native Web，不包含原生 iOS。

**未来**: 如果扩展到原生平台，可重新评估。

---

## 验收标准

### 阶段 1 完成标志

- [ ] `motion-standards.md` 包含 Emil 的 cubic-bezier 和时长表
- [ ] `review-checklist.md` 新增"动效与交互质量"检查维度
- [ ] `showcase-mode.md` 新增"流体交互要求"章节
- [ ] 运行 `node --test tests/*.test.mjs` 全部通过
- [ ] 使用更新后的规范审查一个真实展示模式页面，输出报告符合新格式

### 阶段 2 完成标志

- [ ] `animation-craft.md` 文档完整，每个原则有 OneSeven 约束说明
- [ ] `design-tokens.json` 新增 `motion.*` 节点
- [ ] `theme.css` 新增 `--ease-*` 和 `--duration-*` 变量
- [ ] 更新 VERSION 到 3.2.0（包含 AI 组件与发现来源层）

### 阶段 3 完成标志

- [ ] 静态校验器能检测出 `ease-in`、`scale(0)`、`transition: all`
- [ ] 动效审查 Agent 能输出符合五段式的报告
- [ ] 测试覆盖率包含动效回归用例

---

## 维护说明

1. **定期同步**: 每 6 个月检查 `emilkowalski/skills` 的更新，评估是否需要更新集成文档
2. **冲突处理**: 当 Emil 建议与 OneSeven 品牌约束冲突时，优先 OneSeven，并在文档中注明原因
3. **社区反馈**: 如果发现 Emil 的某个原则在 OneSeven 项目中不适用，在 `animation-craft.md` 中显式标注例外

---

## 附录：快速参考

### Emil 推荐的 Easing 曲线

```css
/* 强化版 Cubic Bezier */
--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

### Apple 推荐的 Spring 配置

```js
// 默认 UI（无弹跳）
{ type: 'spring', damping: 1.0, response: 0.4 }

// 动量交互（轻微弹跳）
{ type: 'spring', damping: 0.8, response: 0.3 }

// Motion API 等价
{ type: 'spring', bounce: 0, duration: 0.4 }      // damping 1.0
{ type: 'spring', bounce: 0.2, duration: 0.4 }    // damping 0.8
```

### 时长标准表

| 组件 | Emil 推荐 | OneSeven 采用 |
|---|---|---|
| 按钮按压 | 100-160ms | 160ms |
| 工具提示 | 125-200ms | 125ms |
| 下拉菜单 | 150-250ms | 200ms |
| 模态/抽屉 | 200-500ms | 350ms |
| Showcase 叙事 | 可更长 | 视内容而定 |

---

**文档结束**
