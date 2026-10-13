# 2026-10-13 组件验收

范围：UiStatCard / UiTimeline / UiStepFlow、XCA 终端的五条未关闭请求，以及 React UiBreadcrumb / UiDock。以当前工作区源码和构建产物验收，保留本轮开始前的未提交修改。视觉验收由用户指定的 gpt-6-luna / max 子代理完成。

## 真实消费与修复

Neoverse-Slides 的 `packages/slidev-theme-neoverse/layouts/stats.vue`、`steps.vue`、`timeline.vue` 已接入共享 Vue 组件。`slides/tech-share-template/slides.md` 第 7、8、14 页使用 frontmatter 数组供给内容，默认 Markdown 插槽保留页面标题。主题中 Markdown 的段落、列表样式避开共享组件容器，组件字号、材质和连接线由 Neoverse-UI 负责。

首次时间线消费验收发现序号被放进独立时间行，四个条目叠加后遮挡页脚。序号已并回标题；它们不是时间，不再占用 `time` 字段。保持共享组件尺寸，修复后开发页面和生产静态构建均通过页脚边界检查。

XCA 已在 `app/features/terminal/components/TerminalHost.vue` 组合 UiTerminalSurface / UiTerminalTranscript / UiTerminalLine，命令输入使用 UiTerminalPrompt。旧 UiInput terminal 外观已移除，输入请求按当前透明原生编辑器组合验收，不恢复旧变体。业务命令、历史、补全选择和入场动画继续由 XCA 负责。

终端验收发现真实 resize 缺陷：1440px 下 transcript metrics 为 `scrollHeight=1429, clientHeight=390, scrollTop=1039`，缩至 390px 后为 `1500,317,1111`，持续离底 72px。原生滚动锚定的 scroll 先于 ResizeObserver 到达，关闭了 `shouldFollow`；随后 XCA 的 session 列宽更新再次重排行内容。只抑制首个布局 scroll 的诊断实验恢复到底，确认不是缺少 observer 通知或读历史操作。

UiTerminalTranscript 现在记录最近滚动时的容器尺寸，仅在原本跟随且尺寸改变时保留跟随；读历史仍按原有规则停止跟随。没有增加超时器或事件监听。消费者最小回归 `tests/e2e/terminal-resize.spec.ts` 修复前稳定失败（72px），同步并重建后通过（≤3px）；同时验证草稿不丢失，以及主动读历史后放大仍保持顶部。临时探针已移除，新增 patch Changeset。

React 运行态 fixture 新增 Breadcrumb 和 Dock：默认与自定义条目渲染、当前页面更新、原生链接键盘导航、compact 切换、尾部控件状态及动态移除、`as="div"` 组合。没有增加新公共组件 API。

## 已完成的功能检查

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| React 导航浏览器功能 | 8/8 通过，浅深主题 × desktop/mobile | `tests/visual/navigation-runtime.spec.ts` |
| Slides 真实开发消费 | 12/12 通过，3 布局 × 浅深 × 1440/390px | 消费者 `scripts/check-presentation-data.ts` |
| Slides 生产静态消费 | 12/12 通过，同一布局/主题/视口矩阵 | 设置 `NEOVERSE_SLIDES_DATA_DIR` 后运行同一脚本 |
| Slides 元数据、类型和生产构建 | `check:slide tech-share-template`、`check`、`build` 通过 | 完整门户及 2 个已发布文稿的静态输出验证 |
| XCA 类型与生产构建 | `ui:sync`、Nuxt typecheck、生产 build 通过 | 本地共享包同步后验证 |
| XCA 终端边界与单测 | 边界通过，17/17 单测通过 | `check:terminal`、`bun test app` |
| XCA resize 最小回归 | 修复后 1/1 通过 | 消费者 `tests/e2e/terminal-resize.spec.ts`；不以发送新命令绕过 resize |

Slides 消费脚本使用 Slidev 的已保存 Wake Lock 偏好在 headless 浏览器中关闭屏幕唤醒，不忽略页面错误。Nuxt 检查遇到本机代理环境时，仅清空当前检查进程的大小写 HTTP_PROXY / HTTPS_PROXY / ALL_PROXY，不修改项目或系统设置。

