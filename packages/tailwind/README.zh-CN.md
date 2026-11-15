# @neoverse-ui/tailwind

[English](README.md)

<!-- Source: packages/tailwind/README.md -->
<!-- Source-SHA256: 3d42aaf84dde360df2b4575c0af5de9484fe0ff6c92dbfc44ed47303a7a9776b -->

Neoverse-UI 的 Tailwind CSS v4 语义主题与组件样式。

```sh
bun add @neoverse-ui/tailwind
```

参与 Tailwind 构建时，导入共享主题并扫描应用源码：

```css
@import 'tailwindcss';
@import '@neoverse-ui/tailwind/theme.css';

@source './src';
```

此包还导出 `@neoverse-ui/tailwind/index.css` 作为编译后的消费端样式包，导出 `@neoverse-ui/tailwind/components.css` 作为组件选择器门面，并导出 `@neoverse-ui/tailwind/prose.css` 作为共享的 `.neoverse-prose` 阅读语义。

`.neoverse-prose` 覆盖语义标题、嵌套列表、定义列表、行内代码、引用、表格与题注、折叠内容、媒体、键盘提示、标记与缩写状态。它有意不负责行宽，应与 `max-w-reading` 或 `max-w-reading-wide` 等语义布局角色配合，使排版与页面构图保持独立。

架构与贡献说明见 [Neoverse-UI 仓库](https://github.com/SSJ-ZYJ/Neoverse-UI)。