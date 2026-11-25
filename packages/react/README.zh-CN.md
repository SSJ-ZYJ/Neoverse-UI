# @neoverse-ui/react

[English](README.md)

<!-- Source: packages/react/README.md -->
<!-- Source-SHA256: d474de3a479becd211c98507b79eb199a9d2b7c4c0a7d0ece2b6816fa380186f -->

Neoverse-UI 的 React 适配器，以极光玻璃作为共享玻璃材质。Light、Standard 与 Immersive 是它的层级，不是独立样式。展示标签使用 [Tokens 的 `glassMaterial` 元数据](../tokens/README.md#极光玻璃)；`glass-*` surface 标识保持稳定。详见[材质标准](../../docs/zh-CN/architecture/material-standards.md)。

此包提供与 Vue 包相同的公开组件，包括导航、表单、浮层、反馈、数据展示、终端组合与文档滚动条。两套适配器复用共享的 Tokens、Tailwind、Material、Motion 与 Overlay Runtime。状态绑定与验证范围见[框架对应](../../docs/architecture/framework-parity.md)。

## 表单与浮层

```tsx
<UiField controlId="email" label="Email" description="Release notifications" message={emailError} required>
  {(controlAttrs) => (
    <UiInput {...controlAttrs} type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} validation={emailError ? 'error' : 'none'} />
  )}
</UiField>

<UiCheckbox checked={notifications} onCheckedChange={setNotifications} name="notifications">
  Release notifications
</UiCheckbox>
<UiPopover trigger="Details" ariaLabel="Project details"><p>Project details</p></UiPopover>
<UiDropdownMenu trigger="Actions" ariaLabel="Project actions" items={actions} onSelect={onAction} />
```

Field 的函数子节点接收 `UiFieldControlAttrs`：传入的控件 ID、用于已渲染描述/消息的 `aria-describedby`，以及启用时的原生 `required`/`disabled` 标记。`descriptionId` / `messageId` 可覆盖 SSR 稳定默认值。把这些属性展开到控件上，并显式合并消费项目的描述 ID。普通子节点继续工作，不会被自动改写。Field 不校验值，也不重置受控状态。

Checkbox/Switch 接受原生 `checked/defaultChecked/onChange` 以及 `onCheckedChange`；RadioGroup 使用 `value/defaultValue/onValueChange`。受控表单重置必须同步消费项目状态；非受控原生选择控件保留浏览器重置行为。`readOnly` 阻止值变化，但保持可聚焦。

`UiInput type="number"` 渲染主题化增减按钮，同时保留原生数字输入、键盘方向键与 `min`/`max`/`step` 约束。`incrementLabel` 与 `decrementLabel` 本地化其无障碍名称（默认：`Increase value` / `Decrease value`）。按钮变化触发原生 input/change 事件以及受控 `onChange` 更新。使用 `step="any"` 时，按钮按 1 改变值并保留小数部分。禁用与只读输入会同时禁用两个按钮；转发的 ref 仍指向输入元素。

Popover 是非模态的；DropdownMenu 提供菜单键盘导航。两者都接受 `open/defaultOpen/onOpenChange`、禁用状态与放置方式，并与 Select 共享 Overlay Runtime。

```tsx
import { UiAction } from '@neoverse-ui/react';

<UiAction href="/docs">Open docs</UiAction>
```

对框架路由组件使用 `asChild`，让路由器保留导航所有权，同时由 Neoverse-UI 负责控件几何、材质、状态与焦点样式。

## Dock

`UiDock` 是可复用的浮动导航外壳。通过 `children` 传入导航内容，通过 `trailing` 传入可选的模式/语言控件；路由数据与激活状态仍由消费项目持有。`navigationIndicator` 默认是 `true`，使用与 `UiControlSurface` 相同的实测共享指示器。用 `UiNavigationItem` 子节点提供激活标记。

```tsx
<UiDock aria-label="Primary navigation" trailing={<LanguageControl />}>
  {navigationItems}
</UiDock>
```

## 卡片

```tsx
import { UiCard } from '@neoverse-ui/react';

<UiCard as="article" surface="subtle" id="related-reading">
  Related reading
</UiCard>

<UiCard as="a" href="/docs/chapter" surface="glass-elevated">
  Open chapter
</UiCard>
```

`UiCard` 增加共享卡片几何与 Surface 预设，同时转发原生或路由根属性。内容布局与导航行为仍归消费项目负责。

## 原生按钮

```tsx
import { UiButton } from '@neoverse-ui/react';

<UiButton ref={buttonRef} variant="ghost" size="sm" surface="none" onClick={copy}>
  Copy
</UiButton>
```

`UiButton` 接受原生按钮属性与 React 19 ref，默认 `type="button"`，支持 `primary | secondary | ghost`、`sm | md | lg`、`stretch`、`leading` 与 `trailing`。`loading` 设置原生 disabled 与 `aria-busy`，同时保留标签。非加载状态下显式 `aria-busy` 会被保留。仅图标子节点要求消费项目提供无障碍标签。

## 仅图标控件

```tsx
import { Settings } from 'lucide-react';
import { UiIconButton } from '@neoverse-ui/react';

<UiIconButton label="Open settings" variant="ghost" size="sm" onClick={openSettings}>
  <Settings aria-hidden="true" />
</UiIconButton>

<UiIconButton as="a" href="/settings" label="Settings" surface="none">
  <Settings aria-hidden="true" />
</UiIconButton>
```

`UiIconButton` 要求无障碍 `label`，保留原生按钮属性与 ref，也支持原生锚点目标。`disabled` 或 `loading` 会禁用原生按钮；禁用链接会失去目标、离开 Tab 顺序并取消激活。其紧凑几何来自共享组件样式表。

## 状态提示

```tsx
import { UiNotice } from '@neoverse-ui/react';

<UiNotice as="aside" variant="warning" action={<a href="/guide">Read the guide</a>}>
  Check this requirement before continuing.
</UiNotice>
```

`UiNotice` 与 Vue 适配器对应，提供 `neutral | info | success | warning | danger` 变体、`div | aside | section` 根、转发的原生属性以及可选操作区域。它提供状态表面；内容语义、图标、标题与操作行为仍归消费项目负责。

## Presence

```tsx
import { UiPresence } from '@neoverse-ui/react';

<UiPresence show={open} variant="pop" origin="top">
  Panel content
</UiPresence>
```

`UiPresence` 在共享出场动画期间保留子节点，并在动画结束时卸载，同时带基于变量的超时兜底。`useUiPresence(open)` 为消费项目自有标记暴露 `mounted`、`leaving` 与 `ref`；直接使用 hook 时绑定 Motion 的 `nv-appear` / `nv-vanish` 类与预设属性。Presence hook 与交互式消费项目属于客户端边界。预设与减少动效行为由 `@neoverse-ui/motion` 负责。

没有自有 Tailwind 构建的消费项目可以导入 `@neoverse-ui/react/index.css`；它转发到编译后的 `@neoverse-ui/tailwind/index.css` 消费端样式包，包含 Tokens、Motion、Material、组件选择器以及适配器所需工具类。无需扫描包源码工具类。静态适配器支持服务端渲染，Presence hook 与事件处理器属于消费项目的客户端边界。

## 导航与分段选择

`UiControlSurface` 将任意控件分组，并可带 `trailing` 内容。`UiNavigationItem` 提供无障碍 `label`、`icon`、`active`、`compact`、`indicatorPlacement` 以及禁用链接/按钮语义。它像 `UiAction` 一样支持与路由元素配合的 `asChild`。

`UiSegmentedControl` 使用 `options`，包含 `value`、`label`、可选 `disabled` 与 `ariaLabel`。绑定 `value/onValueChange`，或使用 `defaultValue` 作为内部状态。ArrowLeft/ArrowRight 在启用选项间循环；Home/End 选择端点。加载与禁用状态阻止变化。受控父级可以拒绝更新而不改变选中值。

## 反馈与展示

- `UiBadge`：`variant`（neutral/info/success/warning/danger）、`size`（sm/md/lg）与标签子节点。
- `UiStatusIndicator`：`status`、`size`（sm/md）、`pulse`、`loading` 与标签子节点。
- `UiTooltipSurface`：`as`、`variant`（neutral/accent）与内容；调用方控制提示可见性与关联。
- `UiSkeleton`：`variant`（text/title/avatar/circle/rect）、`effect`（shimmer/pulse/none）、`width`、`height` 与矩形 `radius`。数值尺寸使用 CSS 像素。
- `UiStatCard`：`label`、`value`、可选 `unit`、`trend`、`footnote` 与 `surface`；label/value/trend/footnote 接受 ReactNode 内容。
- `UiTimeline`：`items`、`ariaLabel` 与可选 `renderItem({ item, index })`。
- `UiStepFlow`：`items` 带 pending/current/complete 状态、`ariaLabel`、`renderItem` 与 `renderStatus`。

## 终端与滚动条

[终端组合](../../docs/zh-CN/architecture/terminal-composition.md)包含 React 示例。`UiTerminalSurface` 接受 `titlebar`（`default | auto | macos | windows | linux`）、`maximized`、`onWindowAction`、`status` 与 `actions` 内容。`UiTerminalTranscript` 仅在读者位于尾部时跟随输出，并保留嵌套的无障碍日志。`UiTerminalLine` 渲染转义文本或子节点。

`UiTerminalPrompt` 使用 `value/defaultValue/onValueChange`，保留原生 `onChange`、键盘/组合事件与输入 ref。`suggestion` 仅在光标位于末尾且聚焦时显示匹配的残影后缀。`TerminalPromptSegment` 的 `icon`（`auto` 或系统/终端/浏览器/运行时预设）与 `iconOnly` 会自动渲染内置 SVG 图标，同时 `context` 与 `renderSegment(segment)` 仍可定制上下文内容。命令执行与接受建议归应用负责。

`UiTerminalEcho` 显示转义后的记录 `text`，其 `segments`、`symbol`、`error` 状态与内置或 `renderSegment` 外观和实时提示一致，但没有输入或 Tab 停靠点。提交历史时捕获 segment 值，避免后续目录变化改写旧提示。

`UiScrollbar` 用 `autoHideMs`（1200）、`minThumbRatio`（0.1）、`refreshKey` 与 `hideNative`（true）装饰文档滚动。设置 `autoHideMs={0}` 可在文档有溢出时保持显示。它支持轨道跳转与指针拖拽，并在卸载时恢复原生滚动条所有权。它是装饰性的，不替代原生文档键盘滚动。滚动条在服务端渲染时带 `data-hide-native`，因此服务端渲染的轨道会在首次绘制时移除原生滚动条，而不是等到水合后；`hideNative={false}` 保留原生滚动条。