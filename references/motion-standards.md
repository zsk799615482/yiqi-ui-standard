# 动效和交互规范

本文档定义 OneSeven 跨产品共享的动效意图。整体节奏柔和舒缓，适当使用过渡与等待动效；具体实现服从任务效率、平台能力和产品信息密度。

---

## 核心动效原则

> 本节执行 `animation-craft.md` 的统一规则；本文保留平台配方、具体代码示例和历史兼容说明。

### 1. 所有交互必须有视觉反馈

用户的每一个操作都应该得到即时的视觉响应，让用户明确知道"系统收到了我的指令"。

**关键原则**：反馈必须在 **pointer-down 时立即触发**，不能等到 click 或 touch-up。等待释放才反馈会让界面感觉迟钝和失去连接。

**反馈类型：**
- **即时反馈**：按钮点击的颜色变化、缩放效果（必须在按下瞬间）
- **进行中反馈**：加载 spinner、进度条、骨架屏
- **完成反馈**：成功提示、错误提示、Toast 消息

**反例（❌ 避免）：**
- 点击按钮后没有任何变化，用户不知道是否点击成功
- 按钮只在 `:hover` 有反馈，`:active` 无变化
- 提交表单后页面静止不动，用户不确定是否在处理
- 删除操作没有确认提示，用户误操作后无法撤销

### 2. 根据交互目的选择弹簧或固定时长

**适合使用弹簧：**
- 弹簧动效是**行为驱动**的，而非时间驱动
- 可以中途打断并自然过渡到新状态
- 更接近物理世界的运动规律，感觉更自然

抽屉、浮层、拖拽等具有空间关系或直接操控的组件可以使用轻微弹性。按钮、颜色、透明度、Tooltip 和等待反馈优先使用克制的固定时长或无弹性弹簧。

### 3. 可中断性（最重要原则）

用户应该能够随时打断正在进行的动画，系统立即响应新的输入。

**示例场景：**
- 抽屉正在关闭（50% 进度），用户再次点击打开 → 抽屉应该从当前位置反向运动，而非先完成关闭再打开
- 模态框正在淡入，用户点击背景关闭 → 立即开始淡出，继承当前的透明度和速度

**实现要点：**
- 使用 JavaScript 动画库（Framer Motion, Motion One, GSAP）
- 避免使用 CSS animation（无法中断）
- 使用 CSS transition 时要注意状态切换的连续性

### 4. 尊重用户的无障碍偏好

始终尊重 `prefers-reduced-motion` 媒体查询，为有前庭障碍的用户提供低运动量体验。减少运动不意味着零反馈——意味着更温和、非前庭的等效。保留有助于理解状态的短淡入淡出。

**全局处理方案：**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 120ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 120ms !important;
    scroll-behavior: auto !important;
  }

  /* 移除位移动画，保留透明度 */
  [data-motion="spatial"] {
    transform: none !important;
  }
}
```

**降级策略（Apple 三重响应）：**

| 媒体查询 | 移除 | 保留 |
|---|---|---|
| `prefers-reduced-motion: reduce` | 滑动、弹簧、视差、缩放 | 短 crossfade、颜色变化 |
| `prefers-reduced-transparency: reduce` | 玻璃材质、blur | 实体背景、更高不透明度 |
| `prefers-contrast: more` | 半透明表面 | 实体背景 + 对比边框 |

**示例：**
```css
.sheet {
  transition: transform 400ms var(--ease-drawer), opacity 400ms;
}

