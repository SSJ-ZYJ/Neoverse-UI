# Neoverse Consumer Gap Report

审计基线：Neoverse 当前未提交的 Design System 接入 diff、接入前 `HEAD` 实现、`docs/screenshots/home.webp`，以及 Neoverse-Doc 当前 `control-surface` / navigation / status 用法。

| Neoverse 场景 | 当前实现 | DS 已有能力 | 缺失能力 | 分类 | 是否进入 Core |
| --- | --- | --- | --- | --- | --- |
| Hero CTA | 已迁移到 `UiAction`，Consumer 只提供目标地址、图标、文案与业务排列 | `UiAction` 的原生链接语义、Glass control material、尺寸/variant、leading/content slots | 无 Core 缺口 | B. Core Component | 已进入 Core：`UiAction` |
| Social Action | 已统一为 `UiAction`，外链与 `mailto:` 保持真实 `<a>` 导航语义 | Action material、focus/motion、polymorphic destination contract | 无 Core 缺口；业务 URL 与排列留在 Consumer | B. Core Component | 已进入 Core：`UiAction` |
| Internal Navigation | 已使用 `UiNavigationItem` + Consumer 注入的 `NuxtLink` renderer，active 状态映射为 `aria-current="page"` | polymorphic link seam、navigation geometry、active/compact contract | 无 Core 缺口；路由表与 active route 计算留在 Consumer | B. Core Component | 已进入 Core：`UiNavigationItem` |
| Bottom Dock | 单项使用 `UiNavigationItem`，共享外壳由 `UiDock` 负责；Consumer 只保留路由列表、active route 计算、固定定位与响应式断点决策 | `UiDock` 的 chrome、primary/trailing 分组、divider、整体 scale、compact contract 与共享 navigation indicator；`UiNavigationItem` 的 destination semantics | 无 Core 缺口；具体路由数据与页面定位仍属于 Product Layer | B. Core Component | 已进入 Core：`UiDock` + `UiNavigationItem` |
| Language Segmented Control | 已替换为 `UiSegmentedControl`，Consumer 仅保留 i18n writable model 与外围布局 | 原生 radio-group 语义、roving focus、active slider、disabled/loading、reduced motion | 无 Core 缺口；Dock 内与相邻导航的表面关系属于组合 | C. Shared Composition / Pattern | 否；继续复用现有 Core |
| Status Indicator | Home 已使用 `UiStatusIndicator` 表达当前构建状态；Pulse 的来源标签继续使用 `UiBadge`，两者语义职责分离 | `UiStatusIndicator` 的 dot/label/pulse/reduced-motion contract；`UiBadge` 的标签语义 | 无 Core 缺口 | B. Core Component | 已进入 Core：`UiStatusIndicator` |
| Glass Card | Product 标准卡片已统一使用 `UiCard surface="glass-card"`，圆角与基础内边距由组件自身负责；通用非卡片材质容器继续使用 `UiSurface` | `UiCard` 复用完整 Surface contract 并拥有标准 card geometry；`UiSurface` 提供 polymorphic material plane；`UiGlassSurface` 仅保留 historical `variant` compatibility | 无 Core 缺口；业务内容布局与特定 hover 行为留在 Product Layer | B. Core Component | 是；标准卡片 canonical 用法为 `UiCard surface="glass-card"` |
| Floating Surface | `UiControlSurface` 保留为通用 grouped-control primitive；导航型悬浮外壳由 `UiDock` 专门复用该能力 | grouped-control chrome、primary/trailing 分组、divider、Surface contract、`hoverMode` / `edgeMode` 行为策略 | 无 Core 缺口；固定定位与业务容器约束不进入 Core | B. Core Component | 已进入 Core：`UiControlSurface` / `UiDock` |
| Skeleton | `BaseSkeleton` 已由 `UiSkeleton` 替换；复杂 heatmap 与 inline text skeleton 继续用共享 `skeleton-surface` token facade | `UiSkeleton` geometry/effects、CSS skeleton facade、reduced-motion | 无 Core 缺口；复杂业务骨架只需 Consumer 布局 | A. Core Primitive（已有） | 否；不新增组件 |
| Immersive Scrollbar | 已迁移到 `UiScrollbar`，Consumer 仅传入 route/layout `refreshKey` | document overlay、auto-hide、drag、track jump、native scrollbar visibility 与 token contract | 无 Core 缺口 | B. Core Component | 已进入 Core：`UiScrollbar` |
| Hero Action Group | Consumer 与 Docs 都重复 flex-wrap、gap、responsive alignment | Spacing utilities | 稳定的 action-group composition，不需要业务 props | C. Shared Composition / Pattern | 不新增 Core API；在 Design Lab 提供 Composition |
| Floating Navigation | nav items + language control + separator + glass chrome | `UiDock` 提供可复用导航外壳，并通过 slots/children 接收项目自己的导航项与尾部控件 | 不包含路由列表、业务图标、语言数据或 BottomDock 固定定位 | B. Core Component + Product Composition | `UiDock` 进入 Core；Consumer Parity 仅保留真实产品组合校验 |

