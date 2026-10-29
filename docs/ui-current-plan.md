# Neoverse-UI 当前工作计划

更新：2026-10-29。规划基于 `dev` 的 `7b5bdfc`、`contracts/component-matrix.json`、需求登记及消费项目当前源码；npm 已发布基线与未发布源码分开记录。已实施范围见下方进度，其他条目仍是工作安排。

## 当前基线

- 组件矩阵：36 个公开组件，21 个 Stable、15 个 Consumer Validation。`UiTerminalEcho` 已补齐共享提示符回显、Vue/React 浏览器与 XCA 消费证据，未自动晋升 Stable。成熟度必须以组件矩阵及其测试/真实消费证据为准。
- 2026-10-13 已完成：`UiStatCard`、`UiTimeline`、`UiStepFlow`、`UiTerminalPrompt`、`UiTerminalSurface`、`UiTerminalLine`、`UiTerminalTranscript` 的真实消费与视觉验收；React Breadcrumb / Dock 浏览器运行态补齐。交付依据见[归档需求的 resolution](../contracts/component-requests/archive/)；旧的独立验收文档当前不在工作区。
- 2026-10-18 用户明确批准以当前页面视觉为新基准：有效截图基线为桌面/移动各 30 张，46 项截图测试在更新后与非更新模式下均通过；已移除 12 张无测试引用的历史快照。详见 [2026-10-18 验收记录](acceptance-2026-10-18.md)。
- 2026-10-19 本地浏览器门禁已通过：Playwright 714 项，675 通过、0 失败、39 跳过，`bun run release:check` 通过；移动端触控、浮层定位、预览锚点以及桌面字体/加载时序已收口。详见 [2026-10-19 验收记录](acceptance-2026-10-19.md)。
- 活动需求以 `bun run requests list` 为准。已交付或拒绝的请求放在 `contracts/component-requests/archive/`，仍由 CLI 校验和提供历史查询，**不得作为待实现事项再次分派**。
- 0.3.0 基线已于 2026-10-21 发布：Tokens / Tailwind / Vue / React / Overlay Runtime 为 0.3.0，Motion / Glass Runtime 为 0.2.1，Giscus Theme 保持 0.2.0。2026-10-25 官方 Registry 的八包 `latest` 与本地 manifest 一致；[Release 39613361164](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/39613361164) 的发布和正式 Registry 安装检查均成功，七个新标签指向 `dfb84a7`。详见[发布说明](release-0.3.0.md)。
- 终端语义 Token 请求 [`CR-20261010-2A6D0E6E`](../contracts/component-requests/archive/CR-20261010-2A6D0E6E.json) 已于 2026-10-23 交付归档；用户接受 XCA 保持本地 `file:` 消费且 Token 与 npm 0.3.0 一致，不再要求切换依赖来源。见[终端 Token 验收](acceptance-2026-10-20-terminal-tokens.md)。
- 2026-10-29 已核对本地与远端 `dev` 均为 `7b5bdfc`；[CI 40839029975](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/40839029975) 的 Linux 质量、三分片视觉和 Windows 浏览器门禁均成功。此前“`f35c566` 尚未推送”的待办已失效；React 功能补齐、Echo、跨框架修复、Aurora Glass 命名等后续源码仍须与已发布 0.3.0 分开验收。该 CI 不等于 Firefox/WebKit 或人工辅助技术验收。
- 2026-10-25 下午收口：4 张 `consumer-parity` 基线漂移经像素取证确认全部源于 `f35c566` 的契约矩阵数据行与 Parity 列文字更新（非终端回显卡片，无布局破损），已更新基线并全量复跑 Design Lab（144 通过/6 条件跳过/0 失败）；`release:check` 在清除本机 `NODE_ENV=production` 污染后全绿（该环境变量曾致 Vue prod 构建下 `emitted()` 假失败 15 项）。详见 [Consumer Validation 记录](consumer-validation-2026-10-25.md)。
- 2026-10-29 `bun changeset status`：React / Vue / Tailwind / Tokens 聚合为 minor，Overlay Runtime / Motion / Glass Runtime 为 patch，Giscus Theme 无变更。按当前 manifest 和 Changeset 规则，候选分别为前四包 0.4.0、Overlay Runtime 0.3.1、Motion / Glass Runtime 0.2.2；这是版本预期，尚未版本落盘，也未核验当前 Registry `latest`。
- 2026-10-29 triage / implementation 队列均为空；`check:contracts` 通过（36 个共享组件、9 个数据契约、21 个字面量联合，13 条需求登记有效）。不从归档需求生成新一轮实现任务。

