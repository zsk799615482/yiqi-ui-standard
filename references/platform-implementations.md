# 分平台实现指南

## 共同约束

- 默认只实现暗色主题
- 品牌 Token 来源为 `design-tokens.json`
- Web 优先复用 `theme.css`
- 卡片使用 36px Web 降级圆角和连续曲率增强
- 控件圆角不继承卡片圆角
- 用户选择液态玻璃时才启用透明材质
- 不支持背景模糊、连续曲率或减少透明查询的平台，降级为实体暗色卡片

## React / Vue / 传统 Web

```css
@import "./theme.css";

html {
  color-scheme: dark;
  font-family: var(--font-sans);
  background: var(--color-bg-page);
  color: var(--color-text-primary);
}

[data-ui-card] {
  border-radius: var(--radius-card);
  corner-shape: squircle;
}

[data-ui-card-material="solid"] [data-ui-card] {
  background: var(--card-solid-bg);
  border: 1px solid var(--card-solid-border);
  box-shadow: var(--card-solid-shadow);
}

[data-ui-card-material="liquid-glass"] [data-ui-card] {
  background: var(--card-glass-bg);
  border: 1px solid var(--card-glass-border);
  backdrop-filter:
    blur(var(--card-glass-blur))
    saturate(var(--card-glass-saturation));
}

:where(a, button, input, select, textarea):focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

@media (prefers-reduced-transparency: reduce) {
  [data-ui-card-material="liquid-glass"] [data-ui-card] {
    background: var(--card-solid-bg);
    backdrop-filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```

Tailwind 项目在主题扩展中映射：

```javascript
export default {
  theme: {
    extend: {
      colors: {
        page: "#09090B",
        surface: "#141418",
        elevated: "#1B1B20",
        brand: "#9A6ABA",
      },
      borderRadius: {
        card: "36px",
      },
      fontFamily: {
        sans: ["Alibaba PuHuiTi", "system-ui", "sans-serif"],
      },
    },
  },
};
```

## 展示模式 Web 多栈

展示模式只覆盖现代 Web 构建环境。先运行 `scripts/resolve-showcase-components.mjs` 生成锁文件，再按目标栈实现；标准模式页面不得加载这些高级运行时。

### React / Next

- Motion React 负责排版、布局、共享元素和滚动增强。
- Three.js 负责单一代码生成 3D 场景；项目已稳定使用 React Three Fiber 时可以复用，但锁文件仍记录 Three.js 版本。
- Magic UI 等来源只作为宽松许可的源码配方，复制后删除供应商品牌、Demo 文案和默认主题。
- GSAP / ScrollTrigger 只有锁文件存在条件许可批准时使用。
- 用户确认液态玻璃且效果锁选择 `liquid-glass-react` 时，安装锁定的 `liquid-glass-react@1.1.1`；只使用其容器和滤镜行为，外层样式仍由 OneSeven Token 控制。

### Vue / Nuxt

- Motion Vue 负责排版、状态和滚动增强。
- Three.js 使用组合式函数封装生命周期，组件卸载、页面隐藏和离屏时停止渲染并释放资源。
- Reka UI 只提供交互和无障碍 Primitive，视觉由 OneSeven 实现。
- GSAP / ScrollTrigger 继续遵守条件许可批准。
- 用户确认液态玻璃时，可自动取用 `@wxperia/liquid-glass-vue@1.0.9`；锁文件保留 npm 包许可证核验记录，SSR、组件卸载和 Safari/Firefox 部分支持必须经过验证。

### Vanilla Web

- 使用 Motion JavaScript 或原生 CSS 实现排版与交互；不移植 React / Vue 组件源码。
- Three.js 使用本地 ESM 和固定版本构建，不使用未锁版本 CDN。
- 组件按目录中的品牌配方现场实现，并生成相同 effects-lock。
- 用户确认液态玻璃且效果锁选择 `liquid-glass-vanilla-source` 时，只复制锁定 commit 的 CSS/SVG 配方文件；不要安装同名 npm `liquid-glass` 包，也不要复制 Astro 文档站页面。

三种 Web 栈都实现 Full / Lite / Static：Full 允许一个主要 WebGL 场景；Lite 降低像素比和复杂度；Static 在 reduced-motion、WebGL 不可用或失败时显示完整静态内容。

## 小程序

```css
page {
  background: #09090b;
  color: #f5f5f7;
}

.ui-card {
  border-radius: 72rpx;
  background: #141418;
  border: 1rpx solid #2e2e35;
}
```

小程序默认使用实体暗色卡片。仅在目标运行时明确支持且通过真机对比度验证时实现透明材质。

展示模式的 WebGL、滚动 pin 和复杂时间线不移植到小程序；使用 Static 或平台原生轻量进入效果。

## React Native

```javascript
export const uiTheme = {
  colors: {
    page: "#09090B",
    surface: "#141418",
    elevated: "#1B1B20",
    textPrimary: "#F5F5F7",
    textSecondary: "#B8B8C0",
    border: "#2E2E35",
    brand: "#9A6ABA",
  },
  radius: {
    card: 36,
  },
};
```

React Native 默认使用实体暗色卡片。只有已有可靠模糊组件、减少透明设置映射和真机验证时才实现液态玻璃。

展示模式的 WebGL 与 Web 滚动编排不移植到 React Native；只保留内容、品牌 Token 和平台原生轻量交互。

## 验证

所有平台检查默认暗色、字体、标题范围、卡片曲率、焦点或可访问状态、等待和错误状态。Web 额外运行 `scripts/validate-generated-web.mjs` 和 Playwright 桌面/移动验收。

外部样式表、复杂 CSS 级联、非 px 单位或长度计算、字体加载和不确定的视觉判断由浏览器验收，不要求静态校验器证明。
