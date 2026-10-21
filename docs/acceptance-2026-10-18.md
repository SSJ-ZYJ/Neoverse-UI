# 2026-10-18 回归、跨平台与消费验收

范围：上一轮统一材质提交（c95d08e）之后的全量视觉回归与截图基线重审、规格断言向共享 Token 与渲染几何对齐、历史深色断言清理、跨平台 CI 准备和消费尺寸核对。以当前工作区源码和构建产物验收，保留本轮开始前的未提交修改。

## 视觉基准重审

用户明确批准以当前页面视觉为新基准。先以更新模式刷新截图，再以校验模式复跑，46 项截图测试在更新后与非更新模式下均通过；有效基线收敛为桌面、移动各 30 张。其中 react-navigation 与 terminal 的 16 张基线与已提交版本一致，其余 44 张（模块区域、按钮按压、展示数据、状态反馈等）按当前材质实现刷新。Badge 状态描边的混合透明度从 medium 降到 quiet 档，随基线一并重审。

同时移除 12 张无测试引用的历史快照：composition、floating-toolbar、scrollbar 的浅深主题 × 桌面/移动组合。删除后全量截图测试仍通过，确认没有规格依赖这些文件。

## 规格断言对齐

回归中把视觉规格从历史硬编码值迁回共享 Token 与渲染几何：

- Design Lab 弹层与按钮按压的模糊度改为从 `--neoverse-material-blur(-md)`、`--neoverse-control-button-blur-scale` 推导，不再断言固定 10/12px；`glass-scroll` 同步按层级 Token × 按钮缩放系数校验。
- Dock 材质断言跟进统一的 `glass-elevated` 层级（含 React navigation-runtime）；边缘按“遮罩 + 背景采样”验证（`mask-image` 而非独立渐变），边缘滤镜与 `--neoverse-material-edge-filter` 一致；WebGL 渲染时画布必须可见，`dark-glass-parity` 按渲染器分支校验 CSS 回退分层。
- 分段控件高度、选项内边距与尾部内边距改为从 control-surface Token 解析，几何断言计入 Dock 演示缩放对 DOMRect 的影响；内嵌语言控件刻意矮于导航项，但必须共享垂直中心。
- 表单内嵌控件改为“半透明实心填充”语义：焦点深度由环/阴影表达而不重绘填充，禁用态用弱化文本色（`-webkit-text-fill-color`）表达且不降低透明度；Notice 与 QA 舞台同步按当前实现对齐（共享中性底、无渐变图像）。
- `material-standards` 确认由表格根元素持有背景采样，单元格不再各自创建合成层；`playground-material-usage` 接受 Tooltip 由 `::before` 绘制统一板材、深色按钮按缩放系数降低模糊。
- 密度网格按当前断点重核（materials 1920px 4 列、typography 收窄），模块工具栏回归共享 elevated 层级，浮动 Dock 导航字比限定在 0.7–1。
- `glass-transition` 断言粒子过渡结束后释放临时 `will-change`。

## 历史断言清理

`consumer-sizing.md` 记录过 `control-identity.spec.ts` 的 8 项深色材质断言失败。复核确认这些断言已被 `dock-language-proportions`、`dock-consumer-size`、`button-glass`、`glass-dark-visibility` 四个专项规格取代：旧 Dock 尺寸（1.3 缩放、32px 选项）、glass-subtle 尾部面板与深色填充按钮光学断言移除，`control-identity` 仅保留交互契约。计划文档中的对应待办关闭；没有修改材质规则去迎合旧断言。

## 跨平台 CI

CI 触发扩展到 `dev` 分支推送与手动 `workflow_dispatch`；Linux 与 Windows 作业统一先跑 `release:check`，Linux 再跑全量 Playwright 视觉，Windows 安装 Chromium 后定向运行键盘、浮层、主题交互规格（component-interactions、control-identity、dock-language-proportions、react-theme）。本机通过不等于远端 CI 记录，推送后仍需核实真实执行结果。

## 消费尺寸核对

`dock-consumer-size` 以 16px 根字号的独立消费文档与 Playground 比对 Dock 几何，浅深主题 × 标准/紧凑规格一致，尾部控件不溢出。React `UiBreadcrumb` 的真实产品消费仍为 Pending，本项不改变组件矩阵状态。

## 最终状态

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 截图基线重审 | 46 项截图测试在更新后与非更新模式下均通过 | `tests/visual/snapshots/` 桌面/移动各 30 张 |
| 历史快照清理 | 12 张无测试引用快照移除，复跑通过 | git 工作区删除记录 |
| 断言对齐 | 材质/几何期望迁移到共享 Token 与渲染几何 | `tests/visual/*.spec.ts` |
| 深色断言复核 | 8 项历史失败由专项规格取代，不再阻塞 | `tests/visual/control-identity.spec.ts` |
| 消费尺寸比对 | 独立消费文档与 Playground 一致 | `tests/visual/dock-consumer-size.spec.ts` |
| 跨平台 CI | 配置就绪，待推送后的真实记录 | `.github/workflows/ci.yml` |

以上仍属未提交工作区改动，未执行 commit、版本落盘或 publish。
