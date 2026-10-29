# 2026-10-29 浮层运行时与关联语义实施记录

## 范围与复现

源码基于 `dev` 的 `7b5bdfc` 加本轮未提交改动。实施当前计划 M1 的 N1/N2，并展开 N3 风险验证；不增加公共组件、不修改公共 props，也不晋升组件成熟度。

初始失败命令（在隔离源码副本设置 `NEOVERSE_UI_PLAYWRIGHT_PORT=3198`）：

```powershell
bunx playwright test tests/visual/overlay-tracking.spec.ts --project=desktop --grep 'Vue .* / native / 1$' --workers=1 --reporter=line
```

两项均失败：锚点平移后左右偏差为 120px；动态内容增加后 panel side 仍为 bottom，未翻转至 top。仅在同一测试动作后补发 resize，两项立即通过，确认根因为更新触发缺失，而非已有定位计算。补发 resize 只用于隔离副本的诊断，未保留在回归用例中。

## 实现

- 共享 overlay-runtime 在浮层打开时以单个 rAF 采样触发器矩形与面板布局尺寸，几何变化才重新计算和写坐标；关闭、禁用、卸载或节点脱离文档时停止跟踪，继续复用既有定位与 dismiss 清理链。
- Vue/React Popover 与 DropdownMenu 用框架 `useId` 建立稳定的 panel ID / `aria-controls`。两端均有多实例 SSR → hydration → 打开交互测试，浏览器验证打开/关闭后的关联和焦点恢复。
- WebKit 真实复现发现 `.ui-choice__native` 的 `inset: 0` 仍保留 12px 固有宽度，Vue Checkbox/Switch 的文字区域因此不在输入框点击范围。显式 width/height 100% 修复透明原生控件的整行 hit area，不改变绘制尺寸。
- 监听器测试在夹具触发器实际可见后取基线，避免把稍后挂载的 Glass renderer 监听器误记为浮层泄漏。选择控件用例保留 Chromium/Firefox 鼠标焦点断言，同时尊重 WebKit 实测的鼠标焦点策略，另显式验证其键盘焦点与 Space。
- cross-browser 配置增加审计、表单语义/行为、choice、浮层与动态跟踪用例。Firefox/WebKit 运行交互断言；`ignoreSnapshots` 只作用于此配置，发布截图仍由完整 Chromium 门禁负责，不生成跨引擎替代基线。

## 验证记录

运行环境：Windows，Bun 1.4.4；Firefox 另使用 WSL/Arch Linux 的原生环境。均为隔离源码副本，未与开发服务共享 dist。

| 验证层 | 当前记录 |
| --- | --- |
| `release:check` | 首轮与整行点击修复后的最终门禁均通过，包含新 hydration 测试和八包制品验证 |
| 新动态跟踪浏览器用例 | 首轮 Chromium 32 项通过，含两框架 / native+fallback / zoom 1+1.5 / desktop+mobile |
| SSR/hydration | Vue、React 各 1 项通过，验证多实例唯一性、关联与 hydration 后交互 |
| 最终相关 Chromium 集 | 234 项通过，0 失败（desktop+mobile，2.3 分钟）；包括动态跟踪、审计、choice、表单语义/行为、浮层 review 与组件交互 |
| 静止写入与关闭/卸载 | 最终动态套件固定为 CSS 基础层，保留默认 Motion；只强制可选 renderer 的 reduced-transparency 查询为真，避免其独立帧及大型 Vue 夹具的 WebGL 负载干扰。资源用例检查连续两帧零坐标写入、关闭/卸载后零待处理帧，不等待所有字体/动画 |
| 完整 Chromium | 首轮 984 通过 / 8 失败 / 68 条件跳过；最终源码按 last-failed 复跑 8 项全部通过，未更新快照或阈值。不是最终源码完整套件一次全绿 |
| Firefox | Windows 在测试页打开前发生启动崩溃（exit 3221225477）；WSL/Linux 可选 WebGL 下动态集 20 通过 / 4 未通过；最终 CSS 基础层 23 通过 / 1 焦点恢复断言失败，该项单 worker 复跑通过（2.8 秒）。不是一次全绿 |
| WebKit | 整行点击修复后的 69 项定向集为 66 通过 / 3 未通过，三个未通过均在新动态集；其中其余 45 项表单、choice 标签、ARIA、审计和 overlay review 通过。最终 CSS 基础层完整动态集 24 项通过（保留默认 Motion），0 失败 |
| 最终动态集 / Chromium | CSS 基础层 desktop+mobile 共 48 项通过（保留默认 Motion），0 失败；此轮在最终测试配置修改后执行 |
| XCA 真实消费 | 当前工作源码的隔离副本安装、共享同步、Nuxt 构建通过；`mobile-header.spec.ts` 6 项通过 |

XCA 快照基于消费者 `dac11a6` 加其现有未提交工作，真实入口为 `app/components/site/SiteHeader.vue`（SHA-256：`D57CEF8C7918CC914DCDE8CAE6D545E0531DD8928D7E22427DFBC59ED5B7EC87`）。测试同时覆盖响应式菜单、主题/语言控件和终端进入；这不是干净消费者提交或固定组合的远端 CI 验收。候选以本地 `file:` 包安装并同步全部嵌套 dist，不等同于 npm 制品验收。消费者源码、manifest、锁文件与 CI 未改动。

