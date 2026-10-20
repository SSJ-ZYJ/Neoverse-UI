# 2026-10-19 全量浏览器回归与剩余阻塞

范围：全量本地浏览器门禁，以及回归暴露的四类定向收口：移动端触控、浮层定位、预览锚点、桌面字体/加载时序。以当前工作区源码和构建产物验收，保留本轮开始前的未提交修改。

## 定向修复

- 浮层定位：过滤或变换祖先会为 fixed 回退浮层建立包含块，固定坐标不再视口相对。`positionAnchoredOverlay` 现在按渲染后的视口矩形校正回退坐标，原生 Popover 顶层定位不受影响；新增 `@neoverse-ui/overlay-runtime` 的 patch Changeset。React Select 回退用例改按 `getBoundingClientRect` 断言几何：初始垂直间距小于 20px、左偏移小于 2px，滚动与视口缩放后间距、偏移、宽度跟踪保持稳定；离屏锚点先回到视口再测量，避免把视口钳制当作定位错误。Design Lab 弹层用例等待真实滚动发生后再校验锚定，不再被 wheel 事件分发与实际滚动之间的时序差欺骗。
- 移动端触控：Glass 按钮材质容器以更高特异性设置 `overflow:hidden`，会裁掉 `::before` 外扩的触控热区。补一条同特异性的 `overflow:visible` 规则，热区在视觉边界外仍可命中；触控密度用例按 `--neoverse-button-height-sm` 断言高度，展开热区不小于 44px 且不被裁剪，滚动定位改到实际控件而不是超出移动视口的密度标本。
- 预览锚点：卡片模糊用例改轮询当前的 `data-neoverse-view-transitioning` 属性，先确认卡片可见再等过渡结束；标本预览链接用例先等待 `load` 与 `document.fonts.ready` 建立最终布局，再验证点击不导航、不重置工作区滚动。字体晚于 DOMContentLoaded 到达会改变标本高度，原生滚动锚定会在无点击时调整 scrollTop。
- 字体/加载时序：Dock 消费尺寸比对在 Playground 与独立消费文档两侧都等待 `document.fonts.ready`，以相同最终字体测量几何；相关导航统一改用 `domcontentloaded`，避免并行运行时被无关远端资源的 load 事件阻塞（表单状态用例同）。

## 全量本地门禁

`bun run release:check` 通过：非修改型 Biome、文本/样式/Tailwind 及契约检查、全量类型、单测、生产构建与 8 包消费验证。Playwright 全量 714 项：675 通过、0 失败、39 跳过。移动端触控、浮层定位、预览锚点以及桌面字体/加载时序均已收口。

## 剩余阻塞

- `CR-20261010-2A6D0E6E` 终端语义色 Token：实现与本地消费已有证据，但验收包含正式发布，未发布前保持 implementing。
- 远端 CI：`dev` 推送与手动触发已配置，等待推送后的真实 Linux / Windows 执行记录。
- 实际辅助技术体验：Windows NVDA / Linux Orca 人工验收未做，本机通过不等于 AT 验收。
- React `UiBreadcrumb` 真实产品消费仍为 Pending；Checkbox / RadioGroup / Switch / Field / Popover / DropdownMenu / Presence 等状态视觉与消费证据按矩阵逐项推进。

## 2026-10-19 晚间：0.3.0 候选版浏览器稳定性复核

以已经提交的 `dev` HEAD `dd5f374` 为基准；验证开始时工作区干净，分支比 `origin/dev` 超前一个提交。

- 历史异常：同日早些时候某次第二轮全量测试进行到 424 项通过、13 项失败、9 项跳过后中止；失败包括大型控件截图等待元素稳定、Dock 水平指示器动画检查和后续连续的页面重载/导航超时。该运行并非完整通过。
- 高并发复测：独立端口 `3161`，代表性失败测试重复 15 轮、3 workers，得到 **165 通过、0 失败、15 按设备条件跳过**。
- 首轮全量：独立端口 `3162`，2 workers，`bunx playwright test --workers=2 --reporter=list`，**675 通过、0 失败、39 跳过**，约 10.7 分钟。
- 第二轮全量：同一端口编号，但由 Playwright 重新启动本地 webServer 和浏览器 Worker；相同命令，**675 通过、0 失败、39 跳过**，约 10.4 分钟。两轮都未使用 `--update-snapshots`、重试或调宽像素阈值。
- `bun run release:check` 再次通过，包括 8 个公开包的本地消费验证；本轮未修改任何组件样式、Token、图片或测试断言。

以上证据表明当前 HEAD 在**没有并行 watch 构建、没有预存 Playground 服务、由 Playwright 管理服务生命周期**的环境下可连续通过完整门禁。历史间歇性超时在本次未复现；既不能证明旧问题根因已完全确定，也不应为消除旧记录而随意改动 Dock 动画或截图阈值。发布候选阶段建议继续使用独立端口，禁止同时执行会修改 Playground 构建产物的 watch 任务，并在远端 CI 保留失败日志、截图和 Trace 供真正复现时诊断。

## 交付边界

上述修复已经由用户提交在本地 `dev` 的 `dd5f374`；本次只进行复核与文档记录，**未提交、推送、升级版本或发布**。Changeset 仍为候选发布记录，不代表授权执行 `changeset version` 或 `npm publish`；最新远端 CI、真实消费者和辅助技术验收尚未完成，不能由本地绿灯推定正式 0.3.0 可发布。
