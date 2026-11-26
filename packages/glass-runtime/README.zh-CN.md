# @neoverse-ui/glass-runtime

[English](README.md)

<!-- Source: packages/glass-runtime/README.md -->
<!-- Source-SHA256: aeb6f0eaf803f0305dc4262e85220319ca675746c238f0d29799cf1fc80f75b7 -->

Neoverse-UI 的共享、可选、方向性极光玻璃（Aurora Glass）边缘增强。极光玻璃是唯一的共享玻璃材质；Light / 轻薄、Standard / 标准与 Immersive / 厚实层级共享同一名称。展示标签从 `@neoverse-ui/tokens` 的 `glassMaterial` 获取；详见[材质标准](../../docs/zh-CN/architecture/material-standards.md)。包与渲染器标识保持稳定。

浅色与深色模式共用 WebGL 边缘合成，在浏览器支持时按比例提亮下方实际颜色。边缘不采样或偏移邻近像素；表面色调、模糊与阴影仍由 CSS 负责。详见[材质标准](../../docs/zh-CN/architecture/material-standards.md#光学与主题)。

不透明度、裁剪与浮层遮挡仍然生效。Light 对左上与右下做适度聚焦；深色按钮保留其聚焦高光。减少透明度会禁用渲染器。CSS 回退使用仅含 alpha 的渐变遮罩与背景亮度。历史 `native` 后端仍是显式 API 选项，但不得把全表面 SVG 位移设为默认，也不得用它进行[修复守则](../../docs/zh-CN/architecture/material-standards.md#glass-修复守则)所述的 Glass 修复。

WebGL 渲染器还识别共享的 Input、Textarea、Select、选择控件与 Disclosure 类，以及 `UiTable`、正文表格与正文 details。它在同一画布上绘制表格外框与可见的内部单元格边框，而 CSS 保留表格唯一的背景滤镜。最后一行的局部下侧高光只走 CSS 边缘路径，避免渲染器外框被第二条薄荷色线重复。浏览器顶层中的 Select 面板使用局部 CSS 边缘场，因为共享画布无法绘制在该层之上。可选的历史 `native` 后端不会把位移滤镜扩展到这些隐式控件、折叠内容与表格表面。顶层弹出层或模态框内的原生文本输入、折叠内容与表格网格保留既有内嵌样式，因为共享画布无法触达它们。

动画跟踪会重绘移动的边缘与遮挡物。仅改变背景位置与纯绘制属性的动效仍留在 CSS；非 Glass、非遮挡物后代上的纯视觉动效（transform、opacity、filter）以及 `::view-transition` 遮罩不会空转边缘重绘。会改变布局的 CSS/WAAPI 动画（包括会推挤相邻 Glass 控件的非 Glass 兄弟元素、`details::details-content` 展开以及 `neoverse-motion-start` 事件）会在整份文档范围内被跟踪，并且活跃动效会绕过被动的 60 fps 滚动与视口缩放帧率上限，使边缘紧贴每一次屏幕刷新。元素 `ResizeObserver` 回调会在绘制前同步重绘，动效结束时必定补绘一帧落定帧。

表面几何通过方向基向量跟踪二维 CSS 变换（`rotate`、`scale`、`zoom`、`transform` 矩阵），而不再使用膨胀的轴对齐包围盒；同时支持百分比圆角与 CSS §4.5 等比收紧圆角，在 `filter: blur(...)` 过渡期间平滑衰减边缘不透明度，避免 `position: fixed` 表面被非包含块的 `overflow: hidden` 祖先错误裁剪，并将原生顶层元素（`:popover-open`、`:modal`、离场中的 `overlay: auto`）排除在文档 WebGL 画布之外但继续作为遮挡物保留，防止在局部 CSS 边缘背后画出延迟的双重边缘。

## 按需分配光学资源

`mount()` 只建立观察。首个可绘制且符合条件的 Glass 表面出现时才分配共享画布、WebGL 上下文、Shader Program 与 Buffer，因此自动表面全部解析为实体的页面不保留光学资源。后挂载的 Glass 表面会触发激活；最后一个符合条件的表面消失后释放画布、上下文、原生 SVG 滤镜与缓存映射，`destroy()` 始终释放。暂停中的渲染器仍会在页面需要时分配画布，但只在 `resume()` 或显式 `refresh()` 时绘制。

## 为页面过渡暂停边缘重绘

`suspend()` 与 `resume()` 是增量式、可选的轻量路径，用于整页位置与不透明度过渡（例如路由滑动）。暂停期间，渲染器保留最后绘制的帧、撤回待执行帧并跳过自动重绘：不进行全文档表面枚举，不执行 `elementsFromPoint` 遮挡探测，也不重绘画布。`resume()` 结束暂停并执行一次完整强制刷新，使边缘、遮挡与主题匹配已落定的 DOM。两者都是幂等的，`mount` / `refresh` / `destroy` 保持既有语义；现有调用方无需修改即可升级。

```ts
// 整页位移/不透明度过渡开始时：
renderer.suspend();
// 过渡落定后调用；同时设置兜底超时，防止后台标签页中
// transitionend/animationend 事件始终不触发：
renderer.resume();
```

安全边界：轻量路径只适用于位置与不透明度变化。冻结帧不跟踪几何，因此暂停期间的任何尺寸、层叠顺序或顶层（popover/modal）变化都需要完整刷新——调用 `refresh()`（暂停期间仍会绘制）或 `resume()`。不要跨缩放表面或打开浮层的过渡执行暂停。减少透明度与 WebGL 上下文丢失在暂停期间仍会释放画布；暂停状态下挂载会延迟首帧到 `resume()`。

保证位于普通 Glass 表面之上、且对指针透明的浮层，可通过 `data-neoverse-glass-occluder="topmost"` 选择启用边缘遮挡。不要把这个标记用在可能位于那些表面下方的浮层上。渲染器每次边缘绘制最多限制为六个遮挡矩形；该标记控制可见性，不采样也不折射背景像素。

每次重绘时，同一滚动区域内的边缘共享祖先裁剪测量结果。下一次重绘会重新测量裁剪边界，避免嵌套滚动时在滚动区域外绘制边缘或留住旧位置的边缘。

浏览器页面缩放与视口尺寸调整遵守常规的边缘重绘频率上限。最后一次尺寸变化仍会排队，重绘时使用最新的几何位置与像素比。根元素的标记值不变时，继续复用调色板缓存。

运行时单测覆盖 WebGL 选择、上下文丢失与恢复、共享画布复用、帧调度与减少透明度切换。Chromium 集成测试检查保留的 CSS 模糊、渲染器所有权以及无 WebGL 回退。独立的 Linux Chromium + SwiftShader 套件记录三种层级、两种主题与四张固定背景上的亮/暗像素差值，用于边缘连续性、角部响应与内部泄漏诊断。它是回归诊断信号，不是已验证的 0.2.0 颜色参考比对，也不能证明空间折射。最终外观、实时背景行为与性能仍需人工渲染验收。

```sh
bun add @neoverse-ui/glass-runtime
```

```ts
import { createGlassRenderer } from '@neoverse-ui/glass-runtime';

const renderer = createGlassRenderer();
renderer.mount();
```

材质规范与运行时说明见 [Neoverse-UI 仓库](https://github.com/SSJ-ZYJ/Neoverse-UI)。