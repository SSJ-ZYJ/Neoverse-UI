# Aurora Glass 测试方案（2026-11-10）

Status: adopted

实施状态：L0/L1 的第一批回归与 L2 浏览器检查已实现；L3 已有 Linux Chromium +
SwiftShader 光学采样、固定场景和 CI smoke。历史 0.2.0 对照、实时背景与硬件 GPU
人工验收尚未实现，不能用结构性阈值代替审美结论。

## L3 实施与实测记录（2026-11-10）

- 新增 `playwright.optics.config.ts`、`tests/optics/glass.spec.ts` 和
  `tests/support/glass-optics.ts`。固定 900×700、DPR 1、单 worker、零 retry；
  每次启动核验实际 WebGL renderer 含 SwiftShader，否则失败。
- 采样 2 主题 × 3 tier × 4 backdrop 的 24 组 lit/unlit 截图；同时隐藏 shared WebGL
  和 chroma canvas 取 CSS 基线。指标记录四边 P10、最大缺口、宽度、RGB、四角强度及中心泄漏；
  保存到测试 `test-results/` 的 JSON，断言失败上传两张截图。
- Linux Arch WSL2、Playwright 1.65.0、Chromium 158 (SwiftShader)、当前工作区构建：
  首次 24/24 通过。代表性 6 组 smoke 每组连续运行 5 次（30/30）通过，P10
  范围 7–31，最大缺口 0px、宽度 P90 至多 2px、中心 P95 为 0。
  这些是**本次测量**，不是跨版本承诺；其他机器上的 SwiftShader 仍需 CI 结果确认。
- 结构性断言加入后，完整 24 组采样与 2 组冷暖背景色响应比较合计 26/26 通过。
  `actionlint` 已通过工作流语法检查；CI 的新增 job 尚未在 GitHub 托管 runner 上实际执行。
- 据此加入保守的结构性门禁：四边 P10 ≥ 2、连续缺口 ≤ 6px、宽度 P90 ≤ 6px、
  中心 P95 ≤ 3、四角可测且 UL+LR 高于 UR+LL。冷暖背景颜色比较单独保留
  在 `@optics-full`，不把颜色差当成空间折射证明。
- `@optics-smoke` 是 CI 中 6 个中性背景用例；完整 `@optics-full` 作为显式运行项目，
  不在每次 PR 中运行。新增 `optics-checks` scope，仅材质相关文件触发；
  共享 `quality-linux` 的已构建资源、独立安装 Chromium，结果纳入 `verify-linux` 聚合。
- 没有复原旧截图基线，也未修改生产 shader、tokens 光学值或默认 Glass backend；
  未提交、推送、发布。

## 本次审查后的实施记录

已经确认 L1 的不少预期能力实际上已有测试，不应为凑矩阵重复添加：

- 现有单元已验证 WebGL2/1、context loss/restore、canvas 复用、表格 cell 的
  observe/unobserve、DPR 上限、滚动合并和帧率限制。
- 本轮新增 painted stroke 规则及 reduced transparency 回退的 L0 契约；
  L1 新增动态 reduced transparency 往返、resize 后 canvas backing store 与 viewport uniform
  同步、`refresh(false/true)` 去重；L2 初步补充共享 canvas、无 WebGL 的 CSS 退路和 stroke。
- 当前运行结果：tokens 材质契约 9/9；glass-runtime 8 个文件、158/158；
  Chromium desktop 新增浏览器用例 3/3。其余 L2/L3 测试仍是计划，不可宣称已通过。
- 保留本地既有的 Playwright 端口调整，不另改已有配置；本轮不提交、不发布。

审查后增加以下约束，避免计划落地时引入虚假的稳定性或额外 CI 成本：

1. **先验证测量方法，再定阈值。** 表格中的 L3 数值只是待标定的候选区间，
   不代表现有 0.2.2 已实测达到。先保存稳定的诊断指标、运行环境与人工对照；
   经 Linux Chromium + SwiftShader 连续多轮测量后才能启用 blocking CI。
2. **明确运行环境。** 光学用例启动后检查实际 WebGL renderer/vendor 确实对应
   SwiftShader；未取得预期上下文必须标记环境失败，不得自动跳过并假装光学通过。
   截图像素读取必须保留原始截图与指标以便复核；渲染、截图和采样只用一种 DPR。
