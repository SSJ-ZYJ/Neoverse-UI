# 从 0.2.x 迁移到已发布的 0.3.0 基线

Status: adopted

[English](../../releases/migration-0.3.0.md)

<!-- Source: docs/releases/migration-0.3.0.md -->
<!-- Source-SHA256: 312e81e6bdd89051fb801e6f3173255cb86439fe5f572a06587a493f9f835bb5 -->

0.3.0 基线于 2026-10-21 发布，官方 Registry 于 2026-10-25 复核。下表中的精确版本已在 npm 上可用；后续仅存在于源码的 React 对应与 `UiTerminalEcho` 新增不在本次发布内。参见[发布证据](../../releases/release-0.3.0.md)。较早的[0.1.x → 0.2.0 指南](../../releases/migration-0.2.0.md)仍适用于更早的消费项目。

## 包协同与可用性

各包版本独立：`.changeset/config.json` 没有 fixed 或 linked 版本组。合并后的版本计划是：

| 包 | 发布版本 | 消费项目影响 |
| --- | --- | --- |
| `@neoverse-ui/tokens` | 0.3.0 | 表单/浮层与终端角色、移除 chrome、共享视觉与尺寸更新 |
| `@neoverse-ui/tailwind` | 0.3.0 | 匹配的编译 CSS 与组件样式 |
| `@neoverse-ui/vue` | 0.3.0 | Vue 3.5 要求、表单/浮层、终端与展示适配器 |
| `@neoverse-ui/react` | 0.3.0 | 共享表单/浮层行为与 surface 切换 |
| `@neoverse-ui/overlay-runtime` | 0.3.0 | 共享锚定浮层运行时 |
| `@neoverse-ui/glass-runtime` | 0.2.1 | 实时背景边缘、可选 native 后端、恢复与清理 |
| `@neoverse-ui/motion` | 0.2.1 | Vue 列表重排 FLIP 动效修复 |
| `@neoverse-ui/giscus-theme` | 0.2.0（未变） | 无需新发布 |

不要给每个包统一指定 `0.3.0`。带版本的 manifest 已包含协同的内部范围。`^0.2.0` 范围不接纳 `0.3.x`，因此只改顶层适配器而保留旧 overrides 不是协同升级。参见[发布说明](../../releases/release-0.3.0.md)，并在发布后运行 `bun run verify:published` 验证精确的 Registry 版本与安装结果。

Vue 与 React 现在除 Motion 与 Tailwind 外还依赖 Overlay Runtime；Tailwind 引入 Tokens 与 Motion。普通适配器消费项目无需自行导入运行时。直接使用运行时的消费项目应阅读其[公开指南](../../../packages/overlay-runtime/README.zh-CN.md)。

**发布证据：** 上述八个版本都已在官方 Registry 上，[Release 39613361164](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/39613361164) 完成发布与 Registry 安装检查。后续发布遵循[发布准备与发布](../../releases/releasing.md)：`bun run check:release-registry` 只检查包名可用性，不建立当前 Trusted Publisher 配置或授权。

## 必需的源码切换

### 移除 chrome surface

在 Vue、React 与直接 CSS 组合中替换已移除的公开 surface 与 CSS 类：

| 已移除 | 规范替代 |
| --- | --- |
| `surface="chrome"` / React `surface="chrome"` | 显式轻薄的 Glass 平面使用 `surface="glass-subtle"` |
| `ui-surface-chrome` | `material-glass-subtle` |
| chrome 专用材质/效果变量与 TypeScript 变量导出 | 共享 Glass 材质变量与控制表面几何变量 |

不保留兼容别名。移除消费项目的 chrome 配方，而不是用本地别名重建被删除的材质。尽可能使用框架 `surface` prop；参见[材质标准](../architecture/material-standards.md)。

较早的 `remove-chrome-surface` Changeset 描述了轻薄的 Dock 默认值，但后续 `dock-elevated-glass` 变更与当前两套适配器都把 **`UiDock` 默认设为 `glass-elevated`**。确实需要更轻平面时显式选择 `glass-subtle`。Dock 分组与内嵌控件几何仍是共享职责，不是恢复 chrome 的理由。

### 框架要求与样式

- Vue 现在要求 **`>=3.5.0 <4.0.0`**。采用新适配器前先协同升级消费项目的 Vue 运行时/工具链：Field 与选择控件使用 Vue 的 SSR 稳定 `useId`。
- React 的 0.3.0 manifest 要求 **`>=19.0.0 <20.0.0`**。该发布不包含后续仅源码的 React 终端/展示适配器；未发布新增见[当前框架对应](../../architecture/framework-parity.md)。
- 适配器代码、Tokens 与编译后的消费端 CSS 必须来自同一个已批准发布计划。没有 Tailwind 构建的消费项目可以使用适配器 `index.css` 入口；升级 JS 后不要保留旧的复制 vendor 样式表。安装示例见 [Vue](../../../packages/vue/README.zh-CN.md) 与 [React](../../../packages/react/README.zh-CN.md) 指南。

## 表单与锚定浮层

`UiCheckbox`、`UiRadioGroup`、`UiSwitch`、`UiField`、`UiPopover` 与 `UiDropdownMenu` 具有共享的 Vue/React 行为。采用规范控件，不要继续携带本地替代实现，但应用校验与状态仍留在消费项目。

