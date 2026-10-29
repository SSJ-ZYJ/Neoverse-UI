# Neoverse-UI 跨框架行为与可访问性审计（2026-10-25）

基线：`dev` 的 `9d70774`（`UiTerminalEcho` 契约行基线更新后）。审计范围为本轮未提交的审计改动，不包含版本落盘或发布。

## 审计方法与边界

以真实源码为准：`packages/vue/src/*.vue`、`packages/react/src/*.tsx`、共享 `@neoverse-ui/overlay-runtime`、`@neoverse-ui/motion`。审查维度覆盖受控/非受控语义、焦点与键盘、SSR/hydration、Overlay 定位与关闭、卸载清理、reduced-motion/IME/触控、主题与响应式，以及 WCAG/WAI-ARIA 的语义、可访问名称、角色、状态、焦点顺序与动态播报。

**层次不可互换**：单元与 SSR 检查不等于浏览器交互；浏览器断言不等于真实屏幕阅读器验收；Playground 运行与截图不等于行为验证。

**未完成的验收层**：Windows NVDA 与 Linux Orca 人工验收**本轮未执行**，所有可访问性结论限于自动化语义与浏览器断言，不声称人工验收完成。Firefox/WebKit 未跑完整套件，仅按风险针对性覆盖（见“跨引擎”一节）。操作系统级输入法（真实 IME）仍为人工待验证项。

## 确认缺陷与修复

### P1 React `UiSelect`：打开态卸载泄漏全局监听器

- **最小复现**：`/react-fixture?contract-fixtures=1`，ArrowDown 打开面板后卸载组件。
- **根因（适配层）**：`showAnchoredOverlay` 在 window 注册 `resize`/`scroll`(capture)、document 注册 `keydown`(capture)/`pointerdown`(fallback)，清理只能经 `hideAnchoredOverlay`/`stopOverlayTracking` 触发。React 版组件没有任何卸载清理，Vue 版有 `onBeforeUnmount`。
- **实测泄漏**：native 模式下 `document.keydown` 1→2、`window.resize` 2→3、`window.scroll` 2→3；fallback 另多一个 `document.pointerdown`。每次“打开→卸载”永久残留。
- **修复**：`packages/react/src/index.tsx` 增加卸载 effect，用 `overlayRef` 持有实际元素（React 在 passive cleanup 前先 detach ref，故 ref 回调只在非空时记录），卸载时调用 `stopOverlayTracking` 并移除 `:popover-open`/fallback 类。
- **覆盖**：`tests/visual/audit-regressions.spec.ts` 的 `React Select releases overlay tracking when unmounted while open`，native/fallback × desktop/mobile。

### P1 Vue 受控选择控件：父级拒绝更新后 DOM 与 ARIA 不回滚

- **最小复现**：`<UiCheckbox :model-value="true" @update:model-value="() => undefined" />`，点击后控件保持未选中；`UiSwitch` 的 `aria-checked` 同样与应用状态分歧。
- **根因（适配层 + 共享 helper）**：这些组件用裸 `:checked` 绑定，未使用 `v-model` 指令。原生控件在点击时已翻转，父级拒绝后 props 未变，Vue 的 patch 因前后 vnode 值相等而跳过写回，任意重渲染也无法恢复。React 由 `restoreControlledState` 自动回滚，两端不对称。
- **修复**：新增 `packages/vue/src/form-control.ts` 的 `restoreControlledChecked(input, readExpected, syncAriaChecked)`，在 `nextTick` 后读取**当前** props 值再比对，仅回滚真正被拒绝的更新。`UiCheckbox`/`UiSwitch` 接入（Switch 同时同步 `aria-checked`）。
- **关键陷阱**：首版用 emit 时捕获的旧值 + 单次 `nextTick`，把父级**接受**的正常翻转也回滚了，导致 `choice-control-behavior.spec.ts` 8 项回归。改读 getter 后两种路径同时正确。
- **覆盖**：`audit-regressions.spec.ts` 的 `Vue {Checkbox,Switch} restores the controlled state when the parent rejects an update`；既有的 `choice-control-behavior.spec.ts` 正常受控路径保持通过。

### P2 共享 overlay-runtime：键盘焦点移出浮层不关闭

- **最小复现**：删除 `showPopover`/`hidePopover` 后打开 Select 或菜单，Tab 遍历完后浮层仍开，`aria-expanded` 停留 true。
- **根因（共享运行时）**：`installDismiss` 只处理外部 `pointerdown` 与 Escape。native 模式依赖浏览器 light-dismiss，但 Chromium 在键盘焦点移出时**不会**关闭 popover；fallback 模式完全没有关闭路径。偏离 APG menu/listbox 模式。
- **修复**：`packages/overlay-runtime/src/index.ts` 增加 document capture `focusout`：焦点落到浮层与触发器之外时关闭。门控条件 `relatedTarget` 必须是元素，避免与 pointerdown 路径重复计数（首版导致 `Vue controlled Popover stays open when parent rejects dismiss / fallback` 的 dismiss 计数 2→3 回归）。
- **覆盖**：`{Vue,React} Select closes its fallback panel when focus leaves with Tab`、`{Vue,React} DropdownMenu closes and restores focus when Tab leaves / {native,fallback}`。

### P2 Vue `UiScrollbar`：多实例卸载互相破坏

