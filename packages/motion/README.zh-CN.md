# @neoverse-ui/motion

[English](README.md)

<!-- Source: packages/motion/README.md -->
<!-- Source-SHA256: 85e5f1f56a7ae8eaac83dc3d577e00dd3f272af360d61b7b9767cdab53713eac -->

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

1. **变量尺度**（`@neoverse-ui/tokens`）：时长（`fast` / `standard` / `expressive`）、缓动（`linear` / `standard` / `emphasized` / `accelerate` / `spring`）、位移距离、Presence 几何与粒子消散时序。在 `prefers-reduced-motion` 下，整个尺度折叠为瞬时。
2. **语义角色**：`feedback`、`state`、`spatial`、`enter` 与 `exit`。组件引用角色而不是原始值，因此修改一个变量即可重新调节整个系统。
3. **Presence 引擎**（`.nv-*` 类）：为所有框架提供统一的入场/出场行为，由 `data-neoverse-motion` 预设属性驱动。
4. **布局宽度动效**：`captureLayoutWidths` / `animateLayoutWidths` 让一组盒子在内容尺寸变化时保持同步。
5. **页面切换动画**：由 `startViewTransition()` 编排的 9 种标准 View Transition 预设（`fade`、`glide`、`slide`、`push`、`depth`、`veil`、`curtain`、`iris`、`morph`），支持 `nv-page` / `nv-morph-*` 快照与 WAAPI 回退，并保留可选的 WebGL 粒子 `dissolve` 管线。

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

预设：`fade`、`rise`、`sink`、`pop`、`veil`、`bloom`、`haze`、`sway`、`spring`、`slide-start`、`slide-end`。`pop` 从原点边缘生长——用 `presence('pop', 'top')` 把原点指向触发边缘，使弹出层从触发器向外生长（边缘到边缘）。`veil`、`bloom` 与 `haze` 带模糊通道；`bloom` 还从远缩放生长，`haze` 在 expressive 时长内无位移地落定，`sway` 带轻微倾斜落位，`spring` 用会越过终点一次的曲线做短位移。

- `<TransitionGroup name="nv">` 增加 FLIP 连续性：被重新定位的相邻项会滑行（`nv-move`），而不是瞬移。使用 `@neoverse-ui/vue` 的 `staggerStyle(index)` 错开入场（出场仍立即执行）。
- `.nv-appear`（或 `presenceAppearClassName`）在首次渲染时零 JavaScript 播放预设——适用于加载指示器、勾选标记与提示的挂载入场。
- `.nv-vanish` + React 中的 `useUiPresence()` / `<UiPresence show>`：由动画驱动的出场，在 `animationend` 时卸载。
- `.nv-presence`：通过 `@starting-style` + `allow-discrete` 为顶层 `[popover]` 表面提供零 JS 入场/出场。入场与出场都可中断：CSS 过渡从当前帧重新定向，同一列表中的入场与出场元素并行动画。

### 回退档位

模糊是纵深线索，不是必需品。在任意祖先元素上设置 `data-neoverse-motion-fallback`（`presenceFallbackAttribute`）即可强制声明的回退：

| 档位 | 结果 |
| --- | --- |
| `no-filter` | 跳过模糊通道；`veil` 与 `haze` 改为近缩放入场，`bloom` 保留远缩放。`@supports not (filter: blur(1px))` 会自动应用同一档位，也可作为低功耗设备的主动选择。 |
| `fade-only` | 复现不具备独立 `translate` / `scale` / `rotate` 属性的引擎：所有预设折叠为透明度变化。 |

`presenceFallbacks` 列出这两个值。设计实验室的 Presence 示例会在每个档位下渲染同一批预设，让结果可见而不是只被描述。

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

`captureLayoutWidths` 与 `animateLayoutWidths` 与框架无关；Vue 适配为 `@neoverse-ui/vue` 的 `useLayoutWidthMotion`。Design Lab 的「切换动效」样例（`foundation-motion-playground`）展示了语言切换下的结果。