3. **区分采样证明与视觉正确。** `lit-unlit` 的差值可测量渲染层增量，
   不能独立证明空间折射，也无法推导全部背景色响应；应同时保留原图及人工对照。
   光学用例优先测连续性、宽度、溢出与空页可读性这些可量化退化。
4. **CI 精确触发。** 光学门禁只在 shader、glass runtime、光学 token/CSS、
   材质消费者或测试 harness 变化时运行，不因文档修改或无关模块修改执行。
   独立 job 复用 `quality-linux` 的构建产物，且必须进入 `verify-linux`
   的必需聚合结果；无需重复构建或恢复全页 snapshot。
5. **运行分层。** 普通 PR 优先运行 L0/L1/L2 与标定后的代表性 L3 smoke；
   完整 backdrop/tier/theme 参数矩阵放入可手动触发的深度验收。
   故障时保留诊断工件，禁止用自动重试替代确定性。

## 结论

Aurora Glass 的测试分五层：材质契约、runtime 单元、浏览器集成、光学回归、人工验收。
自动化只负责“可量化、可复现”的部分；方向光、边缘连续性、背景色响应和流畅度仍以人工验收为最终结论。

审查前基线（本次改进前的实测）：

- `@neoverse-ui/glass-runtime`：8 个测试文件、155 个用例通过（`vitest run --environment happy-dom`）。
- `tests/e2e/materials.spec.ts`：桌面 Chromium 6 个用例通过（2.7s）。
- 仓库内没有活跃的 live-pixel 测试。`docs/material-standards.md`、`docs/architecture.md` 与
  `packages/glass-runtime/README.md` 仍声称存在 “live-pixel tests” 和 “0.2.0 reference test”；
  这些用例在 `2602b65` 的测试重构中随 20 个 `tests/visual/glass-*` spec 一起删除。
  本方案恢复其中稳定、可量化的子集，并同步修正文档。

## 目标

1. 每次改动都能回答四个问题：真实 backdrop blur 是否保留、四边和四角是否有连续细边、
   颜色是否响应背景、交互和滚动是否仍然流畅。
2. 不引入第二套材质实现，不把禁止的修复路径重新设为默认。
3. 光学测试只做回归“跳闸”，不替代人工验收，不保存整页截图基线。

## 非目标

- 不做跨平台像素基线，不恢复 225 张截图快照或 `test:visual:update`。
- 不自动化审美判断，不把单个灰底、单张截图或单个阈值当作外观正确的证明。
- 不在 Windows/macOS 硬件 GPU 上建立权威光学阈值；权威环境固定为 Linux Chromium + SwiftShader。
- 不测试 `backend: 'native'` 的视觉效果；它只保留 API 兼容性单元测试，不得成为默认路径。

## 覆盖矩阵

| 维度 | 取值 | 说明 |
| --- | --- | --- |
| tier | `subtle` / `elevated` / `immersive` | 三层都必须出现；不是三种材质名 |
| theme | light / dark | 两种合成模型不同：light 为 normal + 方向色，dark 为 overlay |
| surface | 卡片、按钮、Input/Textarea/Select、Table、Disclosure、Select panel、SegmentedControl | 覆盖显式 tier、隐式控制面、表格网格、top layer 特例 |
| runtime | WebGL2、WebGL1、无 GL、context lost、reduced transparency、forced colors、`native` 兼容路径 | 默认只验证 WebGL；`native` 不进入光学门禁 |
| backdrop | 中性灰、浅色、冷渐变、暖渐变、高对比图案、深色空页、实时 DOM/canvas | 至少 4 种进入自动光学；实时内容留给人工 |
| viewport | 1920×1080 desktop、390×844 mobile、DPR 1/2 | 光学固定 900×700、DPR 1 |
| input | hover 可用/不可用、reduced motion、forced colors | 状态反馈仍需保留；玻璃本身不因 reduced motion 关闭 |

不做全笛卡尔积：行为用例按“主题 × 适配器”选取代表面；光学用例固定
3 tier × 2 theme × 4 backdrop，其余维度用单个代表值。

## L0 材质契约

工具：`bun test`（`@neoverse-ui/tokens`）与 `bun run check:contracts`。
目标：在打开浏览器之前拦住第二套光学配方、主题重定义 tier、默认路径切换。

