# 2026-10-20 终端语义色 Token 需求验收

关联需求：`CR-20261010-2A6D0E6E`，消费者 XCA-Portal。

## 已完成的实现与消费证据

- Tokens 已在 `packages/tokens/src/themes/light.css` 和 `dark.css` 定义终端背景、文字、提示符、光标、选区和五种上下文段的语义映射；`packages/tokens/src/index.ts` 公开变量名，`packages/tailwind/src/components/terminal.css` 将其应用于真实 Terminal 组件。Light / Dark / System 均复用既有主题选择器，无第三套硬编码色表。
- 这次新增独立主题契约测试 `tests/visual/terminal-theme-contract.spec.ts`，验证浅色、深色、显式主题不受系统设置干扰、System 跟随动态切换，并核对全部 18 个终端变量。
- 对比度验收首次发现浅色 `prompt` 与 `cursor` 对画布仅约 **1.99:1**。现仅将 Light 两个角色映射至现有 `--neoverse-color-mint-700`；Dark 映射不变。新测试要求普通/次要/命令文本不低于 4.5:1，提示符不低于 4.5:1，光标不低于 3:1。桌面与移动端均通过。
- 定向 Playwright：新主题契约与原有 Terminal 截图测试 **8/8 通过**（desktop/mobile）；原有终端组合、表面、滚动测试 **10/10 通过**。
- XCA-Portal 的真实消费位置已由过期的 `app/assets/css/home.css` 改为 `app/assets/css/terminal.css`；Terminal 使用入口在 `app/features/terminal/components/TerminalHost.vue`，交互输入在 `TerminalCommandInput.vue`，主题覆盖在 `core/appearance.ts`。消费侧 `bun run check:terminal` 和 `bun test app/features/terminal/core/extensions.test.ts` 通过。XCA 当前采用本地 `file:../Neoverse-UI/packages/*` 开发依赖，不代表已验证 npm 正式版本。
- Neoverse-UI 的 `bun run release:check`、`bun run requests check` 和相关静态检查通过，发布质量门禁没有因为本次 Token 修改被放宽。

## 2026-10-23 验收收口

- npm `@neoverse-ui/tokens@0.3.0` 已发布，检查正式 tarball 确认包含终端语义变量、浅深色及 System 映射。
- 用户确认当前本地 Token 与 npm 包一致，并明确接受 XCA 保持本地 `file:` 依赖完成验收；同步调整 CR 第三条验收条件，不再要求切换依赖来源。
- 本次审计的终端主题与 fallback 浏览器回归 **28/28 通过**，其中终端主题契约 **4/4 通过**，覆盖 desktop/mobile 的 Light、Dark、System 动态切换与对比度；Token 单测 **38/38**、Vue 单测 **73/73** 通过。
- XCA 本地消费补验：`bun run check:terminal` 通过，`bun test app/features/terminal/core/extensions.test.ts` **6/6 通过**。真实入口仍为 `TerminalHost.vue` 和 `TerminalCommandInput.vue`，复用共享终端组件及语义变量。
- 已满足调整后的验收条件，CR 通过管理 CLI 关闭并归档为 `delivered`。本次没有重跑 XCA 全量 E2E、远程 CI 或完整发布门禁，也没有执行版本变更、提交、推送或发布。

本次收口只更新需求与文档记录，保留工作区已有源码改动，没有修改 XCA-Portal 文件或视觉快照。
