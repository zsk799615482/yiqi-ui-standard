# OneSeven 展示模式

展示模式是 OneSeven 的显式高设计上限模式。它负责选择、品牌化和验收高级组件、代码生成 3D、排版动画与滚动编排，不替代标准模式，也不改变 OneSeven 的品牌硬规则。动效判断统一遵循 `animation-craft.md`。

## 默认与切换条件

OneSeven 品牌默认启用展示模式。只有在以下情况下切换为标准模式：

1. 用户明确要求效率优先、普通后台、CRM、数据任务或不需要高级视觉效果。
2. 品牌模式不是 OneSeven / 壹柒研究所，且当前项目没有批准使用 OneSeven 展示模式。

用户没有明确信号时，OneSeven 项目自动使用 `showcase`（展示模式），不得额外询问是否需要炫酷模式。用户明确选择标准模式后，才停止加载展示目录和高级运行时。选择当前项目设计系统或新品牌规范时不得启用 OneSeven 展示模式。

规划阶段只把展示模式作为已批准的视觉意图写入 UI 需求规范，不询问技术栈、不取用组件、不生成生产代码。代码实现阶段才执行目录解析。审查阶段只在页面已经声明或明显使用展示模式效果时加载本文件。

## 工作顺序

1. 完成品牌、项目阶段、产品画像、页面任务、Hero 与卡片材质入口。
2. 判断高级效果是否承载真实产品能力、过程、结果或叙事；没有内容依据时回到标准模式。
3. 确认 React / Next、Vue / Nuxt 或 Vanilla Web。
4. 读取 `showcase-catalog.json`，运行 `../scripts/resolve-showcase-components.mjs`。
5. 输出一个单一推荐提案，等待用户确认。
6. 用户确认后取用源码或安装运行时，生成 `oneseven-effects.lock.json`。
7. 实现 Full、Lite、Static 三档。
8. 运行静态校验、桌面/移动浏览器验收和降级测试。

不得因为用户说“赶时间”而跳过来源、版本、许可证、性能分级或用户确认。

## 单一推荐提案契约

提案固定使用以下结构，不提供三套并列方案：

```markdown
## OneSeven 展示模式推荐提案

### 视觉目标与内容依据
说明要强化的真实产品能力、过程、成果或叙事证据。

### 推荐组件与动效
列出目录 ID、来源、固定版本和选择原因。

### OneSeven 品牌改造
说明暗色、品牌紫、Alibaba PuHuiTi、36px 连续卡片语言、真实内容和页面任务如何约束效果。

### 技术栈与依赖
给出目标栈、安装命令、复制源码和锁文件位置。

### 性能分级
- Full：完整桌面效果。
- Lite：移动、粗指针或节省流量环境。
- Static：减少动态、WebGL 不可用或运行失败。

### 授权、性能与兼容风险
记录许可证分类、批准状态、运行成本和平台限制。
```

用户确认提案后才能进入完整实现。用户要求调整时只更新这一个提案，不额外展开未被要求的备选方向。

## 目录选择规则

通用工程依赖由 `library-catalog.json` 和 `library-selection.md` 负责；本文件的 `showcase-catalog.json` 只管理高级视觉来源。两者不得合并。

按以下顺序选择，前项优先：

1. 内容和业务表达是否需要该效果
2. OneSeven 品牌适配度
3. 目标技术栈支持度
4. 宽松授权
5. 性能和可访问性
6. 视觉冲击力

运行：

```bash
node scripts/resolve-showcase-components.mjs \
  --stack react \
  --page-type saas-ai-workspace \
  --effects 3d,typography,scroll \
  --output oneseven-effects.lock.json
```

### Liquid Glass 专用目录

当用户已经确认卡片材质为液态玻璃，并且页面属于 OneSeven 展示模式时，使用效果名 `liquid-glass` 解析专用来源：

| 目录 ID | 技术栈 | 取用方式 | 授权策略 |
|---|---|---|---|
| `liquid-glass-react` | React / Next | 安装 `liquid-glass-react@1.1.1` | MIT，核心自动推荐 |
| `liquid-glass-vue` | Vue / Nuxt | 安装 `@wxperia/liquid-glass-vue@1.0.9` | MIT，按 npm 包许可证记录，核心自动推荐 |
| `liquid-glass-vanilla-source` | Vanilla Web | 复制锁定 commit 中的 CSS/SVG 配方文件 | MIT，核心自动推荐 |

示例：

```bash
node scripts/resolve-showcase-components.mjs \
  --stack react \
  --page-type product \
  --effects liquid-glass \
  --output oneseven-effects.lock.json

node scripts/resolve-showcase-components.mjs \
  --stack vue \
  --page-type product \
  --effects liquid-glass \
  --output oneseven-effects.lock.json
```

这些来源只负责折射、滤镜和容器行为，不覆盖 OneSeven 材质层。组件默认参数必须被品牌配方重写：使用 36px 连续圆角、Alibaba PuHuiTi、暗色 Token、克制品牌紫和真实内容；不得把供应商的 999px 胶囊、Demo Logo、示例文案或全屏 shader 带入业务页面。Vanilla 目录的同名 npm 包 `liquid-glass@1.0.0` 不属于该仓库，不得安装。

条件许可组件必须通过 `--approve-conditional <catalog-id>` 显式批准。禁止仅因为组件流行、Demo 好看或用户指定就把它视为已授权。

## 3D 与空间交互

