# Neoverse Consumer Gap Report

审计基线：Neoverse 当前未提交的 Design System 接入 diff、接入前 `HEAD` 实现、`docs/screenshots/home.webp`，以及 Neoverse-Doc 当前 `control-surface` / navigation / status 用法。

| Neoverse 场景 | 当前实现 | DS 已有能力 | 缺失能力 | 分类 | 是否进入 Core |
| --- | --- | --- | --- | --- | --- |
| Hero CTA | 已迁移到 `UiAction`，Consumer 只提供目标地址、图标、文案与业务排列 | `UiAction` 的原生链接语义、Glass control material、尺寸/variant、leading/content slots | 无 Core 缺口 | B. Core Component | 已进入 Core：`UiAction` |
| Social Action | 已统一为 `UiAction`，外链与 `mailto:` 保持真实 `<a>` 导航语义 | Action material、focus/motion、polymorphic destination contract | 无 Core 缺口；业务 URL 与排列留在 Consumer | B. Core Component | 已进入 Core：`UiAction` |
| Internal Navigation | 已使用 `UiNavigationItem` + Consumer 注入的 `NuxtLink` renderer，active 状态映射为 `aria-current="page"` | polymorphic link seam、navigation geometry、active/compact contract | 无 Core 缺口；路由表与 active route 计算留在 Consumer | B. Core Component | 已进入 Core：`UiNavigationItem` |
| Bottom Dock Item | 单项已统一使用 `UiNavigationItem`；Consumer 只保留路由列表、跨项 active/hover indicator 与响应式排列 | navigation item contract、active accent、compact/stretched geometry、真实 destination semantics | 无 Core 缺口；跨项 indicator 与 Dock 定位仍属于 Product composition | B. Core Component | 单项已进入 Core；BottomDock 整体不进入 Core |
| Language Segmented Control | 已替换为 `UiSegmentedControl`，Consumer 仅保留 i18n writable model 与外围布局 | 原生 radio-group 语义、roving focus、active slider、disabled/loading、reduced motion | 无 Core 缺口；Dock 内与相邻导航的表面关系属于组合 | C. Shared Composition / Pattern | 否；继续复用现有 Core |
| Status Indicator | Home 已使用 `UiStatusIndicator` 表达当前构建状态；Pulse 的来源标签继续使用 `UiBadge`，两者语义职责分离 | `UiStatusIndicator` 的 dot/label/pulse/reduced-motion contract；`UiBadge` 的标签语义 | 无 Core 缺口 | B. Core Component | 已进入 Core：`UiStatusIndicator` |
| Glass Card | Product 标准卡片已统一使用 `UiCard surface="glass-card"`，圆角与基础内边距由组件自身负责；通用非卡片材质容器继续使用 `UiSurface` | `UiCard` 复用完整 Surface contract 并拥有标准 card geometry；`UiSurface` 提供 polymorphic material plane；`UiGlassSurface` 仅保留 historical `variant` compatibility | 无 Core 缺口；业务内容布局与特定 hover 行为留在 Product Layer | B. Core Component | 是；标准卡片 canonical 用法为 `UiCard surface="glass-card"` |
| Floating Surface | Bottom Dock 与 Design Lab parity 已统一使用 `UiControlSurface`；Consumer 只保留 Dock 尺寸、定位、跨项 indicator 与 responsive geometry | grouped-control chrome、primary/trailing 分组、divider、Surface contract、`hoverMode` / `edgeMode` 行为策略 | 无 Core 缺口；产品级 Dock geometry 不进入 Core | B. Core Component | 已进入 Core：`UiControlSurface` |
| Skeleton | `BaseSkeleton` 已由 `UiSkeleton` 替换；复杂 heatmap 与 inline text skeleton 继续用共享 `skeleton-surface` token facade | `UiSkeleton` geometry/effects、CSS skeleton facade、reduced-motion | 无 Core 缺口；复杂业务骨架只需 Consumer 布局 | A. Core Primitive（已有） | 否；不新增组件 |
| Immersive Scrollbar | 已迁移到 `UiScrollbar`，Consumer 仅传入 route/layout `refreshKey` | document overlay、auto-hide、drag、track jump、native scrollbar visibility 与 token contract | 无 Core 缺口 | B. Core Component | 已进入 Core：`UiScrollbar` |
| Hero Action Group | Consumer 与 Docs 都重复 flex-wrap、gap、responsive alignment | Spacing utilities | 稳定的 action-group composition，不需要业务 props | C. Shared Composition / Pattern | 不新增 Core API；在 Design Lab 提供 Composition |
| Floating Navigation | nav items + language control + separator + glass chrome | 上述单项能力 | 可复用组合参考，不应包含路由列表或 BottomDock 定位 | C. Shared Composition / Pattern | 不新增业务组件；在 Consumer Parity 模块验证 |

## P0 落地结果

1. `UiAction`：链接专用，不扩大 `UiButton` 职责；默认渲染 `<a>`，允许 Consumer 注入 Nuxt/Next link renderer，保持真实导航语义。
2. `UiNavigationItem`：复用 Action 的链接语义，但使用独立的紧凑 navigation geometry；拥有 icon/label、active、`aria-current`、compact、stretch 与根节点对齐的 selected indicator；不拥有路由表或 Dock 布局。
3. `UiStatusIndicator`：统一 dot/label/pulse；不承载 “Currently building” 业务文案。
4. `UiControlSurface`：唯一新增 floating/toolbar chrome abstraction；不再并列创建 `UiToolbar` / `UiFloatingBar`。
5. Hero Action Group 与 Floating Navigation 只作为 Design Lab composition；不为一层 flex wrapper 增加 Vue API。

## 明确保留在 Product Layer

Hero 内容与入场序列、BottomDock 固定定位/路由列表/跨项滑动逻辑、Cosmos/City、Project Card 内容布局与内部 `product-inset-*` 预览材质、Project Card hover、Focus journey（含 track tone / stage inset）、Pulse 数据与 heatmap、route layout、复杂 skeleton 排布。上述内容属于具体产品表达，不应为了“全部组件化”继续下沉到 Core。

## 历史复现证据（已修复）

早期接入阶段，Consumer 运行态中的 Hero Action 曾出现 `display: block`、`border-radius: 0px`、`gap: normal`、高度 36px，而接入前 wrapper 明确定义 `inline-flex`、control-inner radius、0.5rem gap、44px large height。根因是 Consumer 手工拼装 DS 的 variant/size class，遗漏 `UiButton` 内部 base/focus/transition contract。该回归促成了 `UiAction` / `UiNavigationItem` 的完整组件契约；当前 Consumer 已不再使用“导出 class 零件 + 本地 wrapper”的方式。
