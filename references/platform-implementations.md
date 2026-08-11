# 分平台实现指南

本文档提供各技术栈如何落地 Design Tokens 的具体方案和完整配置模板。

---

## 概述

Design Tokens 是平台无关的设计决策（定义在 `visual-system.md`）。各平台通过不同的技术方案将 tokens 转换为可用的代码。

**核心原则：**
- 单一数据源：所有平台的配置都从同一套 tokens 派生
- 命名一致：`primary-600` 在任何平台都叫 `primary-600`
- 值的转换：根据平台特性转换单位（px/rpx/无单位数字）

---

## React + Tailwind CSS

### 方案概述

通过 `tailwind.config.js` 扩展或覆盖默认主题。

**优点：**
- 原子化类名，样式复用率高
- 响应式、状态变体开箱即用
- 生产环境自动 PurgeCSS，体积小

**何时使用：** 新项目或可以引入构建工具的项目。

### 完整配置模板

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      // 颜色系统
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          DEFAULT: '#3B82F6', // 对应 primary-500
        },
        success: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          600: '#DC2626',
          700: '#B91C1C',
        },
        // neutral 保持 Tailwind 默认的 gray，或自定义
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      
      // 间距系统（Tailwind 默认已经是 4px 倍数，按需扩展）
      spacing: {
        '18': '72px',  // 如果需要非标准间距
        '22': '88px',
      },
      
      // 字体
      fontFamily: {
        sans: [
          'PingFang SC',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'Consolas',
          'Menlo',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },
      
      // 字号（Tailwind 默认已经覆盖大部分，按需扩展）
      fontSize: {
        '2xs': ['10px', '14px'],
        '3xs': ['8px', '12px'],
      },
      
      // 圆角
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'md': '8px',
        'DEFAULT': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
      },
      
      // 阴影
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
        'none': 'none',
      },
      
      // 过渡时长
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '400': '400ms',
      },
      
      // 缓动函数
      transitionTimingFunction: {
        'out-quick': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'out-smooth': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'in-smooth': 'cubic-bezier(0.32, 0, 0.67, 0)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      
      // z-index
      zIndex: {
        'dropdown': '1000',
        'sticky': '1100',
        'overlay': '1200',
        'modal': '1300',
        'popover': '1400',
        'toast': '1500',
      },
    },
  },
  plugins: [],
};
```

### 使用示例

```jsx
// 按钮组件
function Button({ variant = 'primary', size = 'md', children }) {
  const baseClasses = 'font-medium rounded-md transition-all duration-150 ease-out-quick';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 active:scale-98 text-white',
    secondary: 'bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700',
    danger: 'bg-danger-600 hover:bg-danger-700 active:scale-98 text-white',
  };
  
  const sizeClasses = {
    sm: 'h-8 px-4 text-sm',
    md: 'h-10 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </button>
  );
}

// 卡片组件
function Card({ children }) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-250 p-6 border border-neutral-200">
      {children}
    </div>
  );
}
```

---

## React/Vue + CSS 变量

### 方案概述

在 CSS 文件中定义 CSS 自定义属性（变量），通过 `var()` 引用。

**优点：**
- 运行时可修改（支持主题切换）
- 不依赖构建工具
- 可与任何 CSS 方案配合

**何时使用：** 需要动态主题切换，或不使用 Tailwind 的项目。

### 完整配置模板

```css
/* theme.css */
:root {
  /* === 颜色系统 === */
  
  /* 品牌主色 */
  --color-primary-50: #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #1E3A8A;
  --color-primary: var(--color-primary-500);
  
  /* 语义色 */
  --color-success: #10B981;
  --color-success-50: #ECFDF5;
  --color-success-600: #059669;
  
  --color-warning: #F59E0B;
  --color-warning-50: #FFFBEB;
  --color-warning-600: #D97706;
  
  --color-danger: #EF4444;
  --color-danger-50: #FEF2F2;
  --color-danger-600: #DC2626;
  
  /* 中性色 */
  --color-neutral-50: #F9FAFB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-200: #E5E7EB;
  --color-neutral-300: #D1D5DB;
  --color-neutral-400: #9CA3AF;
  --color-neutral-500: #6B7280;
  --color-neutral-600: #4B5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1F2937;
  --color-neutral-900: #111827;
  
  /* 语义别名（用于暗色模式切换） */
  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-600);
  --color-text-tertiary: var(--color-neutral-400);
  --color-text-inverse: white;
  
  --color-bg-page: var(--color-neutral-50);
  --color-bg-surface: white;
  --color-bg-hover: var(--color-neutral-100);
  --color-bg-active: var(--color-neutral-200);
  
  --color-border-default: var(--color-neutral-300);
  --color-border-strong: var(--color-neutral-400);
  --color-border-focus: var(--color-primary);
  
  /* === 间距系统 === */
  --spacing-0: 0;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
  --spacing-16: 64px;
  
  /* === 字体系统 === */
  --font-sans: "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "SF Mono", Consolas, Menlo, monospace;
  
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* === 圆角 === */
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  
  /* === 阴影 === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  --shadow-inner: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  
  /* === 动效 === */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
  
  --easing-out: cubic-bezier(0.23, 1, 0.32, 1);
  --easing-in: cubic-bezier(0.32, 0, 0.67, 0);
  --easing-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  
  /* === 层级 === */
  --z-dropdown: 1000;
  --z-sticky: 1100;
  --z-overlay: 1200;
  --z-modal: 1300;
  --z-popover: 1400;
  --z-toast: 1500;
}

