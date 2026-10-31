# 2026-10-30 远端跨引擎入口与消费 CI 实施记录

## 来源与执行限制

UI 基底为 `eda31c32d6881541c847256eaacb60c3719f2763` 加本轮 CI / 文档改动。Doc 仍为 `4c7de67` 加已有迁移和用户工作；Slides 尚无首个提交。保留三个消费工作区的既有修改，本轮不更改包版本、锁文件或组件成熟度。

先前尝试直接触发 `cross-browser-smoke.yml` 返回 HTTP 404：默认分支 `main` 尚未注册该文件。已只读核对默认分支的 `ci.yml` 存在且包含 `workflow_dispatch`，因此复用此入口，避免要求先合并独立 smoke 文件。

本机测试曾因系统蓝屏中断，没有完整结束结果，不作为本轮通过证据。后续停止本机浏览器、WebGL、WSL、构建与压力验证。本记录中的本轮通过项仅为静态配置检查；蓝屏转储和调试产物保留在项目外，不纳入提交。

## 实现

- UI 的 `ci.yml` 增加默认 false 的布尔输入 `cross_browser_only`。push、PR、普通手动运行继续使用原质量与视觉门禁；仅显式手动启用该输入时运行跨引擎工作流，避免重复执行常规门禁。两种手动模式使用独立 concurrency group。
- `cross-browser-smoke.yml` 增加 `workflow_call`，由同一提交的 CI 调用；checkout 固定为运行的 `github.sha` 并关闭凭据持久化。测试在 Ubuntu 24.04 运行，保持现有集合与 WebGL 断言，单 worker、零自动重试，保留首次失败 trace。记录源码 SHA、Bun / Playwright 和浏览器安装信息，并在成功或失败时上传 JSON / HTML / trace 证据。
- Slides 的 CI 将消费项目与固定 UI 提交检出为兄弟目录，再分别 frozen install。UI 固定值维护在工作流一处，当前为 `eda31c3`；现有类型检查复用共享同步器，新增 Chromium 准备和真实 `test:ui-size`，随后执行原静态构建。上传路径按新的检出目录修正。README 说明来源与验收边界。
- Doc 的 PR Test job 在单测后执行不启动浏览器的 `check:callouts`；Build job 复用现有唯一一次生产构建的 `out/`，安装当前 Puppeteer 锁定的 Chrome 后运行 `check:reading`。不重新生成 Mermaid、不新增全站构建或截图基线。README 和现有 CI ADR 同步。
- XCA 的固定 UI SHA 暂未改动：新组合的运行验证尚未具备，不先记录为消费组合通过。Slides 的最终候选 SHA 也须在运行验证后与交付记录核对。

## 实际验证

| 检查 | 本轮结果 |
| --- | --- |
| Actionlint 1.7.12 | 五份变更工作流通过；校验 YAML、GitHub 表达式、job / step 结构及可复用工作流接口。未运行 shellcheck / pyflakes |
| YAML 与调度静态检查 | push、PR、普通手动、跨引擎手动四种路由通过；默认模式不减少原门禁 |
| 消费路径与脚本检查 | Slides 根与子包的 15 处本地 UI 依赖均落在联合检出的兄弟 UI 包目录；工作流调用的项目脚本存在；Doc 仅一个生产构建且先于阅读回归 |
| 运行结果 | 本次变更未提交、推送或在远端执行；未运行本机功能 / 浏览器 / 构建验证，不能标记 A/B/C 完成 |

Actionlint 仅下载至临时工具目录，按官方 release 的 SHA-256 校验后使用，没有添加项目依赖。静态核对脚本也保留在临时目录，不建立第二套项目门禁。

## 远端执行与后续

本次 UI CI 差异经审阅、明确授权提交和推送后，可通过已注册的 CI 文件选择目标分支：

```sh
gh workflow run ci.yml --repo SSJ-ZYJ/Neoverse-UI --ref dev -f cross_browser_only=true
```

核对 run 的 `head_sha` 与最终提交完全一致，下载 JSON / trace 后再按引擎区分加载、WebGL、交互和环境问题。失败用例先取得最小证据，再决定是否修共享源码，不在本机复现。尚未取得远端结果前保留所有验收缺口。

消费工作流在各自源码提交后另行远端验收；Slides 仍需建立消费源码基线，Doc 迁移仍需与既有用户修改明确区分。提交、推送和发布不由本记录自动授权。

参考：[GitHub 手动执行前提](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)、[同提交复用工作流](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows)、[当前计划](ui-current-plan.md)。
