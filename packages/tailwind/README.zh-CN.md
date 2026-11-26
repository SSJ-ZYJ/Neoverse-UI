# @neoverse-ui/tailwind

[English](README.md)

<!-- Source: packages/tailwind/README.md -->
<!-- Source-SHA256: 48d958341ff0e8c87d257785bb388e9fb2d94ec4cb5a3be3cc833b0b86793d3b -->

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

表面配方通过对称的 CSS `@scope` 边界，从最近的 `data-neoverse-material` 作用域（`solid`、`frosted` 或 `glass`）自动解析全部七种 `SurfaceRole`（`control`、`panel`、`group`、`field`、`overlay`、`compactOverlay`、`table`），提供不透明回退、磨砂嵌套去重模糊以及减少透明度与强制颜色支持。

`.neoverse-prose` 覆盖语义标题、嵌套列表、定义列表、行内代码、引用、表格与题注、折叠内容、媒体、键盘提示、标记与缩写状态。六个标题层级共用同一字重与行高，字号依次由 `--neoverse-prose-heading-h1-size` 到 `--neoverse-prose-heading-h6-size` 控制，因此 Markdown 标题不会与界面标题角色混用。加粗、倾斜、加粗倾斜、行内代码、删除线与链接共用同一层样式；链接内的加粗或删除文本沿用链接颜色。它有意不负责行宽，应与 `max-w-reading` 或 `max-w-reading-wide` 等语义布局角色配合，使排版与页面构图保持独立。

架构与贡献说明见 [Neoverse-UI 仓库](https://github.com/SSJ-ZYJ/Neoverse-UI)。