| ID | 用例 | 断言 | 位置 |
| --- | --- | --- | --- |
| GL-C01 | 三个 tier 的 blur/alpha/saturation 精确且单调 | 12/18/24px、15/20/30%、132/145/165% | 已有：`packages/tokens/src/material-standards.test.ts` |
| GL-C02 | 主题只改 tint，不改 tier 光学 | light/dark 不得定义 `material-glass-*-filter/transparency` | 已有：同上 |
| GL-C03 | 适配器接受三 tier 并保留 `none` | Vue/React preset 联合类型 | 已有：同上 |
| GL-C04 | 组件和适配器只消费共享角色 | 无本地数字 blur/alpha、无 `rgb()/hsl()` 半透明、无 `opacity: 0.x` | 已有：`scripts/check-material-standards.ts` |
| GL-C05 | painted stroke 契约 | 默认 `0 0 transparent`；dark 解析为强边框 + 顶部 catch；选择器排除 `.ui-button` | 新增：tokens 测试 |
| GL-C06 | painted stroke 合成顺序 | 普通路径、`[data-neoverse-glass-renderer]` 路径、reduced transparency 路径都把 stroke 放在阴影/高光之前 | 新增：tokens 测试 |
| GL-C07 | reduced transparency / forced colors 回退 | 基础 tint、`filter: none`、无 `backdrop-filter`；语义字段仍不透明 | 新增：tokens 测试 |
| GL-C08 | 默认路径禁止 repair 捷径 | 默认 `backend` 不是 `native`；默认输出不含 `backdrop-filter: url(`、截图/capture 层、替换 body blur | 新增：源码静态断言 + review checklist |
| GL-C09 | 公开名称与变量不变 | `glassMaterial`、`cssVariables.material.glass.*`、`glass-*` preset | 已有：`packages/tokens/src/index.test.ts` 与 release smoke |
| GL-C10 | 文档与测试事实一致 | 光学套件落地后更新 material-standards、architecture、README 的 “live-pixel tests” 表述 | 新增：文档改动 |

## L1 runtime 单元

工具：`bun run --filter @neoverse-ui/glass-runtime test`，happy-dom + fake GL。
现有 155 个用例已覆盖：WebGL2/1 选择、单 canvas、canvas 复用、context loss/restore、
DPR 上限、surface 发现与 `inherit`、segmented/tooltip/table 几何、裁剪、遮挡采样与 6 个上限、
light/dark uniform、主题切换、luminance 回退、scroll 合并、rAF 16ms 延迟但绝不丢弃、
mutation 相关性、动画跟踪、隐藏子树、reduced transparency 预检、native backend 所有权。

新增缺口：

| ID | 用例 | 断言 |
| --- | --- | --- |
| GL-U01 | reduced transparency 运行时切换 | 初始挂载 → 切到 reduce：canvas/probe 移除、renderer 属性恢复、无残留 rAF；切回 no-preference：恰好重建一个 canvas，不重复监听 |
| GL-U02 | 窗口 resize 更新 backing store | `innerWidth/innerHeight` 变化后 canvas.width/height 跟随 DPR 上限，viewport uniform 更新，只排一帧 |
| GL-U03 | DPR 1 / 1.5 / 2 / 3 | backing store 取 `min(dpr, 2)`；非法或非有限值回退到 2；uniform 与 canvas 尺寸一致 |
| GL-U04 | `refresh(false)` 与 `refresh(true)` | 场景签名不变时 false 去重；true 强制重绘；两者都不重建 program |
| GL-U05 | context lost 期间的 reduced transparency | 不激活新 canvas；restore 后仍遵循 reduce 状态 |
| GL-U06 | 动态新增/移除 table cell | ResizeObserver 只观察可见 cell，移除后 unobserve，不重复 observe |
| GL-U07 | painted stroke 属性不改变渲染所有权 | 只改 CSS 阴影，不产生额外 canvas、不改变 draw 数量 |

## L2 浏览器集成

工具：Playwright Chromium（`tests/e2e`）。新增 `tests/e2e/glass-runtime.spec.ts`。
这些用例不读取像素，只验证真实浏览器里的生命周期、回退和 CSS 接线。

