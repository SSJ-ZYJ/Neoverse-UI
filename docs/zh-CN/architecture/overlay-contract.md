# 浮层行为规范

Status: adopted

[English](../../architecture/overlay-contract.md)

<!-- Source: docs/architecture/overlay-contract.md -->
<!-- Source-SHA256: b95c1e806652e7044e34a43882e0402f5b6e7835097180301cbf0430de531976 -->

Neoverse-UI 对锚定的顶层界面使用同一套浮层行为规则。Popover、DropdownMenu 与 Select 共用与框架无关的定位运行时，按局部材质作用域选择浮层配方。原生顶层保留 DOM 作用域；异地挂载通过共享桥接传递调用位置的有效材质，并在退出动画期间保留最后解析的材质。

## 运行时归属

`@neoverse-ui/overlay-runtime` 负责：

- 相对触发器的视口定位，
- `auto`、`bottom-start`、`bottom`、`bottom-end`、`top-start`、`top`、`top-end`、`left-start`、`left-end`、`right-start` 与 `right-end` 放置方式，
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

固定定位回退不是浏览器顶层。层级变量只能在所在的层叠上下文内排序，无法把面板抬到较低祖先上下文的兄弟元素之上。此规则适用于所有锚定面板，包括 Select 和 ContextMenu 子菜单。应避免让浮层祖先落入较低的层叠上下文；组合明确隔离层级时，应避免裁剪浮层宿主，并把宿主放在它要覆盖的兄弟元素之上。单独调高面板层级无法解决祖先层级冲突。

通用极光玻璃材质辅助类不得用 `position: relative` 替换顶层定位。因此浮层面板与 Select 弹出层直接拥有自己的定位上下文。

原生与回退浮层都在面板本地绘制玻璃细边。圆角透明度遮罩将材质的背景提亮限制在轮廓上，左上与右下的覆盖率更高。面板本体仍使用独立的模糊；共享 WebGL 画布不重复绘制这些边缘。

## 关闭与焦点

- Escape 关闭已打开浮层。
- 当用户在 `auto` Popover 外部激活时，原生轻触关闭会关闭它。
- Escape 与显式选择条目都会把焦点恢复到触发器。
- 禁用触发器不能打开面板。
- 受控与非受控框架状态必须表现一致；在 Vue 中，省略布尔 `open` prop 时必须保持 `undefined`，避免意外变成受控的 `false`。

关闭请求是改变受控 `open` 的请求。父级更新后，适配器让实际面板与最终生效的 prop 保持一致。如果父级保持 `open=true`，面板保持打开，而不是留下已展开触发器与隐藏面板。原生 toggle 事件按同一策略处理。跟踪与关闭清理会捕获已挂载面板，因此卸载不依赖已被清空的 ref。

## 共享元素动画

Popover、DropdownMenu 与 Select 从触发器的视口矩形展开，关闭时收回触发器。ContextMenu 以唤出位置为起点，子菜单以父菜单行为起点。切换菜单行会从新行播放展开动画，再次激活同一行不会重播。

Dialog 默认以打开前聚焦的元素为起点。Vue 和 React 都可通过 `motionSource` 指定另一元素，例如指针事件的 `event.currentTarget`；传 `null` 则保留默认出入场动画。此属性不改变焦点归还目标。打开时选定来源，关闭时重新测量；如果触发器移动，面板会收回其当前位置。来源隐藏、离开文档或不存在时，回退到默认出入场动画。

动画直接移动和缩放面板，不克隆 DOM，不捕获背景。CSS 复用现有出入场时序，并在浏览器支持时保留顶层退出过渡。启用减少动态效果偏好时跳过共享元素的位移和缩放。

Dialog 在遮罩上使用专用的半透明底色 `--neoverse-dialog-background`，而不是覆盖率较低的普通浮层底色。`--neoverse-dialog-scrim` 独立控制周围页面的压暗程度。面板保留抬升层级玻璃的模糊与边缘效果。

删除等破坏性操作的确认按钮使用 `UiButton variant="danger"`。普通确认保留 `primary`；对话框的 `alertdialog` 角色不会自动改变按钮颜色。

## Drawer

`UiDrawer` 使用 `open` 控制边缘面板，默认关闭。Vue 绑定 `v-model:open`，React 绑定 `open` 与 `onOpenChange`。通过 `aria-label` 或 `aria-labelledby` 提供无障碍名称，内容放在默认插槽或 `children` 中。`side` 支持 `left`（默认）与 `right`。

`modal` 默认为 `true`。模态抽屉挂载于文档根部，与 Dialog 共用 `--neoverse-layout-layer-modal` 层级。它位于普通页面浮层之上，但不会盖住层级更高的控件，例如浏览器扩展工具栏。最上方的文档模态面板约束 Tab，关闭时把焦点归还给先前聚焦的元素。Escape 和激活遮罩会请求关闭；`closeOnOutside` 设为 `false` 可禁用遮罩关闭。调用方更新 `open` 前，抽屉保持打开。

