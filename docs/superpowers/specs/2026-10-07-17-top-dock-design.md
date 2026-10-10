# 17 Top-dock

用户确认：三条桌面 Web 技术栈；名称 17 Top-dock；品牌 Logo 左对齐；导航按钮默认右对齐、间隔自适应；导航条和下拉面板全宽；深浅色切换；液态玻璃；弹簧动画。本次项目许可已由用户明确确认。

## 结构与范围

- 为 yiqi-ui-standard 新增按需模板，不替换项目已有导航、不改变全局暗色默认。
- React / Next 基于 shadcn/ui 的 Radix Navigation Menu 结构；Vue / Nuxt 基于 Reka UI；原生 Web 独立实现同等语义。
- 外层 header 和下拉 viewport 为父级全宽；模板要求挂在页面根壳层，不嵌入限宽内容区。内层版心可配置。
- items 为 `{label, href?, groups?:[{title, links:[{label,href}]}]}`；Logo、首页链接与主题由项目提供。
- 主题由项目控制或继承 `data-theme`，组件不读取/覆盖系统主题、不写入 localStorage。
- Full 玻璃由当前业务项目许可取用的 GlassSurface 作为材质插槽注入；Skill 只包含原创接入胶水和规则，不分发上游源码。导航内容保持在独立语义层，防止材质的 overflow 裁切菜单。
- Lite 使用轻量玻璃；减少透明度/更高对比度/滤镜失败使用实体。主题回退保持内容和操作完整。
- 展开与切换使用真实弹簧；动画可中断，reduced-motion 与键盘打开即时呈现。无持续动画。
- 窄桌面窗口提供可访问的换行/滚动回退；移动端完整导航模板不在本轮范围。

## 验收

三栈构建、Skill 合同测试、实际桌面浏览器验证全宽面板/右对齐/主题/键盘/Escape/连续切换/减少动态/透明度回退；记录 SSR、真实滤镜和其他浏览器验证边界。

## 非目标

不新增独立 Artifact Template Skill；不修改已安装 Skill 副本；不提交或推送；不擅自覆盖现有脏文件；许可确认只属于当前项目。