@media (prefers-reduced-motion: reduce) {
  .sheet {
    /* 只保留透明度，移除位移 */
    transition: opacity 200ms ease;
    transform: none !important;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .toolbar {
    background: rgb(18, 18, 18); /* 实体而非半透明 */
    backdrop-filter: none;
  }
}
```

**注意：** 不要移除加载进度、完成、警告和错误反馈。减少动态效果时，用短淡入淡出替代大幅位移、弹性和循环缩放。

### 5. 等待动效表达真实进度

- 短暂且不可测的等待使用品牌紫 Spinner，不立即覆盖整个页面
- 内容区域加载优先使用与最终结构接近的中性骨架屏
- 可测任务使用进度条和明确的百分比或步骤
- 超过预期时间时解释正在处理什么，并提供取消、后台运行或重试能力
- 不使用持续跳动、快速闪烁、大面积渐变扫光或与真实进度无关的装饰循环
- 成功和失败必须有文字反馈，不能只改变颜色

---

## 动效决策框架

在编写任何动画代码之前，按以下顺序回答这些问题：

### 步骤 1：是否该动画？

**问：用户会多频繁看到这个动画？**

| 频率 | 决策 | 示例 |
|---|---|---|
| 100+ 次/天 | **绝不动画** | 键盘快捷键、命令面板切换、列表导航 |
| 数十次/天 | 移除或大幅缩短 | 悬停效果、工具栏交互 |
| 偶尔 | 标准动画 | 模态框、抽屉、Toast |
| 罕见/首次 | 可以增加愉悦感 | 引导、庆祝动效 |

**关键规则**：
- **绝不为键盘操作添加动画**。Raycast 没有打开/关闭动画，这是最佳体验。
- **高频操作延迟的复合效应**：300ms 的动画 × 100 次/天 = 30 秒浪费。

### 步骤 2：动画的目的是什么？

每个动画必须有清晰的回答："为什么这个要动画？"

**有效目的**：
- **空间一致性**：Toast 从同一方向进入和退出，让滑动关闭更直观
- **状态指示**：按钮形态变化显示状态转换
- **解释说明**：营销页动画展示功能如何工作
- **反馈确认**：按钮按下缩放，确认界面收到指令
- **防止突兀变化**：元素出现/消失无过渡会感觉破碎

**无效目的**：
- "看起来很酷"，但用户会频繁看到 → **不要动画**

### 步骤 3：使用什么 Easing？

**决策树**：

```
元素是进入还是退出？
  是 → ease-out（快速启动，响应迅速）
  否 →
    在屏幕上移动/变形？
      是 → ease-in-out（自然加速/减速）
    悬停/颜色变化？
      是 → ease（标准缓动）
    持续运动（跑马灯、进度条）？
      是 → linear（匀速）
    默认 → ease-out
```

**关键：使用自定义 easing 曲线。** 内置 CSS easing 太弱，缺乏让动画感觉有意图的冲击力。

```css
/* 强化版 Cubic Bezier（来自 Emil Kowalski） */
--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);  /* iOS 抽屉曲线 */
```

**绝不在 UI 动画中使用 ease-in**。它启动缓慢，让界面感觉迟钝和不响应。一个 300ms `ease-in` 的下拉菜单**感觉**比 300ms `ease-out` 更慢，因为 ease-in 延迟了初始移动——而这正是用户最关注的时刻。

**Easing 曲线资源**：不要从零创建。使用 [easing.dev](https://easing.dev/) 或 [easings.co](https://easings.co/) 找到标准 easing 的强化变体。

### 步骤 4：速度应该多快？

| 元素 | 时长 |
|---|---|
| 按钮按压反馈 | 100-160ms |
| 工具提示、小弹出层 | 125-200ms |
| 下拉菜单、选择器 | 150-250ms |
| 模态框、抽屉 | 200-500ms |
| 营销/说明性动画 | 可以更长 |

**规则：UI 动画应保持在 300ms 以下。** 180ms 的下拉菜单比 400ms 更响应。快速旋转的 spinner 让应用感觉加载更快，即使加载时间相同。

### 感知性能

动画速度不仅关乎敏捷感——它直接影响用户如何感知应用性能：

- **快速旋转的 spinner** 让加载感觉更快（相同加载时间，不同感知）
- **180ms 选择器**动画比 **400ms** 感觉更响应
- **第一个工具提示后立即显示**（跳过延迟 + 跳过动画）让整个工具栏感觉更快

感知速度与实际速度同样重要。Easing 放大了这一点：200ms `ease-out` **感觉**比 200ms `ease-in` 更快，因为用户看到立即的移动。

---

## 弹簧动画（Spring Animations）

## 弹簧动画（Spring Animations）

弹簧比基于时长的动画感觉更自然，因为它们模拟真实物理。它们没有固定时长——根据物理参数自然稳定。

### 何时使用弹簧

- 带动量的拖拽交互
- 应该感觉"有生命"的元素（如 Apple 的灵动岛）
- 可以中途打断的手势
- 装饰性鼠标跟踪交互

### 基于弹簧的鼠标交互

将视觉变化直接绑定到鼠标位置会感觉生硬，因为缺少运动。使用 Motion 的 `useSpring` 让数值变化具有弹簧行为，而不是立即更新。

```jsx
import { useSpring } from 'motion/react';

