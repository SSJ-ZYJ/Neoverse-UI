# @neoverse-ui/tokens

[English](README.md)

<!-- Source: packages/tokens/README.md -->
<!-- Source-SHA256: 93968addf8eda40848d6ef0b9a35e088edb1c63a18f1e180f410a07cfc277f58 -->

Neoverse-UI 的设计变量、CSS 变量与变量名称映射。

```sh
bun add @neoverse-ui/tokens
```

通过以下方式使用生成的 CSS 变量：

```css
@import '@neoverse-ui/tokens/css';
```

TypeScript 消费项目可以从 `@neoverse-ui/tokens` 导入公开的变量名称映射。

## 材质家族

Neoverse-UI 提供三种地位平等且独立的材质：

- **不透明材质（Solid）**（`cssVariables.material.solid`）：基于原生 CSS 的不透明色阶、嵌套面板分层、分组控件抬升、语义按钮与状态底板。
- **磨砂材质（Frosted）**（`cssVariables.material.frosted`）：基于原生 CSS `backdrop-filter` 的按角色模糊/饱和度/不透明度尺度、柔和哑光边缘、嵌套去重模糊与完全不透明回退色。
- **极光玻璃（Aurora Glass）**（`cssVariables.material.glass` / `glassMaterial`）：包含轻薄（`glass-subtle`）、标准（`glass-elevated`）与厚实（`glass-immersive`）三个层级的光学玻璃材质。

## 极光玻璃

极光玻璃（Aurora Glass）是唯一的共享玻璃材质。轻薄（Light）、标准（Standard）与厚实（Immersive）是它的层级，不是独立样式。稳定的技术 surface 标识仍分别为 `glass-subtle`、`glass-elevated` 与 `glass-immersive`；`glass-*` 不代表另一种玻璃样式。

消费端展示标签时使用共享元数据：

```ts
import { glassMaterial } from '@neoverse-ui/tokens';

glassMaterial.name.en; // Aurora Glass
glassMaterial.name.zh; // Chinese display name
glassMaterial.tiers.subtle; // { en: 'Light', zh: Chinese tier name }
glassMaterial.tiers.elevated; // { en: 'Standard', zh: Chinese tier name }
glassMaterial.tiers.immersive; // { en: 'Immersive', zh: Chinese tier name }
```

`tiers` 导出简短的层级名称；需要完整材质标签时与 `name` 组合使用。`zh` 条目保存供中文界面展示的本地化名称。CSS 类、变量与现有 TypeScript API 保留技术名称。光学数值与使用方式见[材质标准](../../docs/zh-CN/architecture/material-standards.md)。

架构、主题规范与贡献说明见 [Neoverse-UI 仓库](https://github.com/SSJ-ZYJ/Neoverse-UI)。