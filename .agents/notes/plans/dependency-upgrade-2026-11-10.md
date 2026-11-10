# 依赖升级决策（2026-11-10）

Status: adopted

## 结论

在兼容范围内升级 5 组开发/构建依赖；两项最新版存在明确的兼容性阻塞，保持原版本。
升级后 `build`、`typecheck`、`bun run test`、完整 e2e（202 次运行 / 200 通过 / 2 跳过）
与 `bun run lint` 全绿。

| 包 | 原版本 | 新版本 | 依据 |
| --- | --- | --- | --- |
| `@biomejs/biome` | 2.5.10 | 2.6.6 | 小版本；`$schema` 同步到 2.6.6，新增 `noComponentHookFactories` 触发 1 处测试夹具，已移出函数作用域 |
| `@playwright/test` | 1.64.1 | 1.65.0 | 小版本；需 Chromium 1254，已安装；完整套件通过 |
| `tailwindcss` / `@tailwindcss/cli` | 4.3.3 | 4.3.5 | 补丁版本；`test:contracts` 与构建通过 |
| `vite` | ^8.3.5 | ^8.3.7 | 补丁版本；Vue 包与 playground 构建通过 |
| `vue` | ^3.5.44 | ^3.5.45 | 补丁版本；`peerDependencies` 保持 `>=3.5.0 <4.0.0` 不变 |
| `@types/react` / `@types/react-dom` | ^19.2.18 / ^19.2.7 | ^19.3.0 | 与 React 19.3.1 对齐；类型检查通过 |

## 保持原版本

| 包 | 当前 | 最新 | 原因 |
| --- | --- | --- | --- |
| `typescript` | 5.9.3 | 7.0.2 | TypeScript 7 是原生编译器大版本；`@volar/language-service` 与 `@volar/typescript` 的 peer 范围是 `typescript: <7`，`vue-tsc` 3.3.14 依赖这两个包。升级会直接破坏 Vue SFC 类型检查，属于未适配的硬阻塞 |
| `@types/node` | 24.19.2 | 26.6.6 | 运行时是 Bun 1.4.4，`bun-types` 自带 Node 兼容层并依赖 `@types/node`。升到 26 会引入 Bun 未实现的 Node 26 API 类型，属于无收益的兼容性风险 |

其余直接依赖（`react`、`react-dom`、`vitest`、`happy-dom`、`stylelint`、`@vue/test-utils`、
`@vitejs/plugin-vue`、`@changesets/*`、`bun-types`）已在最新版本。

## 环境说明

- 干净安装后根 `node_modules` 不再提升 `vite`/`vue`/`tailwindcss`，各工作区按自己的
  版本解析（playground `vite 8.3.7` / `vue 3.5.45`，tailwind 包 `4.3.5`），
  `bunx playwright --version` 为 1.65.0。
- 本机 3100 端口被 `GameViewerServer` 占用，本地验证使用
  `NEOVERSE_UI_PLAYWRIGHT_PORT=3200`；CI 不受影响。
- `@parcel/watcher` 的 postinstall 仍被 Bun 的信任策略阻止，构建与测试不依赖它。
- 未新增 Changeset：本次只改开发依赖与构建工具，公开 API、运行时依赖范围和
  `peerDependencies` 均未变化。
