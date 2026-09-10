# Neoverse Consumer Gap Report

审计基线：Neoverse 当前未提交的 Design System 接入 diff、接入前 `HEAD` 实现、`docs/screenshots/home.webp`，以及 Neoverse-Doc 当前 `control-surface` / navigation / status 用法。

| Neoverse 场景 | 当前实现 | DS 已有能力 | 缺失能力 | 分类 | 是否进入 Core |
| --- | --- | --- | --- | --- | --- |
| Hero CTA | 本地 `UiGlassButton` 手工拼装 `ui-button` selector、variant 与 size；接入后根节点为 `display: block`、0 圆角、36px 高，图标与标签失去水平布局 | `UiButton` 的 command 语义、Glass control material、三档视觉层级 | 原生链接语义、完整而不可漏装的 Action 结构、紧凑到舒适的 destination-control 几何、icon/label slots | B. Core Component | 是，P0：`UiAction` |
| Social Action | 六个外链/`mailto:` 被迫复用 Button 的 class contract，本地 wrapper 仍处理 tag、href、icon 与 label | Button material、focus token、motion token | 不模拟 click 的 `<a>` 语义、external/internal link adapter seam、可换路由 link renderer | B. Core Component | 是，P0：`UiAction` |
| Internal Navigation | `NuxtLink` 包在本地 Button wrapper 中，并用 `active` 映射 Button primary | Button visual variants | 框架无关的 polymorphic link seam；`aria-current` 与 destination 语义 | B. Core Component | 是，P0：`UiNavigationItem` 复用 `UiAction` |
| Bottom Dock Item | icon、label、active、compact mobile label、stretch、selected indicator 分散在 `BottomDock.vue` 与 wrapper | Focus utilities、shared control colors/motion | 稳定的 navigation item contract；active accent、内建 selected indicator、compact/stretched geometry | B. Core Component | 是，P0：`UiNavigationItem`；BottomDock 整体不进入 Core |
| Language Segmented Control | 已替换为 `UiSegmentedControl`，Consumer 仅保留 i18n writable model 与外围布局 | 原生 radio-group 语义、roving focus、active slider、disabled/loading、reduced motion | 无 Core 缺口；Dock 内与相邻导航的表面关系属于组合 | C. Shared Composition / Pattern | 否；继续复用现有 Core |
| Status Indicator | Home 手写 success dot、halo、label flex 与 reduced-motion；Pulse 使用 Badge 表达来源状态 | Status semantic colors、`UiBadge` | dot + label 的 presence/status 语言、可选 pulse、主题与 reduced-motion 契约 | B. Core Component | 是，P0：`UiStatusIndicator` |
| Glass Card | Product 仍有 `.glass-card`；部分接入改成裸 `material-glass-elevated rounded-surface` 后结构差异明显 | `UiGlassSurface` 四档 material（subtle/elevated/card/immersive）；`UiCard` 的无材质 grouping | 已补 `card` 材质档（hairline 边 + 145° 中性 sheen + 深 blur）；业务 hover/content geometry 留本地 | B. Core Component | 是；`variant="card"` |
| Floating Surface | Bottom Dock 手写 background、border、shadow、padding、control alignment 与 divider；Design Lab toolbar 和 Docs 也重复 control surface | Glass material、radius/spacing/shadow tokens | 适合 controls 的紧凑 surface、primary/trailing group relationship、可选语义容器、separator | B. Core Component | 是，P0：`UiControlSurface` |
| Skeleton | `BaseSkeleton` 已由 `UiSkeleton` 替换；复杂 heatmap 与 inline text skeleton 继续用共享 `skeleton-surface` token facade | `UiSkeleton` geometry/effects、CSS skeleton facade、reduced-motion | 无 Core 缺口；复杂业务骨架只需 Consumer 布局 | A. Core Primitive（已有） | 否；不新增组件 |
| Immersive Scrollbar | Neoverse 原 `CustomScrollbar` 负责 document overlay、auto-hide、拖拽、track jump、route/layout refresh | `UiScrollbar` 运行时、滚动条 token、`hideNative` 与 `refreshKey` | Consumer 仅提供 route refresh key；不再保留产品级滚动条运行时 | B. Core Component | 是，P2：`UiScrollbar` |
| Hero Action Group | Consumer 与 Docs 都重复 flex-wrap、gap、responsive alignment | Spacing utilities | 稳定的 action-group composition，不需要业务 props | C. Shared Composition / Pattern | 不新增 Core API；在 Design Lab 提供 Composition |
| Floating Navigation | nav items + language control + separator + glass chrome | 上述单项能力 | 可复用组合参考，不应包含路由列表或 BottomDock 定位 | C. Shared Composition / Pattern | 不新增业务组件；在 Consumer Parity 模块验证 |

## P0 决策

1. `UiAction`：链接专用，不扩大 `UiButton` 职责；默认渲染 `<a>`，允许 Consumer 注入 Nuxt/Next link renderer，保持真实导航语义。
2. `UiNavigationItem`：复用 Action 的链接语义，但使用独立的紧凑 navigation geometry；拥有 icon/label、active、`aria-current`、compact、stretch 与根节点对齐的 selected indicator；不拥有路由表或 Dock 布局。
3. `UiStatusIndicator`：统一 dot/label/pulse；不承载 “Currently building” 业务文案。
4. `UiControlSurface`：唯一新增 floating/toolbar chrome abstraction；不再并列创建 `UiToolbar` / `UiFloatingBar`。
5. Hero Action Group 与 Floating Navigation 只作为 Design Lab composition；不为一层 flex wrapper 增加 Vue API。

## 明确保留在 Product Layer

Hero 内容与入场序列、BottomDock 固定定位/路由列表/跨项滑动逻辑、Cosmos/City、Project Card 内容与 hover、Focus journey、Pulse 数据与 heatmap、route layout、复杂 skeleton 排布。

## 复现证据

当前 Consumer 运行态中 Hero Action 实测为 `display: block`、`border-radius: 0px`、`gap: normal`、高度 36px；接入前 wrapper 明确定义 `inline-flex`、control-inner radius、0.5rem gap、44px large height。直接原因是 Consumer 只拼装了 DS 的 variant/size class，遗漏 `UiButton` 内部未导出的 base/focus/transition class。该失败同时证明“导出 class 零件 + Consumer wrapper”不是安全的跨框架 Action contract。