/* 暗色模式 */
[data-theme="dark"] {
  --color-text-primary: var(--color-neutral-50);
  --color-text-secondary: var(--color-neutral-300);
  --color-text-tertiary: var(--color-neutral-500);
  
  --color-bg-page: var(--color-neutral-900);
  --color-bg-surface: var(--color-neutral-800);
  --color-bg-hover: var(--color-neutral-700);
  --color-bg-active: var(--color-neutral-600);
  
  --color-border-default: var(--color-neutral-700);
  --color-border-strong: var(--color-neutral-600);
  
  --color-primary: var(--color-primary-400); /* 暗色模式下提亮 */
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 使用示例

```css
/* Button.module.css */
.button {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  padding: var(--spacing-3) var(--spacing-5);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--easing-out);
}

.button-primary {
  background: var(--color-primary-600);
  color: white;
}

.button-primary:hover {
  background: var(--color-primary-700);
}

.button-primary:active {
  transform: scale(0.98);
}

/* Card.module.css */
.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-base);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

---

## 小程序（微信/支付宝/抖音）

### 方案概述

在 `app.wxss`（或对应平台的全局样式文件）中定义 CSS 变量。小程序支持 rpx 响应式单位。

**单位转换：**
- 颜色、圆角、阴影：与 Web 一致
- 间距：可选用 rpx（750rpx = 屏幕宽度）或 px
- 字号：建议用 rpx，保证不同屏幕视觉一致

**限制：**
- 不支持复杂动画，避免使用 JavaScript 动画库
- 部分 CSS3 特性受限（如 backdrop-filter）

### 完整配置模板

```css
/* app.wxss */
page {
  /* 颜色系统 */
  --color-primary-50: #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-500: #3B82F6;
  --color-primary-600: #2563EB;
  --color-primary-700: #1D4ED8;
  --color-primary: var(--color-primary-500);
  
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  
  --color-neutral-50: #F9FAFB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-300: #D1D5DB;
  --color-neutral-600: #4B5563;
  --color-neutral-900: #111827;
  
  /* 间距系统（rpx 单位，基于 750rpx 设计稿） */
  --spacing-1: 8rpx;   /* 4px */
  --spacing-2: 16rpx;  /* 8px */
  --spacing-3: 24rpx;  /* 12px */
  --spacing-4: 32rpx;  /* 16px */
  --spacing-6: 48rpx;  /* 24px */
  --spacing-8: 64rpx;  /* 32px */
  
  /* 字号（rpx） */
  --text-xs: 24rpx;   /* 12px */
  --text-sm: 28rpx;   /* 14px */
  --text-base: 32rpx; /* 16px */
  --text-lg: 36rpx;   /* 18px */
  --text-xl: 40rpx;   /* 20px */
  
  /* 圆角（rpx） */
  --radius-sm: 8rpx;   /* 4px */
  --radius-md: 16rpx;  /* 8px */
  --radius-lg: 24rpx;  /* 12px */
  --radius-full: 9999rpx;
  
  /* 动效（小程序性能考虑，时长略短） */
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 350ms; /* 比 Web 短 50ms */
  
  --easing-out: cubic-bezier(0.23, 1, 0.32, 1);
  --easing-in: cubic-bezier(0.32, 0, 0.67, 0);
}
```

### 使用示例

```xml
<!-- button.wxml -->
<view class="button button-{{variant}} button-{{size}}">
  <slot></slot>
</view>
```

```css
/* button.wxss */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--easing-out);
}

