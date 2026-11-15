<div align="center">

<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/neoverse-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/images/neoverse.svg">
    <img src="docs/images/neoverse.svg" alt="Neoverse" width="320">
  </picture>
</h1>

**Neoverse-UI** 是面向 Vue 3 与 React 的组件库，提供极光玻璃表面、浅色与深色主题以及共享交互。适用于个人网站、文档、工具，以及带终端或数据展示的页面。

<p align="center">
  <a href="https://vuejs.org"><img alt="Vue 3" src="https://img.shields.io/badge/Vue-3-42b883?style=flat&amp;labelColor=132134&amp;logo=vue.js&amp;logoColor=f4f8fc"></a>
  <a href="https://react.dev"><img alt="React 19" src="https://img.shields.io/badge/React-19-61dafb?style=flat&amp;labelColor=132134&amp;logo=react&amp;logoColor=f4f8fc"></a>
  <a href="https://www.typescriptlang.org"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-8c9bff?style=flat&amp;labelColor=132134&amp;logo=typescript&amp;logoColor=f4f8fc"></a>
  <a href="https://tailwindcss.com"><img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat&amp;labelColor=132134&amp;logo=tailwindcss&amp;logoColor=f4f8fc"></a>
  <a href="https://bun.sh"><img alt="Bun" src="https://img.shields.io/badge/Bun-runtime-f7df1e?style=flat&amp;labelColor=132134&amp;logo=bun&amp;logoColor=f4f8fc"></a>
  <a href="https://biomejs.dev"><img alt="Biome" src="https://img.shields.io/badge/Biome-tooling-60a5fa?style=flat&amp;labelColor=132134&amp;logo=biome&amp;logoColor=f4f8fc"></a>
</p>