## 披露区域动效

`animateDisclosure(element, expanded)` 在 `state` 角色上让一个已挂载的披露区域在零高度与自然高度之间运动。关闭时立即加上 `inert` 与 `aria-hidden`，高度归零后再设置 `hidden`；展开时先移除这些状态再测量。被中断的运行会从当前屏幕高度继续，运行结束时恢复消费项目原有的内联 `height` 与 `overflow`；减少动效或缺少 Web Animations API 时直接应用目标状态。

```ts
import { animateDisclosure } from '@neoverse-ui/motion';

const animation = animateDisclosure(list, expanded);
await animation.finished;
// animation.cancel() 会在当前高度停止。
```

Design Lab 用它播放资源浏览中示例叶子的展开与收缩，并在动效模块的「展开与收起」样例中展示。

## 外观与控件尺寸动效

`animateAppearanceChange` 不管理应用的主题或语言状态。把真实的 DOM 更新放在回调中，保持控件实例不变：

```ts
import { animateAppearanceChange, attachLayoutSizeMotion } from '@neoverse-ui/motion';

await animateAppearanceChange(
  () => { document.documentElement.dataset.theme = 'dark'; },
  {
    kind: 'theme-reveal',
    origin: themeControl,
    theme: { current: readAppliedPalette, next: 'dark' },
  },
);

await animateAppearanceChange(() => renderLocale('en'), { kind: 'locale' });

// Mark the descendants to animate with `data-neoverse-size-motion`.
const detach = attachLayoutSizeMotion(controlGroup);
// Call detach() when the group unmounts.
```

- `theme-reveal` 从触发控件中心开始羽化扩散，键盘触发也使用相同中心。`theme-fade` 保留原来的淡入淡出；缺少有效起点或无法播放遮罩动效时，也回退到淡入淡出。扩散时长与羽化宽度分别由 `--neoverse-motion-theme-reveal-duration`、`--neoverse-motion-theme-reveal-feather` 控制。
- 外观动效只播放旧界面的快照，下方实时界面仍可点击。新的切换请求会打断当前动效，不排队，也不会丢失之前的 DOM 更新。
  每次切换传入 `theme.current` 和 `theme.next`，使用解析后的配色标识。切回被快照覆盖的配色时，动画从当前进度原地反向，不重拍快照。控件可立即显示最新选择；反向收尾时，等快照重新盖住实时页面，再由回调应用目标配色。回调只负责应用配色。
  主题配色由快照统一过渡。回调新触发的颜色和阴影过渡会在实时页面露出前到达终点；已在运行的效果和布局动效不受影响。
- `locale` 让旧界面淡出，露出更新后的界面。在同一渲染批次更新文案和 `document.documentElement.lang`；Vue 回调返回 `nextTick()`，React 在回调内通过 `flushSync` 提交状态。减少动效时直接更新；不支持 View Transition 时，主题回退到令牌颜色过渡，语言直接更新。
- `attachLayoutSizeMotion` 对同一个元素的实际宽度和高度做动画。默认只观察带 `data-neoverse-size-motion` 的后代，可用 `targets` 指定范围，或用 `attributes` 指定触发尺寸变化的属性。默认观察 `class`、`style`、`hidden` 和内容更新。卸载时解除观察；初次挂载、视口变化和原生拖拽缩放不播放动画。显式 `zoom` 档位可按 `spatial` 角色过渡。
  紧凑标签可标记 `data-neoverse-size-motion-label`，也可用 `singleLineLabels` 指定选择器。控件尺寸或语言变化时，标签保持单行，只暂时裁切尚未容纳的文字；动画结束后按正常字号完整显示，不为其他译文占位。描述等本应换行的内容不要标记。

### 避免双语控件换行