Field 组合中，用 `v-bind` 绑定 Vue 作用域插槽的 `controlAttrs`，或把 React 函数子节点的 `controlAttrs` 展开到真实输入上。为标签关联提供 `control-id` / `controlId`。这些绑定包含传入的控件 ID、当前已渲染的描述/消息，以及启用时的原生 `required`/`disabled` 标记。普通子节点不会被克隆或自动接线。显式合并额外的消费项目 `aria-describedby` ID，并单独传入控件的 `validation`。Field 不校验值，也不重置受控状态。

提交时保留原生名称与值。Vue `v-model` 与 React 受控状态必须由应用重置；React 非受控原生选择输入保留浏览器重置行为。`readonly` / `readOnly` 保持可聚焦、可提交。绑定语法与校验状态使用既有[表单控件规范](../architecture/form-control-contract.md)与包示例，不要引入包装兼容 API。

Select 现在与 Popover、DropdownMenu 共享 Overlay Runtime 定位/跟踪。切换到这些适配器时移除重复的消费端定位/关闭实现。受控 `open` 仍是最终状态：关闭请求被接受时必须更新消费项目状态；保持 `open=true` 的父级会让面板保持打开。验证 Escape、外部激活、触发器焦点恢复、菜单键盘导航、滚动/缩放，以及没有原生 Popover API 时的固定定位回退。Popover 是非模态的，不捕获焦点，也不是模态对话框替代品。精确行为与职责边界见[浮层行为规范](../architecture/overlay-contract.md)。

## 终端与展示消费项目

终端基础组件与语义角色包含在 Vue 0.3.0 中。它导出 `UiTerminalSurface`、`UiTerminalLine`、`UiTerminalTranscript` 与 `UiTerminalPrompt`；使用 `cssVariables.components.terminal` 与共享 `--neoverse-terminal-*` 角色，而不是消费项目自有的调色板。终端渲染是展示，不是 Shell 模拟器或命令运行时。

此前围绕 `UiInput` 构建的 Shell 式命令输入应切换到 `UiTerminalPrompt`：编辑器是外层终端 Glass 表面内的无边框原生输入。`UiInput` 仍是规范表单输入，不是终端兼容包装。命令执行、Enter 处理与历史归消费项目所有。React **0.3.0** 不导出这些终端适配器；当前源码单独添加它们。当前示例、transcript 跟随、主题角色与 Maple 字体回退规则见[终端组合](../architecture/terminal-composition.md)；本次新增不捆绑字体。

**XCA 验收：** [CR-20261010-2A6D0E6E](../../../contracts/component-requests/archive/CR-20261010-2A6D0E6E.json) 已于 2026-10-23 交付并归档。已发布的 Tokens 0.3.0 包含这些变量；用户确认了本地/npm Token 一致，并接受 XCA 的本地 `file:` 消费证据，无需切换依赖来源。参见[带日期的验收](../../../.agents/notes/archives/acceptance-2026-10-20-terminal-tokens.md)；不要重新打开或重实现该请求。

Vue 0.3.0 还新增 `UiStatCard`、`UiTimeline` 与 `UiStepFlow`。它们的[归档交付决议](../../../contracts/component-requests/archive/)记录了 2026-10-13 完成的发布级视觉与真实 Slides 消费验证；组件矩阵把它们记为 Stable。这些组件的 React 适配器存在于后续源码，不在 React 0.3.0 中；Vue 消费证据不能建立 React 消费验证。

## 实际升级与验证顺序

1. 盘点直接消费的包、lockfile 版本、根 overrides、本地 `file:`/link 依赖与复制的 CSS。识别 chrome 引用、Shell 式 `UiInput` 组合与本地表单/浮层替代实现。
2. 在允许的前提下，针对刻意同步的本地工作区准备源码切换与框架前置条件。本地产物遵循[消费尺寸与本地同步](../../architecture/consumer-sizing.md)；只重新构建本仓库不会刷新已过期的安装副本。XCA 已接受的本地依赖模式无需为了其归档 Token 请求而改变。
3. 0.2.x → 0.3.0 迁移使用上面的协同已发布基线。对于后续仅源码 API，发布负责人必须审阅各自的 Changesets 计划、完成检查并授权版本管理与发布；本指南不执行其中任何操作。
4. 把所有直接消费的 UI 包升级到已批准的协同版本，解析传递版本与 overrides，刷新 lockfile，并重新生成复制的/vendor CSS。不要用一个假定版本覆盖所有包，也不要手动强制未发布的传递依赖。
5. 运行消费项目的类型检查与生产构建。检查适用时的 SSR/水合 ID、Field 标签/描述/消息关联、required/disabled/readonly 提交、受控与非受控重置，以及原生与回退路径上的浮层行为。
6. 用正常根字号在浅色/深色/系统主题、桌面/移动宽度下检查真实页面。检查 Dock 几何/默认材质、终端对比与滚动历史、表单、Badge/Skeleton/Tooltip 材质变化、减少动效/透明度，以及支持时的强制颜色行为。共享尺寸预期与既有消费检查见[消费尺寸](../../architecture/consumer-sizing.md)。
7. 关闭请求或提升成熟度前记录真实的消费证据。通过的 Playground 样例、本地同步或本迁移指南本身都不是发布或消费验收证据。

不要为已移除 API 添加 shim。缺失的规范能力应通过现有组件需求流程报告，而不是静默维护第二套设计规则。