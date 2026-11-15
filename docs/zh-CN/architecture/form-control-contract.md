# 表单控件行为规范

Status: adopted

[English](../../architecture/form-control-contract.md)

<!-- Source: docs/architecture/form-control-contract.md -->
<!-- Source-SHA256: 5dc562cef159b3ad69ba1e14dfaa2adea041244383eaba817600ad0232ddd923 -->

Neoverse-UI 表单控件在 Vue 与 React 之间共享同一套状态、无障碍与样式规则。原生 HTML 控件仍是交互语义的来源；组件层增加 Neoverse 材质、几何、状态语言与框架绑定。

## 状态模型

所有规范表单控件使用同一套校验词汇：

| 状态 | 规则 |
| --- | --- |
| `validation="none"` | 默认状态，不渲染校验强调。 |
| `validation="error"` | 使用 danger 语义变量，并把 `aria-invalid` 默认设为 true。 |
| `validation="warning"` | 使用 warning 语义变量，但不把值标记为无效。 |
| `validation="success"` | 使用 success 语义变量，不改变原生有效性。 |
| `disabled` | 把控件移出交互，并使用禁用前景/背景角色。 |
| `readonly` / `readOnly` | 保持控件可聚焦、可提交，同时阻止值变化。 |

消费项目显式提供的 `aria-invalid` 始终优先于由校验状态推导的默认值。

## 共享控件

规范控件集合：

- `UiInput`、`UiTextarea` 与 `UiSelect` 用于文本和选择输入。`UiInput` 在 `ui-input-shell` 内渲染原生输入，并同步绘制共享的闪烁光标；选择、IME 组合、掩码、email、number 等没有文本选择的类型，以及只读/禁用和强制颜色模式，继续使用浏览器光标。光标横跨已移动的跨度并收缩回竖条，时长随移动距离增长，上限为 glide 变量；在 `prefers-reduced-motion` 下滑动停止，但不透明度闪烁保留。竖条移动时保持实心，落定后重新闪烁。`UiTextarea` 保留原生光标，因为多行光标需要双轴同步。
- `UiCheckbox`、`UiRadioGroup` 与 `UiSwitch` 用于选择输入。
- `UiField` 用于标签、描述、必填标记、控件放置与校验消息组合。

选择控件保留原生 `input` 元素。Checkbox 与 Switch 使用原生 checkbox 状态；RadioGroup 使用按 `name` 分组的原生 radio 输入。视觉控件是相邻的展示层，不替代浏览器语义。

透明的选择输入显式填满其视觉行；在 WebKit 中，单独使用 `inset: 0` 不会拉伸替换型 checkbox 输入。这样既让可见选择文本位于原生命中区域内，又不改变已绘制控件的尺寸。鼠标聚焦策略仍归浏览器所有；键盘聚焦与空格激活与指针激活分开测试。

## 框架绑定

| 行为 | Vue | React |
| --- | --- | --- |
| 文本值 | `v-model` | 原生 `value/defaultValue/onChange` |
| Checkbox / Switch 值 | `v-model<boolean>` | `checked/defaultChecked/onChange` 加 `onCheckedChange` |
| RadioGroup 值 | `v-model<string \| number>` | `value/defaultValue` 加 `onValueChange` |
| 只读 | `readonly` | `readOnly` |
| 校验 | `validation` | `validation` |
| Field 关联 | `control-id` | `controlId` |

框架特定的绑定语法有意保留。对应关系意味着语义与视觉状态等价，而不是在所用框架已有原生约定时强行统一 prop 拼写。

Vue 的 Input 与 Textarea 使用感知组合输入的原生 `v-model` 行为：未完成的 IME 文本不会提交到模型，也不会被无关的消费项目重渲染覆盖。数字输入的模型更新保留字符串值事件规则。React 文本输入保留原生 `value/defaultValue/onChange` 与组合事件；消费项目应使用框架自身的组合输入约定。Vue 模型状态归消费项目所有；省略模型不是独立的非受控/默认值 API。React 原生 Input/Textarea 支持非受控 `defaultValue` 与原生表单重置。

Select 在两套适配器中都是受控选择组件：Vue 使用 `modelValue`/`update:modelValue`，React 使用 `value`/`onValueChange`。两者都不承诺非受控 `defaultValue` 模式。被拒绝的更新不会改变显示的选择或隐藏的提交值。触发器上的 ArrowDown/ArrowUp 打开列表框并聚焦当前选中的启用项，无法聚焦时回退到第一个/最后一个启用项。方向键、Home 与 End 在启用项之间导航；Escape 关闭并恢复触发器焦点。禁用/只读控件不接受变化。SSR 稳定 ID 通过 `aria-controls` 关联 combobox 与 listbox；原生 Popover 与回退路径保持相同键盘行为。

## Field 组合

`UiField` 不执行校验，也不持有应用状态。它只组合：

1. 通过 `controlId` 关联的可选标签，
2. 可选描述，
3. 控件插槽/子节点，
4. 可选校验或帮助消息，
5. 必填与禁用展示状态。

校验规则、消息内容、表单提交与服务端错误仍由消费项目负责。

### 可访问控件绑定

Field 为描述与消息节点渲染 ID，这些 ID 从 `controlId` 派生；未提供控件 ID 时使用 SSR 稳定的框架 ID。`descriptionId` 与 `messageId` 可以覆盖默认值。

Vue 默认作用域插槽暴露 `{ controlAttrs }`；React 接受函数子节点 `(controlAttrs) => ReactNode`。公开的 `FieldControlAttrs` / `UiFieldControlAttrs` 包含：

- 提供 `controlId` 时的 `id`，
- 当前已渲染描述与消息对应的 `aria-describedby`，
- Field 标记为真时的原生 `required` 与 `disabled`。

消费项目把这些属性绑定/展开到真实控件上。Field 不克隆任意子节点，也不静默传播状态；普通子节点仍受支持。从 Field 移除的描述/消息也会移除其关联。消费项目提供的额外描述 ID 必须显式合并。校验状态仍独立传给控件。

### 表单重置

提交由原生名称与值决定。表单重置期间，Vue `v-model` 与 React 受控状态仍归消费项目所有；消费项目必须显式重置该状态。React 非受控原生选择输入使用浏览器 `defaultChecked` 与表单重置行为。Field 没有独立值模型或重置引擎。

React Switch 通过 `role="switch"` 暴露原生 checkbox 的 `checked` 状态，但不在 `aria-checked` 中重复它。这样在原生表单重置与消费项目重渲染后，无障碍状态仍然正确，遵循 [WAI-ARIA Switch 模式](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)。

## 样式归属

表单几何、状态颜色、选择控件尺寸、Switch 几何与 Field 间距归 `components.formControl` 下的变量所有。Tailwind 组件 CSS 消费这些变量。框架适配器不得引入硬编码几何或独立颜色配方。

公开接口流程：

```text
Token -> form-control.css -> Vue/React adapter -> unit contract -> Playground -> consumer validation
```

新增表单控件必须在导出它的同一次改动中登记到组件成熟度矩阵。