# Form Control Contract

Neoverse-UI form controls share one state, accessibility, and styling contract across Vue and React. Native HTML controls remain the source of interaction semantics; the component layer adds the Neoverse material, geometry, state language, and framework bindings.

## State model

All canonical form controls use the same validation vocabulary:

| State | Contract |
| --- | --- |
| `validation="none"` | Default state. No validation emphasis is rendered. |
| `validation="error"` | Uses the danger semantic token and defaults `aria-invalid` to true. |
| `validation="warning"` | Uses the warning semantic token without marking the value invalid. |
| `validation="success"` | Uses the success semantic token without changing native validity. |
| `disabled` | Removes the control from interaction and uses disabled foreground/background roles. |
| `readonly` / `readOnly` | Keeps the control focusable and form-submittable while preventing value mutation. |

An explicit consumer-provided `aria-invalid` always wins over the validation-derived default.

## Shared controls

The canonical control set is:

- `UiInput`, `UiTextarea`, and `UiSelect` for text and selection input.
- `UiCheckbox`, `UiRadioGroup`, and `UiSwitch` for choice input.
- `UiField` for label, description, required marker, control placement, and validation message composition.

Choice controls preserve native `input` elements. Checkbox and Switch use native checkbox state; RadioGroup uses native radio inputs grouped by `name`. The visual control is a sibling presentation layer and does not replace browser semantics.

The transparent choice input explicitly fills its visual row; `inset: 0` alone
does not stretch replaced checkbox inputs in WebKit. This keeps visible choice
text inside the native hit area without changing the painted control's size.
Mouse-focus policy remains browser-owned; keyboard focus and Space activation
are tested separately from pointer activation.

## Framework bindings

| Contract | Vue | React |
| --- | --- | --- |
| Text value | `v-model` | native `value/defaultValue/onChange` |
| Checkbox / Switch value | `v-model<boolean>` | `checked/defaultChecked/onChange` plus `onCheckedChange` |
| RadioGroup value | `v-model<string \| number>` | `value/defaultValue` plus `onValueChange` |
| Readonly | `readonly` | `readOnly` |
| Validation | `validation` | `validation` |
| Field association | `control-id` | `controlId` |

Framework-specific binding syntax is intentionally preserved. Contract parity means equivalent semantics and visual states, not identical prop spelling where the host framework already has a native convention.

Vue Input and Textarea use composition-aware native `v-model` behavior: unfinished
IME text is not committed to the model or overwritten by unrelated consumer
rerenders. Number-input model updates retain their string-valued event contract.
React text inputs retain native `value/defaultValue/onChange` and composition
events; consumers should use the framework's own composition conventions.
Vue model state remains consumer-owned; an omitted model is not a separate
uncontrolled/default-value API. React native Input/Textarea support uncontrolled
`defaultValue` and native form reset.

Select is a controlled selection component in both adapters: Vue uses
`modelValue`/`update:modelValue`, React uses `value`/`onValueChange`. Neither promises
an uncontrolled `defaultValue` mode. A rejected update does not change the displayed
selection or hidden submitted value. ArrowDown/ArrowUp on the trigger open the
listbox and focus its selected enabled option, falling back to its first/last
enabled option. Arrow keys, Home and End navigate enabled options; Escape closes
and restores trigger focus. Disabled/readonly controls do not accept changes.
SSR-stable IDs associate the combobox and listbox through `aria-controls`; native
Popover and fallback paths keep the same keyboard contract.

## Field composition

`UiField` does not run validation and does not own application state. It only composes:

1. an optional label associated through `controlId`,
2. an optional description,
3. the control slot/children,
4. an optional validation or help message,
5. the required and disabled presentation state.

Consumers remain responsible for validation rules, message content, form submission, and server errors.

### Accessible control bindings

Field renders description and message nodes with IDs derived from `controlId`, or an SSR-stable framework ID when no control ID is supplied. `descriptionId` and `messageId` can override those defaults.

Vue's default scoped slot exposes `{ controlAttrs }`; React accepts function children `(controlAttrs) => ReactNode`. The public `FieldControlAttrs` / `UiFieldControlAttrs` contains:

- `id` when `controlId` is supplied,
- `aria-describedby` for currently rendered descriptions and messages,
- native `required` and `disabled` when those Field flags are true.

Consumers bind/spread these attributes onto the actual control. Field does not clone arbitrary children or silently propagate state; ordinary children remain supported. A description/message removed from the field also leaves its association. Consumer-provided extra description IDs must be merged explicitly. Validation state is still passed to the control independently.

### Form reset

Native names and values determine submission. Vue `v-model` and React controlled state remain consumer-owned during a form reset; consumers must reset that state explicitly. React uncontrolled native choice inputs use browser `defaultChecked` and form-reset behavior. Field has no independent value model or reset engine.

React Switch exposes its native checkbox `checked` state through `role="switch"` without duplicating it in `aria-checked`. This keeps the accessible state correct after native form resets and consumer rerenders, following the [WAI-ARIA Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).

## Styling ownership

Form geometry, state colors, choice-control dimensions, Switch geometry, and Field spacing are token-owned under `components.formControl`. Tailwind component CSS consumes those tokens. Framework adapters must not introduce hard-coded geometry or independent color recipes.

The public contract follows:

```text
Token -> form-control.css -> Vue/React adapter -> unit contract -> Playground -> consumer validation
```

A new form control must enter the Component Contract Matrix in the same change that exports it.
