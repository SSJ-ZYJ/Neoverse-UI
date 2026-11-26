<div align="center">

<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/neoverse-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/neoverse.svg">
    <img src="docs/images/neoverse.svg" alt="Neoverse" width="320">
  </picture>
</h1>

**为 Vue 与 React 打造的极光玻璃界面。**

一套组件库，共享 Tokens、Tailwind 样式、Motion、浮层与终端基础组件。

<p align="center">
  <a href="https://vuejs.org"><img alt="Vue 3" src="https://img.shields.io/badge/Vue-3-42b883?style=flat&amp;labelColor=132134&amp;logo=vue.js&amp;logoColor=f4f8fc"></a>
  <a href="https://react.dev"><img alt="React 19" src="https://img.shields.io/badge/React-19-61dafb?style=flat&amp;labelColor=132134&amp;logo=react&amp;logoColor=f4f8fc"></a>
  <a href="https://www.typescriptlang.org"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-8c9bff?style=flat&amp;labelColor=132134&amp;logo=typescript&amp;logoColor=f4f8fc"></a>
  <a href="https://tailwindcss.com"><img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat&amp;labelColor=132134&amp;logo=tailwindcss&amp;logoColor=f4f8fc"></a>
  <a href="https://bun.sh"><img alt="Bun" src="https://img.shields.io/badge/Bun-runtime-f7df1e?style=flat&amp;labelColor=132134&amp;logo=bun&amp;logoColor=f4f8fc"></a>
</p>

[English](README.md) · [Vue 指南](packages/vue/README.zh-CN.md) · [React 指南](packages/react/README.zh-CN.md) · [中文文档](docs/zh-CN/README.md)

</div>

<!-- Source: README.md -->
<!-- Source-SHA256: 8edeecb667cb31b557dc0fe656d53a124847bb8b2bc179bd897fc45597bad67b -->

## 设计语言

| 方面 | 提供内容 |
| --- | --- |
| **极光玻璃** | 唯一的共享玻璃材质，分为轻薄、标准与厚实三个层级。 |
| **主题** | 通过一个 `data-theme` 规则支持 `light`、`dark` 与 `system`。 |
| **样式变量** | 颜色、字体、间距、圆角与材质值以 CSS 变量提供。 |
| **Tailwind** | `bg-surface-raised`、`text-primary`、`rounded-control` 等语义工具类。 |
| **动效** | 共享时长、缓动、Presence 与页面过渡；尊重减少动效偏好。 |
| **密度** | 紧凑绘制尺寸，粗指针设备上扩大触控命中区。 |

极光玻璃是一种材质，不是三套独立样式：

| Surface | 层级 | 用途 |
| --- | --- | --- |
| `glass-subtle` | 轻薄 | 按钮、紧凑控件、薄层 |
| `glass-elevated` | 标准 | 卡片、浮动导航、主内容容器 |
| `glass-immersive` | 厚实 | 更强模糊与材质深度 |

CSS 基线无需 JavaScript 即可工作。`@neoverse-ui/glass-runtime` 是可选的边缘渲染增强；减少透明度与减少动效下仍保持可读、可操作。

## 安装

需要 Vue **3.5+** 或 React **19**。

```sh
npm install @neoverse-ui/vue
npm install @neoverse-ui/react
```

也可以使用 pnpm、Yarn 或 Bun。共享样式与动效依赖会随组件包一起安装。

## 快速开始

在应用入口导入一次样式表，然后使用组件。

```ts
import '@neoverse-ui/vue/index.css';
```

```vue
<script setup lang="ts">
import { UiButton, UiCard, UiField, UiInput } from '@neoverse-ui/vue';
</script>

<template>
  <UiCard surface="glass-elevated">
    <UiField control-id="name" label="Display name">
      <template #default="{ controlAttrs }">
        <UiInput v-bind="controlAttrs" placeholder="Your name" />
      </template>
    </UiField>
    <UiButton>Save</UiButton>
  </UiCard>
</template>
```

React 使用相同的组合方式，只是改为 React 的 props 与事件：

```tsx
import '@neoverse-ui/react/index.css';
import { UiButton, UiCard, UiField, UiInput } from '@neoverse-ui/react';

<UiCard surface="glass-elevated">
  <UiField controlId="name" label="Display name">
    {controlAttrs => <UiInput {...controlAttrs} placeholder="Your name" />}
  </UiField>
  <UiButton>Save</UiButton>
</UiCard>
```

