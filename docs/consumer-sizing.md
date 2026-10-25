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
| Badge sm / md / lg | 随原有行高和内边距计算 | 13 / 14 / 16px |

徽章三档统一使用 `--neoverse-badge-font-family` 与 `--neoverse-badge-font-weight`，分别映射共享 Label 字体族和字重。字号随尺寸递增，行高与内边距保持原有尺寸；消费项目可通过同一组徽章 Token 调整三档字体和字重。

这些值由 `rem` 计算，会随用户字体设置变化，不需要消费项目设置更大的 `html` 字号或逐个覆盖 `.ui-*`。小型状态标签、辅助说明仍使用较小的语义字号。Playground shell 与 `/frame` 都使用普通根字号。

Dock 尾部的嵌入式语言切换保持 0.2.0 的独立几何：外层高 30px、选项高 24px、字号
11.2px、左右留白 6px，桌面最小宽度 32px；紧凑模式按内容宽度排布。
尾部分组背景到首尾选项的左右留白复用独立分段控件的 inset 与边界之和，默认各 5px；
该间距由 `--neoverse-control-surface-trailing-padding-inline` 统一控制，不改变上下留白。
`lg` 档保留语言字号的 0.9 补偿。Dock 通过独立的
`--neoverse-dock-scale-md` / `--neoverse-dock-scale-lg` 将整体缩放设为 1.1 / 1.3；
外壳、图标、间距及语言控件一起放大，导航文字另用
`--neoverse-dock-navigation-type-factor: 0.95` 收敛字号，通用 ControlSurface 仍为 1 / 1.3。
在 16px 根字号下，md 导航项实际高约 35.2px，文字约 14.6px，Dock 外壳约 49px。
Neoverse 当前显式使用 `scale="md"`，Playground 标准、紧凑及消费一致性示例均使用同档，
组件省略 `scale` 时仍使用 lg。
嵌入项不随独立分段控件的 32px / 14px 基线放大，背景和交互继续使用共享材质。

## 本地 file: 包同步

Bun 的 `file:` 依赖可能是旧构建产物的物理副本或硬链接。只构建 Neoverse-UI，再从消费项目的 `node_modules` 复制 CSS，不能保证获得最新组件。

在消费仓库运行共享入口：

```powershell
bun D:/SSJ/Projects/Neoverse-UI/scripts/sync-consumer.ts --consumer .
```

脚本读取根与 `apps/*` / `packages/*` 的依赖，遵守根 `overrides`，按依赖顺序构建，同步并逐文件验证已安装的本地 UI 包及其嵌套副本。只更新生成的 `dist` 与包清单，不更改消费源码或锁文件。消费仓库应先安装依赖；发布包不走此本地入口。已完成构建时可传 `--skip-build`。

Neoverse-Slides 已接入 `bun run ui:sync`；门户的开发、构建、生成、类型检查和样式同步会先同步共享包，再复制预编译 CSS 到 `/vendor/neoverse-ui.css`。

## 2026-10-25 消费依赖核查

此处区分安装来源与源码成熟度，不要求所有项目统一使用 npm。当前官方发布基线见[发布说明](release-0.3.0.md)；相同 manifest 版本不代表本地 `file:` 构建与已发布 tarball 相同。

| 消费项目 | 直接来源及锁定 / 已安装版本 | 复现边界 |
| --- | --- | --- |
| Neoverse | npm：Glass / Motion 0.2.1，Tailwind / Tokens / Vue 0.3.0；传递 Overlay Runtime 0.3.0 | 六包锁定完整性与官方一致，无嵌套 UI 安装副本，不依赖兄弟源码 |
| Neoverse-Doc | 六包仍为 0.1.0；Tokens / Motion / Glass 改为精确 npm 0.1.0，React / Tailwind / Giscus 继续本地 tarball | 前三包官方 SHA-512 与原 tarball 完全相同，Motion / Tokens overrides 同步；其余三包仍依赖被 UI Git 忽略的 `.release/packages/`，现有 CI 未获取它们，干净 checkout 不能独立安装 |
| Neoverse-Slides | 六个 UI 包使用兄弟仓库 `file:`；Glass / Motion 0.2.1，其余 0.3.0；业务子包另用 `workspace:*` | UI 不属于本站 workspace；CI 未检出兄弟 UI。`ui:sync` 同步生成物并复制 vendor CSS，不会固定源码提交 |
| XCA-Portal | 六个 UI 包的 direct / overrides 使用兄弟仓库 `file:`；Glass / Motion 0.2.1，其余 0.3.0 | CI 联合检出固定 UI `82d0614`，本地 UI 已在后续提交；本地 Echo 验证不等于该固定组合的 CI 验证，不擅自移动消费者 SHA |

