# UI 测试重构记录（2026-11-10）

Status: adopted

## 目标

把 `tests/visual` 的 71 个 spec、约 250 个用例、20400 行断言，重构为按产品模块
拆分的纯端到端（e2e）套件；删除像素探针、计算样式算术、动画帧计数与截图基线。

## 结构

```text
tests/
  e2e/
    forms.spec.ts        27 项  字段/文本/IME/Select/选择控件/数字框/无障碍角色
    overlays.spec.ts     28 项  弹层生命周期/键盘/焦点/锚点跟随/上下文菜单/视口夹取
    navigation.spec.ts    7 项  面包屑/Dock/分段控件/步骤流
    surfaces.spec.ts      6 项  折叠面板/表格/骨架/时间线/统计卡/滚动条
    terminal.spec.ts      7 项  转录/补全/IME 守卫/尾部跟随/阅读位置
    motion.spec.ts        4 项  列表重排/入场重放/降级动效/语言切换宽度
    materials.spec.ts     6 项  预览可见性、降透明度可读性、三层材质参数接线
    layout.spec.ts        5 项  控件尺寸基线、徽标字号、24px 点击区、无隐式放大
    contrast.spec.ts      3 项  文本角色 WCAG 对比度下限（深浅主题）
    playground.spec.ts   11 项  shell 导航/深链/抽屉/滚动恢复/响应式溢出
    parity.spec.ts        6 项  React 适配器渲染/主题解析/共享控件名称
  support/e2e.ts               适配器矩阵、popover 回退、表单值、溢出断言
  support/contrast.ts          浏览器内颜色解析、合成与 WCAG 比值
```

共 110 项（含桌面/移动两个 project，运行 220 次），本机约 1.1 分钟全部通过：
218 passed、2 skipped（仅桌面/仅移动的布局断言）。

## 删除原则

一个用例只有在断言“用户可观察的结果”时才保留：面板打开、焦点返回、值被提交、
链接发生导航、文本被写入。以下内容不再进入 e2e 门禁：

| 删除内容 | 原因 | 契约仍然记录在 |
| --- | --- | --- |
| 225 张截图基线（129MB） | 截图回归不是端到端行为，跨平台维护成本高 | — |
| 20 个 `glass-*` 光学探针 | 像素/色度测量，属于材质人工验收 | `docs/material-standards.md` |
| `button-*`、`card-*`、`badge-*`、`table-backdrop`、`tooltip-*` 的纯外观断言 | 只比外观、不含行为；其中尺寸/字号/材质参数已改写进新模块 | `layout.spec.ts`、`materials.spec.ts` |
| `design-lab`、`playground-*` 的版式比例/密度断言 | 只保留“无隐式放大、无横向溢出”这类稳定不变量 | `layout.spec.ts`、`playground.spec.ts` |
| `component-size`、`dock-consumer-size` 的截图与自然宽度推导 | 尺寸基线改为直接测量真实控件（32/40/48、40px、13/14/16、24px 点击区） | `layout.spec.ts` |
| `overlay-tracking` 的监听器计数、rAF 排队、`setProperty` 探针 | 实现细节；保留“面板跟随锚点/关闭后不写入”的用户可见部分 | `overlays.spec.ts` |

重复覆盖同时合并：主题 × 适配器 × native/fallback 的四重矩阵改为“行为用浅色、
主题渲染单独一条”，同一断言的浅/深重复被删除。

## 同步改动

- `playwright.config.ts`：`testDir` 改为 `tests/e2e`，移除截图快照模板与阈值。
- `package.json`：`test:visual*` → `test:e2e*`，删除 `test:visual:update`。
- `.github/workflows/verify.yml`：`visual-linux` → `browser-linux`，
  `visual-checks` → `browser-checks`；Windows 子集改为 forms/overlays/navigation/parity。
- `.github/workflows/ci.yml`：删除 `visual_only`、`visual_suite`、`visual_grep`、
  `visual_update` 输入与 `focused-visual` 作业；删除 `visual-focused.yml`。
- `.github/scripts/ci-classify.mjs`：`visualChecks` → `browserChecks`，
  路径规则改为 `tests/e2e/`；分类器 7 项测试通过。
- `contracts/component-matrix.json` 的 54 条测试证据重指向对应模块 spec。
- `tests/support/glass-colour-metrics.ts` 与其单测随材质探针删除，
  `test:contracts` 同步收敛。

## 覆盖边界

| 类别 | 是否自动 | 说明 |
| --- | --- | --- |
| 交互与状态 | e2e | 打开/关闭、焦点、提交、导航、滚动位置 |
| 尺寸与几何 | e2e | 真实控件的 rect、字号、缩放、最小点击区 |
| 文本对比度 | e2e | 从渲染颜色合成背景后计算 WCAG 比值 |
| 材质参数接线 | e2e | 三层玻璃各自的 blur / saturate / tint 与递减关系 |
| 光学外观（方向光、色度、折射） | 人工 | 仅能通过像素采样判断，跨引擎阈值不稳定 |
| 截图回归 | 不做 | 维护成本高于信号，改为人工验收 |

对比度检查顺带发现并修复一处差距：浅色主题 `.text-muted` 原为 `neutral-500`
（`#6c7f90`，3.90:1），只达大字号 AA，而占位符与 Field 说明属于正文级文本。
浅色语义角色改为 `#5d6f80`（canvas 上 4.89:1，色相不变），测试下限同步提升到
4.5；`neutral-500`、深色 `#7f93a8` 以及装饰性用途的参数未动。

## 顺带修复

新的“深链聚焦”用例在 Chromium 158 上暴露了真实竞态：`focusSpecimen` 在模块内容
挂载前只尝试一次，`controls-action` 与 `status-feedback-notice` 的焦点落回 `body`。
`apps/playground/src/App.vue` 改为在 2 秒内按帧重试，等目标元素出现后再聚焦。
