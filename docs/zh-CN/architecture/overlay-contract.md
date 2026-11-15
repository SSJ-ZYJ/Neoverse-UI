# 浮层行为规范

Status: adopted

[English](../../architecture/overlay-contract.md)

<!-- Source: docs/architecture/overlay-contract.md -->
<!-- Source-SHA256: b07ccfec63ef78ca16f426999cfcea75890634d8bb99d58b55b7a3dd6fd15dce -->

Neoverse-UI 对锚定的顶层界面使用同一套浮层行为规则。Popover、DropdownMenu 与 Select 共享同一个与框架无关的定位运行时和同一套极光玻璃深度语言。

## 运行时归属

`@neoverse-ui/overlay-runtime` 负责：

- 相对触发器的视口定位，
- `auto`、`bottom-start` 与 `bottom-end` 放置方式，
- 当下方视口无法容纳 `auto` 放置的面板时自动向上翻转，
- 视口限制，
- CSS 缩放补偿，
- 可选的触发器宽度匹配，
- 面板打开期间的滚动与缩放跟踪，
- 内容异步改变尺寸、触发器移动但没有滚动/缩放事件时的几何跟踪，
- 原生 Popover API 检测，
- Popover 不可用时的固定定位回退行为。

框架适配器不重复实现这些算法。

打开期间，一个动画帧会采样触发器的视口矩形与面板的布局尺寸。只有几何变化才请求写入定位；未变化的帧不会重写坐标。这覆盖布局位移与被变换的祖先，同时保留既有 CSS 缩放与视口限制规则。关闭、禁用、卸载或断开任一元素都会取消该帧并移除跟踪/关闭监听器。不安装全文档变更观察器，也不添加第二套定位算法。这不会为回退规则增加通用的旋转或缩放包含块支持。

## 顶层行为

首选浏览器路径使用 `popover="auto"`。它提供原生顶层堆叠与轻触关闭。回退路径保持相同的运行时计算 `position: fixed`、`top` 与 `left` 规则，仅通过回退类改变可见性。

通用极光玻璃材质辅助类不得用 `position: relative` 替换顶层定位。因此浮层面板与 Select 弹出层直接拥有自己的定位上下文。

## 关闭与焦点

- Escape 关闭已打开浮层。
- 当用户在 `auto` Popover 外部激活时，原生轻触关闭会关闭它。
- Escape 与显式选择条目都会把焦点恢复到触发器。
- 禁用触发器不能打开面板。
- 受控与非受控框架状态必须表现一致；在 Vue 中，省略布尔 `open` prop 时必须保持 `undefined`，避免意外变成受控的 `false`。

关闭请求是改变受控 `open` 的请求。父级更新后，适配器让实际面板与最终生效的 prop 保持一致。如果父级保持 `open=true`，面板保持打开，而不是留下已展开触发器与隐藏面板。原生 toggle 事件按同一策略处理。跟踪与关闭清理会捕获已挂载面板，因此卸载不依赖已被清空的 ref。

## Popover

`UiPopover` 暴露按钮触发器与 `role="dialog"` 面板。调用方为对话框内容提供无障碍标签。Popover 不强制菜单语义，也不捕获焦点。

触发器是共享按钮。`triggerVariant` 选择其变体，默认 `secondary`，因此现有消费项目保留相同触发器类。`ghost` 复用共享 ghost 按钮类：透明外观配标准 hover 与按压底色，适用于位于页面头部等 ghost 外观内的触发器。`UiDropdownMenu` 暴露相同选项与默认值。

触发器的 `aria-controls` 引用面板生成的 ID，关闭时也保持关联。Vue 与 React 使用各自的 SSR 稳定 `useId`；多个实例获得不同 ID，水合/打开/关闭循环保持关联。ID 是内部实现细节，消费项目不得依赖其格式。

## DropdownMenu

`UiDropdownMenu` 暴露：

- 触发器上的 `aria-haspopup="menu"`，
- 引用 SSR 稳定面板 ID 的 `aria-controls`，生命周期规则与 Popover 相同，
- 面板上的 `role="menu"`，
- 带 `role="menuitem"` 的原生按钮菜单项，
- ArrowUp / ArrowDown 循环，
- Home / End 导航，
- 跳过禁用项，
- 打开时聚焦第一个启用项，
- 选择后关闭并恢复触发器焦点。

