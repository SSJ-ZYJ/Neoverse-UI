# Neoverse-UI 当前工作计划

更新：2026-10-25。当前源码以本地 `dev` 及 `contracts/component-matrix.json`、需求登记为准；npm 已发布基线与未发布源码分开记录。待办只包含未完成事项，历史验收保留在关联记录中。

## 当前基线

- 组件矩阵：36 个公开组件，21 个 Stable、15 个 Consumer Validation。`UiTerminalEcho` 已补齐共享提示符回显、Vue/React 浏览器与 XCA 消费证据，未自动晋升 Stable。成熟度必须以组件矩阵及其测试/真实消费证据为准。
- 2026-10-13 已完成：`UiStatCard`、`UiTimeline`、`UiStepFlow`、`UiTerminalPrompt`、`UiTerminalSurface`、`UiTerminalLine`、`UiTerminalTranscript` 的真实消费与视觉验收；React Breadcrumb / Dock 浏览器运行态补齐。交付依据见[归档需求的 resolution](../contracts/component-requests/archive/)；旧的独立验收文档当前不在工作区。
- 2026-10-18 用户明确批准以当前页面视觉为新基准：有效截图基线为桌面/移动各 30 张，46 项截图测试在更新后与非更新模式下均通过；已移除 12 张无测试引用的历史快照。详见 [2026-10-18 验收记录](acceptance-2026-10-18.md)。
- 2026-10-19 本地浏览器门禁已通过：Playwright 714 项，675 通过、0 失败、39 跳过，`bun run release:check` 通过；移动端触控、浮层定位、预览锚点以及桌面字体/加载时序已收口。详见 [2026-10-19 验收记录](acceptance-2026-10-19.md)。
- 活动需求以 `bun run requests list` 为准。已交付或拒绝的请求放在 `contracts/component-requests/archive/`，仍由 CLI 校验和提供历史查询，**不得作为待实现事项再次分派**。
- 0.3.0 基线已于 2026-10-21 发布：Tokens / Tailwind / Vue / React / Overlay Runtime 为 0.3.0，Motion / Glass Runtime 为 0.2.1，Giscus Theme 保持 0.2.0。2026-10-25 官方 Registry 的八包 `latest` 与本地 manifest 一致；[Release 39613361164](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/39613361164) 的发布和正式 Registry 安装检查均成功，七个新标签指向 `dfb84a7`。详见[发布说明](release-0.3.0.md)。
- 终端语义 Token 请求 [`CR-20261010-2A6D0E6E`](../contracts/component-requests/archive/CR-20261010-2A6D0E6E.json) 已于 2026-10-23 交付归档；用户接受 XCA 保持本地 `file:` 消费且 Token 与 npm 0.3.0 一致，不再要求切换依赖来源。见[终端 Token 验收](acceptance-2026-10-20-terminal-tokens.md)。
- 当前远端 `dev` 为 `34bd4a1`，[CI 40107362521](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/40107362521) 的 Linux 质量、三分片视觉和 Windows 浏览器门禁均成功。本地 `dev` 的 `f35c566`（`UiTerminalEcho`）尚未推送；React 功能补齐、Echo 等后续源码不属于已发布 0.3.0，Changeset 仍是候选记录。
- 2026-10-25 下午收口：4 张 `consumer-parity` 基线漂移经像素取证确认全部源于 `f35c566` 的契约矩阵数据行与 Parity 列文字更新（非终端回显卡片，无布局破损），已更新基线并全量复跑 Design Lab（144 通过/6 条件跳过/0 失败）；`release:check` 在清除本机 `NODE_ENV=production` 污染后全绿（该环境变量曾致 Vue prod 构建下 `emitted()` 假失败 15 项）。详见 [Consumer Validation 记录](consumer-validation-2026-10-25.md)。
- 当前 Changeset 沿用新增公共组件的 minor 策略：React / Vue / Tailwind 聚合为 minor，Motion 为 patch；前三包从 0.3.0 将进入 0.4.0，而非 0.3.1。这里只收口 0.3.0 基线及后续候选记录，不更改版本策略或执行版本落盘；若必须发布为 0.3.x，需另行明确该策略决定。

## 尚待完成

| 优先级 | 工作 | 完成条件 / 当前边界 |
| --- | --- | --- |
| P0 | 0.3.0 之后的源码候选发布 | 按 Changeset 审核实际未发布范围及独立包版本，完成目标提交的质量/浏览器门禁；版本落盘和发布仍需单独授权，不能因八包已注册而省略发布身份复核 |
| P1 | 未推送提交的远端 CI 与实际辅助技术体验 | `34bd4a1` 已有成功的 Linux / Windows CI；`f35c566` 尚无远端记录。Windows NVDA / Linux Orca 人工验收仍待完成，本地或 CI 浏览器通过不等于 AT 验收 |
| P1 | `UiBreadcrumb` 的 React 真实产品消费 | Runtime/Release Visual 已验证；Consumer 仍 Pending，按真实消费验收再修改矩阵 |
| P1 | Checkbox / RadioGroup / Switch / Field / Popover / DropdownMenu / Presence 等状态视觉与消费证据 | 完成目标组件的浅深/系统主题、焦点、禁用、只读、校验/浮层打开态等 release visual 以及真实消费，逐项记录 |
| P1 | 新 React 适配与其他 Consumer Validation 组件的成熟度复核 | 以矩阵及 `reactValidation` 为唯一状态源；现有 Vue / 共享验收不自动成为 React 真实消费证据，按缺失的发布视觉与产品消费逐项验收，不批量升级成熟度 |
| P1 | 消费项目的安装复现与迁移边界 | Doc 仍需三份无法等价替换的 0.1.0 历史 tarball，Slides CI 尚未检出兄弟 UI；XCA 固定 UI 提交与本地 Echo 源码不同。见[依赖核查](consumer-sizing.md#2026-10-25-消费依赖核查)，不擅自升级或统一开发来源 |

## 下一阶段原则

1. **按实际消费缺口排序**。Dialog / AlertDialog、完整 Tooltip、Toast、Tabs / Pagination 等仅为候选，未登记真实场景前不提前创建公共组件。
2. **保留职责边界**。Hero、业务状态、路由、MDX、终端命令解析及产品演出动画归消费项目；公共组件只承担可复用的结构、样式和交互契约。
3. **先验收后关闭**。需求关闭时保留代码、测试、截图、消费者路径和决定依据；通过 CLI 自动归档关闭请求，但在历史查询与契约检查中仍可读取。
4. **禁止顺带提交或发布**。Changeset 是候选发布记录，不代表授权执行 `changeset version`、`npm publish` 或 Git 提交。

## 关联文档

- [架构与组件职责](architecture.md)
- [组件矩阵及晋升规则](component-contract-matrix.md)
- [跨项目需求生命周期与本地写入](component-requests.md)
- [已关闭需求与交付证据](../contracts/component-requests/archive/)
- [2026-10-18 回归、跨平台与消费验收记录](acceptance-2026-10-18.md)
- [2026-10-19 全量浏览器回归与剩余阻塞](acceptance-2026-10-19.md)
- [终端组合边界](terminal-composition.md)
- [消费项目默认尺寸与已知问题](consumer-sizing.md)
- [极光玻璃材质规范](material-standards.md)
- [版本与发布流程](releasing.md)

较早的 P0/P1 审计过程保留在 Git 历史，不再作为“尚待实施”清单重复维护。