// 没有弹簧：感觉生硬，即时
const rotation = mouseX * 0.1;

// 有弹簧：感觉自然，有动量
const springRotation = useSpring(mouseX * 0.1, {
  stiffness: 100,
  damping: 10,
});
```

这有效是因为动画是**装饰性的**——不服务于功能。如果这是银行应用中的功能图表，不动画会更好。要知道装饰何时有帮助，何时阻碍。

### 弹簧配置（Apple 推荐）

**Apple 方法（推荐——更易理解）：**

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
```

**传统物理参数（更精确控制）：**

```js
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

使用 bounce 时保持微妙（0.1-0.3）。在大多数 UI 上下文中避免 bounce。用于拖拽关闭和俏皮交互。

### 可中断性优势

弹簧在被打断时保持速度——CSS 动画和 keyframes 从零重启。这让弹簧成为用户可能中途改变的手势的理想选择。当你点击展开的项目并快速按 Escape，基于弹簧的动画会从当前位置平滑反向。

## 弹簧参数标准（设计意图层）

### 标准弹簧配置表

以下标准使用 Motion/Framer Motion 的弹簧参数定义。这是**设计意图层**的规范，描述"我们希望动效有什么感觉"。

| 交互类型 | Spring 配置 | 说明 | 适用场景 |
|---------|------------|------|---------|
| **按钮点击反馈** | `{ type: "spring", duration: 0.16, bounce: 0 }` | 及时、无弹跳（Emil 推荐 160ms） | 所有按钮、链接、可点击卡片 |
| **Tooltip 进入** | `{ type: "spring", duration: 0.125, bounce: 0 }` | 快速出现，不喧宾夺主（Emil 推荐 125ms） | Tooltip、提示 |
| **下拉菜单展开** | `{ type: "spring", duration: 0.2, bounce: 0 }` | 柔和展开，无弹性（Emil 推荐 200ms） | Dropdown、Select、Popover |
| **模态框进入** | `{ type: "spring", duration: 0.35, bounce: 0.1 }` | 轻微弹性，建立空间层级（Emil 推荐 350ms） | Modal、Dialog、Alert |
| **抽屉滑出** | `{ type: "spring", duration: 0.4, bounce: 0.2 }` | Apple 动量交互配置 | Drawer、Sidebar、Sheet |
| **页面切换** | `{ type: "spring", duration: 0.5, bounce: 0 }` | 平滑过渡，不打断阅读节奏 | 路由切换、Tab 切换 |
| **拖拽跟随** | `{ type: "spring", stiffness: 300, damping: 20 }` | 高响应，紧跟鼠标/手指 | 拖拽排序、滑块、拖动手柄 |
| **悬停反馈** | `{ type: "spring", duration: 0.2, bounce: 0 }` | 轻微位移或明度变化 | 可点击卡片、图标按钮 |

**重要更新**：时长已根据 Emil Kowalski 的经验值调整，倾向于更快速的响应。OneSeven 默认使用无弹跳（bounce: 0）的临界阻尼配置，只在有动量的交互中使用轻微弹跳。

### 弹簧参数解释

**duration（推荐用法）：**
- 设计友好的参数，表示"大约多久到达目标"
- 单位：秒（如 0.4 表示 400ms）
- 适合大多数场景

**bounce（弹跳量）：**
- 范围：0（无弹跳）到 1（强烈弹跳）
- `0`：临界阻尼，无超调
- `0.1`：轻微弹性，专业感
- `0.25`：明显弹性，活泼感
- `0.5+`：强烈弹跳，俏皮感（谨慎使用）

**stiffness（弹簧刚度）和 damping（阻尼）：**
- 物理参数，更精确但更复杂
- `stiffness` 越高，弹簧越"硬"，响应越快
- `damping` 越高，阻力越大，越快稳定
- 典型值：`stiffness: 300, damping: 20`（跟随类交互）

---

## 平台降级策略

由于小程序和传统页面无法使用 JavaScript 弹簧库，需要使用 CSS 动画降级。

### 现代框架（React/Vue）- 使用真实弹簧

**Framer Motion 实现：**
```jsx
import { motion } from 'framer-motion';

