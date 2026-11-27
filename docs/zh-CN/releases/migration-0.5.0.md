# 迁移到 0.5.0（三材质架构）

Status: adopted

[English](../../releases/migration-0.5.0.md)

<!-- Source: docs/releases/migration-0.5.0.md -->
<!-- Source-SHA256: d02e593063b12beb8975a0a2ce610c9703aa8cd9723beafce7fecaefeb1fd66b -->

Neoverse-UI 0.5.0 发布线完成了实体（Solid）、磨砂（Frosted）与极光玻璃（Aurora Glass）三材质架构。消费项目应同步升级 Tokens、Tailwind、Motion、Overlay Runtime、Glass Runtime 与对应框架适配器。各包独立版本管理，按协调发布计划选择版本，不要给每个依赖都指定 `0.5.0`。

## 材质作用域与破坏性 API 变更

| 移除或变更项 | 替代方案 |
| --- | --- |
| `MaterialMode` | 从 `@neoverse-ui/tokens` 导入 `Material`（`'glass' \| 'solid' \| 'frosted'`） |
| `MaterialSurfaceRole` | 从 `@neoverse-ui/tokens` 导入 `SurfaceRole` |
| `surfaceClasses`、`materialSurfacePresets` | 使用 `@neoverse-ui/tokens`、`@neoverse-ui/vue` 或 `@neoverse-ui/react` 导出的 `getSurfaceClass(selection, role)` |
| 自动 `.material-auto`、`.material-solid-*`、`.material-glass-*` 选择器 | 使用在 `data-neoverse-material` 作用域下解析的语义角色标记（`.material-role-*`） |
| `surface="chrome"`、`.ui-surface-chrome`、`--neoverse-control-chrome-*`、`--neoverse-effect-floating-chrome-*` | 改用显式 `surface="glass-subtle"` 或自动 `surface="auto"`，几何间距由 `--neoverse-control-surface-*` 控制 |
| 硬编码三材质选项数组 | 从 `@neoverse-ui/tokens` 导入 `materials`、`defaultMaterial`、`materialAttribute`、`isMaterial` 与 `materialCatalog` |

在 `<html>`、子树或单个表面设置 `data-neoverse-material="solid" | "frosted" | "glass"`。省略属性时默认极光玻璃，未知值不阻断父级作用域继承。

## 将组件从显式玻璃迁移为自动材质

1. 需要跟随文档或子树材质切换的 `UiButton`、`UiCard`、`UiControlSurface`、`UiSegmentedControl`、`UiDock` 与 `UiTerminalSurface`，将 `surface="glass-elevated"` 或 `surface="glass-subtle"` 替换为 `surface="auto"`（或省略 `surface`）。
2. 仅在需要固定表面外观、不受外层材质作用域影响时保留显式 `surface="glass-*"`、`surface="frosted"`、`surface="solid"`、`surface="elevated"` 或 `surface="none"`。
3. 清理消费端在可切换材质表面上直接引用极光玻璃专属变量（如 `--neoverse-material-background-fallback`、`--neoverse-material-glass-subtle-filter`）的临时 CSS 绕行方案，或将对应规则限定在极光玻璃作用域内。

## 构建、样式入口与本地同步兼容性

- **本地 `file:` 消费端同步路径**：共享同步脚本已由 `scripts/sync-consumer.ts` 迁至 `scripts/sync/sync-consumer.ts`。消费端脚本（如 `Neoverse-Slides` 中的 `apps/web/scripts/sync-neoverse-ui-styles.ts`）需更新为调用 `../Neoverse-UI/scripts/sync/sync-consumer.ts`。
- **CSS `@layer` 层叠顺序**：保持 `@layer neoverse` 位于 Tailwind `components` 与 `utilities` 之后（例如 `@layer properties, theme, base, components, utilities, neoverse;`）。避免匹配内部 `@neoverse-ui/tailwind/dist/index.css` 路径，也不要把 `neoverse` 排在 `components` 与 `utilities` 之前。
- **包产物与检出模式**：验收压缩包或注册表安装的包时，从安装位置解析公开入口，不使用指向相邻检出目录 `dist` 的别名。本地同步命令仅用于指向相邻检出目录的 `file:` 依赖。需要复制静态样式表时，从已安装的公开入口 `@neoverse-ui/tailwind/index.css` 读取。
- **Nuxt Autoprefixer**：`@neoverse-ui/tailwind` 已内置前缀并使用现代 `@supports` 能力检测。若 PostCSS 在 `@supports` 子句上报错，请在 Nuxt 中关闭内置 Autoprefixer（`postcss: { plugins: { autoprefixer: false } }`）。
- **可选 Glass Runtime**：在纯实体或纯磨砂页面挂载 `@neoverse-ui/glass-runtime` 不会创建任何画布、WebGL 上下文、Shader Program 或 Buffer；仅当存在合格极光玻璃表面时才自动激活，页面隐藏（`document.hidden`）期间自动暂停调度并在 `visibilitychange` 恢复，最后一个合格表面移除后立即释放 GPU 资源。

## 材质成熟度说明

`contracts/component-matrix.json` 继续保持 `materialMaturity` 为 `glass: "existing"`、`solid: "existing"`、`frosted: "experimental"`。磨砂材质基于原生 CSS `backdrop-filter`，具备 `@supports`、`prefers-reduced-transparency: reduce` 与 `forced-colors: active` 自动降级。工程验证不提升磨砂成熟度；还需真实消费端、跨平台、视觉验收及最终发布门禁证据。

## 验证顺序

1. 同步升级所有直接消费的 `@neoverse-ui/*` 包，刷新锁文件或本地同步产物。
2. 在 Windows 与 Linux 环境运行消费端类型检查与生产构建。
3. 在 `solid`、`frosted`、`glass` 三种作用域下验证 SSR 输出与客户端 Hydration 零告警一致。
4. 在浅色与深色主题下检查导航、表单、浮层、终端与页面背景，并覆盖减少动效、减少透明度与强制颜色。
5. 确认纯实体与纯磨砂页面不生成 `[data-neoverse-glass-renderer-canvas]` 节点。
