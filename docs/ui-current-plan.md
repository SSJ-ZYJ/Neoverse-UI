# Neoverse-UI 当前工作计划

更新：2026-10-19。以本地 `dev` 工作区及 `contracts/component-matrix.json`、需求登记为准。**本页只记录未完成事项**，已完成验收不再复制进待办正文。

## 当前基线

- 组件矩阵：35 个公开组件，21 个 Stable、14 个 Consumer Validation。成熟度必须以组件矩阵及其测试/真实消费证据为准。
- 2026-10-13 已完成：`UiStatCard`、`UiTimeline`、`UiStepFlow`、`UiTerminalPrompt`、`UiTerminalSurface`、`UiTerminalLine`、`UiTerminalTranscript` 的真实消费与视觉验收；React Breadcrumb / Dock 浏览器运行态补齐。详情见 [2026-10-13 验收记录](acceptance-2026-10-13.md)。
- 2026-10-18 用户明确批准以当前页面视觉为新基准：有效截图基线为桌面/移动各 30 张，46 项截图测试在更新后与非更新模式下均通过；已移除 12 张无测试引用的历史快照。详见 [2026-10-18 验收记录](acceptance-2026-10-18.md)。
- 2026-10-19 本地浏览器门禁已通过：Playwright 714 项，675 通过、0 失败、39 跳过，`bun run release:check` 通过；移动端触控、浮层定位、预览锚点以及桌面字体/加载时序已收口。详见 [2026-10-19 验收记录](acceptance-2026-10-19.md)。
- 活动需求登记仅剩 `CR-20261010-2A6D0E6E`。已交付或拒绝的请求放在 `contracts/component-requests/archive/`，仍由 CLI 校验和提供历史查询，**不得作为待实现事项再次分派**。
- 上述交付仍属于未发布的工作区改动；通过本地验证不表示已经执行版本落盘或 npm 发布。

## 尚待完成

| 优先级 | 工作 | 完成条件 / 当前边界 |
| --- | --- | --- |
| P0 | 终端语义色 Token 请求 `CR-20261010-2A6D0E6E` 收尾 | 实现及本地消费已有证据，但验收包含正式发布；只能在明确获批的发布流程完成后关闭，不能因代码存在就标 delivered |
| P1 | Windows / Linux 远端 CI 与实际辅助技术体验 | CI 已配置 `dev` + 手动触发、Linux 全量视觉与 Windows Chromium 交互；待推送后的真实 CI 记录与 Windows NVDA / Linux Orca 人工验收，本机通过不等于远端和 AT 验收 |
| P1 | `UiBreadcrumb` 的 React 真实产品消费 | Runtime/Release Visual 已验证；Consumer 仍 Pending，按真实消费验收再修改矩阵 |
| P1 | Checkbox / RadioGroup / Switch / Field / Popover / DropdownMenu / Presence 等状态视觉与消费证据 | 完成目标组件的浅深/系统主题、焦点、禁用、只读、校验/浮层打开态等 release visual 以及真实消费，逐项记录 |
| P1 | 其他 Consumer Validation 组件的成熟度复核 | 以 `contracts/component-matrix.json` 为唯一组件状态源；逐项核对适配、浏览器测试、真实消费者，不为追求 Stable 数字批量升级 |

## 下一阶段原则

1. **按实际消费缺口排序**。Dialog / AlertDialog、完整 Tooltip、Toast、Tabs / Pagination 等仅为候选，未登记真实场景前不提前创建公共组件。
2. **保留职责边界**。Hero、业务状态、路由、MDX、终端命令解析及产品演出动画归消费项目；公共组件只承担可复用的结构、样式和交互契约。
3. **先验收后关闭**。需求关闭时保留代码、测试、截图、消费者路径和决定依据；通过 CLI 自动归档关闭请求，但在历史查询与契约检查中仍可读取。
4. **禁止顺带提交或发布**。Changeset 是候选发布记录，不代表授权执行 `changeset version`、`npm publish` 或 Git 提交。

## 关联文档

- [架构与组件职责](architecture.md)
- [组件矩阵及晋升规则](component-contract-matrix.md)
- [跨项目需求生命周期与本地写入](component-requests.md)
- [2026-10-13 验收记录](acceptance-2026-10-13.md)
- [2026-10-18 回归、跨平台与消费验收记录](acceptance-2026-10-18.md)
- [2026-10-19 全量浏览器回归与剩余阻塞](acceptance-2026-10-19.md)
- [终端组合边界](terminal-composition.md)
- [消费项目默认尺寸与已知问题](consumer-sizing.md)
- [材料与玻璃规范](material-standards.md)
- [版本与发布流程](releasing.md)

较早的 P0/P1 审计过程保留在 Git 历史，不再作为“尚待实施”清单重复维护。