// 模态框进入
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
>
  模态框内容
</motion.div>

// 按钮点击反馈
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", duration: 0.2, bounce: 0 }}
>
  点击我
</motion.button>

// 悬停放大
<motion.div
  whileHover={{ y: -1 }}
  transition={{ type: "spring", duration: 0.2, bounce: 0 }}
>
  卡片内容
</motion.div>
```

**Motion One 实现（轻量替代）：**
```javascript
import { animate, spring } from 'motion';

// 模态框进入
animate(
  '.modal',
  { opacity: [0, 1], y: [20, 0] },
  { easing: spring({ duration: 0.5, bounce: 0.1 }) }
);

// 按钮点击
button.addEventListener('click', () => {
  animate(
    button,
    { scale: [1, 0.95, 1] },
    { easing: spring({ duration: 0.2 }) }
  );
});
```

### 小程序/传统页面 - CSS 近似曲线

无法使用真实弹簧时，使用精心调校的 cubic-bezier 曲线近似弹簧效果。

**标准 Easing 曲线库（Emil Kowalski 强化版）：**

```css
/* === 进入动画（ease-out 类）=== */

/* 强化快速进入 - 对应 bounce: 0, duration: 0.2 */
--ease-out-quick: cubic-bezier(0.23, 1, 0.32, 1);

/* 强化流畅进入 - 对应 bounce: 0, duration: 0.3-0.5 */
--ease-out-smooth: cubic-bezier(0.32, 0.72, 0, 1);

/* 弹性进入 - 对应 bounce: 0.1, duration: 0.5-0.6 */
--ease-out-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);


/* === 退出动画（ease-in 类）=== */

/* 快速退出 */
--ease-in-quick: cubic-bezier(0.68, -0.55, 0.77, 0);

/* 流畅退出 */
--ease-in-smooth: cubic-bezier(0.32, 0, 0.67, 0);


/* === 位置移动（ease-in-out 类）=== */

/* 强化标准移动 - 对应抽屉、页面切换 */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);

/* iOS 抽屉曲线（来自 Ionic Framework，Apple Design） */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

