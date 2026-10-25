# 2026-10-25 Consumer Validation 治理（B1—B5）

## 边界与结论

状态唯一来源是 `contracts/component-matrix.json`。本次基于 `dev` 的 `f35c566`、Batch A 尚未提交的修正及本轮改动；没有提交、推送、版本落盘或发布。保留消费者的原有源码与依赖方式，Slides / XCA 使用隔离的真实消费源码副本及当前打包产物验收，不把副本当作新产品实现。

15 个目标开始时均为 Consumer Validation，Vue/React Adapter 与 Unit 已登记完成，React Runtime 已登记验证；除 Echo 的 Vue/XCA 历史消费外，其他目标的 consumer 均为 pending。**最终 15 个仍全部保持 Consumer Validation，Stable 总数仍为 21。**本次只补充可追溯证据及五项 Vue 消费登记，不以数字晋升为目标。

层次不能互换：SSR/Unit 不等于浏览器交互，Runtime 不等于 Release Visual，组合页面截图不等于所有组件状态覆盖，Vue 产品使用不等于 React 产品使用。下文的“缺”表示尚无足够验收证据，不表示适配器未实现。

## 已确认缺陷与最小修复

### Vue Input / Textarea：IME 模型提前提交

先在 `packages/vue/src/components.test.ts` 增加两条 `commits IME text only after composition ends` 回归。正确使用 happy-dom 环境后，两条均因组合中的 `ni` 已产生 `update:modelValue` 而失败。改用 Vue 原生 composition-aware `v-model` 后，form controls 分组 12 条通过；完整 Vue 套件 77 条通过。

- 文本输入/多行输入在 composition commit 后更新模型，消费者无关重渲染不覆盖未完成文本。
- 数字分支保留原字符串事件值、原生边界和步进逻辑，不用 `v-model.number` 改变公共值类型。
- React 保留原生 `value/defaultValue/onChange` 与 composition 事件惯例，没有额外输入法状态机。
- 新浏览器用例在真正 Vue DOM 中复核 composition 与消费者重渲染；这是合成 composition 事件边界验证，不是操作系统输入法人工验收。

### Vue / React Select：方向键不能进入选项

先增加 `form-control-behavior.spec.ts` 的键盘入口回归，两个框架均在 ArrowDown 后仍找不到可见 listbox 而失败。最小修复补齐 ArrowDown/ArrowUp 入口、已选 enabled 项聚焦、无有效选中项时首/末 enabled 项聚焦，以及 SSR-stable `aria-controls` 关联。

原有选项键盘、受控值归属、readonly/disabled、native/fallback 保留。新测试验证 Home/End、Escape 焦点恢复、禁用项跳过、父级拒绝更新后显示与提交值不变。没有新增 props、CSS 或非受控 Select 模式。

B2 未确认实现缺陷。最初直接点击 Vue 标签 span 的自动化被覆盖整行的原生 input 拦截；改为滚入视区后点击用户看到的标签坐标，验证了真实 hit testing。没有为适配测试工具而修改组件 DOM 或样式。

## 单元与运行态证据索引

以下 Unit/Contract 全部在 Windows 和原生 Linux 的 `release:check` 中执行通过。React 的 SSR/结构检查只记为该层证据，不扩写为 effects、键盘或焦点验证。

- **V-U**：`packages/vue/src/components.test.ts`（输入、Field、choice、overlay、Presence、表格/披露/面包屑/显示组件）。
- **V-T**：`packages/vue/src/terminal.test.ts`（Echo 文本、上下文、无 editor）。
- **R-I**：`packages/react/src/index.test.ts`（表单/choice/native 属性、Table、Disclosure、Breadcrumb 的已有契约）。
- **R-F**：`packages/react/src/field.test.tsx`（Field 控件绑定、描述与 SSR ID）。
- **R-O**：`packages/react/src/overlay.test.tsx`（Popover/Menu 的已有 SSR 与状态契约）。
- **R-P**：`packages/react/src/presence.test.tsx`（Presence 的已有 SSR 契约，不代表完整退出生命周期）。
- **R-D**：`packages/react/src/parity.test.tsx`（Tooltip/Echo 等渲染契约）。
- **F**：`tests/visual/form-control-behavior.spec.ts`。
- **C**：`tests/visual/choice-control-behavior.spec.ts`。
- **I**：`tests/visual/component-interactions.spec.ts`。

## B1 — 表单基础