## 组件

当前源码在 Vue 与 React 中都提供相同的 **37 个组件**：

| 分组 | 组件 |
| --- | --- |
| 操作 | `UiButton`、`UiIconButton`、`UiAction` |
| 表面 | `UiSurface`、`UiCard`、`UiControlSurface` |
| 导航 | `UiDock`、`UiNavigationItem`、`UiBreadcrumb`、`UiSegmentedControl` |
| 表单 | `UiField`、`UiInput`、`UiTextarea`、`UiSelect`、`UiCheckbox`、`UiRadioGroup`、`UiSwitch` |
| 浮层 | `UiPopover`、`UiDropdownMenu`、`UiContextMenu` |
| 反馈 | `UiBadge`、`UiStatusIndicator`、`UiNotice`、`UiTooltipSurface`、`UiSkeleton` |
| 数据 | `UiTable`、`UiDisclosure`、`UiStatCard`、`UiTimeline`、`UiStepFlow` |
| 终端 | `UiTerminalSurface`、`UiTerminalTranscript`、`UiTerminalLine`、`UiTerminalPrompt`、`UiTerminalEcho` |
| 滚动与出入场 | `UiScrollbar`、`UiPresence` |

按钮提供 `primary`、`secondary` 与 `ghost`，尺寸为 `sm`、`md` 与 `lg`。表单支持禁用、只读与校验状态。菜单与分段控件支持键盘导航。

## 主题

在根元素设置一个属性：

```html
<html lang="zh-CN" data-theme="system">...</html>
```

使用 `light`、`dark` 或 `system`。切换主题会保留组件尺寸与布局。

## Tailwind

项目已经使用 Tailwind CSS 4 时，导入共享主题：

```css
@import 'tailwindcss';
@import '@neoverse-ui/tokens/css';
@import '@neoverse-ui/tailwind/theme.css';

@source '../node_modules/@neoverse-ui/vue/dist';
```

然后可以省略组件包的 `index.css` 导入。使用语义工具类，或通过 `--neoverse-*` 变量定制主题。

## 软件包

| 包 | 提供内容 |
| --- | --- |
| [`@neoverse-ui/vue`](packages/vue/README.zh-CN.md) | Vue 3 组件 |
| [`@neoverse-ui/react`](packages/react/README.zh-CN.md) | React 19 适配器 |
| [`@neoverse-ui/tokens`](packages/tokens/README.zh-CN.md) | CSS 变量与名称映射 |
| [`@neoverse-ui/tailwind`](packages/tailwind/README.zh-CN.md) | Tailwind 主题与组件样式 |
| [`@neoverse-ui/motion`](packages/motion/README.zh-CN.md) | 动效角色与页面过渡 |
| [`@neoverse-ui/overlay-runtime`](packages/overlay-runtime/README.zh-CN.md) | 顶层定位与关闭 |
| [`@neoverse-ui/glass-runtime`](packages/glass-runtime/README.zh-CN.md) | 可选的极光玻璃边缘渲染 |
| [`@neoverse-ui/giscus-theme`](packages/giscus-theme/README.zh-CN.md) | Giscus 浅色与深色主题 |

## 文档

- [Vue 指南](packages/vue/README.zh-CN.md)与 [React 指南](packages/react/README.zh-CN.md)：API 与组合示例。
- [表单规范](docs/zh-CN/architecture/form-control-contract.md)、[浮层行为规范](docs/zh-CN/architecture/overlay-contract.md)与[终端组合](docs/zh-CN/architecture/terminal-composition.md)：交互规则。
- [材质标准](docs/zh-CN/architecture/material-standards.md)：极光玻璃光学与修复规则。
- [迁移指南](docs/zh-CN/releases/migration-0.3.1.md)：从 0.3.0 基线升级。
- [组件需求](docs/architecture/component-requests.md)：从消费项目提交可复用能力缺口。

## 开发

```sh
bun install
bun run dev
```

设计台使用 Vite 热更新 Vue、React 和 CSS。修改单个组件或样式时，不会重载页面，未受影响区域的状态会保留。修改热更新边界之外的共享入口时，仍可能重载页面。

`bun run check` 运行全部检查。架构、测试与发布规则见 [AGENTS.md](AGENTS.md) 与[文档规范](docs/AGENTS.md)。

## 许可

Neoverse-UI 以 [Star And Thank Author License 2.0](LICENSE) 发布。