**重要提示**：这些曲线经过 Emil Kowalski 和 Apple 实际产品验证，比内置 CSS easing（`ease`、`ease-out`）有更强的冲击力和意图感。来源：[easing.dev](https://easing.dev/)、[easings.co](https://easings.co/)。

**小程序实现示例：**

```css
/* 模态框进入 */
.modal-enter {
  animation: modal-in 500ms var(--ease-out-bounce) forwards;
}

.modal-exit {
  animation: modal-out 300ms var(--ease-in-smooth) forwards;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modal-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* 按钮点击反馈（小程序） */
.button-active {
  transition: transform 200ms var(--ease-out-quick);
  transform: scale(0.95);
}
```

**传统页面实现示例：**

```css
/* 使用 CSS 自定义属性定义 easing */
:root {
  --ease-out-quick: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-out-smooth: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-out-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in-smooth: cubic-bezier(0.32, 0, 0.67, 0);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

/* 下拉菜单 */
.dropdown {
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 300ms var(--ease-out-smooth),
              transform 300ms var(--ease-out-smooth);
}

.dropdown.is-open {
  opacity: 1;
  transform: translateY(0);
}

/* 按钮悬停 */
.button {
  transition: transform 200ms var(--ease-out-quick),
              background 200ms var(--ease-out-quick);
}

.button:hover {
  transform: translateY(-1px);
  background: var(--color-primary-700);
}

.button:active {
  transform: scale(0.98);
}
```

---

## 时长速查表（无法使用弹簧时）

当完全无法使用 JavaScript 动画，只能用 CSS transition/animation 时，参考以下时长标准。

**时长已根据 Emil Kowalski 的实战经验优化，倾向于更快速的响应。**

| 元素类型 | 时长 | Easing | 说明 |
|---------|------|--------|------|
| **按钮反馈** | 160ms | `cubic-bezier(0.23, 1, 0.32, 1)` | 及时响应，不拖沓（Emil 推荐） |
| **Tooltip** | 125-200ms | `cubic-bezier(0.23, 1, 0.32, 1)` | 轻快出现（首次延迟，后续立即） |
| **下拉菜单** | 200ms | `cubic-bezier(0.32, 0.72, 0, 1)` | 柔和展开 |
| **模态框进入** | 350ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 建立层级，轻微弹性 |
| **模态框退出** | 250ms | `cubic-bezier(0.32, 0, 0.67, 0)` | 比进入更快（非对称时长） |
| **抽屉滑出** | 400ms | `cubic-bezier(0.32, 0.72, 0, 1)` | 大面积移动，柔和连续 |
| **抽屉收回** | 300ms | `cubic-bezier(0.32, 0, 0.67, 0)` | 退出比进入快 |
| **页面切换** | 500ms | `cubic-bezier(0.77, 0, 0.175, 1)` | 平滑过渡 |
| **Toast 消息** | 300ms | `cubic-bezier(0.23, 1, 0.32, 1)` | 快速出现和消失 |

**时长规则：**
- **UI 反馈类**（按钮、链接）：约 160ms，保持及时
- **内容展示类**（菜单、提示）：125-200ms，柔和但不慢
- **大型组件**（模态框、抽屉）：250-400ms，建立空间连续性
- **页面级动画**（路由切换）：约 500ms，避免突兀
- **避免超过 300ms**（UI 元素）：除非动画直接跟随用户手势
- **非对称时长**：退出比进入快 25-30%，让操作感觉敏捷

**感知性能技巧**：
- 快速旋转的 spinner 比慢速的感觉"更快"（即使加载时间相同）
- 180ms 的下拉菜单比 400ms 感觉更响应
- `ease-out` 在 200ms 比 `ease-in` 在 200ms **感觉**更快

---

## 交互反馈完整性清单

确保所有交互都有完整的视觉反馈。

### ✅ 按钮交互状态

所有按钮必须有 `:active` 状态反馈，在 pointer-down 时立即触发。

```css
.button {
  /* 默认态 */
  background: var(--color-primary);
  transition:
    background-color 160ms var(--ease-out-quick),
    transform 160ms var(--ease-out-quick);
}

.button:hover {
  /* 悬停态 - 颜色稍深或略微上移 */
  background: var(--color-primary-700);
  transform: translateY(-1px);
}

.button:active {
  /* 点击态 - 轻微缩放确认收到指令（Emil 推荐 scale(0.97)） */
  transform: scale(0.97);
}

.button:disabled {
  /* 禁用态 - 降低不透明度，禁用鼠标事件 */
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.button:focus-visible {
  /* 键盘焦点态 - 外轮廓 */
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

**关键原则（来自 Emil Kowalski）：**
- `:active` 状态必须用 `scale(0.95)` 到 `scale(0.98)` 之间的值
- 160ms 是按钮反馈的最佳时长（不是 200ms）
- 缩放要微妙，让用户感觉到而非看到

### ✅ 表单输入反馈

```css
.input {
  border: 1px solid var(--color-neutral-200);
  transition: border-color 200ms, box-shadow 200ms;
}

.input:hover {
  border-color: var(--color-neutral-400);
}

.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

.input.is-error {
  border-color: var(--color-danger);
}

.input.is-success {
  border-color: var(--color-success);
}
```

### ✅ 加载状态

**场景一：按钮加载**
```jsx
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner className="mr-2" />
      <span>提交中...</span>
    </>
  ) : (
    '提交'
  )}
</button>
```

**场景二：内容加载（骨架屏）**
```jsx
{isLoading ? (
  <div className="skeleton">
    <div className="skeleton-line" />
    <div className="skeleton-line" />
    <div className="skeleton-line w-2/3" />
  </div>
) : (
  <ArticleContent />
)}
```

**场景三：页面加载（Spinner）**
```jsx
{isLoading && (
  <div className="loading-overlay">
    <Spinner size="large" />
  </div>
)}
```

### ✅ 表单反馈

**成功反馈：**
```jsx
// Toast 提示
toast.success('保存成功！');

// 或 inline 提示
<div className="alert alert-success">
  ✓ 您的更改已保存
</div>
```

**错误反馈：**
```jsx
// 表单级错误
<div className="alert alert-error">
  ✗ 提交失败：{errorMessage}
</div>

