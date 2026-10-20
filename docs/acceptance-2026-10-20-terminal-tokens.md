# 2026-10-20 终端语义色 Token 需求验收

关联需求：`CR-20261010-2A6D0E6E`，消费者 XCA-Portal。

## 已完成的实现与消费证据

- Tokens 已在 `packages/tokens/src/themes/light.css` 和 `dark.css` 定义终端背景、文字、提示符、光标、选区和五种上下文段的语义映射；`packages/tokens/src/index.ts` 公开变量名，`packages/tailwind/src/components/terminal.css` 将其应用于真实 Terminal 组件。Light / Dark / System 均复用既有主题选择器，无第三套硬编码色表。
- 这次新增独立主题契约测试 `tests/visual/terminal-theme-contract.spec.ts`，验证浅色、深色、显式主题不受系统设置干扰、System 跟随动态切换，并核对全部 18 个终端变量。
- 对比度验收首次发现浅色 `prompt` 与 `cursor` 对画布仅约 **1.99:1**。现仅将 Light 两个角色映射至现有 `--neoverse-color-mint-700`；Dark 映射不变。新测试要求普通/次要/命令文本不低于 4.5:1，提示符不低于 4.5:1，光标不低于 3:1。桌面与移动端均通过。
- 定向 Playwright：新主题契约与原有 Terminal 截图测试 **8/8 通过**（desktop/mobile）；原有终端组合、表面、滚动测试 **10/10 通过**。
- XCA-Portal 的真实消费位置已由过期的 `app/assets/css/home.css` 改为 `app/assets/css/terminal.css`；Terminal 使用入口在 `app/features/terminal/components/TerminalHost.vue`，交互输入在 `TerminalCommandInput.vue`，主题覆盖在 `core/appearance.ts`。消费侧 `bun run check:terminal` 和 `bun test app/features/terminal/core/extensions.test.ts` 通过。XCA 当前采用本地 `file:../Neoverse-UI/packages/*` 开发依赖，不代表已验证 npm 正式版本。
- Neoverse-UI 的 `bun run release:check`、`bun run requests check` 和相关静态检查通过，发布质量门禁没有因为本次 Token 修改被放宽。配套 Changeset：`.changeset/terminal-light-contrast.md`。

## 尚待发布的条件

CR 的第三条验收标准包含 **正式发布之后 XCA 才能只依赖已发布的变量**。本地 `file:` 消费不是 npm 正式发布证据。此次不执行 `changeset version`、发布、推送或提交，因此不得将 CR 归档为 `delivered`。需求暂标 `blocked`，仅等待按既有发布方案完成版本发布与 XCA 的正式包消费升级/验证；届时补充已发布包版本、CI、真实消费者测试，再关闭并归档。

Neoverse-UI 的当前所有修改保留在 `dev` 工作区；没有覆盖 XCA-Portal 的任何未提交文件，也没有修改现有视觉快照。
