# @neoverse-ui/glass-runtime

[English](README.md)

<!-- Source: packages/glass-runtime/README.md -->
<!-- Source-SHA256: eb1ae1ad36ec31be2e456a01e7574df5c2c8877e9cc8ecf0929a66326b1fa54b -->

Neoverse-UI 的共享、可选、方向性极光玻璃（Aurora Glass）边缘增强。极光玻璃是唯一的共享玻璃材质；Light / 轻薄、Standard / 标准与 Immersive / 厚实层级共享同一名称。展示标签从 `@neoverse-ui/tokens` 的 `glassMaterial` 获取；详见[材质标准](../../docs/zh-CN/architecture/material-standards.md)。包与渲染器标识保持稳定。

Light 使用方向性边缘：着色器混合主题强调色，根据有效不透明度变化色度，并把片段 alpha 上限设为 0.34。浅色画布使用常规合成与发布版的 WebGL 混合因子；大面积表面使用 0.36 / 0.38 / 0.40 的边缘不透明度，不再叠加额外的浅色 alpha 增益去乘层级数值。色度与增益仍是可选乘数，在浅色模式下默认都为 1。

浅色片段保留 30% 的主题混合，其余部分向中性边缘光收敛，因此浅色背景自身的色相不会被高饱和青色带覆盖。Light 保留这一带色方向，但限制其冷色过量：红/绿内容之上的蓝色领先幅度削减 72%，右侧高光保持偏冷，同时避免发布版三倍余量在浅色页面上读成蓝带。该上限只作用于浅色表面；深色合成不变。

这是叠加在背景上的半透明主题色高光，不是对背景的采样或位移图像。它的表观颜色与对比度同时取决于主题强调色和下方像素。深色保留其叠加响应。两种主题共享一块画布；主体色调、模糊与阴影仍由 CSS 负责。

不透明度、裁剪与浮层遮挡仍然生效。Light 对左上与右下做适度聚焦；深色按钮保留其聚焦高光。减少透明度会禁用渲染器。CSS 回退使用仅含 alpha 的渐变遮罩与背景亮度。历史 `native` 后端仍是显式 API 选项，但不得把全表面 SVG 位移设为默认，也不得用它进行[修复守则](../../docs/zh-CN/architecture/material-standards.md#glass-修复守则)所述的 Glass 修复。

WebGL 渲染器还识别共享的 Input、Textarea、Select、选择控件与 Disclosure 类，以及 `UiTable`、正文表格与正文 details。它在同一画布上绘制表格外框与可见的内部单元格边框，而 CSS 保留表格唯一的背景滤镜。最后一行的局部下侧高光只走 CSS 边缘路径，避免渲染器外框被第二条薄荷色线重复。浏览器顶层中的 Select 面板使用局部 CSS 边缘场，因为共享画布无法绘制在该层之上。可选的历史 `native` 后端不会把位移滤镜扩展到这些隐式控件、折叠内容与表格表面。顶层弹出层或模态框内的原生文本输入、折叠内容与表格网格保留既有内嵌样式，因为共享画布无法触达它们。

动画跟踪会重绘移动的边缘与遮挡物。仅改变背景位置的动效仍留在 CSS；被变换或淡入淡出的后代，如果其最近的 Glass 表面在两个轴上都隔离并裁剪，且内部没有嵌套 Glass，也留在 CSS。共享选择指示器（`.ui-control-surface__indicator`、`.ui-navigation-item__indicator`）是限制在自身表面内的装饰内容，因此它们的过渡不会调度边缘帧。未知动效仍被跟踪。隐藏子树不会维持帧循环；可见性与裁剪变更会触发重新求值，包括已经在运行的动画。这些规则不改变边缘着色器。

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