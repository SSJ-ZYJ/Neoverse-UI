# 2026-11-14 Dock 合成层指示器与 Glass Runtime 轻量刷新验收

Status: historical

对应需求：`CR-20261114-0769801C`（UiDock 共享选中指示器合成层动画）、
`CR-20261114-19A2E5DE`（GlassRuntime 页面级位移过渡轻量重绘/暂停接口）。
本轮在 `dev` 工作区实施，未提交、未推送、未发布；消费者 Neoverse 以本地 `file:`
依赖同步打包产物验收，发布另行处理。

## 实施结论

两条需求均为增量变更，不改变既有公共契约：

- UiControlSurface 共享指示器由 `left/top/width` 过渡改为「提交几何 + transform
  位移缩放」。首次测量直接写入 left/top/width/height；后续切换保持提交基线，仅写
  `translate(...) scale(...)`，由 CSS 在合成层插值；`transitionend` 一次性提交目标
  几何并清空 transform（提交期间临时关闭过渡并强制一次样式 flush，避免回弹）。
  reduced-motion 或消费者将时长归零时直接提交目标几何，无飞行。Vue 与 React 适配
  层镜像同一状态机。
- GlassRuntime 新增 `suspend()` / `resume()`：暂停期间保留上一帧、撤回待执行帧、
  跳过自动重绘（不做全文档枚举、不做 `elementsFromPoint` 遮挡命中、不重绘画布）；
  `resume()` 结束暂停并做一次完整强制刷新。两者幂等；`mount/refresh/destroy` 语义
  不变；显式 `refresh()` 在暂停期间仍会重绘（尺寸/层级/top-layer 变化的逃生口）。
  WebGL 与历史 native 后端均实现该接口。
- 运行时将共享选中指示器（`.ui-control-surface__indicator`、
  `.ui-navigation-item__indicator`）视为边缘中性内容：其过渡不再调度边缘帧，其
  style 变更不再计入场景 mutation。这是 Dock 指示器位于 glass-elevated 容器内却
  不触发整场景逐帧重绘的关键。

安全边界：轻量路径仅适用于位置/透明度变化；尺寸、层级、top-layer（popover/modal）
变化仍需完整刷新。文档见 `packages/glass-runtime/README.md` 与
`docs/material-standards.md`、`docs/architecture.md`。

## 单元与浏览器验证

- glass-runtime 166 项通过（含新增 8 项：指示器运动不调度边缘帧、suspend 保留帧
  且 resume 一次刷新、suspend 先于 mount 延迟首帧、暂停期间显式 refresh 仍重绘、
  幂等、suspend 撤回待执行帧且 destroy 清除暂停、reduced-transparency 暂停期间仍
  释放画布；native 后端 suspend/resume 1 项）。
- Vue 99 项、React 48 项通过（含新增指示器 transform 飞行/提交、reduced-motion
  直接提交、SSR 隐藏指示器契约）。
- 浏览器（desktop + mobile，Chromium）：`tests/e2e/navigation.spec.ts` 与
  `tests/e2e/glass-runtime.spec.ts` 共 32 项通过，重复 3 轮稳定。覆盖相邻项、跨项、
  快速连点、compact 几何、reduced-motion、Vue/React 双适配；指示器飞行期间布局盒
  （offsetLeft/offsetWidth，不含 transform）不变而视觉盒移动，证明合成层动画无逐帧
  布局；suspend 期间画布像素冻结、遮挡探针计数不变，resume 帧与完整刷新帧逐像素一致。
- 门禁：`check:docs`、`check:contracts`（materials/component/parity/requests）、
  `lint:language`、`lint:style`、`lint:tailwind`、改动文件 `biome lint` 均通过。

## Neoverse 真实消费验收（/projects → /focus → /pulse）

消费者 `app/app.vue` 在 `route-forward` / `route-back` 整屏横滑起点调用
`glassRenderer?.suspend()`，在 `settleStageAfterEnter` 与 1500ms 兜底计时器调用
`resume()`；主页往返涉及缩放/相机编排，不走轻量路径。本地 `file:` 依赖 +
`scripts/sync-consumer.ts` 同步打包产物，dev server（localhost:3006）实测。

每轮导航采集 800ms 窗口，3 轮 × 3 路径取均值：

| 指标 | 基线（npm 0.2.2，逐帧渲染） | 本轮（suspend 轻量路径） | 对照（禁用 WebGL，无渲染器） |
| --- | --- | --- | --- |
| RecalcStyleCount 均值 | 309 | 56 | 51 |
| elementsFromPoint 探针均值 | 323 | 96（resume 一次性） | 0 |
| LayoutCount 均值 | 24 | 16 | 15 |
| 指示器 transitionProperty | left, top, width | transform | — |
| 指示器落定几何误差 | — | left/top/width 均 0px | — |

结论：轻量路径把渲染器的逐帧开销降到接近「无渲染器」对照水平（RecalcStyle 56 vs
51、Layout 16 vs 15），残留约 96 次探针为 resume 的一次完整刷新（需求要求）。

帧间隔说明：本机 headless Chromium 使用 SwiftShader 软件 WebGL（ANGLE Vulkan
SwiftShader），整页平移两块 backdrop-filter 模糊页面的合成由 CPU 承担。禁用渲染器
的对照仍出现 100ms 最大帧间隔、每轮约 13 帧 >25ms，证明绝对帧间隔下限由软件合成
主导，而非渲染器 JavaScript。因此「不超过 25ms 长帧」的绝对验收在本软件渲染环境
不可达，与渲染器改动无关；渲染器侧的逐帧长任务（消费者此前实测 60–68ms 重枚举/
命中测试）已消除。真实 GPU 硬件上的绝对帧率需另行手动验收。

视觉一致性：落定状态 Dock 截图（深/浅色）基线 vs 本轮像素差仅 0.18% / 最大通道差
5（深）、0.16% / 最大通道差 3（浅）；同一构建强制刷新两次自身的 SwiftShader 噪声
即达 15.8% / 最大通道差 16。前后差异远低于渲染器自身噪声下限，落定外观保持一致。

消费者门禁：`nuxt typecheck` 通过、`check:ui-boundary` 通过、`test:ui-css` 通过、
`biome lint app/app.vue` 通过（`biome check` 的整文件 CRLF 格式提示为仓库既有状态，
HEAD 原文件同样存在，非本轮引入）。

## 未做

- 未提交、未推送、未创建 Changeset、未发布；消费者保留本地 `file:` 依赖用于验收。
- 真实 GPU 硬件的绝对帧率与最终光学外观仍属手动验收范畴。