[English](README.md) · [Vue 指南](packages/vue/README.zh-CN.md) · [React 指南](packages/react/README.zh-CN.md) · [报告问题](https://github.com/SSJ-ZYJ/Neoverse-UI/issues)

</div>

<!-- Source: README.md -->
<!-- Source-SHA256: ad498503fbc618d1d8ead47f3ecad67be31cd9dc2937224ca582c28b224e005a -->

Vue 与 React 在当前源码中提供相同的 37 个组件，共享主题、样式与动效。可以直接使用组件，也可以用 CSS 变量与 Tailwind CSS 构建自己的布局。

## 安装

需要 Vue **3.5+** 或 React **19**。按框架安装对应的包：

```sh
# Vue
npm install @neoverse-ui/vue

# React
npm install @neoverse-ui/react
```

也可以使用 pnpm、Yarn 或 Bun。共享样式与动效依赖会随组件包一起安装。

本 README 描述当前源码。使用已发布版本时，请查看包变更日志，确认已安装版本提供的功能。

## 使用 Vue

在应用入口导入一次样式表：

```ts
import '@neoverse-ui/vue/index.css';
```

然后使用组件：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { UiButton, UiCard, UiField, UiInput } from '@neoverse-ui/vue';

const name = ref('');
const saved = ref(false);
</script>

<template>
  <UiCard as="section">
    <h2>Profile</h2>
    <UiField control-id="name" label="Display name" description="The name shown on your page">
      <template #default="{ controlAttrs }">
        <UiInput v-bind="controlAttrs" v-model="name" placeholder="Enter your name" />
      </template>
    </UiField>
    <UiButton @click="saved = true">{{ saved ? 'Saved' : 'Save' }}</UiButton>
  </UiCard>
</template>
```

## 使用 React

在应用入口导入一次样式表：

```ts
import '@neoverse-ui/react/index.css';
```

组件遵循 React 的 prop 与事件约定：

```tsx
import { useState } from 'react';
import { UiButton, UiCard, UiField, UiInput } from '@neoverse-ui/react';

export function Profile() {
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  return (
    <UiCard as="section">
      <h2>Profile</h2>
      <UiField controlId="name" label="Display name" description="The name shown on your page">
        {controlAttrs => (
          <UiInput
            {...controlAttrs}
            value={name}
            onChange={event => setName(event.currentTarget.value)}
            placeholder="Enter your name"
          />
        )}
      </UiField>
      <UiButton onClick={() => setSaved(true)}>{saved ? 'Saved' : 'Save'}</UiButton>
    </UiCard>
  );
}
```

在 Next.js 等框架中，把使用状态或事件处理器的组件放在客户端边界内。通过框架支持的入口导入全局样式。

## 组件

以下组件在 Vue 与 React 中都可用：

| 用途 | 组件 |
| --- | --- |
| 按钮与操作 | `UiButton`、`UiIconButton`、`UiAction` |
| 表面与容器 | `UiSurface`、`UiCard`、`UiControlSurface` |
| 导航与选择 | `UiDock`、`UiNavigationItem`、`UiBreadcrumb`、`UiSegmentedControl` |
| 表单 | `UiField`、`UiInput`、`UiTextarea`、`UiSelect`、`UiCheckbox`、`UiRadioGroup`、`UiSwitch` |
| 浮层与菜单 | `UiPopover`、`UiDropdownMenu`、`UiContextMenu` |
| 状态与反馈 | `UiBadge`、`UiStatusIndicator`、`UiNotice`、`UiTooltipSurface`、`UiSkeleton` |
| 数据与进度 | `UiTable`、`UiDisclosure`、`UiStatCard`、`UiTimeline`、`UiStepFlow` |
| 终端界面 | `UiTerminalSurface`、`UiTerminalTranscript`、`UiTerminalLine`、`UiTerminalPrompt`、`UiTerminalEcho` |
| 滚动与过渡 | `UiScrollbar`、`UiPresence` |

按钮提供 `primary`、`secondary` 与 `ghost` 变体，以及 `sm`、`md`、`lg` 尺寸。仅图标按钮使用 `label` 作为无障碍名称。表单控件支持禁用、只读与校验状态。分段控件与菜单支持键盘导航。

`UiDock` 组合导航项与尾部控件；路由与当前目标由应用管理。终端组件提供命令输入、建议与输出展示。输出增长时跟随尾部，向上滚动阅读历史时保留当前位置。命令执行与补全候选由应用提供。

更多示例：[表单](docs/zh-CN/architecture/form-control-contract.md) · [浮层](docs/zh-CN/architecture/overlay-contract.md) · [终端](docs/zh-CN/architecture/terminal-composition.md) · [Vue / React 对应](docs/architecture/framework-parity.md)

## 主题与材质

在根元素上设置 `data-theme` 为 `light`、`dark` 或 `system`：

```html
<html lang="zh-CN" data-theme="system">...</html>
```

未设置值时，主题也会跟随系统偏好。

带 `surface` prop 的组件可以使用普通表面或**极光玻璃**这一唯一共享玻璃材质：

| `surface` | 用途 |
| --- | --- |
| `none` | 透明容器 |
| `solid`、`subtle`、`elevated`、`inset` | 内容表面与布局层 |
| `glass-subtle` | 轻薄层级——轻量控件与薄极光玻璃层 |
| `glass-elevated` | 标准层级——卡片、浮动导航与主内容容器 |
| `glass-immersive` | 厚实层级——更强背景模糊与材质深度 |

这些是极光玻璃的层级，不是独立玻璃样式。`glass-*` 值是稳定的技术标识。消费项目应从 Tokens 获取共享展示名与层级短名，而不是自行定义：

```ts
import { glassMaterial } from '@neoverse-ui/tokens';

glassMaterial.name.en; // Aurora Glass
glassMaterial.name.zh; // Chinese display name
glassMaterial.tiers.subtle; // { en: 'Light', zh: Chinese tier name }
glassMaterial.tiers.elevated; // { en: 'Standard', zh: Chinese tier name }
glassMaterial.tiers.immersive; // { en: 'Immersive', zh: Chinese tier name }
```

部分控件只接受极光玻璃预设与 `none`；具体选项见组件类型。极光玻璃需要可见的背景内容才能呈现效果。透明度效果不可用或用户偏好减少透明度时，表面仍保持可读。共享光学规范见[材质标准](docs/zh-CN/architecture/material-standards.md)。

组件尊重系统的减少动效偏好。切换主题会保留组件尺寸与布局。

## 样式与定制

上面的 `index.css` 导入包含组件所需样式，因此无需 Tailwind 构建即可使用。样式包包含组件使用的工具类；应用中的其他 Tailwind 工具类需要自己的构建。

如果项目已使用 **Tailwind CSS 4**，用以下导入共享主题并生成应用工具类：

```css
@import 'tailwindcss';
@import '@neoverse-ui/tokens/css';
@import '@neoverse-ui/tailwind/theme.css';

/* Adjust the path relative to this stylesheet. Use react instead of vue for React. */
@source '../node_modules/@neoverse-ui/vue/dist';
```

采用此方式后可以省略组件包的 `index.css` 导入。使用 `text-primary`、`bg-surface-raised`、`rounded-control` 等语义工具类，或通过 `--neoverse-*` CSS 变量定制主题。

也可以按需安装单个包：

| 包 | 提供内容 |
| --- | --- |
| [`@neoverse-ui/tokens`](packages/tokens/README.zh-CN.md) | 颜色、字体、间距等的 CSS 变量与 TypeScript 名称映射 |
| [`@neoverse-ui/tailwind`](packages/tailwind/README.zh-CN.md) | Tailwind 主题、组件样式与阅读排版 |
| [`@neoverse-ui/motion`](packages/motion/README.zh-CN.md) | 入场与出场动画、列表过渡与页面过渡 |
| [`@neoverse-ui/glass-runtime`](packages/glass-runtime/README.zh-CN.md) | 可选的极光玻璃边缘渲染增强 |
| [`@neoverse-ui/giscus-theme`](packages/giscus-theme/README.zh-CN.md) | Giscus 评论的浅色与深色主题 |

## 开发

需要 [Bun](https://bun.sh) 1.4 与兼容 Node 的工具链。安装工作区并启动 Design Lab：

```sh
bun install
bun run dev
```

| 命令 | 用途 |
| --- | --- |
| `bun run check` | 运行全部检查并输出通过/失败摘要 |
| `bun run test` | 工作区单元测试与仓库接口测试 |
| `bun run test:e2e` | 构建后运行 Chromium 桌面与触控浏览器用例 |
| `bun run typecheck` | 构建声明后对每个工作区做类型检查 |

架构、接口、测试归属与发布流程见[文档](docs/zh-CN/README.md)。影响包的改动需要 Changeset，并完成仓库 Agent 说明中的验证。

## 参与贡献

- [Issues](https://github.com/SSJ-ZYJ/Neoverse-UI/issues)：报告缺陷或请求组件。请附上框架、组件版本、复现步骤与期望结果。
- [组件需求](docs/architecture/component-requests.md)：消费项目使用的记录与命令流程。

## 许可

Neoverse-UI 以 [MIT 许可](LICENSE)发布。