// 字段级错误
<input className="is-error" />
<span className="error-message">请输入有效的邮箱地址</span>
```

### ✅ 危险操作确认

```jsx
// 删除确认
const handleDelete = () => {
  if (confirm('确定要删除这条记录吗？此操作无法撤销。')) {
    deleteItem();
  }
};

// 或使用模态框确认
<ConfirmDialog
  title="删除确认"
  message="确定要删除这条记录吗？此操作无法撤销。"
  confirmText="删除"
  confirmVariant="danger"
  onConfirm={deleteItem}
/>
```

---

## 常见错误模式检查清单

以下是代码审查中必须检查的动效错误，按严重级别分类。

### 🔴 强制修复（Error）

| 错误模式 | 错误示例 | 修复目标 | 原因 |
|---|---|---|---|
| **UI 元素使用 ease-in** | `transition: transform 300ms ease-in` | `transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1)` | ease-in 启动缓慢，让界面感觉迟钝 |
| **入场动画从 scale(0)** | `@starting-style { transform: scale(0); }` | `transform: scale(0.95); opacity: 0;` | 真实世界中没有东西从虚无出现 |
| **使用 transition: all** | `transition: all 300ms` | 指定具体属性：`transform, opacity` | all 触发不必要的重排，性能差 |
| **键盘操作有动画** | 命令面板切换有 300ms 淡入 | 完全移除动画 | 高频操作，每天节省数十秒 |
| **时长超过 300ms（UI 元素）** | `transition: transform 500ms` | 按钮 160ms，弹层 200ms，模态 350ms | 超过 300ms 感觉迟缓 |
| **缺失 prefers-reduced-motion** | 大幅位移动画无降级 | 改为短 crossfade 或移除位移 | 可访问性强制要求 |

### 🟡 推荐修复（Warning）

| 错误模式 | 当前状态 | 改进方向 | 原因 |
|---|---|---|---|
| **弹出层从中心缩放** | `transform-origin: center` | 锚定到触发点（模态除外） | 空间一致性，显示关系 |
| **按钮无 :active 状态** | 点击无反馈 | 添加 `scale(0.97)` 160ms | 确认界面收到指令 |
| **工具提示无即时模式** | 每次都延迟 200ms | 首次延迟，后续立即 + 无动画 | 感知性能优化 |
| **非 GPU 加速属性** | `transition: top 200ms` | 改为 `transform: translateY()` | 避免重排，性能优化 |
| **动态 UI 使用 keyframes** | Toast 进入用 @keyframes | 改为 CSS transitions | keyframes 不可中断 |

### 🟢 体验优化（Info）

| 错误模式 | 当前状态 | 改进方向 | 原因 |
|---|---|---|---|
| **列表元素同时出现** | opacity 0→1 无延迟 | 添加 stagger（30-80ms） | 视觉层次感 |
| **过渡不够平滑** | 状态切换有跳变感 | 添加 `filter: blur(2px)` 过渡中 | 掩盖不完美的过渡 |
| **缺少悬停反馈** | 卡片悬停无变化 | 添加 `translateY(-2px)` 或明度变化 | 可交互性提示 |

---

## 性能优化原则

### 只动画 transform 和 opacity

这两个属性跳过布局和绘制，在 GPU 上运行。动画 `padding`、`margin`、`height` 或 `width` 会触发全部三个渲染步骤。

**✅ 推荐：**
```css
/* 使用 transform（GPU 加速） */
.element {
  transform: translateY(10px);
  transition: transform 200ms;
}
```

**❌ 避免：**
```css
/* 使用 top/left（触发重排） */
.element {
  top: 10px;
  transition: top 200ms;
}
```

### CSS 变量是可继承的

改变父元素上的 CSS 变量会重新计算所有子元素的样式。在有许多项目的抽屉中，在容器上更新 `--swipe-amount` 会导致昂贵的样式重算。直接在元素上更新 `transform`。

```js
// ❌ 错误：触发所有子元素重算
element.style.setProperty('--swipe-amount', `${distance}px`);

// ✅ 正确：只影响此元素
element.style.transform = `translateY(${distance}px)`;
```

### Framer Motion 硬件加速注意事项

Framer Motion 的简写属性（`x`、`y`、`scale`）**不是**硬件加速的。它们在主线程上使用 `requestAnimationFrame`。要硬件加速，使用完整的 `transform` 字符串：

```jsx
// ❌ 不是硬件加速（方便但在负载下掉帧）
<motion.div animate={{ x: 100 }} />

