# 从 0.3.0 迁移到 0.3.1 / 0.4.0

Status: adopted

[English](../../releases/migration-0.3.1.md)

<!-- Source: docs/releases/migration-0.3.1.md -->
<!-- Source-SHA256: be3e0f2eb90c29c0ce07105269dd5332a1175f1d014055ec89024dd2cca80200 -->

最新已发布基线是 2026-11-05 的 0.3.1 / 0.4.0 协同发布。各包版本仍独立；`0.3.1` 是发布代号，不是所有包共用的版本。

| 包 | 先前版本 | 当前版本 |
| --- | --- | --- |
| Tokens、Tailwind、Overlay Runtime | 0.3.0 | 0.3.1 |
| Vue、React | 0.3.0 | 0.4.0 |
| Motion、Glass Runtime | 0.2.1 | 0.2.2 |
| Giscus Theme | 0.2.0 | 0.2.0（未变） |

适配器 JavaScript、Tokens 与编译后的 Tailwind CSS 必须一起升级。Vue 仍要求 `>=3.5.0 <4.0.0`；React 要求 `>=19.0.0 <20.0.0`。

从 0.2.x 升级的消费项目必须先完成 [0.3.0 迁移要求](../../releases/migration-0.3.0.md)。

## 已移除的滚动条名称

| 已移除 | 替代 |
| --- | --- |
| `--neoverse-scrollbar-immersive-track-border-width` | `--neoverse-scrollbar-immersive-rail-inset` |
| `cssVariables.components.scrollbar.immersive.trackBorderWidth` | 同一映射中的 `.railInset` |
| `--neoverse-effect-rail-thumb-glow`、`--neoverse-scrollbar-immersive-thumb-glow` | 移除 glow 覆盖；调整共享 thumb ink 与背景值 |
| `cssVariables.components.scrollbar.immersive.thumbGlow` | 移除该查询；调整 `.thumb`、`.thumbHover` 或背景条目 |
| `--neoverse-effect-rail-thumb-hover-shadow`、`--neoverse-scrollbar-overlay-thumb-hover-shadow` | 移除外阴影覆盖；调整 thumb ink 与 overlay 宽度 |
| `cssVariables.components.scrollbar.overlay.thumbHoverShadow` | 移除该查询；调整 immersive ink 或 overlay 宽度条目 |

`--neoverse-scrollbar-overlay-thumb-width` 及其 hover 对应值现在同时驱动两条轨道。原生 thumb 边框宽度从这些值派生。Tokens 还导出 `cssVariables.components.scrollbar.immersive.thumbHoverBorderWidth` 与 `cssVariables.components.controlSurface.trailingPadding`。

## 共享阴影

`--neoverse-shadow-float` 是 Input、Textarea、Select、Disclosure 与 Table 的共享阴影。Button、导航与分段控件的阴影未变。覆盖过这些控件阴影的消费项目应把接触层与环境层组合后，与自己的表面一起检查。

## 滚动条首帧

首帧滚动条保证需要服务端渲染的 `UiScrollbar` 标记与已发布样式表。仅客户端渲染的轨道走挂载时路径。`hideNative={false}` 选择退出，无脚本页面保留原生滚动条。

## 材质混合变量

`--neoverse-material-edge-refraction-blend` 为消费项目自有的折射绘制提供深色主题的 `overlay` 值。该变量不会改变已发布组件的混合模式。绘制描边需要显式属性，并排除按钮表面；详见[材质标准](../architecture/material-standards.md)。

## 验证顺序

1. 盘点直接消费的包、lockfile 版本、根 overrides 与复制的 CSS。
2. 一起升级所有直接消费的 UI 包；刷新 lockfile 并重新生成 vendor CSS。
3. 运行消费项目的类型检查与生产构建。
4. 在桌面与移动宽度检查浅色、深色与系统主题；检查滚动条、浮层、终端对比、表单、减少动效与减少透明度。
5. 提升组件成熟度前记录真实的消费证据。

版本管理与发布仍由发布负责人执行。本指南不运行 Changesets、不发布包，也不改变消费项目的依赖来源。
