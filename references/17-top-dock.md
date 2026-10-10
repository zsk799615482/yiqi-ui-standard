# 17 Top-dock

OneSeven 桌面 Web 默认顶部主导航。仅当页面需要**顶部主导航**、没有已批准的等价导航且项目选用 OneSeven 品牌时，优先取用本模板。不要强迫工作台把已批准的侧栏换掉；悬浮栏、移动底栏仍单独选型。

## 结构

导航条与展开的 Mega Menu 面板都横贯页面视口；Logo 左对齐，按钮组右对齐，按钮间距响应可用空间。导航内容的版心继承已批准的项目规划，可通过 `contentWidth` 配置；不能把整个 `<header>` 放入页面限宽容器。一级菜单用原生链接或按钮，分组标题与链接来自真实项目，不打包演示文案。按钮用熟悉的箭头图标；不使用 emoji。

三栈共用 `assets/17-top-dock/` 下的 `top-dock.css`、`top-dock-motion.js`、`top-dock-scroll.js` 和 `top-dock-scroll-state.js`，TypeScript 项目同时取用 `top-dock-motion.d.ts`、`top-dock-scroll.d.ts`。Motion 的可中断 spring 分别增强菜单展开和导航滚动，焦点管理仍由语义层负责；`prefers-reduced-motion` 下立即切换状态、无位移动画。使用方安装 Motion 或复用项目已有版本，不做隐藏安装。

| 栈 | 取用文件 | 菜单语义 | 依赖 |
|---|---|---|---|
| React / Next | `TopDock.tsx`、`navigation-menu.tsx`（薄适配器） | shadcn/ui Navigation Menu 的 Radix 路线；一个全宽 viewport | React、`radix-ui`、`motion`、`lucide-react` |
| Vue / Nuxt | `TopDock.vue` | shadcn-vue Navigation Menu 对应的 Reka UI 原语；一个全宽 viewport | Vue、`reka-ui`、`motion`、`lucide-vue-next` |
| 原生 Web | `top-dock.js` | 原生 `<nav>`、按钮和链接；自行实现 Escape、方向键、外部点击与焦点回收 | `motion` |

各栈只取用目标栈文件及共享文件；新项目先核验依赖版本、许可证和项目现有方案，不自动升级。`items` 统一为 `{ label, href?, groups?: [{ title, links: [{ label, href }] }] }`。`logoSrc`、`logoAlt`、`homeHref` 必须来自项目；本次验收项目使用用户提供的 `17-logo-b.png` / `17-logo-w.png`，正式业务接入时仍传入项目自己的品牌资产。`theme` 可传 `dark`/`light`，也可以继承项目根元素的 `data-theme`；组件不写持久化主题、不覆盖系统或产品主题。默认暗色；浅色只作用于导航组件，不修改全局 Token。样式引用现有 `theme.css` 变量。

## 滚动行为

默认 `scrollBehavior="smart"`，三栈遵守同一契约：

| 配置 | 行为 |
|---|---|
| `smart` | 保留文档流占位并吸顶；页面顶部 72px 内始终显示，连续向下累计 12px 后弹簧收起，向上累计 12px 后弹簧恢复 |
| `sticky` | 始终吸顶显示，不根据滚动方向隐藏 |
| `static` | 普通文档流布局，随页面滚走 |

菜单展开、导航内部有键盘焦点或精细指针悬停时，`smart` 保持显示。键盘聚焦隐藏导航会立即恢复，不移除可访问链接；微小往返滚动不触发反复切换。React 传 `scrollBehavior="sticky"`，Vue 传 `scroll-behavior="sticky"`，原生 Web 传 `createTopDock({ ..., scrollBehavior: "sticky" })`；省略则使用默认 `smart`。

当前控制器监听页面 `window` 滚动，不监听独立工作台滚动容器；需要容器级行为时另做适配，不宣称已支持。将导航放在可覆盖整个页面高度的壳层内，避免祖先 `overflow` 把 CSS sticky 限制在不可滚动容器中。仅对导航本体做位移，面板仍横贯页面宽度，不随滚动收缩版心。该 `static` 是定位模式，不是材质降级档 Static。