将 `modal` 设为 `false` 可作为宽屏常驻导航等行内面板使用。行内面板参与布局，打开时不捕获或移动焦点。模态位置使用 `--neoverse-drawer-width` 与 `--neoverse-drawer-inset` 变量，可用 `width` 传入 CSS 长度来覆盖默认宽度。抽屉遵循减少动态效果与降低透明度偏好。

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
- 打开时聚焦第一个启用项（指针打开时抑制视觉焦点环，直至开始键盘导航），
- 按一次 Tab 即可退出菜单（菜单项与列表项使用 `tabindex="-1"`），
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

`AnchoredOverlayOptions` 接受 `trigger` 元素或 `point`。点是零尺寸矩形，因此光标菜单复用相同的翻转、视口限制与缩放补偿；`placement: 'auto'` 仍会在指针下方打开，下方视口无法容纳时向上翻转。`trigger` 可选，`focusReturn` 指定点锚定浮层关闭时接收焦点的元素，因为光标打开没有可返回的触发器。`previousFocus` 报告面板打开前持有焦点的元素，由适配器在展示时记录。

已关闭的手动 popover 在 Firefox 中会把键盘焦点留在自身内部：该引擎只按自己的节奏移除焦点，从而把一个菜单行留在已隐藏的表面上。Chromium 与 WebKit 在 `hidePopover()` 期间就把焦点移出。手动浮层正是运行时已经接管关闭的场合，因此也接管配套的焦点释放：`hideAnchoredOverlay` 依次尝试 `focusReturn`、`trigger`、`previousFocus` 归还焦点，没有归属时则让已关闭的行失焦。轻关闭的浮层仍把焦点交给引擎处理。

回退包含块修正读取面板自身的布局盒。尚未布局的面板会报告全零矩形，这会把修正变成重复偏移，因此这种情况下跳过修正。原生 popover 不受影响。

`UiContextMenu` 是这条路径的适配器。它渲染 `role="menu"`，包含 `menuitem`、`menuitemradio` 与 `menuitemcheckbox` 行、分隔线与标题，并复用 DropdownMenu 键盘行为：ArrowUp/ArrowDown 循环、Home/End、跳过禁用项、打开时聚焦第一个启用项、Escape 与选择关闭面板，以及焦点恢复。关闭原因仍为 `escape` 与 `outside`；光标菜单没有触发器，因此只应用文档监听器。

更新 `point` 时，已打开的上下文菜单从当前画面位置平滑移到新位置，不会关闭或重播入场动画。滑动途中再次更新位置会改向新目标。定位规则仍生效；启用减少动态效果时直接移位。若外部位置的右键事件没有被上下文菜单处理器通过 `preventDefault()` 接管，则关闭菜单。

`data-neoverse-overlay-side` 记录面板在锚点哪一侧（`top`、`bottom`、`left` 或 `right`）打开。光标菜单没有可用的共享元素几何数据时，以相反边缘作为出入场起点。所有浮层面板（`UiPopover`、`UiDropdownMenu`、`UiContextMenu`、`.ui-context-menu__submenu`、`UiSelect` 下拉框与 `UiDialog`）统一复用 `.ui-overlay-panel` 的 `body-sm` 字体排版、`material-glass-elevated` 材质与无遮挡方向性极光玻璃边缘高光，并通过 `control-feedback` 统一行内点击项的悬停反馈；模态对话框保留在 `--neoverse-layout-layer-modal`（`show()` + `.ui-dialog__backdrop` 遮罩过渡与范围化 Tab 循环）以使浏览器插件等更高层级浮层保持不被遮挡，同时支持 `size`（`sm`、`md`、`lg`）与 `role`（`dialog`、`alertdialog`）配置。

带 `children` 的行会在点击、悬停或 ArrowRight 时打开子菜单，ArrowLeft 把焦点返回父行。子菜单是面板旁顶层中的第二个 `popover="manual"`，因此父行保持可见，面板保持自身宽度。适配器用 `containedElements` 注册该列，使列内指针按压不会关闭父级。两个表面一起关闭。

鼠标从展开的父菜单行移入二级菜单时，父行保留与普通悬停相同的一层高亮，不再叠加展开态底色。

二级菜单与父面板略微重叠，而不是仅仅接触。它在接缝处覆盖父面板玻璃边缘，未覆盖的轮廓仍然可见。

`autoFocus` 默认是 true。指针打开传 `false`，使区域保持焦点，编辑器保留选择高亮；方向键随后从第一行或最后一行进入面板。键盘打开则立即把焦点移入面板。

任何新的锚定浮层基础组件都应先复用此运行时，再添加新的定位实现。