首轮完整 Chromium 的四项新清理用例受可选 Glass renderer 独立 rAF 干扰，已隔离计数；另外四项是 `glass-reflection` / `glass-scroll` 加载超时、`playground-backdrop` / `playground-shell` 首轮观测失败，未修改这些断言。未改动的 `7b5bdfc` 隔离基线定向运行 5 项：两项 Glass 加载超时同样复现，另三项通过；最终工作源码的上述四项均复跑通过。所有记录按实际运行分别保留，不把首轮失败改写成通过。

跨引擎对照：可选 WebGL 下，Vue 大夹具出现加载/页面关闭、定位观测与多帧等待失败。初次对照的 `test.use({ reducedMotion })` 选项位置错误，不计作有效的 reduced-motion 证据，已移除。对同一个 Firefox 锚点平移失败用例，强制可选 renderer 走 CSS 基础层后，6.2 秒通过。最终动态/生命周期测试保留默认入场动效和原有 2px 定位要求，在三个引擎重新执行完整动态集；其结果不能替代可选 Glass 增强层的跨引擎验收。最终根 TypeScript 检查通过。

## 保留边界

- fallback 不新增旋转/缩放包含块的一般坐标变换支持；本轮覆盖已有 CSS zoom 规则、锚点平移、内容尺寸与 viewport clamp/flip。
- WebKit 初轮还出现原生 radio 方向键行为差异、滚动中 placement 翻转使旧位移断言失效等问题，须分别保留实际复现，不能通过删除状态断言来宣称跨引擎全绿。
- NVDA / Orca、真实操作系统 IME 尚无人工结果。使用下述验收步骤，结果必须由实际操作者填写。
- Doc 安装迁移已完成本地写回，正式 npm 与本地候选分别验收，见[消费迁移记录](consumer-migration-2026-10-29.md)。不因新的 fixture 或个别消费调用批量修改 React consumer / release visual 状态。

## 后续 Glass 调度修复

增强层测量复现：静止表面内仅 background-position 动画在 300ms 内多次清屏，停止动画即归零；裁剪内旋转字形同样可复现持续清屏。共享 renderer 原先把全部活动动画视作几何变化。

现按 effect keyframe 筛选：背景位置动画交给 CSS；最近 Glass 边界同时 isolation:isolate、双轴 hidden/clip、目标不含嵌套 Glass 时，内部 transform/opacity 同样不持续刷新边缘。未知 effect、表面运动和可能改变遮挡的动画保持跟踪；display:none 树内的 pending 动画不维持帧循环。保留活动目标，样式/可见性变化后重评，避免解除裁剪时漏刷新。未改 shader、RGB 或截图阈值。

新增 glass-scheduling 浏览器回归同时验证静止零清屏、背景运动、字形旋转、解除/恢复裁剪以及表面运动恢复刷新，始终断言实际 WebGL 激活。最终 Glass 单测 51 项通过；Chromium 桌面+移动的 scheduling / reflection / resting / occlusion 共 32 项通过；WebKit scheduling 1 项通过。先前一次 29/32 的三项失败（两次加载超时、一次嵌套像素观测）在最终完整 32 项运行中均通过，未修改原断言。

Firefox / WSL 最终增强层用例在 react-fixture 导航时超时，浏览器未完成加载，不计为调度通过。此前增强层调试也观察到实际 WebGL context 丢失；CSS 基础层结果不能替代此限制。Windows Firefox 原生启动问题仍保留。未把该定向修复写作整个增强层跨引擎完成。

最终 release:check 通过，包含同步器 4 项测试、51 项 Glass 单测和八包制品验证。首次运行仅被隔离目录内生成的三份 Playwright .last-run.json 格式阻断；移出测试报告后完整重跑通过，没有更改产品代码或门禁规则来绕过。

## 人工 AT / IME 验收步骤（N4）

固定测试源码与消费者来源，先记录 OS、浏览器、NVDA/Orca/IME 版本及主题、视口。构建后启动 Playground，用当前服务端口打开：

- Vue 表单：`/frame?theme=light&lang=en&contract-fixtures=1#forms`。
- Vue 浮层：`/frame?theme=light&lang=en&contract-fixtures=1#controls`。
- React：`/react-fixture?lang=en&contract-fixtures=1`。

| 场景 | 操作与检查 | 人工结果 |
| --- | --- | --- |
| 字段名称与描述 | Tab 进入 Contract text / Contract notes / Contract selection，核对名称、描述、必填/无效/只读状态播报与页面内容一致 | 未执行 |
| Select | ArrowDown 打开，方向键与 Home/End 导航；禁用项不能被选中；Enter 选择后播报值，Escape 关闭并回到触发器 | 未执行 |
| 菜单 | 打开 Open menu，核对 menu/menuitem 与禁用状态播报；方向键/Home/End 可达有效项；Escape 关闭并恢复焦点 | 未执行 |
| Popover | 打开后内容名称可识别，Tab 可离开且不形成焦点陷阱；Escape 返回触发器；关闭后没有残留可浏览的可见面板内容 | 未执行 |
| IME | 在 Input/Textarea 用真实中文输入法输入未完成拼音，触发外部重渲染；预编辑文字不被覆盖、不提前提交，选词确认后提交最终中文；测试取消组合和连续输入 | 未执行 |

每个失败记录实际播报/输入、预期、复现步骤与环境；合成 composition 事件、ARIA 属性断言及截图均不得填写为人工通过。