| 组件 | Vue / React Unit | 本轮 Browser Runtime | 发布视觉（Vue / React） | 真实消费（Vue / React） | 修改依据与保留缺口 |
| --- | --- | --- | --- | --- | --- |
| UiInput | V-U 的 IME、原生属性/步进；R-I | F：受控文本、Field、readonly/disabled、FormData、布局；Vue composition；React 非受控重置；`number-input.spec.ts`：两端步进/边界 | 既有 Forms 基线通过 / 有运行态截图，独立 Release Visual 仍缺 | Slides 搜索四组合通过 / 未找到目标调用 | 修复 Vue IME；React 无实现改动。不据 Vue 消费晋升 |
| UiTextarea | V-U 的 IME/多行；R-I | F：多行文本、readonly/disabled、提交、布局；Vue composition；React 非受控重置 | 既有 Forms 基线通过 / 独立 Release Visual 仍缺 | 未找到 / 未找到 | 修复 Vue IME；保持 consumer=pending |
| UiSelect | V-U；R-I | F：两端方向键入口、选项/禁用项、受控拒绝、readonly；I：fallback/跟随；`select-blocked-regression.spec.ts`：native/fallback 动态锁定 | 既有 Forms 基线通过 / 独立 Release Visual 仍缺 | Slides 分类/排序/语言/精选通过 / 未找到 | 两端键盘与 ARIA 修复；明确为受控组件，不承诺 defaultValue 模式 |
| UiField | V-U；R-F | F/I：标签、动态描述/消息关联、required/disabled 原生属性与提交；两端分别执行 | 组合 Forms 截图通过，独立状态范围仍不足，保持 playground / Release Visual 缺 | Slides 搜索标签、真实控件组合通过 / 未找到 | 不修改实现；不自动传递 validation，不运行业务校验。真实产品未覆盖错误/禁用等全部状态 |

Vue 模型的重置仍由消费者负责；React 原生 Input/Textarea 支持 `defaultValue` 与原生 reset。没有为追求形式一致而增加 Vue 的第二套非受控状态。

## B2 — 选择组件

| 组件 | Vue / React Unit | 本轮 Browser Runtime | 发布视觉（Vue / React） | 真实消费（Vue / React） | 修改或不修改依据 |
| --- | --- | --- | --- | --- | --- |
| UiCheckbox | V-U / R-I | C：标签坐标点击、焦点、Space；I：readonly 不变、提交、受控 reset，React 非受控 reset | Vue Forms 组合截图通过，完整独立状态覆盖仍缺 / 独立 Release Visual 缺 | 未找到 / 未找到 | 实现不改；原生 input 保持语义，不把产品设置里的本地 checkbox 算公共消费 |
| UiRadioGroup | V-U / R-I | C：方向键跳过 disabled、唯一 checked、焦点和数值模型；I：readonly、提交/reset、React 非受控 | 同上 / 缺 | 未找到 / 未找到 | 仅在契约夹具增加真实 disabled 项，未增加业务 UI 或公共逻辑 |
| UiSwitch | V-U / R-I | C：标签点击、焦点、Space；I：readonly、提交/reset、React 原生 checked 与 reset 后可访问状态 | 同上 / 缺 | 未找到 / 未找到 | 实现不改；原生 checkbox/switch 状态保留，未虚构产品消费 |

三个组件均维持 visual=playground、consumer=pending。XCA/Doc 自有主题设置或 SegmentedControl 的 radio 语义不能转记为这些公共组件的使用。

## B3 — 浮层和状态

| 组件 | Vue / React Unit | 本轮 Browser Runtime | 发布视觉（Vue / React） | 真实消费（Vue / React） | 决策与缺口 |
| --- | --- | --- | --- | --- | --- |
| UiPopover | V-U / R-O | I、`overlay-review-regressions.spec.ts`、`playground-interactions.spec.ts`：native/fallback、受控拒绝、Escape/outside、disable/re-enable、焦点、CSS zoom、卸载；React 有 listener 回基线检查 | 默认关闭态截图通过，不能代替打开态；保持 playground / 打开态 Release Visual 缺 | XCA 响应式菜单通过 / 未找到 | 不改实现；Vue listener 清理、异步增高内容、独立滚动/resize 与长内容视觉仍不完整；不承诺 focus trap |
| UiDropdownMenu | V-U / R-O | 同组浏览器用例：打开首项、跳过禁用项、Arrow/Home/End、选择/关闭、Escape/outside、native/fallback、disable/zoom | 关闭态组合截图通过，打开/选中/危险项等独立范围仍缺 / 缺 | 未找到 / 未找到 | 不改实现；不能借 Select 或 Popover 的跟随测试宣称本组件已全部覆盖 |
| UiPresence | V-U / R-P | `playground-interactions.spec.ts` 的 Motion/React fixture 用例复核实际显示与退出 | 未建立两端独立的中断/退出状态发布视觉 | 未找到 / 未找到 | 不改实现；React 进入/退出中断、timer fallback、退出中卸载的独立浏览器证据仍薄弱 |