- 默认使用 Three.js 代码生成几何、材质、灯光和空间关系。
- 只有用户已经提供 GLB、Spline 或 Rive 资产时才把它们作为增强层。
- 每个路由最多一个主要 3D 场景和一个活跃 WebGL Canvas。
- 场景必须解释产品能力、生成过程、对象关系或结果，不得作为空洞背景。
- 3D 失败不得阻止标题、正文、主要操作和产品状态出现。
- Canvas 离开视口、页面隐藏或组件卸载时停止渲染并释放资源。

不使用以下默认方案：紫色 Aurora、发光球体、轨道、无信息粒子、通用宇宙背景和大型装饰圆形。

## 排版与滚动编排

允许：

- Mask / Reveal 与文字分段进入
- Shared Element、Layout Animation 与页面转场
- Scroll-driven Animation、固定叙事段落和连续场景切换
- 与真实内容对应的进度、状态和空间连续性

要求：

- DOM 默认状态必须可读，JavaScript 只增强而不解锁内容。
- 不使用滚动劫持改变用户输入方向或速度。
- 高频工作台只在生成过程、关键空状态或成果展示使用高冲击编排。
- 普通 CRM、管理和数据任务在效率优先或不需要高级效果时切换为标准模式。

## 自适应性能分级

### Full

适用于精细指针、WebGL 可用、没有减少动态偏好的桌面环境。

- WebGL 像素比不高于 `1.75`。
- 允许一个受控镜头、指针深度、完整排版时间线和低成本后处理。
- 动画必须可以中断，页面隐藏时停止时间线和渲染循环。

### Lite

出现粗指针、小视口或 `saveData` 时启用。

- WebGL 像素比不高于 `1.25`。
- 几何、采样或实例数量至少降低一半。
- 关闭后处理、复杂阴影、长时间 pin 和持续背景渲染。
- 排版改为短距离 Reveal、Crossfade 或一次性进入。

### Static

出现 `prefers-reduced-motion: reduce`、WebGL 不可用、初始化失败或资源失败时启用。

- 使用预渲染海报、SVG、CSS 构图或完整展开的内容。
- 不允许空白 Canvas 或“请开启动画”占位。
- 与 Full 保持相同信息、操作和阅读顺序。

## Web 多栈实现

| 技术栈 | 动效运行时 | 3D | 组件取用 |
|---|---|---|---|
| React / Next | Motion React；条件批准时 GSAP | Three.js；项目已使用 R3F 时可复用 | Magic UI 等宽松源码配方，复制后完全品牌化 |
| Vue / Nuxt | Motion Vue；条件批准时 GSAP | Three.js | Reka UI 负责行为与无障碍，视觉由 OneSeven 实现 |
| Vanilla Web | Motion JavaScript 或原生 CSS；条件批准时 GSAP | Three.js | 使用目录配方现场实现，不加载 React/Vue 组件 |

小程序和 React Native 本轮只使用 Static 或平台原生轻量动效，不移植 WebGL 与滚动编排。

## OneSeven 品牌改造

所有来源必须完成以下改造：

- 删除供应商 Logo、名称、演示文案、示例数据和归属视觉。
- 替换 Inter、Roboto、系统默认字体和供应商字体。
- 所有颜色、圆角、排版、阴影和动效参数映射到 OneSeven Token。
- 保持默认暗色、克制品牌紫、Alibaba PuHuiTi 和 36px 连续卡片语言。
- 用真实业务内容替代“AI 驱动未来”等泛化口号。
- 不复刻 Linear、Raycast 或其他成熟产品的页面构图。
- 同一路由只设一个主要视觉时刻，其余动效服务反馈和连续性。

## 授权与来源

- `permissive`：可以进入核心自动推荐。
- `conditional`：必须记录用户或公司的明确批准，只在当前项目使用。
- `restricted`：不得自动选择，不得复制、移植或重新分发。

效果锁文件必须记录目录快照、来源 URL、固定版本、许可证、批准范围、依赖、品牌配方和验证步骤。无法确认许可证时停止取用并选择宽松替代项。

## 常见失败

| 失败 | 处理 |
|---|---|
| 直接粘贴组件库 Demo | 删除供应商视觉，重新应用 OneSeven 内容、Token 与构图 |
| 每个区块都使用高级效果 | 保留一个主要视觉时刻，其余回到任务反馈 |
| 用 3D 球体冒充产品内容 | 把场景改成真实对象、流程、关系或成果 |
| 移动端继续运行桌面场景 | 自动切换 Lite，必要时使用 Static |
| reduced-motion 只把 duration 设为 0 | 改为完整静态内容或短 Crossfade，取消 scrub、pin、视差和镜头运动 |
| 用户指定付费组件就默认已授权 | 要求明确批准并记录范围；否则使用 permissive 替代 |
| 标准模式页面加载 Three.js / GSAP | 移除依赖，或重新确认是否显式启用展示模式 |

## 完成门槛

只有以下项目全部完成才能声明通过：

1. 推荐提案已经用户确认。
2. `oneseven-effects.lock.json` 与页面效果一致。
3. 静态校验无 error，warning 已在浏览器复核。
4. 完成 `1440 × 1000`、`390 × 844`、reduced-motion 和 WebGL 失败验收。
5. 浏览器控制台无错误和警告。
6. 页面没有供应商 Demo 残留，不像通用 AI SaaS 模板。
7. 品牌/设计与前端评审的视觉冲击、完成度、内容相关性和 OneSeven 适配均达到 `4/5`。