## 下一阶段目标

本阶段围绕现有组件完成“共享运行时修复 → 跨引擎验证 → 真实产品验收 → 候选交付”。不以新增组件数或 Stable 晋升数作为交付目标；暂时没有真实消费场景的组件可以继续保持 Consumer Validation。

当前缺口直接从矩阵统计：

| 证据维度 | 待完成 | 使用方式 |
| --- | --- | --- |
| 总体发布视觉 | 7 项仍为 playground | Checkbox / RadioGroup / Switch / Field / Presence / Popover / DropdownMenu |
| 总体真实消费 | 9 项 pending | 按现有产品需求补证据，不为补数新造产品页面 |
| 单独 React 发布视觉 | 27 项 pending | 29 个带 `reactValidation` 的组件中，Breadcrumb / Echo 已验证视觉；其余分批补齐 |
| 单独 React 真实消费 | 29 项 pending | Vue 消费、SSR 渲染和 React fixture 均不能替代 |

这些统计维度存在重叠，不相加为组件总数。整体 Stable 和单独 React 验收是不同状态，现有 21 个 Stable 不代表所有 React 适配器已完成产品验收。

## 本轮实施进度（2026-10-29）

- N1/N2 已实现：共享动态浮层跟踪、SSR 稳定的 Popover/Menu 关联；另修复 WebKit 原生 choice 输入框未覆盖整行的点击缺陷。保留组件成熟度与 React 消费状态。
- N3 已扩展测试选择并完成 CSS 基础层定向验证；可选 Glass 增强层、原生 radio 键盘策略等差异尚未收口，不标记整体完成。验证结果、Firefox 单项复跑及范围见[本轮实施记录](acceptance-2026-10-29-overlays.md)。
- N4 已提供环境记录与人工操作步骤，NVDA / Orca / 真实 IME 仍未执行。
- M3 的 Doc 迁移已写回：精确 npm 来源替代历史 tarball，补齐 RSC 客户端入口；正式包与本地候选分别完成安装、构建和真实页面回归，候选另通过 81 项单测。见[迁移记录](consumer-migration-2026-10-29.md)。XCA 的隔离源码副本已有候选验收，其原工作区未修改。
- 已复现并修复 Glass 装饰动画持续重绘静止边缘；51 项单测、32 项 Chromium Glass 回归和 WebKit 调度用例通过。其余跨引擎增强层限制继续保留。
- 本轮新增两份 patch Changeset，当前共九份候选记录；未提交、推送、版本落盘或发布。

## 工作顺序与验收

### M1：收口共享浮层与跨引擎风险（优先启动）

依据：[跨框架与无障碍审计](audit-2026-10-25-crossframework-a11y.md)。先在真实浏览器建立失败复现，再决定实现；不得把静态审查线索直接写成已确认缺陷。

| 编号 / 优先级 | 工作 | 完成条件 |
| --- | --- | --- |
| N1 / P1 | 动态浮层重定位 | 覆盖打开后内容异步增高、锚点在无 scroll/resize 时位移、长内容与 CSS zoom。确认缺陷后在共享 overlay-runtime 修复；只增加 ResizeObserver 不能自动解决所有锚点位移，须界定支持范围。Vue/React 与 native/fallback 均验证，关闭/卸载后观察器和监听器归零 |
| N2 / P1 | Popover / DropdownMenu 的 ARIA 关联 | 两端补齐稳定 panel id 与触发器 `aria-controls`，验证多实例唯一性、SSR/hydration 一致、开关状态与焦点恢复；Select 已有此能力，不重复实现，不给普通 Popover 增加 focus trap |
| N3 / P1 | Firefox / WebKit 风险回归 | 现有 cross-browser 配置只匹配 `component-interactions` / `react-parity`；纳入本轮审计、表单受控回滚、overlay 清理和 Scrollbar 引用计数的相关用例。固定目标 SHA，记录各引擎通过/失败/条件跳过及原因；先跑定向集，再决定是否扩展常规门禁 |
| N4 / P1 | 辅助技术与真实 IME 验收 | Windows NVDA / Linux Orca 验证表单名称与状态、Select/Menu 键盘及播报、关闭后的焦点；真实操作系统输入法验证 Input/Textarea 组合输入与父级重渲染。记录 OS、浏览器、AT/IME 版本、步骤与结果；没有实际运行就保留待验收 |

