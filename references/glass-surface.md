# Glass Surface 液态玻璃材质

仅在 OneSeven 展示模式、用户已经选择液态玻璃且技术栈为 React / Next 或 Vue / Nuxt 时读取。默认组件来源不代表默认把页面全部改成玻璃；不替换项目已有等价实现、不改业务布局。Vanilla 保持原有 CSS/SVG 配方。

## 来源与取用边界

| 技术栈 | 默认目录 ID | 固定 commit | 业务项目取用路径 |
|---|---|---|---|
| React / Next | `react-bits-glass-surface` | `ca44b3f9ee180676a06d7de8ec6bea84cddff85b` | `src/ts-default/Components/GlassSurface/GlassSurface.tsx` 与同目录 CSS |
| Vue / Nuxt | `vue-bits-glass-surface` | `07c0f76d5567db022c2e3185dd97a2311e056c0c` | `src/content/Components/GlassSurface/GlassSurface.vue` |

官方入口：[React Glass Surface](https://reactbits.dev/c/components/glass-surface)、[Vue Glass Surface](https://vue-bits.dev/components/glass-surface)。取用版本以目录 commit 为准，不以官网滚动更新的下载按钮或未锁定 registry 为准。目录路径是业务项目批准后取用的路径，不是 Skill 内已存在的源码文件。

- 两个来源均为 **MIT + Commons Clause License Condition v1.0**，不是纯 MIT；2026-10-07 已核对固定 commit 的 `LICENSE.md`。
- 条件许可允许应用、网站或产品使用（包含商业用途），要求保留版权和完整许可声明；限制出售、再许可或再分发组件本身。Vue 条款另明确包含模板。项目确认不能豁免上游限制。
- Skill 不打包上游组件源码、移植版本或完整组件模板；这里只收录来源元数据与原创适配规则。不自动下载，不安装虚构的 Glass Surface npm 包。
- 提案先说明来源和限制，确认当前项目用途后才传 `--approve-conditional <catalog-id>`。不把本 Skill 的更新授权当作所有未来业务项目的许可确认。
- 未确认时停止取用；用户明确选择纯 MIT 备选才传 `--liquid-glass-source liquid-glass-react` 或 `liquid-glass-vue`，不得静默换源。
- 从固定 commit 取用后，把 `LICENSE.md` 和版权声明保留在业务项目第三方声明中，并记录本地组件路径、改造内容和实际复制路径。

## 技术栈适配

React 优先选择普通 CSS 版本，复用项目已有 TS / JS。JS 项目使用同 commit 的 `src/content/Components/GlassSurface/GlassSurface.jsx` 与配套 CSS，并把锁文件 `copyPaths` 更新为实际路径。Next 的组件边界保留客户端声明；SSR 首屏内容必须完整，挂载后再增强滤镜。

Vue 源码使用 `useTemplateRef`，先检查现有 Vue 版本是否支持；不支持时复用项目已有 `ref` 写法，不自动升级。已有 Tailwind 时复用；未使用 Tailwind 时把上游工具类转为项目普通 CSS，不为单个组件安装 Tailwind。

SSR 与多实例要求：

- SSR 与首轮客户端渲染使用相同静态结构和实体/轻量回退；只在挂载后检测 SVG/backdrop、主题、媒体偏好及容器尺寸，不在渲染计算中读取浏览器全局。
- 用栈内支持 SSR 的稳定 ID 机制或父级传入稳定唯一 ID，替换 Vue 上游随机 ID。滤镜、渐变和通道等所有 DOM ID 都必须实例唯一，不只隔离最外层 filter。
- Nuxt 如需客户端边界，服务端仍输出相同业务内容与实体容器；不能留下空白 ClientOnly 占位。
- 容器尺寸改变时更新位移图；使用零尺寸保护，避免无效滤镜。清理 ResizeObserver、主题与媒体监听器、待执行定时器；卸载钩子在 setup/顶层同步注册，不能在 mounted 回调内才注册。
- 浏览器和 CSP 可能禁用 URL backdrop 或 `data:` SVG 位移图，检测成功不等于实际渲染成功，必须浏览器验证。不要为效果擅自放宽 CSP。

## OneSeven 材质适配

Glass Surface 只负责材质，不负责页面构图和业务交互。外观继承 `design-tokens.json`、`theme.css` 与当前已批准需求，不增加另一套 Token。

- 默认暗色；主题来自项目根元素，不由系统浅色偏好覆盖。字体使用 Alibaba PuHuiTi，焦点颜色使用品牌 Token，替换上游默认蓝色。
- 卡片 `borderRadius` 与外层 36px 规则一致；连续圆角按项目能力降级，不强制所有按钮使用卡片圆角。
- **玻璃无投影**：移除上游 CSS 和 Vue 内联多层 box-shadow。边缘用品牌边框或材质高光，不保留供应商外投影；Static 实体回退使用已有 solid shadow。
- 容器尺寸由业务布局控制，不能保留默认固定示例尺寸。内容布局、padding 和对齐由业务决定，重写上游默认 flex 居中，保证文本、输入框、菜单和焦点不被 overflow 裁切。
- 使用已有 `--card-glass-bg`、`--card-glass-border`、`--card-glass-blur` 与 `--card-glass-saturation`；适配上游属性时转换单位，例如 CSS `140%` 对应倍率 `1.4`。上游 `blur` 是位移图参数，不等同于 CSS 背景模糊 Token，不机械映射。
- 位移强度与色差由真实背景和内容校准，不照搬 Demo 强度。Vue 的计算内联样式必须直接改造，不能假定普通 CSS 会覆盖其背景、阴影或滤镜。
- GlassSurface 的 div 不是按钮；内部保留原生 button/input 等语义与键盘行为，不给材质容器伪造点击交互。滤镜 SVG 不参与焦点或屏幕阅读。
- 仅在必要的局部区域使用；禁止嵌套滤镜、整页透明覆盖、供应商 Logo、Demo 文案与示例背景。

## 三档与失败回退

| 档位 | 行为 |
|---|---|
| Full | 已验证的桌面局部使用 SVG 折射；限制滤镜面积和实例数量，不引入 Three.js 或无意义持续循环 |
| Lite | 移动端、粗指针、节省流量或 URL/SVG 折射不可用时关闭位移和色差，使用 OneSeven 轻量 CSS 玻璃 |
| Static | `prefers-reduced-transparency: reduce`、背景模糊不可用、CSP 阻断或增强失败时，使用实体背景、边框和 solid shadow |

`prefers-reduced-motion: reduce` 时取消过渡与动态材质更新，保留静态玻璃；不强制减少动态用户也减少透明度。两种偏好同时启用时使用 Static。运行时偏好变化应立即生效，卸载时移除监听。

回退必须覆盖实际玻璃元素并移除内联滤镜/透明样式，不能只给无关节点加 CSS。始终保持相同内容、布局、操作、焦点和状态，不显示空白滤镜占位；Safari / Firefox 不依赖 SVG 折射作为唯一信息。

## 验收

- 锁文件记录目录 ID、固定 commit、当前项目许可批准、实际 `copyPaths`、Full / Lite / Static、减少动态回退和验证步骤；Glass Surface 本身无 npm 安装命令。
- 页面继续声明 `data-ui-card-material="liquid-glass"`，效果节点声明对应来源 ID 和 Static 回退；执行现有 `validate-generated-web.mjs --effects-lock` 门禁。
- 浏览器检查 `1440 × 1000`、`390 × 844`、多实例、容器尺寸变化、SSR 水合、卸载清理、键盘焦点与文字对比度。
- 检查减少动态、减少透明度、两者同时启用、backdrop 不可用、SVG 失败和 CSP 限制；确认内容与操作完整。
- 核对 React 的配套 CSS、Vue 的 Tailwind 或 CSS 转换、主题与无投影规则。记录目标浏览器结果，不把 Chromium 验证当作 Safari / Firefox 验证。
- Skill 的目录和解析测试通过只证明规则可用，不代表业务页面已完成浏览器视觉验收。