## 材质和授权

React/Vue 默认目标材质为当前项目获准取用的 Full Glass Surface；纯适配器尚未注入材质时仅显示原创 CSS Lite 玻璃，不得将它宣称为已完成 Full。用户已明确批准**本次 UI 统一 Skills 项目**使用 Glass Surface 条件许可；批准不自动扩展到未来业务项目。

- Full：在**当前已许可的业务项目**，从 `showcase-catalog.json` 锁定 commit 取用 React `react-bits-glass-surface` 或 Vue `vue-bits-glass-surface`，保留 `LICENSE.md` 与版权声明，并按 `glass-surface.md` 改造 SVG ID、主题、内联阴影、SSR、多实例、尺寸监听和卸载清理；只作为导航条/面板的绝对定位材质背板，内容保留在独立语义层。React 传 `glassSurface={GlassSurface}`，Vue 传 `:glass-material="GlassSurface"`。全宽面板需实测滤镜成本；若损害可读性或性能，面板回退 Lite，导航条保留受控折射。
- Lite：原生 CSS `backdrop-filter`、边框高光与背景色。原生 Web 自带原创 `top-dock-glass.js` CSS/SVG 背板，在支持的 Chromium 中启用局部折射，Safari/Firefox 回退 Lite；`glass: false` 关闭 SVG 增强并使用 CSS 玻璃。语法支持检测不等于光学效果验收，目标浏览器仍需实测，不将第三方整套页面移入 Skill。
- Static：`prefers-reduced-transparency: reduce`、`prefers-contrast: more`、backdrop 不可用或 CSP 阻断时，使用**对应主题**的实体背景；减少动态只关闭弹簧，不能隐藏内容或状态。

React/Vue 的 Glass Surface 源码属于 **MIT + Commons Clause License Condition v1.0**，不是纯 MIT；Skill 不打包源码、移植版或成品组件包。未来每个业务项目需分别确认使用条件，生成项目效果锁时使用 `--approve-conditional react-bits-glass-surface` 或 `--approve-conditional vue-bits-glass-surface`，不能把本次授权写成通用免核验标志。未批准时停止 Full 取用，询问许可或是否明确选择 Lite/Static 或其他获批来源，不静默复制或换源。标准工作台若用户明确要求本导航样式，只针对导航使用玻璃，不把全页切换成 Showcase。

## 接入

1. 检查页面壳层及依赖，确认顶部导航不会覆盖已有主任务或侧边导航；读取已批准的版心/主题规范。
2. 复制目标栈适配器及上述共享 CSS、Motion、滚动控制器与状态机文件到业务项目本地目录；原生 Web 同时复制 `top-dock-glass.js`。调整 import 和字体资产路径。React / Next 为客户端组件，Next 保留 SSR 首屏导航链接；Vue / Nuxt 的服务端和客户端初始结构一致。
3. 传入真实 Logo 和菜单数据；项目主题状态应同步到页面根元素并通过 `theme` 属性传入，或让组件继承根主题。不要从操作系统主题推断替换项目已选模式。
4. 若启用 Full，先记录当前项目许可，核对来源、固定 commit 与实际 copyPaths；集成的材质容器只负责滤镜，导航触发器与链接不进入被裁切的 `.glass-surface__content`。原版主题、阴影和不稳定 ID 不可保留。
5. 检查 1440 × 1000、窄桌面窗口与 390 × 844；验收全宽边界、按钮右对齐、分组链接、Hover/点击、Escape、Tab、方向键、外部点击、菜单切换、焦点回收、深浅色、减少动态/透明及失效回退。另验收向下隐藏/向上恢复、顶部显示、菜单/悬停/焦点保护、模式切换与监听清理；React/Next 和 Vue/Nuxt 额外验证 SSR、水合和卸载清理。

该模板不等于移动端完整导航。窄屏提供可用的横向入口与面板回退；移动底部导航/抽屉需要单独确认。Skill 合同测试不等于浏览器与跨浏览器视觉验收。