## Select 复用

`UiSelect` 保留既有 combobox/listbox 行为，但面板定位与跟踪委托给同一个浮层运行时。Select 不得重新引入独立的 fixed/absolute 定位实现。

## 验证

规范在三个层级覆盖：

1. 放置、翻转、限制与超大面板的运行时单测；
2. Vue/React 组件接口测试，覆盖角色、属性与禁用状态；
3. Playwright 浏览器测试，覆盖真实 Popover 行为、Escape、轻触关闭、焦点恢复、键盘导航、视口包含以及既有 Select 顶层回归。

专门的交互测试还会在挂载 Vue/React 测试组件前禁用 `HTMLElement.prototype.showPopover` / `hidePopover`，强制固定定位回退，而不是依赖浏览器默认支持。额外的受控/只读/重置场景通过 `contract-fixtures=1` 选择启用；它们不改变默认 Design Lab 布局。

`tests/e2e/overlays.spec.ts` 覆盖触发器位移、异步内容增长、缩放、ID 关联、关闭、焦点返回、视口包含以及禁用/卸载时取消。两套适配器还会在各自的 `overlay-hydration.test` 套件中渲染服务端标记并水合；这些是 DOM 水合检查，不是辅助技术验收。跨浏览器配置也会在既有交互套件之外选择跟踪、审计、表单语义/行为与浮层回归套件。

## 光标锚定菜单

`AnchoredOverlayOptions` 接受 `trigger` 元素或 `point`。点是零尺寸矩形，因此光标菜单复用相同的翻转、视口限制与缩放补偿；`placement: 'auto'` 仍会在指针下方打开，下方视口无法容纳时向上翻转。`trigger` 可选，`focusReturn` 指定点锚定浮层关闭时接收焦点的元素，因为光标打开没有可返回的触发器。

回退包含块修正读取面板自身的布局盒。尚未布局的面板会报告全零矩形，这会把修正变成重复偏移，因此这种情况下跳过修正。原生 popover 不受影响。

`UiContextMenu` 是这条路径的适配器。它渲染 `role="menu"`，包含 `menuitem`、`menuitemradio` 与 `menuitemcheckbox` 行、分隔线与标题，并复用 DropdownMenu 键盘行为：ArrowUp/ArrowDown 循环、Home/End、跳过禁用项、打开时聚焦第一个启用项、Escape 与选择关闭面板，以及焦点恢复。关闭原因仍为 `escape` 与 `outside`；光标菜单没有触发器，因此只应用文档监听器。

`data-neoverse-overlay-side` 记录面板在锚点上方还是下方打开，适配器把 `data-neoverse-motion-origin` 指向相反边缘，使入场动效始终从静止边缘生长。

带 `children` 的行会在点击、悬停或 ArrowRight 时打开子菜单，ArrowLeft 把焦点返回父行。子菜单是面板旁顶层中的第二个 `popover="manual"`，因此父行保持可见，面板保持自身宽度。适配器用 `containedElements` 注册该列，使列内指针按压不会关闭父级。两个表面一起关闭。

该列与面板边缘重叠一个极光玻璃边缘宽度，而不是仅仅接触。共享 Glass 边缘画布绘制在顶层之上，其遮挡命中测试会在表面边界内采样：重叠让该列位于面板边缘之上，并使渲染器把该列视为遮挡物，因此面板边缘不会跨列绘制。面板边缘未覆盖的部分保持连续。

打开一列、用指针在列之间切换、触控或键盘打开都会重放共享 Presence 入场。切换复用同一 popover 节点，因此 `@starting-style` 无法再次播种入场：适配器通过 `replayPresence()` 把 `data-neoverse-motion-replay="from"` 固定一帧，再释放到同一个入场过渡中。重新进入已经打开的行不会重启动画。

`autoFocus` 默认是 true。指针打开传 `false`，使区域保持焦点，编辑器保留选择高亮；方向键随后从第一行或最后一行进入面板。键盘打开则立即把焦点移入面板。

任何新的锚定浮层基础组件都应先复用此运行时，再添加新的定位实现。