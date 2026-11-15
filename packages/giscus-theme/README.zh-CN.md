# @neoverse-ui/giscus-theme

[English](README.md)

<!-- Source: packages/giscus-theme/README.md -->
<!-- Source-SHA256: 8d71569e5b64d0ea008ab1fe9ab80937d65f6ee65b1f330a3fffc1d9bbed6e4a -->

Neoverse 产品使用的独立浅色与深色 Giscus 主题。

Giscus 组件在跨域 iframe 中渲染，无法直接读取承载页面的 CSS 变量。此包让 iframe 主题继续遵循设计系统，并发布自包含的 CSS 资源，供消费项目复制到公开的 HTTPS 源。

## 导出

- `@neoverse-ui/giscus-theme/light.css`
- `@neoverse-ui/giscus-theme/dark.css`

消费项目应通过 HTTPS 提供复制后的 CSS，并把该 URL 传给 Giscus。不要在 HTTPS 的 Giscus iframe 中使用本机 HTTP URL。