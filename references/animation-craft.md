# 动效工艺标准

本文档是 `yiqi-ui-standard` 的动效单一事实来源，内化 Emil Kowalski 的设计工程判断与 Apple 的流体交互原则，并以 OneSeven 的品牌、产品任务和可访问性要求为最终约束。

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

## 一、先判断是否需要动效

每个动效先回答“为什么动”，再选择技术实现：

| 频率 | 默认决定 | 说明 |
| --- | --- | --- |
| 每天 100 次以上 | 不动画 | 键盘快捷操作、命令面板切换和高频工具栏反馈必须即时 |
| 每天数十次 | 极简反馈 | 优先颜色、透明度或 100–160ms 按压反馈 |
| 偶尔发生 | 标准动效 | Modal、Drawer、Toast、Popover 可使用短时空间反馈 |
| 首次或罕见 | 可使用叙事动效 | 必须服务于解释、成果展示或空间关系 |

允许的动效目的只有：空间连续、状态变化、即时反馈、解释内容或避免突兀跳变。“看起来更酷”不能单独成为理由。

## 二、曲线与时长

### 语义化 Token

```css
--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
--duration-press: 160ms;
--duration-tooltip: 125ms;
--duration-dropdown: 200ms;
--duration-modal: 350ms;
```

| 场景 | 推荐时长 | 推荐曲线 |
| --- | ---: | --- |
| 按钮按压 | 100–160ms | `--ease-out-strong` |
| Tooltip | 125–200ms | `--ease-out-strong` |
| Dropdown / Select / Popover | 150–250ms | `--ease-out-strong` |
| Modal / Drawer | 200–500ms | `--ease-drawer` 或 spring |
| Showcase 叙事 | 可超过 300ms | 必须有内容依据并支持 Static |

进入和退出的 UI 元素默认使用 ease-out；屏内位置移动使用 ease-in-out；UI 进入不得使用 ease-in。动画超过 300ms 时必须说明它是模态空间转换、手势交接或营销叙事，而不是普通控件反馈。

## 三、实现边界

- 优先只动画 `transform` 和 `opacity`，避免可替代的 `top`、`left`、`width`、`height` 布局动画。
- 动态 UI 优先使用可中断的 transition 或 spring；不要用不可中断 keyframes 表达 Toast、Popover、Drawer 等状态切换。
- 不从 `scale(0)` 入场，使用 `scale(0.95)` 或更高值并结合透明度。
- 不使用 `transition: all`；列出确实变化的属性。
- Popover 从触发点展开；Modal 独立居中，不套用触发点 origin。
- Hover 反馈只在 `(hover: hover) and (pointer: fine)` 下启用，触控设备不能依赖 hover。

## 四、流体交互

Showcase 或确有手势需求时，遵循以下原则：

1. **响应性**：pointer-down 即反馈，不等待 click 或 pointer-up。
2. **1:1 跟手**：拖拽、滑块和抽屉在交互过程中连续跟随指针，并保留抓取偏移。
3. **可中断**：用户可在任意时刻反向或重新抓取，动画从当前值继续。
4. **速度交接**：释放手势后把当前速度交给 spring 或动量投影。
5. **边界阻力**：超出边界时渐进阻力，不硬停也不无限越界。

Standard 模式不因品牌展示而强行加入手势或弹簧；效率、可预测性和数据辨识优先。

## 五、Spring 使用

Spring 适用于可中断的拖拽、抽屉、动态岛式状态或装饰性指针跟随；普通按钮、Tooltip 和高频命令切换默认不用 spring。

```js
{ type: 'spring', duration: 0.4, bounce: 0 }
{ type: 'spring', duration: 0.4, bounce: 0.2 }
```

弹跳保持克制（通常 `0–0.2`）。用户可能连续改变方向的手势必须从当前值和当前速度继续，而不是重新从初始状态播放。

## 六、可访问性与降级

`prefers-reduced-motion: reduce` 下：

- 取消位移、缩放、旋转、scrub、pin 和持续镜头运动。
- 保留内容、焦点、操作和状态顺序。
- 必要时只保留短透明度 crossfade，或直接显示最终状态。
- WebGL、玻璃和高级排版必须有 Static 回退，不能留下空白 Canvas。

`prefers-reduced-transparency: reduce` 或不支持 `backdrop-filter` 时，液态玻璃切换为实体暗色卡片。减少透明度不能导致文字对比度、焦点环或状态信息丢失。

## 七、OneSeven 约束

- 默认暗色、Alibaba PuHuiTi、品牌紫 `#9A6ABA` 和 36px 连续卡片语言不因第三方库默认样式改变。
- 普通 CRM、运营管理、数据分析和账户页面默认使用 Standard 动效；主要任务不得被装饰动效遮挡。
- Showcase 每个路由最多一个主要视觉时刻；其余动效服务状态、空间或阅读连续性。
- 第三方库只提供行为或运行时，不提供 OneSeven 的颜色、字体、圆角、文案和页面构图。

## 八、审查反模式速查

| 反模式 | 默认级别 | 目标 |
| --- | --- | --- |
| UI 进入使用 `ease-in` | Error | 改为 `--ease-out-strong` |
| 入场从 `scale(0)` 开始 | Error | 改为 `scale(0.95)` + `opacity: 0` |
| `transition: all` | Error | 指定 `transform`、`opacity` 等属性 |
| 高频键盘操作带动画 | Error | 移除动画 |
| 缺少 reduced-motion | Error | 提供即时状态或短 crossfade |
| Popover 从中心展开 | Warning | 使用触发点 origin，Modal 除外 |
| Hover 未限制精细指针 | Warning | 添加 hover/pointer media query |
| 只为装饰而持续循环 | Warning | 删除或改为一次性、内容相关动效 |

如有确实的叙事例外，必须在代码旁写明可审计豁免：

```css
/* yiqi-motion: allow duration reason="marketing narrative" */
```