## P0 落地结果

1. `UiAction`：链接专用，不扩大 `UiButton` 职责；默认渲染 `<a>`，允许 Consumer 注入 Nuxt/Next link renderer，保持真实导航语义。
2. `UiNavigationItem`：复用 Action 的链接语义，但使用独立的紧凑 navigation geometry；拥有 icon/label、active、`aria-current`、compact、stretch 与根节点对齐的 selected indicator；不拥有路由表或 Dock 布局。
3. `UiStatusIndicator`：统一 dot/label/pulse；不承载 “Currently building” 业务文案。
4. `UiControlSurface`：通用 floating/toolbar chrome primitive；不再并列创建 `UiToolbar` / `UiFloatingBar`。
5. `UiDock`：在 `UiControlSurface` 之上固化可复用 Dock 布局、scale/compact、primary/trailing 分组与 navigation indicator；不包含任何产品路由或语言数据。Playground 在“组件”中独立展示，Consumer Parity 仅验证真实产品组合。

## 明确保留在 Product Layer

Hero 内容与入场序列、BottomDock 固定定位/路由列表/active route 计算与产品级响应式断点、Cosmos/City、Project Card 内容布局与内部 `product-inset-*` 预览材质、Project Card hover、Focus journey（含 track tone / stage inset）、Pulse 数据与 heatmap、route layout、复杂 skeleton 排布。上述内容属于具体产品表达，不应为了“全部组件化”继续下沉到 Core。

## 历史复现证据（已修复）

早期接入阶段，Consumer 运行态中的 Hero Action 曾出现 `display: block`、`border-radius: 0px`、`gap: normal`、高度 36px，而接入前 wrapper 明确定义 `inline-flex`、control-inner radius、0.5rem gap、44px large height。根因是 Consumer 手工拼装 DS 的 variant/size class，遗漏 `UiButton` 内部 base/focus/transition contract。该回归促成了 `UiAction` / `UiNavigationItem` 的完整组件契约；当前 Consumer 已不再使用“导出 class 零件 + 本地 wrapper”的方式。


## Doc 正文适配

React 新增 `UiButton`，补齐原生按钮 ref、属性、disabled/loading 和完整 CSS 几何契约；Doc 复制按钮消费共享控件，Fumadocs 继续负责复制状态与 Tabs 行为。正文代码、表格、引用、提示和折叠容器采用轻量阅读表面，提示语义色复用共享状态 Token。正文导航卡片复用 Surface，布局与路由留在 Doc。

MDX 注册、Shiki、长代码降级、内容标题和正文排版仍属于产品层，不新增面向 Fumadocs 的 Core 组件。Playground 的正文组合用于展示共享基础的阅读场景，不承担 Doc MDX 渲染器验证。
## 后续迁移队列

本轮顺序按共享适配器、Doc 控件消费、产品层边界收尾；各阶段独立验证。当前正文与交互控件候选均已实施。

| 阶段 | 迁移项 | 边界与保留项 | 验收 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | React UiNotice 对齐 Vue；Doc Fumadocs Callout / CalloutContainer 映射到共享状态表面 | MDX 标题、图标、自定义属性和类型别名仍由 Doc adapter 兼容 | SSR 验证 warn/error 映射、标题、图标及属性 | 已完成 |
| 2 | React UiIconButton 对齐 Vue；迁移 Doc 返回顶部、阅读返回关闭和 Mermaid 六个工具按钮 | Mermaid role=toolbar、pressed/disabled 状态、分组及 Doc 自有尺寸保持不变 | 原生 button/link disabled 与 loading 单测；Doc 阅读回归检查 | 已完成 |
| 3 | Doc 分类搜索和阅读返回主操作接入 React UiButton | URL query、Search context、history restore 和内容排列留在 Doc | React 属性/事件/禁用测试；Doc 类型检查与构建 | 已完成 |
| 4 | React 补齐 UiCard surface adapter | DocCard 保持产品层；其站内转场、外链目标、内容布局继续由 Doc 管理，并继续复用 UiSurface | React 通用原生/路由根节点与 Surface 测试 | 已完成 |

Fumadocs 侧栏、TOC、搜索弹层和结果列表继续由框架适配及搜索功能层承担；任务列表等带业务状态的按钮也继续由对应产品功能拥有。Doc 的代码渲染、表格、引用、折叠、导航卡片和文章内容不批量迁移或改写。React/Vue 中其他目前未被 Doc 使用的组件差异，仅在出现具体消费场景时再列计划。
