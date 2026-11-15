# Neoverse-UI 中文文档

Status: adopted

[English architecture](../architecture/README.md)

中文文档面向使用 Neoverse-UI 的开发者。英文规范仍是唯一依据；中文页与英文源文件成对维护，并在 `docs/translations.json` 中登记。英文源变化后，未同步的中文页会被 `bun run check:docs` 判为过期。

## 开始使用

- [项目 README](../../README.zh-CN.md)：安装、Vue/React 使用、组件清单、主题与材质、样式定制。
- [Vue 指南](../../packages/vue/README.zh-CN.md)：Vue 组件 API、表单、浮层、Presence 与布局宽度动效。
- [React 指南](../../packages/react/README.zh-CN.md)：React 适配器、表单、浮层、Dock、提示与终端。

## 规范

- [表单控件规范](architecture/form-control-contract.md)：状态模型、共享控件、框架绑定与 Field 组合。
- [浮层行为规范](architecture/overlay-contract.md)：定位运行时、顶层行为、关闭与焦点、菜单与 Select。
- [终端组合](architecture/terminal-composition.md)：Vue/React 示例、提示行、transcript、字体与验证边界。
- [极光玻璃材质摘要](architecture/material-standards.md)：层级、光学、嵌套、减少透明度与 Glass 修复守则。

完整英文规范：

- [架构与包边界](../architecture/README.md)
- [组件成熟度矩阵](../architecture/component-contract-matrix.md)
- [材质标准](../architecture/material-standards.md)
- [框架对应](../architecture/framework-parity.md)
- [组件需求](../architecture/component-requests.md)
- [消费尺寸](../architecture/consumer-sizing.md)

## 包指南

- [Tokens](../../packages/tokens/README.zh-CN.md)
- [Tailwind](../../packages/tailwind/README.zh-CN.md)
- [Motion](../../packages/motion/README.zh-CN.md)
- [Overlay Runtime](../../packages/overlay-runtime/README.zh-CN.md)
- [Glass Runtime](../../packages/glass-runtime/README.zh-CN.md)
- [Giscus Theme](../../packages/giscus-theme/README.zh-CN.md)

## 升级

- [从 0.2.x 迁移到 0.3.0](releases/migration-0.3.0.md)

## 维护

- [中文术语与用词](terminology.md)：专有名词、中文写法与禁用表达。
- 英文源文件先改，再同步中文译文与 `docs/translations.json` 登记的头信息哈希。
- 中文页只保留一种行文语言；代码、命令与标识符保持原样。
- 代理治理、源码规范、测试注册表、发布记录与 `.agents/notes/` 不提供中文对照。

相关规则见 [docs/AGENTS.md](../AGENTS.md#translations)。