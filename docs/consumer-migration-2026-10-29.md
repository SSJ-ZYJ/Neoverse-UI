# 2026-10-29 Neoverse-Doc 消费迁移

已保留既有未提交工作，完成隔离验证并写回最小差异。消费基于 dev 的 4c7de67 加当前工作源码；候选 UI 基于 7b5bdfc 加本轮未提交改动。不是新的固定提交组合或远端 CI 结果。

## 正式包安装基线

| 包 | 精确 npm 版本 |
| --- | --- |
| Tokens / Tailwind / React | 0.3.0 |
| Motion / Glass Runtime | 0.2.1 |
| Giscus Theme | 0.2.0 |

六个直接依赖和三个既有 overrides 一起迁移，锁文件包含传递 Overlay Runtime 0.3.0。正式 manifest / lock 不再引用被忽略的历史 tarball，也不依赖兄弟 UI 源码。原工作区 frozen install 已成功完成 Giscus / MDX postinstall；隔离副本另完成生产构建与页面回归。

迁移保留 Docs 的 Tailwind / Fumadocs 管线、共享 CSS、静态导出、路由、布局和 Glass effect 生命周期，不增加本地 renderer 或兼容组件。

## RSC 边界与真实入口

首次生产构建暴露实际问题：服务端页面直接调用 UiAction，共享组件向注入的客户端路由链接传递事件处理器，构建报错。新增 src/runtime/neoverse-ui.ts，以 use client 导出 Action / Button / IconButton；调用方复用该窄入口，页面主体及展示用 Notice 保持服务端渲染。该位置符合 components / features → runtime 依赖方向。依据见 [Next.js 客户端边界说明](https://nextjs.org/docs/app/getting-started/server-and-client-components)。

| 组件 / 场景 | 消费源码与验收 |
| --- | --- |
| UiAction | src/components/home/primary-action.tsx、home-portal.tsx；真实 /zh 首页 CTA 在 1440 / 390px、深浅主题下跳转 /zh/learn |
| UiIconButton | src/components/docs-back-to-top.tsx；真实 syntax-example 文章滚动后点击返回顶部 |
| UiButton | src/components/mdx/code-copy-button.tsx；真实导出文章的复制按钮写入非空代码；另用阅读夹具检查原生 ref、disabled/loading、表单提交与 reduced-motion |
| UiNotice | src/components/mdx/doc-callout.tsx 已注册到 MDX 映射；check:callouts 验证服务端兼容输出，但当前正文无显式 Callout 调用，不计作真实页面消费验收 |

搜索、Mermaid、草稿和错误页等既有交互同样通过窄入口。生产构建覆盖这些导入，不等同于逐项交互或人工视觉验收。syntax-example 的 Markdown admonition 实际未输出 UiNotice，新增的页面消费断言因此失败；确认后移除该不成立的消费前提，保留独立 callout 契约测试。未发现公共 Popover / Menu / Breadcrumb 产品调用，不替换 Fumadocs 功能来补数字。

## 两种来源分别验证

- **已发布 npm**：隔离副本 frozen 安装、类型检查、check:callouts、生产构建、扩展 check:reading 通过；输出 93 个 HTML、72 个 Mermaid 资源和约 16.2 MB 搜索索引。无需兄弟源码。正式工作区沿用此来源。
- **未发布本地候选**：同一消费快照的六包显式切为兄弟 UI file:，overrides 同步固定；sync:ui-assets 委托 UI 的 scripts/sync-consumer.ts 构建、同步并逐文件核验全部嵌套 dist，再复制 Giscus CSS。共享同步器本轮补齐 Giscus 包顺序和回归，4 项同步测试通过，没有另造同步器。
- 候选的 81 项单测、类型检查、架构检查（248 文件 / 308 跨层 / 5 跨 feature / 0 例外）、callout 检查、生产构建和阅读/真实首页回归通过。候选源码与 npm 分别记录，相同 manifest 版本不表示同一制品。

最终 Glass 修复后再次执行候选生产构建与扩展阅读回归，通过 93 个 HTML / 72 个 Mermaid 资源核验，以及真实文章复制、返回顶部和首页导航。构建保留既有 102 条内容维护/翻译提示。部分尝试发生 Next 字体下载临时错误；重试及有效的进程级代理后完成，未改生产字体配置。未执行部署、远端 CI、人工视觉、真实 AT / IME 或全站全部交互验收。

## 交付边界

README、中英文设计系统文档、manifest / lock、窄入口、assets 同步及阅读回归已写回。写回前检查文件漂移，交互源码只改导入，保留既有首页、知识上下文、学习/探索等工作。没有提交、推送、版本落盘或发布。正式包可安装不表示本轮候选已发布；组件成熟度与其余 React consumer / visual pending 不变。