| ID | 用例 | 断言 |
| --- | --- | --- |
| GL-B01 | 默认挂载 | `html[data-neoverse-glass-renderer="webgl"]`；恰好 1 个 `[data-neoverse-glass-renderer-canvas]`；fixed、全视口、`z-index: 2147483646`、`pointer-events: none`、`aria-hidden`；无 native filter defs |
| GL-B02 | 主题切换不重建 | 切 light/dark 后 canvas 仍是同一节点；`mix-blend-mode` normal ↔ overlay；tier `backdrop-filter` 与 body blur 不变；canvas 数量始终 1 |
| GL-B03 | 无 WebGL 回退 | init script 让 `getContext('webgl'/'webgl2')` 返回 null：无 canvas、无 renderer 属性；CSS `::before` 方向场仍存在；组件 blur 保持 |
| GL-B04 | 真实 context loss/restore | 用 `WEBGL_lose_context`：loss 后 canvas 隐藏、CSS 仍可读；restore 后恰好 1 个新 canvas，属性恢复 |
| GL-B05 | reduced transparency 运行时切换 | 可变的 `matchMedia` shim：开启后 canvas 移除、tier 填充变不透明、`backdrop-filter: none`；关闭后恰好 1 个新 canvas |
| GL-B06 | scroll 后 canvas 不漂移 | canvas 保持 fixed；滚动前景 surface 后仍只有 1 个 canvas；滚动位置与 edge 对齐由 GL-O08 验证 |
| GL-B07 | top layer Select panel | panel 带 `data-neoverse-glass-edge-pass="css"`；打开面板后共享 canvas 不覆盖 panel；关闭后恢复 |
| GL-B08 | painted stroke 实际 CSS 路径 | 带属性 surface 的 `box-shadow` 首项为 stroke；无属性时 stroke 为透明；`.ui-button` 被排除；reduced transparency 仍保留 stroke |
| GL-B09 | forced colors | `emulateMedia({ forcedColors: 'active' })`：无 backdrop filter，语义填充不透明，文本可见 |
| GL-B10 | 两个适配器共用渲染器 | Vue `/frame#materials` 与 React fixture 都出现 tier 滤镜；各自文档最多 1 个 canvas |
| GL-B11 | reduced motion | `reducedMotion: 'reduce'` 下玻璃仍挂载；不依赖 CSS 动画才能显示边缘 |

## L3 光学回归

工具：独立 `playwright.optics.config.ts`，只跑 Linux Chromium + SwiftShader。
新增 `tests/optics/glass.spec.ts` 与 `tests/support/glass-optics.ts`。

### 采样方法

1. 打开 `/frame?theme=<theme>&lang=en#materials`，等待 renderer 属性和 canvas。
2. 隐藏 `#app`，注入固定 probe：绝对定位 surface（默认 320×180、24px 圆角）和不透明 backdrop；
   保留 renderer canvas（`position: fixed`、最高 z-index）。
3. 用 `requestAnimationFrame` 两帧 + `expect.poll` 等待边缘稳定，不用固定 sleep。
4. 截取 probe 区域；在页面内用 `createImageBitmap` + `OffscreenCanvas` 解码，返回指标，
   不新增 PNG 解码依赖，也不保存截图基线。
5. 隐藏 `[data-neoverse-glass-renderer-canvas]` **和** `[data-neoverse-glass-chroma-canvas]`
   再截一次，得到 CSS/背景基线；`lit - unlit` 差值只度量 WebGL 与 chroma 的贡献，
   避免背景明暗和主题色干扰。
6. 每个用例只保留失败时的截图与指标 JSON 到 Playwright output。

### 指标与初始阈值

以下阈值为待标定的候选值，尚未在固定的 Linux Chromium + SwiftShader 环境中
形成可复现的基线。完成实际采样与人工验收后才能作为 CI 门禁；后续修改阈值也必须
重新人工验收，不能只改断言。