本轮 N1—N3 完成后，更新 `overlay-contract.md` 与审计缺口的状态及证据。N4 由能操作对应环境的维护者完成，自动化可提供夹具和步骤，不能代签人工结果；未完成时保留为候选验收限制。

### M2：按真实消费补齐组件证据

先做已有 Vue 产品调用，再推进 React 消费迁移；视觉检查可以独立推进，但不据此提前关闭消费待办。

| 批次 | 范围与真实入口 | 完成条件 |
| --- | --- | --- |
| A：表单与浮层 | Slides `apps/web/app/pages/slides/index.vue` 的 Field/Input/Select；XCA `app/components/site/SiteHeader.vue` 的 Popover，以及 `app/features/terminal/components/TerminalInteraction.vue` 的 Field/Input | 补独立状态视觉，覆盖深浅/系统主题、焦点、禁用/只读、校验消息与浮层打开态，按组件适用状态执行。验证真实页面键盘/触控及窄屏；选择控件、DropdownMenu 未找到真实调用时维持 consumer=pending |
| B：React 产品消费 | 优先 Neoverse-Doc 已有导航、表单和内容页；Breadcrumb / Input / Select / Field / TooltipSurface 仅在现有需求匹配时接入 | 先完成 M3 的安装与迁移路径，再逐项记录真实调用、包来源、目标 SHA/版本、交互和页面结果；无适用场景则登记缺口，不替换业务框架现成能力来凑验收 |
| C：其余组件 | Table / Disclosure / Presence / Textarea 与新增 React 适配器 | 先排查真实需求；Presence 优先补进入/退出反转、timer fallback、退出中卸载的浏览器证据。组件全部适用的 release visual 与真实消费满足后，才单独评估晋升 |

视觉基线变更需说明可见行为变化并检查差异，更新后须以非更新模式复跑；样式最终由维护者审阅。每项证据至少包含组件/框架、真实消费者文件、依赖来源和目标提交、命令/环境、结果及未覆盖边界。矩阵只登记已完成层次；不批量晋升，不把历史通过数字复制为当前结果。

### M3：消除消费安装阻塞

本轮先复核消费 manifest 与 CI，再用隔离副本验证 Doc 迁移并写回最小差异。XCA、Doc 和 Slides 的既有未提交工作继续保留。

| 优先级 | 消费项目 | 下一步与完成条件 |
| --- | --- | --- |
| 本地迁移完成 | Neoverse-Doc | 六包及 overrides 已切精确 npm，历史 tarball 安装阻塞已消除；正式包和候选 file: 分别构建并完成真实首页、阅读页回归。RSC 边界、81 项候选单测和来源边界见迁移记录；远端 CI、部署与人工视觉未执行 |
| P1 | Neoverse-Slides | 保留本地 `file:` 开发方式，在 CI 显式获取固定 UI 提交或可追溯制品；干净安装、`ui:sync`、`check` 与真实 `/slides` 尺寸/行为验证可复现，随后按项目实际构建脚本验收 |
| P1 | XCA-Portal | 当前 CI 已固定 UI `d4238c7`，不再是 10 月 25 日记录的 `82d0614`。下一次集成固定为经验证的候选 SHA，复核共享同步与嵌套 dist；执行项目检查及相关终端/浮层回归。目标组合验收通过后再更新消费证据 |
| P2 | Neoverse | 保持现有 npm 消费，候选进入 Registry 后验证真实页面；继续复用共享材质与尺寸，不承担其他项目迁移阻塞 |

M3 是 M2 React 产品验收的前置条件，可以与 M1 并行安排；这里的顺序表示依赖关系，不要求先完成全部组件视觉才开始解决安装问题。

### M4：形成可交付候选

候选范围以已验证改动和 Changeset 为准，不把全部 29 项 React 产品验收作为统一发布前提。未完成的组件验收可以保留明确的 Consumer Validation / `reactValidation` 状态；若 N1—N4 暴露影响目标消费的实际缺陷，则先修复或明确缩小候选范围。