- **最小复现**：两个 `UiScrollbar` 同时挂载，卸载其一后 `html` 上的 `ui-scrollbar-target` 被整体移除，剩余实例的原生滚动条隐藏失效。
- **根因（跨框架不一致）**：React 侧已有引用计数（`nativeOwners`），Vue 侧直接 `classList.toggle`，每次卸载无条件移除。
- **修复**：把引用计数抽到共享层 `packages/overlay-runtime/src/scrollbar-owner.ts`（`acquireNativeScrollbarHiding`），由 overlay-runtime 导出；Vue 与 React 同时改为使用它，并保留“页面原本已有该 class”的还原语义。
- **覆盖**：`Vue two Scrollbar owners keep the native class until the last releases it`。

## 经核验不成立的发现（未改代码）

- **`UiRadioGroup` 缺省 `name` 时分组失效**：实测两端在不传 `name` 时浏览器仍按同一表单分组，勾选互斥与方向键移动均正常。已补 fixture 与用例锁定该行为，不构成缺陷，不改实现。
- **`UiField` 的 label 无法关联非 labelable 控件**：契约夹具通过显式 `aria-label` 提供可访问名称，Select/RadioGroup 均有正确可访问名称（AX 套件断言）。这是使用约定而非实现缺陷；是否需要 `aria-labelledby` 兜底属于 API 扩展决策，本轮不做无授权重构。
- **Vue listener 清理（历史线索）**：已确认修复，`component-interactions.spec.ts` 有监听计数回落断言。

## 保留缺口

下表是 2026-10-25 的审计快照。2026-10-29 已实施动态浮层跟踪与 Popover/Menu 的 `aria-controls`，并启动跨引擎验证；后续结果及仍未完成的边界见[实施记录](acceptance-2026-10-29-overlays.md)，不回写本报告的历史通过数字。

| 缺口 | 性质 | 说明 |
| --- | --- | --- |
| NVDA / Orca 人工验收 | 未验证 | 本轮所有可访问性结论止于自动化，不得标记为人工通过 |
| 真实操作系统 IME | 未验证 | 仅合成 composition 事件；React 侧无 IME 保护，依赖原生惯例 |
| 浮层内容异步增高重定位 | 未修复（P2） | 共享 runtime 只监听 window `resize`/`scroll`，无 `ResizeObserver` 与锚点位移检测；动态增高或非滚动位移时浮层不重定位 |
| 浮层触发器的 `aria-controls` | 未修复（P2） | Popover/DropdownMenu 面板无 `id`、触发器无 `aria-controls`；Select 已具备（SSR 稳定 `useId`） |
| fallback 多层叠加 | 未修复（P3） | 无“仅关闭栈顶层”仲裁，一次 Escape 会关闭所有层 |
| 菜单禁用项可聚焦性 | 未修复（P3） | 用原生 `disabled` 并从导航序列剔除，偏离 APG 建议的 `aria-disabled` |
| 滚动回调无 rAF 合帧 | 未修复（P3） | 滚动期间每事件一次同步布局测量 |
| Select type-ahead / `aria-activedescendant` | 未修复（P3） | 采用“焦点移入 listbox”模式，与 APG select-only combobox 建议不同（可用性成立） |
| Vue 非受控初始值 API | 未修复（P3） | 选择类控件无 `defaultValue`，组内与 `UiSegmentedControl` 不一致 |
| React SegmentedControl 重复值告警 | 未修复（P3） | Vue 有 DEV 告警，React 无 |

以上缺口均为已定位但未改动项，**不属于本轮修复范围**，不声称已解决。

## 测试与验收结果

| 验证层 | 结果 |
| --- | --- |
| `release:check`（biome、changesets、文本完整性、样式、Tailwind、契约矩阵、框架一致性、typecheck、单测、构建、八包验证） | **通过** |
| Vue 单测 | 77 通过 |
| React 单测 | 38 通过 |
| 完整 Playwright（desktop + mobile，Windows Chromium） | **942 通过，0 失败，68 条件跳过**（10.6 分钟） |
| 新增审计用例 | `audit-regressions.spec.ts`（跨框架缺陷回归）+ `form-control-ax.spec.ts`（可访问性语义断言），共 24 项，全绿 |

新增 `form-control-ax.spec.ts` 使用真实可访问名称、`toHaveRole`、`toHaveAccessibleName`、`aria-controls` 与 listbox 关联、`aria-expanded` 状态转换做断言，验证的是辅助技术消费的语义树而非 DOM 形状。

**过程回归的处置**：本轮修复曾引入 8 项失败（6 项为 fixture `name` 污染 FormData 与 Popover dismiss 重复计数，2 项为新增 fixture 无条件渲染导致 `react-navigation-visual` 截图位移）。全部定位后修复，未通过更新基线、放宽阈值或裁剪断言来回避。

## 跨引擎

未在 Firefox/WebKit 跑完整套件。按风险选择性覆盖的候选是本轮改动的三处共享运行时行为（focusout 关闭、卸载清理、引用计数），建议作为后续独立任务补齐，而不是在本报告中等同于已验证。

## 结论

本轮确认并修复 4 个真实缺陷：2 个 P1（React Select 卸载泄漏、Vue 受控控件不回滚），2 个 P2（键盘焦点移出浮层不关闭、Vue Scrollbar 多实例互坏）。其中 3 个的根因在共享层或跨框架语义缝隙，修复均为最小改动，未新增公共 API、未改动玻璃视觉、动效、尺寸或既有契约。

共享 `overlay-runtime` 与 `motion` 的架构纪律经复核仍然成立：WeakMap 链式清理、受控/非受控双端语义等价、native/fallback 对偶、SSR 安全、CSS zoom 换算均有实现与测试兜底。

仍有若干 P2/P3 缺口（持续重定位、`aria-controls`、叠加仲裁等）明确列出，未做无授权扩张。
