# Explorer 全英文展示方案（2026-11-23）

Status: adopted

## 目标

在英文界面下让侧栏中的英文模块名与示例名完整可见，不引入第二套英文文案，
也不改变“切换语言不改变舞台宽度”的既有契约。

## 现状证据

在 1440×900、`lang=en` 的持久化侧栏中实测：

- 侧栏轨道宽度为 230.4px，模块链接可用标签宽度约 123px。
- `Surfaces & Aurora Glass` 需要 156px，`Scenes and modes` 需要约 124px，
  两者被 `.ui-navigation-item__label` 的 `white-space: nowrap` + `text-overflow: ellipsis`
  截断。
- 390px 移动抽屉使用 18rem 宽度，同一组英文标签未被截断；问题只发生在窄的
  持久化侧栏。
- 当前 `EN` 已经只渲染英文、不渲染中文副标题（`catalogueSecondary` 只在 `zh`
  返回英文辅助行），因此不需要新增“全英文”语言开关。

## 推荐方案：英文态允许两行标签

把英文态的 Explorer 标签从“单行省略”改为“按词换行”，保留单行空间充足的标签
不变。落在 `apps/playground/src/styles/shell.css`：

```css
/* An English label is the only line available, so long names need to wrap
   instead of being clipped in the persistent rail. The Chinese layout keeps
   its compact two-line reading aid and its inline English suffix. */
html[lang='en'] .playground-explorer__link .ui-navigation-item__label {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}
```

要点：

1. 只作用于 `html[lang='en']`，中文态的双行标题和后缀行为不变。
2. 只覆盖 Explorer 内的导航标签，不改 `packages/tailwind` 的共享
   `.ui-navigation-item__label` 契约。
3. 侧栏宽度与舞台宽度都不变；语言切换仍满足现有 e2e 断言。
4. 实测注入该规则后，Explorer 内不再存在被省略的标签；`Surfaces & Aurora Glass`
   与 `Status & Feedback` 自然换成两行，行高仍为 32px。

## 验证口径

在 `tests/e2e/playground-inspector.spec.ts` 增加一条以用户结果命名的用例：

- 进入 `?lang=en`，断言 Explorer 中每个 `.ui-navigation-item__label`
  满足 `scrollWidth - clientWidth <= 1`。
- 断言切换语言前后 `[data-design-lab-workspace]` 的 bounding box 不变。
- 不测具体行数、不测文案像素宽度，避免把内容长度写成 brittle 断言。

## 备选方案

| 方案 | 做法 | 收益 | 代价 |
| --- | --- | --- | --- |
| 加宽持久化侧栏 | 英文态把 explorer 轨道改为约 19vw / 20rem | 标签保持单行 | 舞台变窄，且切换语言会改变舞台宽度，违反现有契约 |
| 悬停 title | 给截断标签补 `title` | 改动最小 | 文本仍不可见，不满足“显示全英文” |
| 通用组件改换行 | 修改 Tailwind `.ui-navigation-item__label` | 所有消费者受益 | 影响公共契约，需 changeset 与跨框架回归，超出本次问题范围 |

## 实施与验证

- `apps/playground/src/styles/shell.css` 已按推荐方案加入英文态换行规则。
- `tests/e2e/playground-inspector.spec.ts` 已加入完整显示与舞台宽度回归用例。
- 1440×900 实测：`lang=en` 下 Explorer 标签截断数为 0；`lang=zh` 行为不变；
  两种语言的舞台宽度均为 873.61px。
- 定向 Playwright 4/4 通过（桌面与移动 project），`stylelint`、`lint:text` 通过。
- Biome 未报告本次改动引入的新问题；`shell.css` 中
  `.playground-preview-columns > *` 与 `.playground-stage__specimen-content > *`
  的两条 descending-specificity 警告为既有问题，未在本方案中处理。
