# UI 现状与后续计划

检查日期：2026-10-09。基线：`dev` 分支，HEAD `c989c13`，包含当前未提交的表单、Overlay、Contract Lab、Glass Runtime 和 CI 改动。本文是工作计划，不改变版本号或组件成熟度。

## 判断

当前应进入“补齐验收、验证消费、再按需求扩展”的阶段。Tokens → Tailwind → Vue/React → Design Lab 的基础已经建立；近期新增能力也已经实现，不宜再次按“缺少 Checkbox / Popover”等旧清单规划。

延续现有 Glass、控件几何、语义 Token 与 Motion 体系。视觉调整以具体组件和状态为单位，避免让卡片材质修改影响 Segmented Control。先解决新能力的语义、降级与消费证据，再评估新组件。

## 审计时基线

来源：`contracts/component-matrix.json`、`contracts/framework-parity.json`、公开导出、Playground 与验证脚本。以下保留初次检查的状态，实施后的结果见文末 P0 执行记录。

| 项目 | 当前状态 | 含义 |
| --- | --- | --- |
| 公开组件 | Vue 28 个，React 20 个 | Consumer Driven 不要求两个框架数量一致 |
| Canonical Shared | 17 个 | 已登记 Vue/React 共享契约 |
| 成熟度 | 14 个 Stable，14 个 Consumer Validation | 矩阵声明；本次未重新验收其他仓库的实际消费 |
| React Runtime | 18 个登记为 Validated | 有真实 DOM fixture；Breadcrumb、Dock 仍为 Pending |
| Visual | 20 个 Release，8 个 Playground | 新能力已有部分模块截图与交互测试，不能把 Playground 状态理解为完全没有浏览器覆盖 |
| 公开包 | 8 个，包含新增 overlay-runtime | README 和发布文档仍主要描述原来的 7 个包 |
| 包版本 | 公开包仍为 0.2.0 | 契约矩阵已面向 0.3.x；下一版本需用 Changeset 明确 |

近期已实现：Checkbox、RadioGroup、Switch、Field；Popover、DropdownMenu；Select 复用 Overlay 定位；表单 validation/readonly；React 运行态交互；Contract Lab；Glass 上下文恢复；Linux/Windows CI 配置。

## 检查结果

| 验证 | 本次结果 |
| --- | --- |
| `bun run release:check` | 通过：非修改型 Biome、lint、契约、类型、203 个测试、构建与 8 包验证 |
| `git diff --check` | 通过 |
| `bunx changeset status` | 失败：公开包已有变更，但 `.changeset` 下没有发布说明 |
| `bunx playwright test` | 248 通过、25 跳过、1 失败；工具栏浅色用例等待资源时超时，全量门禁未通过 |
| 工具栏浅色用例单独重复 | 单 worker 重复 3 次全部通过；耗时 18.1 / 16.5 / 19.6 秒 |

以上是本机自动化证据。未验证远端 CI、npm 发布状态、真实项目中新 API 的消费或辅助技术体验。查看了当前桌面浅深色 Forms 基线图；视觉最终验收仍需逐项审阅目标状态，不以整页截图通过代替状态验收。

## UI 优化方向

当前表单基线的圆角、间距、表面和主题语言已经统一。视觉工作优先围绕可读性与状态表达：

| 观察 | 后续工作 | 验收方式 |
| --- | --- | --- |
| 同页同时展示多个背景 QA 与状态样例，内容较长 | 主页面优先呈现典型用法，把完整 QA 放入可展开区域；独立 frame 保留稳定测试视图 | 能快速找到控件与用法，深链和键盘导航不受影响 |
| 新 Choice controls 的主样例主要展示已选状态 | 补未选、focus、readonly、disabled 与 validation 对照 | 浅深主题、键盘与触控状态分别可辨 |
| 深色 Field 的说明和错误文本位于彩色渐变背景上 | 在中性及渐变背景上测量正常说明/错误文本对比度，再决定是否调整局部语义色 | 记录实际对比度与目标截图，禁用内容单独评估 |
| Popover / Menu 的关闭状态无法体现展开材质和空间约束 | 增加打开态、视口边缘和菜单焦点的独立样例 | 展开态截图与焦点/定位断言互相验证 |

这里的可读性条目是复核方向，不是已确认的对比度失败。无需先改全局 Glass 强度、圆角或品牌色。

## P0：收尾当前实现

先处理浏览器测试稳定性，再完成以下三个批次，每批保留明确的 diff 和验收结果。

### 0. 浏览器资源等待稳定性

全量运行的失败位于 `tests/visual/design-lab.spec.ts:1236`：`page.evaluate(waitForStableAssets)` 超过 30 秒，尚未执行工具栏材质断言。单独重复三次通过，但仍明显耗时。当前只能标记为资源等待/执行耗时的稳定性问题，根因未确认，不能宣称 UI 回归已经修复，也不能以局部复跑代替全量通过。

