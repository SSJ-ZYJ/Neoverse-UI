# 消费项目组件尺寸

组件默认尺寸必须在浏览器通常的 16px 根字号下可读。此前 Button/Action 默认只有 32px 高、12.48px 字号，导航/分段控件只有 24px 高、11.2px 字号；Playground 外层使用 17–20px 根字号放大了预览，使实际接入项目显得更小。

现在共享 Tokens 定义以下基线，Vue、React 和预编译消费者 CSS 使用同一组值：

| 组件 | 高度 | 字号 |
| --- | --- | --- |
| Button / Action sm | 32px | 14px |
| Button / Action md | 40px | 14px |
| Button / Action lg | 48px | 16px |
| IconButton sm / md / lg | 32 / 40 / 48px | 图标 16 / 16 / 20px |
| NavigationItem sm / md | 32px | 14px |
| NavigationItem lg | 40px | 16px |
| SegmentedControl 选项 | 32px | 14px |
| Input / Select | 最小 40px | 14px |

这些值由 `rem` 计算，会随用户字体设置变化，不需要消费项目设置更大的 `html` 字号或逐个覆盖 `.ui-*`。小型状态标签、辅助说明仍使用较小的语义字号。Playground shell 与 `/frame` 都使用普通根字号。

Dock 尾部的嵌入式语言切换保持 0.2.0 的独立几何：外层高 30px、选项高 24px、字号
11.2px、左右留白 6px，桌面最小宽度 32px；紧凑模式按内容宽度排布。
`lg` 档保留语言字号的 0.9 补偿，Dock 整体仍按原来的 1.3 缩放。
嵌入项不随独立分段控件的 32px / 14px 基线放大，背景和交互继续使用共享材质。

## 本地 file: 包同步

Bun 的 `file:` 依赖可能是旧构建产物的物理副本或硬链接。只构建 Neoverse-UI，再从消费项目的 `node_modules` 复制 CSS，不能保证获得最新组件。

在消费仓库运行共享入口：

```powershell
bun D:/SSJ/Projects/Neoverse-UI/scripts/sync-consumer.ts --consumer .
```

脚本读取根与 `apps/*` / `packages/*` 的依赖，遵守根 `overrides`，按依赖顺序构建，同步并逐文件验证已安装的本地 UI 包及其嵌套副本。只更新生成的 `dist` 与包清单，不更改消费源码或锁文件。消费仓库应先安装依赖；发布包不走此本地入口。已完成构建时可传 `--skip-build`。

Neoverse-Slides 已接入 `bun run ui:sync`；门户的开发、构建、生成、类型检查和样式同步会先同步共享包，再复制预编译 CSS 到 `/vendor/neoverse-ui.css`。

## 验证

- `tests/visual/component-size.spec.ts` 测量真实 Vue 控件的宽高、字号。
- `tests/visual/playground-shell.spec.ts` 检查桌面各宽度的根字号一致。
- `scripts/sync-consumer.test.ts` 覆盖旧 CSS、嵌套副本、硬链接和根 overrides。
- Neoverse-Slides 的 `bun run test:ui-size` 检查真实 `/slides` 页面在桌面/手机、深浅主题下的导航、按钮、输入框、选择框尺寸和横向溢出。

### 2026-10-12 消费验证记录

- Neoverse-UI 全量构建、TypeScript 检查、共享契约检查和相关 CSS lint 通过；Tokens 与同步脚本单测 36 项通过。
- Vue/React 默认尺寸、所有模块在深浅主题/中英文/shell/frame 的比例、桌面与手机根字号和 Dock 缩放检查共 34 项通过。
- Neoverse-Slides `bun run check`、`bun run test:ui-size`、`bun run build:portal` 通过。真实页面的导航与小按钮为 32px / 14px，输入与选择控件为 40px / 14px，1440px 和 390px 视口均无横向溢出。
- UI 构建 CSS、Slides 已安装 CSS、开发 vendor CSS 和静态输出 vendor CSS 的 SHA-256 一致。没有提交代码或发布包。
- 扩展运行 `control-identity.spec.ts` 时发现 8 项深色材质颜色/阴影断言失败；这些不属于尺寸断言，本次未修改材质规则，也不声称完整视觉门禁已通过。