带尾部图标的紧凑操作控件用当前译文决定宽度，文字保持单行，图标不收缩，两者之间沿用组件间距。容器极窄时只截断可见文字，无障碍名称仍使用完整的当前译文。不要按最长译文固定标签宽度，否则较短的译文会在图标前留下空白。如果外部布局必须等宽，把预留空间放在文字和图标组合之外。需要播放宽度动画时，使用 `attachLayoutSizeMotion` 或布局宽度原语的临时不换行行为。

「切换动效」（`foundation-motion-playground`）提供主题、语言（含布局宽度动效）与控件尺寸的操作示例；检查器的独立预览链接按当前译文排布。

## 页面切换动画

```ts
import { startViewTransition } from '@neoverse-ui/motion';

await startViewTransition(
  () => {
    route.content = next; // 替换 DOM
  },
  {
    variant: 'push',
    direction: 'forward',
    target: outletElement,
  },
);
```

### 预设效果

9 种标准预设均运行在标准 View Transitions 之上（当 `document.startViewTransition` 不可用时回退为非粘滞的 WAAPI 入场与 FLIP 平滑切换动画），无需开启任何实验性浏览器特性。

遵循“同背景不移动背景、保持网站一体性”的原则，**内容级预设**（`fade`、`glide`、`depth`、`veil`、`morph`）默认将动画限定在 `contentTarget` / `[data-neoverse-page-content]` 内容层，让相同背景或底板始终保持静止；仅当两页背景确实不同并显式传入 `background: 'surface'` 时才带动整面过渡。**整体切换预设**（`slide`、`push`、`curtain`、`iris`）则始终作为整页动效带动带画布底色的完整页面表面过渡：

| 预设 | 分组 | 动效形式 | 适用场景 |
| --- | --- | --- | --- |
| `fade` | 同背景 | 非对称先退后入内容淡隐淡现（旧页先退场再淡入新页） | 彼此独立的横向页面跳转 |
| `glide` | 同背景 | 共享轴先退后入内容轻滑（`--neoverse-motion-page-glide-distance`） | 文档阅读与工作台路由切换 |
| `depth` | 同背景 | 细腻 Z 轴内容景深缩放（`1.02` / `0.985`，先退后入） | 总览网格与详情页面往返 |
| `veil` | 同背景 | 前景内容柔和虚化聚焦（`--neoverse-motion-page-blur`） | 同背景极光玻璃表面与静谧视图 |
| `morph` | 同背景 | 模仿 PPT 的跨页共享元素平滑几何变形与位移（`[data-neoverse-page-morph]`），未匹配文案先退后入 | 幻灯片演示、跨页视觉焦点衔接与版式演进 |
| `slide` | 整体切换 | 端到端并排方向滑动（`100%`）并带画布底色支撑 | 连续步骤流与幻灯片切换 |
| `push` | 整体切换 | 不透明图层在前景滑入覆盖退后并变暗的旧页面（`24%` 视差） | 层级钻入与返回 |
| `curtain` | 整体切换 | 带画布底色支撑的方向窄羽化渐变光幕（`--neoverse-motion-page-feather`） | 叙事揭示与演示视图 |
| `iris` | 整体切换 | 带画布底色支撑的径向羽化光圈展开与收拢，锚定到 `origin`（`Element` 或 `{ x, y }`） | 从卡片或按钮中心展开详情页 |

传入 `variant: 'none'`（或 `particle: false`）可直接应用更新；调用 `stopViewTransition()` 可立即取消当前编排。使用 `supportsViewTransition()` 检测标准 View Transitions 支持状态。

### 方向、背景策略、局部范围与回退

