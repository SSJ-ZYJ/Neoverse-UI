# @neoverse-ui/overlay-runtime

[English](README.md)

<!-- Source: packages/overlay-runtime/README.md -->
<!-- Source-SHA256: 245120ba33167988339f76e45d63cc2b0c51c6ebec07744062da198283c47fcd -->

与框架无关的 DOM 运行时，为 Neoverse-UI 顶层浮层提供定位能力。

它负责锚定定位、Popover API 回退、滚动与缩放跟踪，以及回退路径上的轻触关闭行为。组件状态、语义与焦点策略仍由框架适配层负责。

## API

- `resolveAnchoredPosition` 在不访问 DOM 的情况下计算视口位置。
- `positionAnchoredOverlay` 更新已打开面板的 CSS 自定义属性。
- `showAnchoredOverlay` 打开面板、完成定位，并安装跟踪与关闭处理器。
- `hideAnchoredOverlay` 关闭面板并移除处理器。
- `stopOverlayTracking` 在清理阶段为已捕获的面板移除处理器。
- `supportsPopover` 与 `isOverlayOpen` 提供原生/回退状态检查。

`AnchoredOverlayOptions` 提供触发器与面板元素、两者的间距和位置 CSS 变量名、可选的宽度匹配与放置方式、回退打开类，以及可选的关闭回调。放置方式为 `auto | bottom-start | bottom-end`；`auto` 可以向上翻转，所有位置都会限制在视口内。面板可见性 CSS 与组件状态由适配层负责。

```ts
import { resolveAnchoredPosition } from '@neoverse-ui/overlay-runtime';

const position = resolveAnchoredPosition({
  trigger: { top: 10, right: 110, bottom: 50, left: 10, width: 100, height: 40 },
  overlayWidth: 200,
  overlayHeight: 100,
  viewport: { width: 800, height: 600 },
  gap: 8,
  placement: 'auto',
});
```

运行时只在执行元素操作时需要浏览器 DOM。服务端消费项目可以安全导入此包并调用 `resolveAnchoredPosition`。清理时传入已捕获的挂载面板；不要依赖卸载后仍被填充的框架 ref。受控适配层必须根据父级持有的 `open` prop 处理关闭请求。