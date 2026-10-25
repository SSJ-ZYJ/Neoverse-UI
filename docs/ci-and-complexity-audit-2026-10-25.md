# Neoverse-UI CI 性能与架构复杂度治理（2026-10-25）

基线：`dev` 的 `0ce9b9e`。审计期间 [`3a20866`](https://github.com/SSJ-ZYJ/Neoverse-UI/commit/3a20866)（Aurora Glass 统一命名）由维护者并行落盘，与本轮的 CI/复杂度改动互相独立、无冲突；本文所有实测数字均在本轮改动之上复测。

本文只记录有实测数据的结论；无法量化的项目标明"未量化"，不声称提速。

## 一、CI 性能审计

### 数据来源

GitHub Actions API 的真实运行记录（`gh api .../runs/{id}/jobs`），取最近 4 次完整运行：`40107362521`（成功）、`39801024391`（成功）、`39793665292`（失败）、`39625127352`。时间均为各 job 自身的 `started_at`→`completed_at`。

### 各 Job 耗时（成功运行）

| Job | `40107362521` | `39801024391` | `39625127352` |
| --- | --- | --- | --- |
| Select CI scope | 12s | 14s | 12s |
| Validate release quality (Linux) | 99s | 96s | 跳过 |
| Visual shard 1/3 | 365s | 1159s | 跳过 |
| Visual shard 2/3 | 300s | 257s | 跳过 |
| Visual shard 3/3 | 339s | 487s | 跳过 |
| Verify workspace (Windows) | 137s | 262s | 跳过 |
| Verify workspace (Linux) 聚合 | 4s | 2s | 3s |

健康运行的 wall-clock ≈ 489s，三路分片是唯一的长尾。

### Playwright 分片均衡度

`--list` 统计：shard 1/2/3 各 337/337/336 项，数量完全均衡。

本机干净重测（24 核，`--workers=2`，无并发干扰）：209.4 / 215.7 / 176.8s，总和 601.9s，最慢分片占 36%（理想 33.3%）。

**结论：分片算法已足够均衡，不是瓶颈**；差异来自单个用例成本不均（`design-lab` 111s 占 desktop 总量 668s 的 17%）。把分片从 3 改成 6，本机实测最慢分片 137s（vs 3 分片 215.7s），但需要 6 个 runner，属于成本换墙钟的取舍，**本次不改**——现有 3 路已满足"不减少验证强度"的边界。

### 浏览器安装开销（波动最大的单步）

| 运行 | shard 1 | shard 2 | shard 3 |
| --- | --- | --- | --- |
| `40107362521` | 26s | 21s | 28s |
| `39801024391` | **648s** | 23s | 181s |
| `39622296415` | 23s | 25s | 22s |

健康时 21-28s，抖动时 181s / 648s。这是唯一能吃掉整个 job 预算的步骤，且此前**完全没有缓存**——而 `cross-browser-smoke.yml` 早就对 Firefox/WebKit 做了缓存，配置不一致。

### 其它环节实测

| 项 | 本机实测 | 判断 |
| --- | --- | --- |
| `biome check .` | 0.5s | 无需优化 |
| `check:changesets` | 0.1s | 无需优化 |
| `lint:text` / `lint:style` / `lint:tailwind` | 0.3 / 0.8 / 0.2s | 无需优化 |
| `check:contracts` | 1.6s | 无需优化 |
| `bun run test`（全 workspace 单测） | 11.6s | 无需优化 |
| `verify:packages` | 4.2s | 无需优化 |
| HTML reporter 额外开销 | 6.5s → 6.1s | **噪声级，不是优化项** |
| 视觉测试重复场景 | 未发现同名快照；35 个 spec 不区分视口但承担几何/主题断言 | **不删，删了就是降低验证强度** |

## 二、已实施的优化（有前后对比）

### 1. `release:check` 内重复构建（-9.7s，本机 -21%）

**证据**：`typecheck` = `build:types` + 7 个 workspace `typecheck` + 根 `tsc`；`release:check` 的序列是 `... && typecheck && test && build && ...`，即先跑 `build:types`（7 个包 emit 类型），再由 `build` 完整重建一遍同样的 9 个包。

**方案**：把纯检查部分拆成 `typecheck:only`（不含前置构建），`release:check` 改为 `... && build && typecheck:only && test && ...`。

**边界**：`bun run typecheck` 与 `bun run check` 的语义完全不变（仍自带构建，供开发者单独调用），只让 release 路径不再重复 emit。

**实测**：

```
基线 release:check = 45.4s
改后 release:check = 35.7s（复测 37.5s）
```

**未减少任何验证**：biome、changesets、文本完整性、样式、Tailwind、契约矩阵、框架一致性、全 workspace typecheck、全单测、完整构建、八包 smoke 全部保留且顺序更合理（先构建，后检查依赖产物）。

### 2. Playwright 浏览器缓存（CI 侧，消除 181s/648s 长尾）

**方案**：`verify.yml` 的三个 Linux 分片与 Windows job 各自增加 `actions/cache@v4`，缓存 `~/.cache/ms-playwright`（Windows 为 `~\AppData\Local\ms-playwright`），key 用 `hashFiles('bun.lock')`——lockfile 精确锁定了 Playwright 版本，浏览器构建随版本变化，因此该 key 天然正确。

**为什么不违反"不引入不可控缓存"**：缓存内容是可验证的浏览器二进制，key 与 lockfile 强绑定；退一步即使命中错误版本，`playwright install` 也会补齐缺失构建，不会让测试跑在错误引擎上。

**量化**：本机无法复现 CI 网络抖动，因此**只声称"消除已观测到的 181s/648s 长尾"，不声称稳定节省 X 秒**。健康路径（21-28s）命中缓存后约 2-4s，这是保守估计而非实测 CI 数据。

### 3. 分类器死路径（正确性，非性能）

**证据**：`ci-classify.mjs:31` 有 `path.startsWith('themes/')`，但仓库**从未有** `themes/` 目录（`git ls-files | grep '^themes/'` = 0 条）。它落到"未分类"兜底分支时行为相同，所以不是覆盖率漏洞；问题是**分支腐化**——若将来真的出现该目录，会静默走列出的分支而非保守默认。

**方案**：删除该行，并补测试锁定"不存在的目录不得静默降级"（`themes/light.css`、`brand-new-package/src/index.ts`、`.workbuddy/notes.txt` 全部必须落到 quality+visual）。

**验证**：`node --test .github/scripts/ci-classify.test.mjs` → 7 pass / 0 fail。

## 三、AI Slop 审计结论

以只读方式审计 9 个文件，全部结论有 `file:line` 证据。**总体判断：这不是 AI 生成的垃圾代码库**——抽象分层、token 契约、无障碍语义有纪律，942 个 token 名全部有对应 CSS 定义（0 悬空）。

### 已修复（有真实维护风险）

| 模块 | 问题 | 处理 |
| --- | --- | --- |
| `packages/react/src/index.tsx` | `aria-invalid` 推导内联 6 处；Vue 侧早已抽成 `form-control.ts` | 新增 `resolveAriaInvalid` 到 `internal.ts`，6 处统一 |
| `packages/react/src/index.tsx` | `ui-button__tone-field` / `__edge-field` 三个组件逐字复制；这两个 class 被 `tailwind/button.css` 直接选中，漏一处就是材质边缘失效 | 抽 `<ButtonMaterialShell />` |
| `packages/react/src/index.tsx` | 5 处 `[...].filter(Boolean).join(' ')` 绕过同文件的 `mergeClassNames` | 统一为 `mergeClassNames` |
| `apps/playground/src/lab-modules.ts` | `specimensForModule` 零引用，而 `App.vue` 用 flatMap+filter 手写同一逻辑 | `App.vue` 改用它，删除重复推导 |
| `apps/playground/src/lab-modules.ts` | `ModuleGroupId` 零引用（且在 `moduleGroups` 定义前引用，本身是悬空类型） | 删除 |
| `apps/playground/src/styles/playground-tokens.css` | `--neoverse-playground-toolbar-module-transparency` 全仓库仅定义 + 测试读取，**无任何 CSS 消费** | 删除变量与为其背书的断言，保留真正有效的 elevated-tier 相等断言 |
| `packages/tokens/src/index.ts` | `control-surface` 映射漏了 CSS 在用、Tailwind 在消费的 `--neoverse-control-surface-trailing-padding` | 补 `trailingPadding` |
| `packages/glass-runtime/src/index.ts` | `backend: 'webgl'` 与 `'auto'` 行为完全相同，注释却写成"Auto preserves…"，误导调用方以为是强制/回退开关 | 改写为诚实注释（零行为变更，不收窄类型以免破坏已发布 API） |

### 明确"保持原样"（有结论但不改）

- `packages/tokens/src/index.ts`：纯映射表，942 声明全有定义，长是数据量不是 slop。
- `packages/glass-runtime/src/index.ts` 的硬编码回退值（`1.5/5/0.54` 等）：与 token 数值平行维护，但这是**合理**的"CSS 变量读不到时的兜底"（runtime 不依赖构建期 token），属债务非违规。
- `apps/playground/src/playground-content.ts`：四套文案同文件，全是纯数据零逻辑，拆分收益低于风险。
- `apps/playground/src/App.vue`：路由/主题/焦点/目录多关注点，但共享同一批 ref，拆开要靠 props/emit 来回传，**负收益**。
- 未发现"同事实双份 state 且会失同步"的重复状态；`stepNumberInput`、`getCanvasViewport`、`openSelectPopover` 等都不是无意义包装。

### 明确"未处理"（避免超范围）

测试与实现的耦合（`design-lab.spec.ts` 断言私有 class、逐像素、自写亮度扫描）被判定为 P1 级维护风险，但**改断言等于修改验证强度**，需要单独的决策与逐条评审。本次不动，也不通过更新快照掩盖。

## 四、复杂度变化

| 文件 | 变化 | 说明 |
| --- | --- | --- |
| `packages/react/src/index.tsx` | 1492 → 1504 行（+12） | 行数略增，但删除了 6 处重复表达式、3 处重复 DOM 片段、5 处不一致拼装；新增的 12 行是一次性 `ButtonMaterialShell` 定义与注释 |
| `packages/react/src/internal.ts` | 2 → 27 行 | 新增跨适配器语义对齐的单一实现 |
| `package.json` | 新增 `typecheck:only` | 使 release 路径可跳过重复构建，同时保留原 `typecheck` 语义 |

**没有按行数拆任何文件**，没有为单一用途造工具函数或目录，没有增加兼容层。

## 五、验证结果

全部数字在 `3a20866`（Aurora Glass 统一命名）落盘后复测，即本轮改动与改名改动共存的实际状态。

| 项 | 结果 |
| --- | --- |
| `bun run release:check` | **通过**（35.7s / 36.1s / 37.5s / 39.0s / 41.9s，基线 45.4s） |
| `bunx biome check .` | **通过**（360 文件） |
| 全 workspace 单测 | **通过**（React 38、Vue 77、glass-runtime 51、contracts/release-tools 27 等全绿） |
| `node --test .github/scripts/ci-classify.test.mjs` | **7 pass / 0 fail**（含新增 2 组断言） |
| 完整 Playwright（desktop + mobile，Windows Chromium） | **942 通过 / 0 失败 / 68 条件跳过** |
| 快照基线变更 | **0 张**（重构未改变任何可见渲染） |
| Windows | 本机 Windows 全量通过；缓存路径已按 `~\AppData\Local\ms-playwright` 区分 |
| Linux | 未在本机复跑（CI 变更需推送后由 runner 验证） |

### 与并行改名改动的交互

维护者的 Aurora Glass 改名（`3a20866`）与本轮改动在 `apps/playground/src/App.vue` 和 `packages/tokens/src/index.ts` 两个文件上共处，最终状态已验证无冲突：

- `App.vue` 同时保留对 `glassMaterial`（改名新增）与 `specimensForModule`（本轮修复的重复推导）的使用。
- `packages/tokens/src/index.ts` 同时保留 `trailingPadding`（本轮补齐）与改名引入的 `glassMaterial` 导出。

改名提交同时给 `apps/playground/src/modules/ControlSurfaceModule.vue` 带入了两处不符合 Biome 行宽的单行模板。经 `git stash` 隔离验证，该格式违规在去掉本轮全部改动后仍然存在，即属 `3a20866` 的既有问题，与本轮无关。由于它会使 `release:check` 的 `biome check .` 失败，维护者确认后在本轮一并折行修正；改动仅是把两个单行元素按格式化器要求折行，渲染输出完全等价。

审计过程中一次 `verify:packages` 报告 tailwind consumer bundle 缺少 `.sr-only`，根因是 `packages/tailwind/dist/index.css` 处于未压缩的残留状态（断言期望压缩后的 `.sr-only{`）；重新 `bun run build` 后恢复，与本轮改动无关。

## 六、剩余缺口

| 项 | 说明 |
| --- | --- |
| 浏览器缓存的 CI 实测节省 | 未量化。需一次真实推送后对比 job 耗时，当前只声称消除 181s/648s 长尾 |
| Linux 侧验证 | `verify.yml` 的缓存改动无法本地验证，须由 CI runner 证明 |
| 6 分片方案 | 本机实测最慢分片 137s（vs 3 分片的 215.7s），但需 6 runner；未采用，留作后续取舍 |
| 测试与实现耦合（P1） | 已定位未处理，见上文 |
| `design-lab` 111s 占 17% | 由截图数量驱动，减少即降低覆盖，不优化 |

## 七、结论

本轮做了三件事，两件有实测收益、一件是正确性修复：

1. **`release:check` 消除重复构建**：45.4s → 35.7s（-21%），验证强度不降。
2. **CI 浏览器缓存**：消除已观测到的 181s/648s 长尾；健康路径的节省未量化，不夸大。
3. **分类器删除死路径 + 补测试**：防止未来静默降级。

架构方面修了 8 处有证据的重复/死代码/契约不同步，**拒绝了** 4 类看似可疑但经核实无问题的改动（按行数拆文件、拆 App.vue、拆 content 文件、删公共 token 类型）。942 项视觉用例零失败、零基线变更，证明重构未改变公开行为。

与并行的 Aurora Glass 改名（`3a20866`）无冲突，两个共处文件已复验。