.button-primary {
  background: var(--color-primary-600);
  color: white;
}

.button-sm {
  height: 64rpx;  /* 32px */
  padding: 12rpx 32rpx;
  font-size: var(--text-sm);
}

.button-md {
  height: 80rpx;  /* 40px */
  padding: 20rpx 40rpx;
  font-size: var(--text-sm);
}
```

---

## Vue + Element Plus / Ant Design Vue

### 方案概述

通过 SCSS 变量覆盖组件库的默认主题。

**优点：**
- 保持组件库的功能完整性
- 只需修改少量变量即可统一风格

**何时使用：** 使用 Element Plus 或 Ant Design Vue 的项目。

### Element Plus 配置

```scss
/* element-variables.scss */

// 品牌色
$--color-primary: #3B82F6;
$--color-success: #10B981;
$--color-warning: #F59E0B;
$--color-danger: #EF4444;
$--color-info: #3B82F6;

// 文本色
$--color-text-primary: #111827;
$--color-text-regular: #4B5563;
$--color-text-secondary: #6B7280;
$--color-text-placeholder: #9CA3AF;

// 边框色
$--border-color-base: #D1D5DB;
$--border-color-light: #E5E7EB;

// 背景色
$--background-color-base: #F9FAFB;

// 圆角
$--border-radius-base: 8px;
$--border-radius-small: 4px;

// 字体
$--font-family: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
$--font-size-base: 14px;

// 导入 Element Plus
@import 'element-plus/theme-chalk/src/index';
```

```javascript
// main.js
import './styles/element-variables.scss';
```

### Ant Design Vue 配置

```javascript
// vue.config.js
module.exports = {
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {
            // 品牌色
            'primary-color': '#3B82F6',
            'success-color': '#10B981',
            'warning-color': '#F59E0B',
            'error-color': '#EF4444',
            'info-color': '#3B82F6',
            
            // 文本色
            'text-color': '#111827',
            'text-color-secondary': '#6B7280',
            'disabled-color': '#9CA3AF',
            
            // 边框
            'border-radius-base': '8px',
            'border-color-base': '#D1D5DB',
            
            // 字体
            'font-family': "'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif",
            'font-size-base': '14px',
          },
          javascriptEnabled: true,
        },
      },
    },
  },
};
```

---

## 传统页面（HTML + CSS）

### 方案概述

与"React/Vue + CSS 变量"方案完全相同，直接在 `<link>` 引入 `theme.css`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>传统页面</title>
  <link rel="stylesheet" href="theme.css">
  <link rel="stylesheet" href="main.css">
</head>
<body>
  <button class="button button-primary">点击我</button>
</body>
</html>
```

---

## React Native

### 方案概述

创建 TypeScript 常量对象导出 tokens。RN 不支持 CSS 变量，需在 JS 层管理。

**单位：** RN 的尺寸无单位，默认为 dp（密度无关像素）。

### 完整配置模板

```typescript
// theme.ts
export const theme = {
  colors: {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      DEFAULT: '#3B82F6',
    },
    success: { DEFAULT: '#10B981' },
    warning: { DEFAULT: '#F59E0B' },
    danger: { DEFAULT: '#EF4444' },
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      300: '#D1D5DB',
      600: '#4B5563',
      900: '#111827',
    },
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    6: 24,
    8: 32,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
};

export type Theme = typeof theme;
```

### 使用示例

```tsx
// Button.tsx
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { theme } from './theme';

export function Button({ variant = 'primary', children }) {
  return (
    <TouchableOpacity style={[styles.button, styles[`button_${variant}`]]}>
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  button_primary: {
    backgroundColor: theme.colors.primary[600],
  },
  text: {
    color: 'white',
    fontSize: theme.fontSize.sm,
  },
});
```

---

## 跨平台一致性验证

完成各平台配置后，使用以下检查清单验证一致性：

- [ ] 所有平台的主色色值完全一致
- [ ] 间距倍数关系保持一致（虽然单位不同）
- [ ] 字号视觉大小在不同平台接近（考虑屏幕密度）
- [ ] 圆角比例一致
- [ ] 动效时长相近（小程序可略短）
- [ ] 组件在各平台视觉效果接近（拍照对比）

**工具推荐：** 使用设计稿对比工具（如 Figma Overlay）验证还原度。
