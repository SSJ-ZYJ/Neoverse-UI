# Vue / React 功能对应

Status: adopted

Vue 与 React 提供相同的公开组件。两套适配复用 Tokens、Tailwind 组件样式、Motion 与 Overlay Runtime，业务数据和路由仍由使用方管理。

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

`ButtonVariant` 在两端共享：`primary` 为主要蓝色，`secondary` 为次要样式，`ghost` 无填充；`success` 为成功绿，`warning` 为警告琥珀色，`danger` 为危险红，`accent` 为强调紫。

两端从 `@neoverse-ui/tokens` 重导出 `Material`、`SurfaceRole`、`GlassTier`、`SurfacePreset`、`ControlSurfacePreset`、`getSurfaceClass` 和 `isGlassSurface`；门禁校验重导出指向同一份类型声明。两端共用自动材质、显式预设和 Portal 作用域规则。Tabs 省略 `variant` 时跟随作用域，显式 `variant="glass"` 保留极光玻璃。材质职责见[组件矩阵](../../contracts/component-matrix.json)，行为细节见[共享材质规范](material-standards.md#shared-material-selection)。

## 命名内容和根元素

- `UiNavigationItem`：Vue 的 `#suffix`、`#decoration` 对应 React 的 `suffix`、`decoration`。后缀位于标签内部，装饰内容位于内置指示器之前；`trailing` 仍是独立位置。
- `UiBreadcrumb`：Vue 的 `#separator="{ index }"` 对应 React 的 `renderSeparator({ index })`。索引是分隔符后方条目的从零开始的索引。未提供渲染函数时使用 `separator`；函数返回 `null` 时保留位置，不渲染分隔符内容。
- `UiPresence` 和 `UiNotice` 的 `as` 接受标签名。`UiDock` 和 `UiControlSurface` 也可使用自定义组件；组件须把收到的属性和内容转交给根元素。

## 本次补齐

- 导航：`UiControlSurface`、`UiNavigationItem`、`UiSegmentedControl`；`UiDock` 复用 ControlSurface 并支持默认启用的 `navigationIndicator`。
- 反馈：`UiBadge`、`UiStatusIndicator`、`UiTooltipSurface`、`UiSkeleton`。
- 数据展示：`UiStatCard`、`UiTimeline`、`UiStepFlow`。
- 终端：`UiTerminalSurface`、`UiTerminalTranscript`、`UiTerminalLine`、`UiTerminalPrompt`、`UiTerminalEcho`。Echo 使用共享提示符分段渲染器，历史为可选择的纯文本，不产生输入框或 Tab 停靠点。
- 页面滚动：`UiScrollbar`，包含拖拽、轨道定位、自动隐藏和卸载清理。
- Vue 公开导出已有的 `SkeletonVariant` 类型。

TerminalPrompt 的 `suggestion` 在两端都只显示匹配的候选后缀；接收候选和执行命令由使用方处理。终端输出仅在读者处于末尾时跟随更新。Timeline 与 StepFlow 的 React `renderItem` 接收 `{ item, index }`，StepFlow 还提供 `renderStatus`。

## 验证与边界

- `contracts/framework-parity.json`：校验组件、数据结构、字面量类型和登记的命名插槽对应关系，覆盖两条成熟度轨道。
- `packages/react/src/tests/parity.test.tsx`：SSR、原生语义、可访问标签、默认状态与定制内容。
- `/react-fixture?contract-fixtures`：Design Lab 中的实际 React DOM 与状态示例。
- `tests/e2e/parity/parity.spec.ts`：桌面和移动端、深浅主题下每个 React 适配器的语义 DOM、主题解析与共享控件名称；键盘选择、受控拒绝、终端补全、输出跟随、滚动条拖拽等交互分别由 `components/` 下的对应规格覆盖。
- `scripts/release/verify-packages.ts`：在临时消费项目安装本地打包产物，检查公开导出和类型。

新 React 适配的真实产品使用验证和发布级截图仍待补充。已有矩阵中的 Vue / 共享组件验收记录保留，新增 `reactValidation` 单独记录 React 的验证范围。新增运行态示例不作为真实产品验收或成熟度提升依据。

Neoverse-Doc 现有 React 接入继续使用原有组件；本次不通过替换消费项目的业务界面来制造新增组件的使用证据。Vue 的 XCA / Slides 等已有消费记录也不自动视为 React 验证。