- **方向（`direction`）**：支持 `'forward' | 'backward' | 'up' | 'down'`（默认 `'forward'`）。在 `:dir(rtl)` 下，水平位移与 `curtain` 渐变角度会自动镜像翻转。
- **同背景静止保护（`contentTarget`、`background`、`[data-neoverse-page-content]`）**：在默认 `background: 'auto'` 下，`fade`、`glide`、`depth`、`veil` 与 `morph` 会自动解析 `contentTarget` 或 `[data-neoverse-page-content]`，仅对透明内容插槽施加 `nv-page` 快照，而让卡片底板、页面背景与外围壳层完全保持静止。仅当新页面拥有不同底色时传 `background: 'surface'`，或选用整体切换预设（`slide`、`push`、`curtain`、`iris`）。
- **平滑元素匹配（`[data-neoverse-page-morph]`）**：在前后两页对应的持久或同类元素上标注相同的 `data-neoverse-page-morph="<key>"` 属性。启用 `variant: 'morph'` 时，运行时会临时分配确定性的 `nv-morph-<key>` 快照名（带重名去重保护并在结束或中断时自动清理）；当 `document.startViewTransition` 不可用时，回退为非粘滞的 WAAPI FLIP 变换。
- **局部区域快照（`target`、`scope`、`resizeTarget`）**：传入 `target`（`scope` 默认 `'auto'`，也可显式指定 `'region'`）时，仅在该容器范围内分配 `view-transition-name: nv-page` 并停用 `root` 快照。外围导航栏、工具栏与侧栏保持实时可交互，且 `::view-transition-group(nv-page)` 会继承容器圆角（`--neoverse-page-transition-radius`）。使用 `scope: 'document'` 且传入 `background: 'surface'`（或整体预设）时可对整页根视图做快照。相邻页面自然高度不一致时，`resizeTarget`（默认随 `target`）会在切换快照就绪后平滑伸缩容器高度。
- **遮罩与模糊回退**：缺少 `CSS.registerProperty` 时，View Transitions 中的 `curtain` 自动回退为 `glide`，`iris` 自动回退为 `depth`。在 `no-filter` 或 `@supports not (filter: blur(1px))` 下，`veil` 与 `depth` 会跳过模糊通道。
- **WAAPI 局部回退**：不支持 `document.startViewTransition` 且传入 `target` 时，通过 Web Animations API（`fill: 'none'`）播放新页面入场，确保结束后不锁定极光玻璃的背景采样。

### 粒子消散（`variant: 'dissolve'`）

1. **WebGL 粒子消散**——显式选择 `variant: 'dissolve'`，或在未指定 `variant` 且存在 `dissolveSource` / `[data-neoverse-dissolve]` 时启用。浏览器支持 WebGL2 时，离场元素会被光栅化（可用时使用实验性 HTML-in-Canvas 捕获，否则生成主题色合成尘埃），并在指针透明的全屏画布上侵蚀为细尘；进入区域稍后淡入（`--neoverse-motion-particle-enter-delay/-duration`）。可用 `particleDissolvePresets`（`high` / `medium`）继续调节采样密度。
2. **交叉淡化**——不支持 WebGL2 或设置 `particle: 'crossfade'` 时，回退为 `fade`。
3. **普通更新**——减少动效或无可用的 View Transition 宿主时，直接执行 DOM 更新。

可用 `particle: 'capture' | 'synthetic' | 'crossfade' | false` 强制指定消散管线。

保证：

- **可中断**——新调用会在当前帧跳过正在运行的动画；快速导航从不排队。
- **并行**——动画期间每一层都是 `pointer-events: none`；旧页面仍在过渡时，新页面已可交互。
- **稳定 chrome**——使用 `target` 限定局部区域，或为持久元素指定 `view-transition-name` 避免状态间闪烁。

## 变量参考

| 组 | 值 |
| --- | --- |
| 时长 | `fast` 140ms · `standard` 240ms · `expressive` 420ms |
| 缓动 | `linear` · `standard` · `emphasized` · `accelerate` |
| 距离 | `near` · `mid` · `far`（space-2 / space-4 / space-8） |
| 页面 | `duration` 360ms · `expressive` 520ms · `exit` 140ms · `enter` 240ms · `delay` 120ms · `blur` 8px |
| 粒子 | `duration` 910ms · `enter-delay` 455ms · `enter-duration` 234ms |

架构与贡献说明见 [Neoverse-UI 仓库](https://github.com/SSJ-ZYJ/Neoverse-UI)。