1. 审核当前 Changeset 与实际差异，确认独立包版本、内部依赖范围、迁移说明及新增 API 清单。当前预期版本见基线，不擅自改为 0.3.x。
2. 在固定候选 SHA、干净环境完成 `release:check`、本地制品的 JS/CSS/类型 smoke、全量 Chromium 门禁与本轮定向 Firefox/WebKit 回归；Windows/Linux 及条件跳过分别记录。避免与开发 watcher 同写 dist。
3. 记录至少一个 Vue 和一个 React 真实消费项目的候选安装、构建、关键流程结果。React 消费未具备条件时，可以继续维护候选，但本阶段“产品验收”里程碑不能关闭。
4. 输出目标 SHA、包/API/版本差异、迁移步骤、全部证据和剩余限制；版本落盘、提交、推送及发布按用户后续明确授权执行。进入发布时再核验 Registry、发布身份及流程，不沿用历史可用性结论；发布后另验正式包安装。

阶段结束的判断是：N1/N2 已复现并修复或有“不成立/范围受限”的证据；N3 有目标提交上的引擎结果；真实 Vue/React 消费及安装链路可追溯；N4 有人工结果或明确未完成限制。公开组件数量、成熟度总数无需变化。

## 后续候选与暂缓项

- fallback 多层仲裁：先确认真实嵌套场景，再设计“仅关闭栈顶层”和受控拒绝关闭策略，不与单层修复混在一起。
- 滚动定位 rAF 合帧：先测布局次数与滚动定位延迟，有回归证据再优化；已有浏览器缓存与去重构建不重复实施，不增加 CI 分片数量来代替诊断。
- `design-lab` 私有 class/像素断言耦合：仅在维护目标用例时逐条替换为等强度行为或视觉断言，不删截图、放宽阈值或整批重写测试。
- Select type-ahead、菜单禁用项焦点策略、Vue 非受控 API 等均涉及交互/API 决策，保留审计记录，待真实需求与明确任务后推进。
- Dialog / AlertDialog、完整 Tooltip、Toast、Tabs / Pagination 继续作为候选；先由真实消费提交需求、评审契约，再决定是否进入实现。本阶段不预建公共组件或矩阵行。

## 下一阶段原则

1. **按实际消费缺口排序**。Dialog / AlertDialog、完整 Tooltip、Toast、Tabs / Pagination 等仅为候选，未登记真实场景前不提前创建公共组件。
2. **保留职责边界**。Hero、业务状态、路由、MDX、终端命令解析及产品演出动画归消费项目；公共组件只承担可复用的结构、样式和交互契约。
3. **先验收后关闭**。需求关闭时保留代码、测试、截图、消费者路径和决定依据；通过 CLI 自动归档关闭请求，但在历史查询与契约检查中仍可读取。
4. **禁止顺带提交或发布**。Changeset 是候选发布记录，不代表授权执行 `changeset version`、`npm publish` 或 Git 提交。

## 关联文档

- [架构与组件职责](architecture.md)
- [组件矩阵及晋升规则](component-contract-matrix.md)
- [2026-10-25 跨框架与无障碍审计及保留缺口](audit-2026-10-25-crossframework-a11y.md)
- [2026-10-25 Consumer Validation 分层证据](consumer-validation-2026-10-25.md)
- [2026-10-25 CI 性能与复杂度审计](ci-and-complexity-audit-2026-10-25.md)
- [跨项目需求生命周期与本地写入](component-requests.md)
- [已关闭需求与交付证据](../contracts/component-requests/archive/)
- [2026-10-18 回归、跨平台与消费验收记录](acceptance-2026-10-18.md)
- [2026-10-19 全量浏览器回归与剩余阻塞](acceptance-2026-10-19.md)
- [终端组合边界](terminal-composition.md)
- [消费项目默认尺寸与已知问题](consumer-sizing.md)
- [极光玻璃材质规范](material-standards.md)
- [版本与发布流程](releasing.md)

较早的 P0/P1 审计过程保留在 Git 历史，不再作为“尚待实施”清单重复维护。

## 本次规划核查边界

2026-10-29 执行了需求队列查询、`bun changeset status`、`bun run check:contracts`，读取了目标 SHA 的 GitHub CI/job 结果，并只读核对上述消费源码和依赖。未重新执行全量构建、浏览器套件、真实消费验收或人工 AT；文中 10 月 25 日的通过记录均为历史证据。
