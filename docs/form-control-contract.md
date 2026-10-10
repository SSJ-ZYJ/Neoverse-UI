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