只读审查发现的动态内容增高重新定位、长面板配合高 CSS zoom 等风险尚未确认为缺陷，不把静态推断写成 bug 或通过记录。没有改动 Overlay Runtime、Motion 或共享 CSS。

## B4 — 展示与导航

| 组件 | Vue / React Unit | 本轮 Browser Runtime | 发布视觉（Vue / React） | 真实消费（Vue / React） | 决策与缺口 |
| --- | --- | --- | --- | --- | --- |
| UiTable | V-U / R-I | `playground-interactions.spec.ts` 的两端 fixture、`table-backdrop.spec.ts` 的真实 DOM/材质 | Data Display 基线通过；Contract Lab 组合另有下述漂移 / 独立 React 表格基线缺 | 未找到 / 未找到 | 不改实现；窄屏键盘横滚、真实业务数据与人工 AT 尚缺 |
| UiDisclosure | V-U / R-I | 两端 fixture 原生展开/收起；`disclosure-edge.spec.ts` 的主题/轮廓 | Data Display 基线通过 / 独立 React 基线缺 | 未找到 / 未找到 | 不改实现；超长不可断词内容、真实产品与人工 AT 尚缺 |
| UiBreadcrumb | V-U / R-I | `navigation-runtime.spec.ts` 的 React 导航/current 更新、两端 Design Lab；`react-navigation-visual.spec.ts` | 两端已有基线通过，React visual 明确登记 validated | 未找到 / 未找到 | 不改实现；fixture 路由变化不等于产品消费，长层级/缩放焦点可达性尚待完整验证 |
| UiTooltipSurface | V-U / R-D | `tooltip-contour.spec.ts`、`tooltip-entrance.spec.ts`；真实 Pulse 额外两例通过 | Vue Status Feedback 基线与轮廓/采样通过 / 独立 React Release Visual 仍 pending | Neoverse Pulse 真实贡献日历通过 / 未找到 | 不改实现；这是展示表面，不是自动负责 trigger/dismiss/定位的完整 Tooltip；产品按钮自己提供可访问日期文本 |

Doc 的 Fumadocs Popover、本地 `<table>` 包装、原生 details 和 JSON-LD breadcrumb 均不是本次公共组件的真实调用，未用于补 consumer。

## B5 — TerminalEcho

- Vue：V-T 及终端组合/表面/重排测试通过；真实 XCA 记录命令的 host/path 快照、plain text、选字、无 editor、尾部跟随及窄屏布局通过。
- React：R-D、`react-parity.spec.ts` 的 recorded commands / tail / reader intent 与 480/1440 浅深截图通过；只有库内 fixture，**没有真实 React 产品消费**。
- 两端 Echo 均保持只读显示职责，不把 Transcript 的 `role=log`、live region、跟随滚动或 Prompt 的编辑器归为 Echo 自身自动能力。
- 不修改实现，Vue consumer 与两端 visual 保留；React consumer 仍 pending；成熟度仍为 Consumer Validation。长多行/超长 context、forced-colors/高 zoom 的独立证据仍不完整。

## 真实消费者的执行环境与范围

### Slides（Vue Input / Select / Field）

消费位置：`../Neoverse-Slides/apps/web/app/pages/slides/index.vue`，实际 `/slides` 页面。冻结安装真实源码副本，保留原 file: 声明，通过已有 `sync-consumer.ts --skip-build` 同步当前已构建包及 vendor CSS；没有改动原消费者。

1440/390 × 显式 light/dark 四组合均验证：

1. 合成 IME composition 尚未提交时不修改真实搜索 URL；提交后更新 `q` 并得到 0 presentations。
2. Reset 恢复真实列表与 URL；Search 的 Field 标签点击聚焦实际 input。
3. Category、Sort、Language、Featured 从键盘进入并选择，URL 分别更新；reload 后控件/URL/结果一致。
4. 真实 manifest 的一条 published presentation 在有效筛选后保留，页面不横向溢出。

没有伪造 manifest：单条数据不能证明多条排序顺序；当前无 series，未宣称验过 Series。消费者的 Field 未覆盖业务校验错误/禁用状态，相关公开契约由库内测试补验而非伪装产品覆盖。

### XCA（Vue Popover / TerminalEcho）

消费位置：`../XCA-Portal/app/components/site/SiteHeader.vue`、`app/features/terminal/components/TerminalTranscript.vue`。隔离真实源码、冻结安装后同步当前 UI 包，构建生产输出并用 Nuxt preview 验收。

现有 `mobile-header.spec.ts`、`terminal-shared-ui.spec.ts`、`terminal-visual-acceptance.spec.ts` **16/16 通过**，未更新截图。覆盖真实菜单的断点/路由/焦点/外部点击，以及真实命令、记录快照、选字、IME、跟随和终端产品截图。