Doc 的官方 `react@0.1.0`、`giscus-theme@0.1.0` 返回 404；官方 `tailwind@0.1.0` 与原锁定 tarball 完整性不同，不能视为同制品来源替换。完整升级跨越 0.1 → 0.2 → 0.3，涉及 Token / Motion / Glass、chrome 删除、Dock 默认材质及共享尺寸，须另行迁移并验收真实页面，不添加兼容 shim。Doc 的 `sync:ui-assets` 只复制已安装 Giscus CSS，不能解决历史制品缺失。

目录审计：Doc 六个根包无嵌套 UI 副本；Slides 的 web/theme Vue 和 Tailwind 链接指向相同缓存实体，另有 Motion → Tokens 嵌套锁条目。XCA 有 17 个 UI 目录（Tokens ×7、Motion ×4、Tailwind ×2、Overlay ×2、Vue ×1、Glass ×1），同名 manifest 为硬链接，不能按目录数认定为不同版本。共享同步器已覆盖嵌套副本；此轮未改动 Slides / XCA 的开发依赖方式、锁文件或现有用户工作。

## 验证

- `tests/visual/component-size.spec.ts` 测量真实 Vue 控件的宽高、字号。
- `tests/visual/dock-consumer-size.spec.ts` 比较 Playground shell/frame 和预编译消费 CSS 的 Dock 几何，覆盖深浅主题、中英文及桌面/手机。
- `tests/visual/playground-shell.spec.ts` 检查桌面各宽度的根字号一致。
- `scripts/sync-consumer.test.ts` 覆盖旧 CSS、嵌套副本、硬链接和根 overrides。
- Neoverse-Slides 的 `bun run test:ui-size` 检查真实 `/slides` 页面在桌面/手机、深浅主题下的导航、按钮、输入框、选择框尺寸和横向溢出。

### 2026-10-16 Dock 尺寸验证

- Dock 尺寸一致性、语言切换、md/lg 缩放和 React 交互检查共 25 项通过；1 项仅桌面展示检查在手机跳过。预编译消费 CSS 与 Playground shell/frame 的标准、紧凑示例几何一致，覆盖中英文及深浅主题。
- 全量构建、UI 类型检查、共享契约检查、相关 Biome/Stylelint 检查通过；Tokens 单测 32 项通过。
- 核对 Neoverse 的 `BottomDock.vue` 继续使用现有 `scale="md"`，本地包通过 link 指向本仓库，已确认安装路径可读取新尺寸 Token；Neoverse 类型检查通过。消费源码保持原样，本次未启动消费项目服务或进行产品截图验收。

### 2026-10-12 消费验证记录

- Neoverse-UI 全量构建、TypeScript 检查、共享契约检查和相关 CSS lint 通过；Tokens 与同步脚本单测 36 项通过。
- Vue/React 默认尺寸、所有模块在深浅主题/中英文/shell/frame 的比例、桌面与手机根字号和 Dock 缩放检查共 34 项通过。
- Neoverse-Slides `bun run check`、`bun run test:ui-size`、`bun run build:portal` 通过。真实页面的导航与小按钮为 32px / 14px，输入与选择控件为 40px / 14px，1440px 和 390px 视口均无横向溢出。
- UI 构建 CSS、Slides 已安装 CSS、开发 vendor CSS 和静态输出 vendor CSS 的 SHA-256 一致。没有提交代码或发布包。
- 扩展运行 `control-identity.spec.ts` 时发现 8 项深色材质颜色/阴影断言失败；这些不属于尺寸断言，本次未修改材质规则，也不声称完整视觉门禁已通过。
