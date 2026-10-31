# Neoverse-UI 当前工作计划

更新：2026-10-30。本次规划以 `dev` 的 `eda31c32d6881541c847256eaacb60c3719f2763` 和当前未提交的 CI 改动为依据。下一阶段目标是取得可追溯的远端运行结果，并完成首批 Field / Popover 组件验收。提交、推送、版本落盘、发布仍需单独授权。

## 当前状态与不再重复的工作

| 项目 | 当前状态 | 后续处理 |
| --- | --- | --- |
| 共享运行时修复 | 动态定位、SSR 稳定 ARIA、WebKit choice 点击区域、Glass 调度已包含在 eda31c3 | 不重做；有新的远端失败再定向修复 |
| 已提交代码的 CI | [40887047977](https://github.com/SSJ-ZYJ/Neoverse-UI/actions/runs/40887047977) 成功，覆盖 Linux 质量、三分片 Chromium 视觉和 Windows 定向检查 | 属于 eda31c3，不能覆盖本地新增的 CI 配置或 Firefox/WebKit |
| 远端跨引擎入口 | 新增 cross_browser_only 和 workflow_call；单 worker、零自动重试、JSON/HTML/trace 保留已配置 | 仅静态检查通过，尚未提交、推送或执行 |
| Slides 消费 CI | 固定 UI 联合检出、真实尺寸检查和产物路径已配置 | 尚无消费首个提交，不能宣称已具备远端运行结果 |
| Doc 消费 | npm 精确版本迁移、RSC 窄入口和实际页面回归已有历史证据；新增 callout / 阅读 CI 接入 | 迁移与其他用户工作仍未提交，新 CI 尚未执行 |
| XCA 消费 | CI 的 UI ref 仍为 d4238c726d695abebef5f283d5520f8bd9a2cd60，工作区有其他未提交修改 | 保留；最终候选验证后再更新 ref |
| 人工验收 | NVDA / Orca / 真实 IME 未执行 | 复用既有步骤，保留未验收状态 |

本次实时核对本地 HEAD 与远端 dev 一致；当前 UI 待处理范围是两份 CI 配置、当前计划和一份[实施记录](acceptance-2026-10-30-ci-consumers.md)。此前五份工作流的 Actionlint、四种触发路由、15 处 Slides 本地依赖路径静态检查通过，不能写成运行验收通过。

矩阵当前仍为 36 个公开组件、21 个 Stable、15 个 Consumer Validation。7 项总体发布视觉、9 项总体真实消费，以及 27 项 React visual / 29 项 React consumer 保留缺口；这些维度有重叠，不相加。本阶段不批量晋升。

## 执行方式

本机仅做源码阅读、编辑、差异审查和轻量静态检查。不启动浏览器、WebGL、WSL、构建或压力测试；蓝屏中断的测试不计入通过结果。运行验证移至远端，图形驱动处理与组件库实施分别安排，不自行修改系统或驱动。

## 下一阶段顺序与完成条件

| 顺序 | 工作包 | 前置条件 | 可交付结果 |
| --- | --- | --- | --- |
| R0 / P1 | 使 CI 改动成为可运行提交 | UI 的指定配置及文档获单独提交、推送授权 | 明确的候选 SHA；普通 push CI 保持原门禁；跨引擎 run 的 head_sha 与候选一致 |
| R1 / P1 | 判定 Firefox / WebKit 风险 | R0 的远端入口可用 | 两引擎各自的首轮结果、JSON、失败 trace、环境与源码来源；实际缺陷的修复及对应新 SHA 回归 |
| R2 / P1 | 固定 Vue / React 消费组合 | 影响目标消费的 UI 产品缺陷已解决或有明确受限范围 | 先 XCA + Doc，随后 Slides；每项包含消费源码、UI 来源、安装、构建与实际页面结果 |
| R3 / P1 | 补齐 Field / Popover 的发布证据 | R1 有有效结论，R2 有对应 Vue 消费结果 | 独立状态覆盖、远端截图差异、维护者审阅记录；满足条件后逐组件更新矩阵 |
| R4 / P2 | 候选交付审查 | 前述范围和限制可追溯 | 版本/API/迁移差异、制品与消费证据、未覆盖项；发布操作另行授权 |

R0 是远端执行前的条件，不阻塞下方可独立进行的源码审查和用例准备。本次重新规划不视为此前提交、推送问题的肯定答复。

## R0 / R1：远端运行与失败处理

1. 审查 UI 两份工作流与相关文档的最小差异，保护消费仓库及其他未提交工作。正常 push / PR / 普通手动运行继续执行原门禁，不能以跨引擎单独运行替代质量与 Chromium 门禁。
2. 在授权提交推送后，通过已有 CI 入口执行 `cross_browser_only=true`。具体命令见实施记录；运行后首先核对完整 SHA，再读取结果，不因工作流名字相同沿用旧证据。
3. 结果分为浏览器启动/依赖、页面加载、WebGL context、定位/键盘/受控行为四类。产品缺陷先取得稳定失败证据再修复；环境限制单独记录，不自动改组件。
4. CSS 基础层与可选 WebGL 分开验收，保留 renderer 激活、2px 定位、原交互与像素断言。首次失败留档，必要复跑有独立记录；不增加 timeout、关闭增强层或放宽断言来替代原因分析。
5. 修复后以新 SHA 运行对应完整定向集合和适用常规门禁。若仅环境受限，说明具体受限场景及对消费/候选的影响，不能将整个跨引擎阶段写成完成。

远端失败分析也不在本机启动浏览器复现；优先读取日志、trace 元数据、源码和构建产物，后续验证继续放远端。

## R2：消费项目按可复现组合推进

- **XCA 优先固定 Vue 组合**：先明确消费基底提交与本次 UI ref 差异，再验证项目检查、生产构建、页头菜单、主题/语言和相关终端流程。以实际提交切片为验证对象，不把脏工作区整体通过记为独立 CI 组合通过。UI ref 在新组合取得运行结果前不标记已验收。
- **Doc 固定 React 组合**：先整理 UI 迁移、窄客户端入口、回归脚本、CI 与其他用户修改的边界，再推进独立消费提交与远端 Build/Quality。复用一次静态导出的阅读检查，不重复迁移、不生成 Mermaid、不再加另一套同步器。已发布 npm 与候选 file: 继续分别留证。
- **Slides 随后验证**：保留既有 file: 开发方式，先建立消费源码基线，再运行已准备的联合检出、冻结安装、共享同步、类型检查、真实尺寸与静态构建。固定 UI SHA 与最终验收来源核对，不把当前 unborn main 说成可引用的提交，也不擅自代建首个提交。

Doc 的真实 Action / Button / IconButton 证据不覆盖其他 29 项 React consumer pending。UiNotice 仍只有注册与服务端契约证据；不为补数字新增正文调用，也不替换 Fumadocs 的现有能力。

## R3：先完成两个具体组件的证据

| 组件 | 真实消费入口 | 重点检查 |
| --- | --- | --- |
| UiField | Slides 过滤表单；XCA TerminalInteraction | label 与 controlId、描述/消息关联、required / disabled 传递、校验消息、窄屏；readonly 检查由子控件承担，不顺带给 Field 扩展 API |
| UiPopover | XCA SiteHeader 菜单 | 开/关、键盘与触控、aria-controls、焦点恢复、动态锚点/内容定位、禁用与关闭清理、深浅主题和窄屏 |

先审查既有 `form-control-ax`、`form-control-behavior`、`overlay-review-regressions`、`overlay-tracking` 与现有 forms / controls 截图，对缺失状态补覆盖，不批量重写已存在的用例。

功能、截图门禁、真实消费、维护者视觉审阅分别记结果。新增基线或可见变化提供远端差异供审阅；全部适用条件满足后才逐组件评估晋升。其他 5 个 visual=playground 组件仍按真实需求排队，不承诺一次补齐全部 React 验收。

## 等待远端执行时可独立推进的工作

- 整理 XCA / Doc 的最小变更切片与来源清单，避免把无关用户修改混入候选。
- 将 Field / Popover 的现有用例逐项映射到上述状态，形成缺失覆盖清单；只对真实缺口准备测试，不预判产品缺陷。
- 核对九份 Changeset、公共导出、内部依赖和迁移说明，准备候选 API 差异；此时不执行版本落盘或包发布。
- 人工 AT / IME 在可操作环境具备时按[已有步骤](acceptance-2026-10-29-overlays.md#人工-at--ime-验收步骤n4)填写真实结果，未执行就保持待验收。

## 阶段结束的判断

R1 有固定提交的跨引擎结论，R2 至少有一个 Vue 和一个 React 的可复现消费组合，Field / Popover 的证据与矩阵状态一致，剩余平台/视觉/AT/IME 限制写清。阶段交付不要求增加公开组件数，也不把所有 pending 项作为统一发布前提；但不能隐去影响目标消费的实际缺陷。

Dialog / AlertDialog、完整 Tooltip、Toast、Tabs / Pagination 等继续等待真实消费需求；fallback 多层仲裁、Select type-ahead 等公共交互变更另行评审，不与本阶段的运行验证混做。

## 本次规划核查边界

本次只读核对 Git 状态、远端 dev SHA、当前提交的 GitHub CI 结果、消费工作流、矩阵与 Field / Popover 源码/测试入口，并更新本计划。未启动浏览器、WSL 或构建，未触发远端工作流，也未提交、推送或发布。版本预期及历史消费结果仍见原记录，本次不刷新 Registry 或重跑历史门禁。

关联依据：[本批 CI 实施记录](acceptance-2026-10-30-ci-consumers.md)、[10 月 29 日运行时记录](acceptance-2026-10-29-overlays.md)、[Doc 迁移记录](consumer-migration-2026-10-29.md)、[组件矩阵规则](component-contract-matrix.md)、[发布流程](releasing.md)。