# @neoverse-ui/motion

[English](README.md)

<!-- Source: packages/motion/README.md -->
<!-- Source-SHA256: 8239e0b24464cc395d4a8369b75370b9caf906f105f968c7b71bf46544ec596d -->

Neoverse-UI 的单一动效规范：变量、Presence 引擎与页面切换动画。组件库中的一切动画都解析到这里发布的值——组件从不硬编码时长、缓动或关键帧。

```sh
bun add @neoverse-ui/motion
```

通过以下方式导入共享动效层：

```css
@import '@neoverse-ui/motion/css';
```

`@neoverse-ui/tokens` 作为内部运行时依赖安装。

## 分层

1. **变量尺度**（`@neoverse-ui/tokens`）：时长（`fast` / `standard` / `expressive`）、缓动（`linear` / `standard` / `emphasized` / `accelerate`）、位移距离、Presence 几何与粒子消散时序。在 `prefers-reduced-motion` 下，整个尺度折叠为瞬时。
2. **语义角色**：`feedback`、`state`、`spatial`、`enter` 与 `exit`。组件引用角色而不是原始值，因此修改一个变量即可重新调节整个系统。
3. **Presence 引擎**（`.nv-*` 类）：为所有框架提供统一的入场/出场行为，由 `data-neoverse-motion` 预设属性驱动。
4. **布局宽度动效**：`captureLayoutWidths` / `animateLayoutWidths` 让一组盒子在内容尺寸变化时保持同步。
5. **页面切换动画**：由 `startViewTransition()` 驱动的 WebGL 粒子消散，带 CSS 快照回退。

## Presence 引擎

选择一个预设后，元素的入场与出场沿同一条路径运动——出场就是入场的反向，这正是动效保持连续的原因。

```vue
<script setup>
import { presence } from '@neoverse-ui/vue';
</script>

<Transition name="nv">
  <span v-if="open" v-bind="presence('pop', 'top')">…</span>
</Transition>
```

预设：`fade`、`rise`、`sink`、`pop`、`veil`、`slide-start`、`slide-end`。`pop` 从原点边缘生长——用 `presence('pop', 'top')` 把原点指向触发边缘，使弹出层从触发器向外生长（边缘到边缘）。

- `<TransitionGroup name="nv">` 增加 FLIP 连续性：被重新定位的相邻项会滑行（`nv-move`），而不是瞬移。使用 `@neoverse-ui/vue` 的 `staggerStyle(index)` 错开入场（出场仍立即执行）。
- `.nv-appear`（或 `presenceAppearClassName`）在首次渲染时零 JavaScript 播放预设——适用于加载指示器、勾选标记与提示的挂载入场。
- `.nv-vanish` + React 中的 `useUiPresence()` / `<UiPresence show>`：由动画驱动的出场，在 `animationend` 时卸载。
- `.nv-presence`：通过 `@starting-style` + `allow-discrete` 为顶层 `[popover]` 表面提供零 JS 入场/出场。入场与出场都可中断：CSS 过渡从当前帧重新定向，同一列表中的入场与出场元素并行动画。

## 布局宽度动效

语言、主题或标签切换会改变一组盒子所需的空间。为这一尺寸变化做动画，可让整组保持在一条曲线上，而不是让每个盒子——或它周围的网格——跳变。

```ts
import { animateLayoutWidths, captureLayoutWidths } from '@neoverse-ui/motion';

const samples = captureLayoutWidths(document.querySelectorAll('[data-resizing]'));
// …替换内容…
animateLayoutWidths(samples);
```

两个阶段缺一不可：自然宽度只有在更新之后才存在。

- 只采样具有客户端矩形的盒子，因此隐藏断点或已脱离文档的节点不会成为动画目标。
- 所有自然终点都在第一个动画开始前解析完成。为一个盒子做动画会改变周围网格，否则会歪曲后续盒子的终点读取。
- 动画写成 `spatial` 角色上的 `width` 关键帧对，并在结束时释放填充，使每个盒子回到自动尺寸。
- **变宽**的盒子在宽度追赶期间保持其替换文案在一行：内联应用 `white-space: nowrap` 与 `overflow: clip`，在运行结束或取消时移除。缺少这一锁定，新的更长文案会在仍然狭窄的盒子内换行，抬高高度并移动周围布局，直到动画结束。变窄的盒子不做处理。
- 宽度未变化（在 `tolerance` 内，默认 0.5px）的盒子保持不变。运行期间再次调用 `animateLayoutWidths` 会从已到达的帧继续，因为捕获宽度是从动画样式读取的。
- 减少动效、缺少时长变量或没有 Web Animations API 时，解析为无动画并使用自然宽度。
- 终点从渲染布局测量，因此消费项目必须在测量前等待字体加载完成（`document.fonts.ready`）——更新期间的字体切换会在动画开始后改变自然宽度。

`captureLayoutWidths` 与 `animateLayoutWidths` 与框架无关；Vue 适配为 `@neoverse-ui/vue` 的 `useLayoutWidthMotion`。Design Lab 的 `foundation-motion-width` 样例展示了语言切换下的结果。

## 页面切换动画

```ts
import { startViewTransition } from '@neoverse-ui/motion';

await startViewTransition(() => {
  route.content = next; // 替换 DOM
});
```

优先级顺序：

1. **WebGL 粒子消散**——浏览器支持 WebGL2 时，标记为 `data-neoverse-dissolve` 的元素会被光栅化（可用时使用 HTML-in-Canvas 捕获，否则生成主题色合成尘埃），并在指针透明的全屏画布上侵蚀为细尘；进入区域稍后淡入（`--neoverse-motion-particle-enter-delay/-duration`）。共享采样间距偏向更轻的场；可用 `particleDissolvePresets`（`high` / `medium`）继续调节。
2. **交叉淡化**——没有 WebGL2 时，View Transition 自带的交叉淡化按 spatial 角色计时。无法使用粒子的消散直接淡出。
3. **普通更新**——减少动效或不支持 View Transition 时，直接执行 DOM 更新。

可用 `particle: 'capture' | 'synthetic' | 'crossfade' | false` 强制指定管线。

保证：

- **可中断**——新调用会在当前帧跳过正在运行的动画；快速导航从不排队。
- **并行**——动画期间每一层都是 `pointer-events: none`；旧页面仍在消散时，新页面已可交互。
- **稳定 chrome**——为持久元素指定 `view-transition-name`，避免它们在状态之间闪烁。

## 变量参考

| 组 | 值 |
| --- | --- |
| 时长 | `fast` 140ms · `standard` 240ms · `expressive` 420ms |
| 缓动 | `linear` · `standard` · `emphasized` · `accelerate` |
| 距离 | `near` · `mid` · `far`（space-2 / space-4 / space-8） |
| 粒子 | `duration` 910ms · `enter-delay` 455ms · `enter-duration` 234ms |

架构与贡献说明见 [Neoverse-UI 仓库](https://github.com/SSJ-ZYJ/Neoverse-UI)。