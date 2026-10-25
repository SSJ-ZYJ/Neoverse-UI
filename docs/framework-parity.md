# Vue / React 功能对应

Vue 与 React 现提供相同的 36 个公开组件。两套适配复用 Tokens、Tailwind 组件样式、Motion 与 Overlay Runtime，业务数据和路由仍由使用方管理。

## 状态与事件

| 用途 | Vue | React |
| --- | --- | --- |
| 文本、选择值 | `v-model` / `update:modelValue` | `value` / `onChange`，Select、RadioGroup 使用 `onValueChange` |
| SegmentedControl | `v-model` / `defaultValue` | `value` / `defaultValue` / `onValueChange` |
| Checkbox、Switch | `v-model` | `checked` / `defaultChecked` / `onCheckedChange` |
| TerminalPrompt | `v-model` | `value` / `defaultValue` / `onValueChange`，同时保留原生 `onChange` |
| 只读 | `readonly` | `readOnly` |
| 弹层展开 | `open` / `update:open` | `open` / `onOpenChange` |
| 命名内容 | 命名插槽 | 对应的 ReactNode 属性或 render 函数 |
| Field 绑定 | `#default="{ controlAttrs }"` | `children(controlAttrs)` |
| 路由导航 | `as` 传入路由组件 | Action、NavigationItem 使用 `asChild` 包裹路由元素 |
| Prompt 聚焦 | 组件 ref 的 `focus()` | input ref 的 `focus()` |

React 的原生事件名称、`className`、`htmlFor` 和 ref 遵循 React 约定。框架适配不要求把这些名称改写为一致的拼写。

## 本次补齐

- 导航：`UiControlSurface`、`UiNavigationItem`、`UiSegmentedControl`；`UiDock` 复用 ControlSurface 并支持默认启用的 `navigationIndicator`。
- 反馈：`UiBadge`、`UiStatusIndicator`、`UiTooltipSurface`、`UiSkeleton`。
- 数据展示：`UiStatCard`、`UiTimeline`、`UiStepFlow`。
- 终端：`UiTerminalSurface`、`UiTerminalTranscript`、`UiTerminalLine`、`UiTerminalPrompt`、`UiTerminalEcho`。Echo 使用共享提示符分段渲染器，历史为可选择的纯文本，不产生输入框或 Tab 停靠点。
- 页面滚动：`UiScrollbar`，包含拖拽、轨道定位、自动隐藏和卸载清理。
- Vue 公开导出已有的 `SkeletonVariant` 类型。

TerminalPrompt 的 `suggestion` 在两端都只显示匹配的候选后缀；接收候选和执行命令由使用方处理。终端输出仅在读者处于末尾时跟随更新。Timeline 与 StepFlow 的 React `renderItem` 接收 `{ item, index }`，StepFlow 还提供 `renderStatus`。

## 验证与边界

- `contracts/framework-parity.json`：36 个组件、9 个数据结构与 21 组字面量类型；已覆盖 consumer-driven 组件，不仅检查 Canonical Shared。
- `packages/react/src/parity.test.tsx`：SSR、原生语义、可访问标签、默认状态与定制内容。
- `/react-fixture?contract-fixtures`：Design Lab 中的实际 React DOM 与状态示例。
- `tests/visual/react-parity.spec.ts`：桌面和移动端、深浅主题下的键盘选择、受控拒绝、指示器位置及 CSS zoom、终端补全与 IME、回显上下文/选字/截图、输出跟随及历史位置、滚动条拖拽与卸载清理。Echo 有 480/1440 宽度深浅主题截图，其余新增适配仍以功能检查为主。
- `scripts/verify-packages.ts`：在临时消费项目安装本地打包产物，检查公开导出和类型。

新 React 适配的真实产品使用验证和发布级截图仍待补充。已有矩阵中的 Vue / 共享组件验收记录保留，新增 `reactValidation` 单独记录 React 的验证范围。新增运行态示例不作为真实产品验收或成熟度提升依据。

Neoverse-Doc 现有 React 接入继续使用原有组件；本次不通过替换消费项目的业务界面来制造新增组件的使用证据。Vue 的 XCA / Slides 等已有消费记录也不自动视为 React 验证。