| 指标 | 采样 | 初始阈值 | 防护对象 |
| --- | --- | --- | --- |
| 边缘可见 lift | 每条边取中段 60%，垂直扫描 ±5px，逐点取最大通道差；取 P10 | light ≥ 8，dark ≥ 12 | 边缘消失、只剩 CSS 灰线 |
| 连续性 | 同上，统计 lift < 2 的连续缺口 | 最大缺口 ≤ 6px，四边 P10 达标 | 半圈消失、断角 |
| 边缘宽度 | 沿法线统计 lift ≥ 2 的像素数 | ≤ 6px；距轮廓 ≥ 4px 的内部 Δ ≤ 1 | 粗白边、整面发亮 |
| 角部强调 | 24×24 角区平均 lift | UL、LR 各自 ≥ max(TR, BL) × 1.5（light）/ × 1.2（dark）；四角均 > 0 | 只剩两个角、其他角消失 |
| 蓝色偏色 | 右边中段 lit-unlit 平均 RGB | `blue > 0` 且 `blue ≤ max(red, green) × 2` | 浅色页面蓝带回归 |
| dark 0.2.0 参照 | 300×180 面板，gain=1、opacity=0.24，8 个锚点（四边中点 + 四角） | 与参考 RGB 最大通道误差 ≤ 3 | dark 响应被重写 |
| 背景响应 | 同一 surface 在冷渐变/暖渐变上的边缘平均 RGB | 至少一个通道差 ≥ 3（标定后固定） | 固定白色/主题色高光冒充采样 |
| painted stroke | 有/无 `data-neoverse-glass-edge-stroke` 的同一 dark surface | 四边峰值 delta ≥ 10，内部 = 0 | 空页轮廓不可读、stroke 被覆盖 |
| 空页可读性 | dark、空页面、window 锚定 surface | 四边都有可见轮廓，中心无额外亮带 | 去掉 backdrop 后消失 |

### 用例

| ID | 用例 | 断言 |
| --- | --- | --- |
| GL-O01 | light 三层在中性灰、冷渐变、暖渐变上都有方向轮廓 | 每 tier 的四边 P10 达 light 阈值；不只测单一灰底 |
| GL-O02 | light 右缘保持冷向但不形成蓝带 | 灰底 right-edge 满足 `blue ≤ max(red, green) × 2` |
| GL-O03 | dark 在灰色和浅色 backdrop 上保持 0.2.0 参照 | 8 个锚点误差 ≤ 3；两 backdrop 都跑 |
| GL-O04 | 边缘窄、中心不被采样场覆盖 | 边缘宽度 ≤ 6px；内部 Δ ≤ 1 |
| GL-O05 | 四角连续且 UL/LR 更强 | 角部比例达标；四边都有非零 lift；最大缺口 ≤ 6px |
| GL-O06 | 边缘颜色随背景改变 | 冷/暖背景下同一 surface 的边缘 RGB 有可测差异 |
| GL-O07 | 遮挡：覆盖区不画，暴露区保留 | pointer-events auto/none、`topmost`、scrollTop 0/24 四组；覆盖区 Δ ≤ 2，暴露区 Δ > 2 |
| GL-O08 | scroll 后边缘跟随 surface | 新位置 P10 达标；旧位置无残留边缘；只截全视口，不截元素，保留 compositing 路径 |
| GL-O09 | painted stroke 在 dark 空页可读 | 四边 delta ≥ 10，内部 = 0；无属性时 delta = 0；按钮排除 |
| GL-O10 | reduced transparency 光学回退 | 无 canvas；tier 填充不透明、无 blur；stroke 保留；文本对比度不下降 |
| GL-O11 | 实时 DOM/canvas 背景 | 边缘颜色随 canvas 内容相位变化；此项允许以诊断 artifact 记录，正式门禁由 O06 承担 |

## L4 人工验收与性能

人工验收是光学结论的唯一权威。每次改 shader、renderer 调度、材质 token、边缘 CSS、新增 tier
都必须执行并记录到 `.agents/notes/archives/glass-acceptance-<date>.md`：

- 记录 commit、浏览器版本、OS/GPU、viewport、DPR、缩放、主题。
- light/dark × 3 tier × 代表控件（卡片、按钮、Input、Table、Disclosure、Select panel、SegmentedControl）。
- 背景：中性灰、浅色、冷/暖渐变、高对比图案、实时 DOM、canvas/video、空页。
- 操作：滚动、resize、主题切换、打开/关闭 overlay、reduced transparency、forced colors、hover/press/focus。
- 同时检查 body blur、边缘连续性、方向角强调、颜色响应、交互延迟；不以 computed style 代替视觉检查。
- 任何一项缺失都必须写明“未验证”，不能用自动化通过替代。

性能：

- 单元层守住 16ms frame cap、请求不丢弃、场景签名去重、滚动合并；这些是硬门禁。
- 真实流畅度使用 Playground FPS overlay 与 DevTools Performance，在有硬件 GPU 的机器上记录；
  CI 的 SwiftShader 结果不作为性能结论。至少覆盖 24 个 surface 的 5 秒滚动和一次主题切换。