## 视觉与最终门禁

新增 fixture 的严格可选字段和 Vue 模板绑定问题已在本轮修复。最终 UI 构建之后，以下 6 份持久 Playwright spec 合并运行，24/24 用例通过，没有更新截图：

- `tests/visual/presentation-data.spec.ts`：2/4 指标、2/10 时间线、2/6 步骤，长文本、窄容器、节点/连接线几何，Light/Dark/System Light/System Dark；desktop/mobile 共 8 张基线。
- `tests/visual/terminal-surface.spec.ts`：共享终端外壳和原生输入、ghost suggestion，浅深主题 × desktop/mobile 共 4 张基线；只隐藏动态时间文字，不隐藏被验收的组件。
- `tests/visual/terminal-composition.spec.ts`：输出自动跟随，主动查看历史时新增输出不抢滚，原生编辑语义。
- `tests/visual/terminal-resize.spec.ts`：缩窄后的重排与继续输出、主动阅读后放大并继续输出，desktop/mobile 均通过。
- `tests/visual/navigation-runtime.spec.ts`：React 导航行为 8 项。
- `tests/visual/react-navigation-visual.spec.ts`：React 导航常规、焦点、compact 且无尾部控件状态，浅深主题 × desktop/mobile 共 12 张基线。

上述新增 24 张 UI 基线均由 luna/max 子代理审阅，合并复跑完全匹配。Slides 真实消费者另有 12 张浅深主题 × 1440/390px 截图审阅，步骤连接线、时间线轴线及卡片边缘无裁切或溢出。Slides 的手机页面按既定固定 980px 画布缩放，完整呈现 16:9 画面；这不等于把幻灯片正文改为手机重排。

`bun run release:check` 通过：非修改型 Biome、文本/样式/Tailwind 及契约、全量类型、229 项单测、生产构建，以及 8 包干净消费验证。保留既有 `tests/visual/playground-shell.spec.ts:757` 非空断言 lint warning，没有为了消除它修改无关测试。

XCA 新增真实终端截图 5 张已经审阅且无更新复跑通过，存于消费者 `tests/e2e/terminal-visual-acceptance.spec.ts-snapshots/`。最终 `bunx playwright test --workers=1` 无快照更新，71/71 通过（3.9 分钟）。

首次全量运行的两项失败确认为旧测试前提：BOOT_SEQUENCE 只有 6 条日志，第 7 个栅格项是独立进度条；测试改为 6 条日志、进度 100 和进入 branding 阶段。首页当前 `scrollHeight=clientHeight=900`，没有页面滚动范围；页头测试移到真实可滚动的 `/about`，显式确认 `scrollY=200` 后验证原有 floating 宽度、位置与返回顶部行为。没有改变产品来满足旧测试，也没有放宽行为断言。两份定向 spec 9/9 通过，再完成上述全量复跑。

## 最终状态

- 3 个展示组件和 4 个终端基础组件具备真实消费及 release 视觉证据，晋升 Stable；矩阵共 35 个组件，21 个 Stable、14 个 Consumer Validation。
- React UiBreadcrumb / UiDock 的 Runtime 均为 Validated，导航 release 视觉门禁已补齐。Breadcrumb 的 Consumer 仍为 Pending，不因 fixture 通过晋升 Stable。
- 本轮通过 CLI 将 7 条请求移到 delivered，并把代码、测试、真实消费与验收记录写入 resolution。登记共 8 条 delivered、2 条 rejected、1 条 implementing（终端 Token 正式发布条件）。
- Changeset 状态、契约校验与差异检查通过；未执行 commit、版本落盘或 publish。

## 交付边界

`CR-20261010-2A6D0E6E` 的验收条件包含正式发布。当前消费使用本地 `file:` 依赖，本轮不执行版本落盘或 npm 发布，因此这条请求在代码及消费通过后仍保留 implementing。其余请求仅在代码、测试、真实消费与视觉证据齐全后关闭。

React Breadcrumb 的运行态验证不等于真实产品消费；其 Consumer 仍为 Pending。其他表单、浮层、Presence 的 P1 待办、历史 control-identity 深色断言、远端 CI 和真实辅助技术体验不属于本次三个验收批次。
