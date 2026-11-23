# @neoverse-ui/vue

[English](README.md)

<!-- Source: packages/vue/README.md -->
<!-- Source-SHA256: f95023a15e4579adac86a527b1586d2cead23d34de28303a12cfb4886963f2e8 -->

Neoverse-UI 设计系统的 Vue 3 组件，以极光玻璃作为共享玻璃材质。Light、Standard 与 Immersive 是它的层级，不是独立样式。展示标签使用 [Tokens 的 `glassMaterial` 元数据](../tokens/README.zh-CN.md#极光玻璃)；`glass-*` surface 标识保持稳定。详见[材质标准](../../docs/zh-CN/architecture/material-standards.md)。

```sh
bun add @neoverse-ui/vue
```

```ts
import { UiButton, UiCard, UiDisclosure, UiDock, UiNotice, UiTable, UiTooltipSurface } from '@neoverse-ui/vue';
```

没有自有 Tailwind 构建的消费项目可以导入打包好的设计系统样式。该入口转发到编译后的共享消费端样式包，包含 Tokens、Motion、Material、组件选择器以及适配器所需的工具类：

```css
@import '@neoverse-ui/vue/index.css';
```

`UiDock` 是构建在共享 `UiControlSurface` 行为上的公开浮动导航外壳。消费项目提供自己的 `UiNavigationItem` 子节点、路由状态、图标与可选 `trailing` 控件；Dock 负责外观、缩放、紧凑布局、分隔线几何与共享导航指示器行为。`UiNavigationItem` 还在标签内提供 `suffix` 插槽，用于需要与主文字共用基线的次要文本；`decoration` 插槽会与内置的选中指示条一同渲染。

Vue `>=3.5 <4` 是必需的 peer dependency。Field 与选择控件的 ID 使用 [Vue 3.5 引入的 SSR 稳定 `useId` API](https://blog.vuejs.org/posts/vue-3-5#useid)。共享的 Tailwind、Motion、Tokens 与 Overlay Runtime 层通过包依赖图安装。

## 公开组件

`UiButton`、`UiIconButton`、`UiAction`、`UiBreadcrumb`、`UiNavigationItem`、`UiSegmentedControl`、`UiControlSurface`、`UiDock`、`UiSurface`、`UiCard`、`UiInput`、`UiTextarea`、`UiSelect`、`UiCheckbox`、`UiRadioGroup`、`UiSwitch`、`UiField`、`UiPopover`、`UiDropdownMenu`、`UiContextMenu`、`UiTable`、`UiDisclosure`、`UiBadge`、`UiStatusIndicator`、`UiSkeleton`、`UiScrollbar`、`UiNotice`、`UiTooltipSurface`、`UiPresence`、`UiTerminalSurface`、`UiTerminalLine`、`UiTerminalTranscript`、`UiTerminalPrompt`、`UiTerminalEcho`、`UiStatCard`、`UiTimeline` 与 `UiStepFlow` 从包根导出。

`UiTooltipSurface` 为标签做动画，同时从第一帧起完整应用材质板与背景模糊。不要把不透明度与滤镜动画放在它的根节点上：它们会把材质板与真实背景隔离，使模糊只在入场结束后出现。定位、触发状态与展开语义仍归消费项目负责。

`UiBadge` 的 `sm` / `md` / `lg` 尺寸共享 `--neoverse-badge-font-family` 与 `--neoverse-badge-font-weight`。字号遵循共享标签尺度（16px 根字号下为 13 / 14 / 16px）；各尺寸的行高与内边距保留既有几何。

终端组合（极光玻璃窗口、输出行、滚动历史与原生终端输入）记录在[终端组合](../../docs/zh-CN/architecture/terminal-composition.md)。内嵌 transcript 使用 `scrollbar-immersive`；`UiScrollbar` 保留给文档滚动。服务端渲染的 `UiScrollbar` 会发布 `data-hide-native`，因此原生滚动条在首次绘制时消失，而不是等到水合后；用 `ClientOnly` 包裹则保留旧的挂载后切换行为。

`UiTerminalEcho` 显示已记录命令的 `text`，沿用实时提示的 `segments`、`symbol`、`error` 状态与 `#segment` 渲染，但没有输入或 Tab 停靠点。提交历史时捕获 segment 值；不要把旧命令绑定到当前目录。

## 指标、里程碑与步骤

```vue
<script setup lang="ts">
import { UiStatCard, UiStepFlow, UiTimeline, type StepFlowItem, type TimelineItem } from '@neoverse-ui/vue';

const milestones: readonly TimelineItem[] = [
  { id: 'design', title: 'Design', description: 'Shared contract', time: 'October 1', dateTime: '2026-10-01' },
  { id: 'release', title: 'Release', description: 'Consumer validation', time: 'October 12', dateTime: '2026-10-12' },
];
const steps: readonly StepFlowItem[] = [
  { id: 'plan', title: 'Plan', status: 'complete', statusLabel: 'Completed' },
  { id: 'build', title: 'Build', description: 'Implement the contract', status: 'current', statusLabel: 'Current' },
  { id: 'verify', title: 'Verify', status: 'pending', statusLabel: 'Pending' },
];
</script>

<template>
  <div class="ui-stat-grid">
    <UiStatCard label="Latency" :value="0" unit="ms" footnote="Includes zero-valued metrics" />
    <UiStatCard label="Coverage" :value="98.6" unit="%" trend="+2.4% this month" />
  </div>
  <UiTimeline :items="milestones" aria-label="Milestones" />
  <UiStepFlow :items="steps" aria-label="Delivery steps" />
</template>
```

- `UiStatCard` 使用 `UiSurface`（默认 `surface="glass-elevated"`）与原生定义列表。`value` 是字符串或数字，包含零值。`unit`、`trend` 与 `footnote` 是可选文本；`label`、`value`、`trend` 与 `footnote` 具名插槽可定制内容。趋势含义、格式与本地化归消费项目负责。`.ui-stat-grid` 在可用宽度内适配两到四张卡片，并在狭窄容器中堆叠。
- `UiTimeline` 是垂直有序列表；条目要求稳定唯一的 `id` 与 `title`，可选 `description`、`time` 与机器可读的 `dateTime`。`#item="{ item, index }"` 插槽替换主体，但不替换列表或装饰轴。不导出水平变体。
- `UiStepFlow` 是静态有序列表，不是步骤控制器。条目要求稳定唯一的 `id` 与 `title`，可选 `description`、`status`（`pending`、`current`、`complete`）与本地化 `statusLabel`。推进由消费项目负责，并且最多把一个条目标记为 current。Current 条目暴露 `aria-current="step"`；状态形状彼此不同，并在提供时用 `statusLabel` 作为无障碍名称。`#item="{ item, index }"` 与 `#status="{ item, index }"` 定制主体与本地化状态。低于 48rem 的容器使用垂直步骤；更宽的容器使用等宽水平布局。
- 字符串 prop 按文本渲染，绝不作为 HTML。三个组件都复用既有主题/排版 Tokens，不引入动效。它们是 Vue Consumer Driven 组件；不声称已有 React 适配、发布级视觉验收或 Neoverse-Slides 的真实接入。
- Design Lab 深链接：`#data-display-stat-card`、`#data-display-timeline` 与 `#data-display-step-flow`。导入上面的打包样式表以获得组件选择器与 `.ui-stat-grid`。

响应式步骤阈值在构建时从共享 Tailwind 的 `--breakpoint-md` 解析（默认 48rem）；指标最小宽度来自 `--neoverse-layout-container-md`。零配置的 `index.css` 入口已经编译。使用 `components.css` / `theme.css` 源码门面的消费项目必须通过 Tailwind 编译，而不是把门面当作普通浏览器样式表加载。

## 表单与浮层

```vue
<UiField
  v-slot="{ controlAttrs }"
  control-id="email"
  label="Email"
  description="Used for release notifications."
  :message="emailError"
  :validation="emailError ? 'error' : 'none'"
  required
>
  <UiInput v-bind="controlAttrs" v-model="email" type="email" :validation="emailError ? 'error' : 'none'" />
</UiField>

<UiCheckbox v-model="notifications" name="notifications">Release notifications</UiCheckbox>
<UiPopover aria-label="Project details">
  <template #trigger>Details</template>
  <p>Project details</p>
</UiPopover>
<UiDropdownMenu :items="actions" aria-label="Project actions" @select="onAction">
  <template #trigger>Actions</template>
</UiDropdownMenu>
```

`controlAttrs` 包含传入的 `controlId`、通过 `aria-describedby` 关联的已渲染描述/消息 ID，以及启用时的原生 `required`/`disabled` 标记。`descriptionId` 与 `messageId` 覆盖 SSR 稳定默认值。把这些属性绑定到真实控件；普通子节点仍受支持，不会被自动改写。显式合并额外的消费项目描述 ID。Field 不校验值，也不重置受控状态。

选择控件使用 `v-model<boolean>`，RadioGroup 使用 `v-model<string | number>`。原生名称与值仍参与表单提交；重置 `v-model` 的消费项目同时负责同步表单状态。`readonly` 保持控件可聚焦并阻止变化。

`UiInput type="number"` 渲染主题化增减按钮，同时保留原生数字输入、键盘方向键与 `min`/`max`/`step` 约束。`increment-label` 与 `decrement-label` 本地化其无障碍名称（默认：`Increase value` / `Decrease value`）。使用 `step="any"` 时，按钮按 1 改变值并保留小数部分。禁用与只读输入会同时禁用两个按钮。

Popover 是非模态的，不捕获焦点。Popover/DropdownMenu 支持 `v-model:open`、`default-open`、`disabled` 与放置方式；Select 共享同一套定位运行时。关闭与焦点策略见仓库中的表单与浮层规范。

## Presence

```vue
<script setup lang="ts">
import { UiPresence, presence, staggerStyle } from '@neoverse-ui/vue';
</script>

<UiPresence :show="open" variant="pop" origin="top">Panel content</UiPresence>

<Transition name="nv">
  <span v-if="open" v-bind="presence('rise')">Content</span>
</Transition>
```

`UiPresence` 在共享出场动画期间保留子节点，随后卸载，并带基于变量的超时兜底。`presence(variant, origin?)` 把共享预设属性绑定到原生 Vue 过渡；`staggerStyle(index, options?)` 为 `TransitionGroup name="nv"` 子节点设置入场延迟。预设、时序与减少动效行为归 `@neoverse-ui/motion` 负责。

## 布局宽度动效

```vue
<script setup lang="ts">
import { useLayoutWidthMotion } from '@neoverse-ui/vue';

const header = ref<HTMLElement | null>(null);
useLayoutWidthMotion({
  root: header,
  targets: '.brand, .navigation > [data-surface]',
  trigger: () => [locale.value, theme.value],
});
</script>

<template>
  <div ref="header">
    <div class="brand">…</div>
    <nav class="navigation"><div data-surface>…</div></nav>
  </div>
</template>
```

该组合式函数在更新前采样每个可见目标，随后在共享 `spatial` 角色上为变化的宽度做动画，因此随文案增减的一组盒子——语言切换、主题标签——会沿同一条曲线运动。消费项目提供容器、选择器与触发值；采样、终点解析、中断与清理保留在共享库中。被中断的变化从已到达的帧继续；缩放、减少动效切换或卸载会结束运行，而不是留下过期终点。首次渲染或水合时不播放动画。变宽的盒子在运行期间保持替换文案在一行，使更长标签随盒子展开而显现，而不是在动画中途换行；共享方法在运行结束时恢复消费项目的内联样式。

Design Lab 在两处使用该组合式函数：Motion 模块的 `foundation-motion-width` 样例，以及它自己的工具栏——主题、语言与返回总览控件在语言切换时一起运动。两者都由实验室语言控件驱动。

完整组件 API 与架构说明见 [Neoverse-UI 仓库](https://github.com/SSJ-ZYJ/Neoverse-UI)。