首轮改用 dev server 时 12 通过、4 失败，包含 hydration 前操作的主题/命令状态；该轮不算通过，也未修改测试去接受失败。改回消费者原定的生产预览路径后全组通过。安装默认镜像还曾返回 httpxy tarball 404；隔离安装显式使用官方 Registry 后成功，未修改原仓库锁文件或镜像配置。

`TerminalInteraction.vue` 虽包含 Input/Field，但当前真实入口未注入 AuthGateway，登录命令返回未开放，只有测试会注入 prompt producer。该条件模板不计为 Input/Field 的已发生真实消费，也没有为验收开启登录或添加业务界面。

### Neoverse（Vue TooltipSurface）

消费位置：`../Neoverse/app/components/pulse/ContributionLandscape.vue`，实际 `/pulse` 页面。保持现有正式 npm 0.3.0 消费；TooltipSurface 本轮没有实现改动。不注入贡献数据，页面实际取得 365 个日期按钮与现有 GitHub 数据/缓存。

显式设置 `NEOVERSE_CONSUMER_URL` 后，已有 Pulse 用例 desktop/mobile **2/2 通过**：真实日期 hover/focus、body Teleport、定位、内容可见、采样根及真实 backdrop blur 像素检查。该消费不证明 React 版本；不宣称验证了所有产品主题/失焦分支。

## 本轮执行结果及未放宽的视觉门禁

| 验证层 | Windows | 原生 Linux / WSL |
| --- | --- | --- |
| `release:check` | 通过 | 通过（Bun 1.4.0） |
| Vue Unit | 77 通过 | 77 通过 |
| React Unit | 38 通过 | 38 通过 |
| 定向 Runtime/既有组件视觉用例（296 项） | 290 通过，6 条件跳过 | 290 通过，6 条件跳过 |
| 选定 Design Lab 发布截图（24 项） | 20 通过，4 失败 | 20 通过，4 失败 |
| 全量 Design Lab 截图（150 项，基线更新后复核） | 144 通过，6 条件跳过 | 未复跑 |

296 项范围为 F、C、I、number-input、select-blocked-regression、overlay-review-regressions、playground-interactions、table-backdrop、disclosure-edge、navigation-runtime、react-navigation-visual、tooltip-contour、tooltip-entrance、terminal-composition、terminal-surface、terminal-resize、terminal-theme-contract、react-parity。Windows 分两组执行，Linux 一组执行，没有把重复运行累加成更多覆盖。

6 项条件跳过是四项 desktop-only 几何断言在 mobile 跳过，以及两个未设置消费者 URL 的 Pulse 用例；Windows 后续对真实 Pulse 单独补验两项通过。Linux 使用 Arch/WSL 与 Playwright Ubuntu 24.04 fallback Chromium，不是新的远端 CI，也不是 Firefox/WebKit 证明。

**4 项失败是 `consumer-parity` 的 desktop/mobile × light/dark 旧截图，不是通过项。**在任何本轮矩阵修改前，两平台已同样失败：旧截图缺少 HEAD 已有的 `UiTerminalEcho` Contract Lab 行；实际桌面高度多 50px，移动多 372px。已检查 expected/actual/diff，且当时 ConsumerParity 模块、contract-lab、lab-modules、矩阵及快照相对 HEAD 均无本轮差异。

**后续收口（2026-10-25 下午）**：经像素级取证复核，4 张基线的漂移全部归因于 `f35c566` 带来的 Contract Lab 契约矩阵数据变化——矩阵表新增 `UiTerminalEcho` 数据行（浅色斑马纹表格行，非终端回显组件卡片；该组件演示位于 Terminal 模块的独立快照），以及 framework-parity 更新引起的若干行 Parity 列 `n/a→covered` 文字变化（抽样行差异仅 14-16 像素、集中单列内）。插入点以下内容桌面 155/155 行按 +50px、移动 100/103 行按 +372px 平移完全匹配，无任何布局/样式破损；本页模块未引用工作区未提交的 UiInput/Select/Textarea 改动。据此已更新 4 张基线并全量复跑 Design Lab：150 项中 144 通过、6 条件跳过、0 失败。未裁剪矩阵区域、未放宽阈值、未修改 UI。

另：本轮曾出现 Vue 单测 15 项失败的假警报，根因是本机 shell 全局 `NODE_ENV=production` 令 Vue 加载 prod 构建、`component:emit` devtools 钩子缺失，`@vue/test-utils` 的 `emitted()` 因此失效；unset 后同套件 77/77 通过，`release:check` 亦全绿。组件源码与测试本身没有任何问题。

既有 Release 标记只保留其已建立范围；这四个旧模块基线的漂移与任何缺失的框架/状态证据都不会被解释为新的 Stable 条件已满足。操作系统 IME、NVDA/Orca 人工体验及跨引擎行为仍未验收。