// ✅ 硬件加速（即使主线程繁忙也保持流畅）
<motion.div animate={{ transform: "translateX(100px)" }} />
```

这在浏览器同时加载内容、运行脚本或绘制时很重要。在 Vercel，仪表板标签动画使用共享布局动画并在页面加载期间掉帧。切换到 CSS 动画（离主线程）修复了它。

### CSS 动画在负载下胜过 JS

CSS 动画在主线程之外运行。当浏览器忙于加载新页面时，Framer Motion 动画（使用 `requestAnimationFrame`）会掉帧。CSS 动画保持流畅。对预定动画使用 CSS；对动态、可中断的动画使用 JS。

### 使用 WAAPI 实现编程式 CSS 动画

Web Animations API 提供 JavaScript 控制和 CSS 性能。硬件加速、可中断，无需库。

```js
element.animate(
  [
    { clipPath: 'inset(0 0 100% 0)' },
    { clipPath: 'inset(0 0 0 0)' }
  ],
  {
    duration: 1000,
    fill: 'forwards',
    easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
  }
);
```

### 避免 Layout Thrashing

不要在循环中混合读取和写入样式。

**❌ 错误：**
```javascript
elements.forEach(el => {
  const height = el.offsetHeight; // 读取（触发重排）
  el.style.height = height + 10 + 'px'; // 写入（触发重排）
});
```

**✅ 正确：**
```javascript
// 先读取
const heights = elements.map(el => el.offsetHeight);

// 再写入
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px';
});
```

### 使用 will-change 提示浏览器

对于即将发生动画的元素，提前告知浏览器优化。

```css
.modal {
  /* 准备阶段 */
  will-change: transform, opacity;
}

.modal.is-animating {
  /* 动画进行中 */
  transform: translateY(0);
  opacity: 1;
}

.modal.animation-done {
  /* 动画结束后移除 will-change */
  will-change: auto;
}
```

**注意：** 不要滥用 `will-change`，只在确实需要动画的元素上使用，动画结束后记得移除。

---

## 平台特定注意事项

### 小程序平台

**限制：**
- 不支持复杂的 CSS 动画（如多步 keyframes）
- 部分机型性能较差，动画可能卡顿
- 不支持 JavaScript 动画库

**建议：**
- 使用简单的 transition 而非 animation
- 动画时长适当缩短（减少 50-100ms）
- 避免同时动画多个属性
- 使用 rpx 单位时注意不同屏幕的表现

**示例：**
```css
/* 小程序中的简化动画 */
.button {
  transition: background 150ms ease-out; /* 只动画背景色 */
}

.modal {
  transition: opacity 300ms, transform 300ms; /* 最多两个属性 */
}
```

### 传统页面（IE 兼容）

如果需要兼容旧版浏览器：

**降级方案：**
```css
.element {
  /* 现代浏览器 */
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* IE10/11 降级 */
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  .element {
    transition: all 200ms ease-out; /* 使用简单 easing */
  }
}
```

---

## 常见问题

### Q1: 什么时候用弹簧，什么时候用固定时长？

**用弹簧：**
- 需要可中断的交互（抽屉、拖拽）
- 跟随鼠标/手指的效果
- 追求极致流畅感的场景

**用固定时长：**
- 简单的淡入淡出
- 小程序等无法使用 JS 动画的平台
- 性能敏感场景（大量元素同时动画）

### Q2: 弹簧的 bounce 参数如何选择？

- `bounce: 0`：适合 95% 的场景，专业、克制
- `bounce: 0.1`：轻微弹性，适合强调重要操作
- `bounce: 0.25+`：明显弹跳，适合游戏化、儿童产品
- **建议：** 从 0 开始，只在需要时逐步增加

### Q3: 动效太慢或太快怎么办？

**太慢（用户感觉迟缓）：**
- 减少 duration（如 0.5 → 0.3）
- 增加 stiffness（如 300 → 400）

**太快（用户看不清）：**
- 增加 duration（如 0.2 → 0.3）
- 减少 stiffness（如 400 → 300）

**最佳实践：** 在真实设备上测试，不同设备性能差异可能导致体感不同。