- 诊断指标：p95 frame ≤ 33ms、无 > 100ms long task。仅作为记录和明显回归信号，不做跨机器硬阈值。

## 运行方式

```sh
bun run --filter @neoverse-ui/glass-runtime test
bun run --filter @neoverse-ui/tokens test
bun run check:contracts
bun run test:e2e
bun run test:glass:optics
```

新增脚本：

```json
{
  "test:glass:optics": "bun run build && playwright test --config=playwright.optics.config.ts"
}
```

本地注意：Playwright 默认使用 3200 段；Playground 在该端口被占用时会自动换端口，
但 Playwright 仍等待配置的 URL。同时设置 `NEOVERSE_UI_PLAYWRIGHT_PORT` 和 `PORT`
到一个空闲端口，或显式关闭占用进程。

`playwright.optics.config.ts`：

- `testDir: './tests/optics'`，`workers: 1`，`retries: 0`，避免多个 WebGL context 争用和重试掩盖抖动。
- 仅 Chromium；`launchOptions.args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']`。
- viewport 900×700、`deviceScaleFactor: 1`、`reducedMotion: 'reduce'`。
- 不复用默认 `playwright.config.ts` 的 desktop/mobile projects，避免移动端重复跑光学。

CI：

- 现有 `browser-linux` 分片继续跑 `tests/e2e/glass-runtime.spec.ts` 与 `materials.spec.ts`。
- 新增 `glass-optics-linux` 作业，依赖 `quality-linux` 并复用现有构建产物，
  仅由光学相关路径的 scope 输出触发；失败时上传 `test-results/` 中的指标 JSON
  和截图，并纳入 `verify-linux` 聚合门禁。该作业与交互分片分离，
  避免一个光学回归拖慢所有 e2e。
- cross-browser 只加入 CSS/无 WebGL 回退 smoke（Firefox/WebKit 不保证 WebGL），不加入光学阈值。
- Windows 运行 `glass-runtime.spec.ts` 的非光学部分；光学权威仍在 Linux。

## 实施顺序

1. L0 契约与 L1 新增单元用例：先补 painted stroke、运行时 reduced transparency、resize/DPR、`refresh(false)`。
2. L2 浏览器集成：挂载、主题、回退、context loss、forced colors、适配器。
3. 光学 harness：固定 probe、lit/unlit 采样、指标函数；先落 O01/O03/O04/O09 并人工标定阈值。
4. 补齐 O02/O05/O06/O07/O08/O10；O11 先做诊断 artifact。
5. CI 接入、文档事实修正、人工验收记录模板。

## 验收标准

- `bun run test`、`bun run test:e2e`、`bun run test:glass:optics`、`bun run check:contracts` 全绿。
- 光学测试在 Linux Chromium + SwiftShader 连续 5 次运行结果一致；无重试依赖。
- 未提交任何整页截图基线；失败时只产物化当次指标与截图。
- 三层 tier、两种主题、至少四种背景的自动断言存在；四边和四角连续性有量化证据。
- 人工验收记录包含实际候选、实际环境、实际缺失项；没有“仅单元 mock 通过”的结论。
- 文档不再声称仓库里不存在的测试；`docs/material-standards.md` 的描述与实现一致。

## 风险与约束

| 风险 | 处理 |
| --- | --- |
| 截图指标只能证明“有差异”，不能证明“好看” | 人工验收仍是最终结论；自动阈值只做回归跳闸 |
| SwiftShader 与真实 GPU 的 AA/色差 | 权威环境固定 SwiftShader；真实 GPU 结果只做人工参考 |
| chroma canvas 残留污染 lit/unlit 对照 | 基线截图同时隐藏 renderer canvas 与 chroma canvas |
| 固定 sleep 造成抖动 | 两帧 rAF + `expect.poll` 稳定条件；动画截图用 `animations: 'disabled'` |
| 阈值被用来“修好”失败测试 | 阈值修改必须附人工验收；禁止只改断言、禁止按平台维护多套基线 |
| 光学套件重新膨胀成 20 个 spec | 上限 11 个光学用例；新增用例必须对应一个已发生的回归或 repair guardrail |
| 性能门禁在 CI 上误报 | 性能只做人工/诊断，硬门禁保留在确定性单元调度测试 |