复现命令：

```sh
bunx playwright test tests/visual/design-lab.spec.ts --project=desktop --grep 'floating toolbar refraction / light' --workers=1 --repeat-each=3
```

后续分别计时页面导航、字体就绪、图片就绪与材质断言，核对离屏资源与加载失败的等待策略；先确认慢点再修改实现，不直接延长超时或更新截图。

验收：解释具体等待原因，完成相关修正后，原用例与完整浏览器门禁通过。25 个条件跳过须保持与桌面/触控能力边界对应。

### 1. 表单语义与消费样例

- 为 Field 明确 description/message 与控件的关联方式。当前 Vue/React 都渲染说明与消息，但没有默认消息 ID 或关联接口；Playground 的错误/只读样例也未建立 `aria-describedby` 关系。
- 明确 Field 的 required/disabled 是展示状态，原生控件的 `required`/`disabled` 仍须落实到控件；让样例真实演示这种组合，避免把展示星号当作必填约束。
- 核对 Checkbox / RadioGroup / Switch 的键盘、readonly、disabled、数值绑定、表单提交和 reset 行为；只对发现的具体缺口增加测试。
- 核对 SSR/hydration 的 ID 与受控/非受控状态，不因框架语法差异强行统一 prop 拼写。

验收：两个框架的标签与说明/错误可被控件关联；只读控件保持值；原生表单提交和 reset 行为有清晰契约；相关浏览器/契约测试通过。

### 2. Overlay 降级与边界

- 保留现有 top layer、Escape、外部关闭、菜单导航和焦点恢复测试。
- 增加强制禁用 Popover API 的浏览器场景，验证固定定位 fallback 的打开、关闭、外部点击与焦点恢复。当前运行时有 fallback 实现，但现有浏览器测试未显式强制进入该路径。
- 核对受控 open、禁用项跳过、连续开关、卸载清理、滚动/resize 和缩放定位。
- 对动态内容尺寸变化与移动端视口变化先复现，再决定是否增加 ResizeObserver / visualViewport 支持；当前运行时主要监听 window scroll/resize。

验收：Vue/React 的原生与 fallback 路径分别通过；Select 不重新引入独立定位算法；关闭与卸载后无残留监听或错误焦点。

### 3. 发布契约与文档

- 更新根 README、Vue/React README、发布文档，列出新增控件和 overlay-runtime，补最小组合示例。
- 扩展 `verify-packages.ts`：干净消费目录直接导入新增表单/浮层组件和 Overlay API，并核对新 CSS。当前脚本已打包第 8 个包，但 smoke import 仍以旧 Action / Presence / Motion 集合为主。
- 为当前公开包变更补 Changeset，明确新增运行时与 Vue/React 依赖的版本关系；规划建议使用 0.3.x，实际 bump 按最终公开契约确定。
- 将非修改型发布检查、Changeset 状态、浏览器回归作为收尾条件；验证新配置的 Linux/Windows 远端 CI 后再记录平台结论。

验收：文档、公开导出、依赖、包消费样例一致；Changeset 状态有效；全部本地检查通过。

## P1：把已实现能力推进到真实消费

| 顺序 | 工作 | 验收产物 |
| --- | --- | --- |
| 1 | 核对 Checkbox、RadioGroup、Switch、Field、Popover、DropdownMenu、Presence、Breadcrumb 的 Release Visual 证据 | 状态级用例与审阅记录；再更新矩阵，避免仅凭模块存在就升级 |
| 2 | 为 React Breadcrumb / Dock 补实际运行态验证 | 导航、属性传递和组合行为得到浏览器验证；按真实消费需要安排 |
| 3 | 从 Neoverse / Neoverse-Doc 的真实设置、筛选或操作场景选择一个表单与一个浮层入口 | 实际项目的构建、交互、主题和无障碍关联证据；这是后续跨仓库任务 |
| 4 | 为成熟度记录可追溯证据 | 指向测试场景、消费路径与验证日期；符合条件后逐项晋升 Stable |

视觉范围优先覆盖新增控件的 default、checked、focus、disabled、readonly、validation，以及浮层 open、边缘定位、菜单选中状态。保留桌面/触控、浅深主题和 reduced-motion / reduced-transparency 覆盖。现有截图更新必须有明确原因和 expected/actual/diff 审阅。

## P2：根据消费缺口扩展

P0/P1 完成后，再更新消费缺口报告，以真实重复场景排序：

| 候选 | 进入条件 | 边界 |
| --- | --- | --- |
| Dialog / AlertDialog | 产品确实需要模态确认或复杂交互 | 与非模态 Popover 分开定义焦点约束、背景 inert 和滚动策略；可复用 Overlay 的合适部分 |
| 完整 Tooltip | 消费方需要自动触发、定位和键盘体验 | 现有 UiTooltipSurface 只是表面能力；新增行为须有独立契约 |
| Toast | 出现重复的短时操作反馈需求 | 先明确队列、关闭、持续时间和 live-region 语义 |
| Tabs / Pagination / 搜索型选择 | 出现多个稳定消费场景 | 按需要新增；现有框架拥有的搜索、Tabs 不因数量目标迁入 Core |

Hero、路由数据、Dock 固定定位、业务卡片内容、MDX 渲染和产品专属动画继续由消费项目负责。下一阶段的成功标准是新能力能被可靠消费，而不是组件总数增长。

## 执行顺序

浏览器等待稳定性 → 表单语义 → Overlay 边界 → 文档/包消费/Changeset → 状态视觉证据 → 实际消费 → 成熟度更新 → 新组件需求评估。

每批采用相关检查；收尾运行完整非修改型检查与浏览器回归。初次审计仅新增计划文档；后续实施结果记录如下。未批准的提交、版本落盘与发布仍不执行。

## P0 执行记录

用户已授权开始执行，并将视觉校验交给 gpt-6-luna / max 子代理。主代理负责本地非视觉实现和检查。

| 项目 | 当前实施结果 |
| --- | --- |
| 浏览器等待稳定性 | 子代理定位到 composition/controls 页外部 Noto Sans SC 字体请求等待；不依赖文字截图的材质/图标几何用例改等渲染器或目标元素。工具栏增加阻塞字体仍能完成材质断言的回归，单项三次均通过（约 0.53 秒/次）；截图仍等待字体就绪，主文档 503 不掩盖为 UI 或字体缺陷 |
| 几何测试前提 | fallback 定位用例按当前位置选择可行滚动方向，并实际改变桌面/移动端宽度；共享导航指示器用例等待标签实际使用的字体与布局稳定，保留原 1.5px 对齐要求，四次并发定向复跑通过 |
| Field | Vue scoped slot / React function children 显式提供 controlAttrs；说明/消息有 SSR 稳定 ID，绑定原生 required/disabled；公开类型和共享契约已登记 |
| 框架兼容范围 | Vue peer 调整为 >=3.5，匹配 Field 与选择控件使用的 useId；版本号没有修改 |
| 受控 Overlay | 单测复现 Escape 隐藏面板但 open=true/aria-expanded=true 的分裂状态，修复后重新同步父级状态；React 卸载清理捕获实际面板 |
| Switch 原生状态 | 子代理复现 React 非受控表单 reset 后 checked=true、aria-checked=false；移除重复的 ARIA 状态，直接使用原生 checkbox checked 语义，补 SSR 回归用例 |
| 边界样例 | contract-fixtures=1 下提供拒绝关闭、卸载、菜单禁用项、readonly、FormData 与 controlled/native reset 场景，默认页面布局不变 |
| 文档和包 | 根/Vue/React README、表单/Overlay/发布契约已更新；干净包消费增加新组件、公开类型、Overlay API 与 CSS |
| Changeset | 已补；状态有效，建议 shared form/overlay 包 minor、Glass Runtime patch；内部依赖的后续 bump 由 Changesets 计算 |
| 非视觉门禁 | 最终 release:check 已通过，格式/lint/类型/契约、210 个单测、构建与 8 包干净消费验证通过；Changeset 状态与 git diff --check 均通过 |
| 浏览器与视觉 | gpt-6-luna / max 子代理完成完整门禁：318 项中 293 通过、25 条件跳过、0 失败；36 个截图匹配通过，新增 44 个交互用例在 desktop/mobile 两项目全部通过；本轮未更新截图 |

最终完整浏览器命令为 `bunx playwright test --output <isolated temp>`，2 workers，耗时 5.1 分钟。覆盖 desktop（1920×1080）与 mobile/touch（390×844）的浅深主题。25 个跳过项保持既有项目边界：desktop 跳过 2 项触控密度/紧凑移动布局；mobile 跳过 23 项桌面视口、缩放/几何、hover/键盘焦点与粒子切换场景，均非资源失败或新增跳过。

截图证据包含 8 个模块 × 浅深主题 × desktop/mobile 的 32 项匹配，以及 4 项按钮按压 glow；交互证据覆盖 Field 关联与原生约束、强制 fallback 的 Popover/Menu/Select、键盘/焦点、禁用项、滚动/resize、readonly/FormData/reset、拒绝受控关闭与卸载清理。工作区已有的 12 张 dirty 预期图未由本轮修改，完整匹配以这些既有基线为准。相关新增组件仍缺独立的组件状态视觉与真实消费验收，矩阵 Visual 保留 Playground。

P0 本地实施与门禁已完成。P1 的跨项目真实消费、远端 Linux/Windows CI 与辅助技术体验尚未重新验收，组件成熟度不因本地 fixture 通过直接改为 Stable。
