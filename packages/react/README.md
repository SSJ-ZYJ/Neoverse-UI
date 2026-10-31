# @neoverse-ui/react

React adapters for Neoverse UI, with Aurora Glass as the shared glass material. Light, Standard, and Immersive are its tiers, not separate styles. Use the [Tokens `glassMaterial` metadata](../tokens/README.md#aurora-glass) for localized display labels; `glass-*` surface identifiers remain stable. See [material standards](../../docs/material-standards.md).

The package provides the same 35 public components as the Vue package, including navigation, forms, feedback, data presentation, terminal composition and document scrollbars. Both adapters use the shared Tokens, Tailwind, Material, Motion and Overlay Runtime. See [framework parity](../../docs/framework-parity.md) for state bindings and validation scope.

## Forms and overlays

```tsx
<UiField controlId="email" label="Email" description="Release notifications" message={emailError} required>
  {(controlAttrs) => (
    <UiInput {...controlAttrs} type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} validation={emailError ? 'error' : 'none'} />
  )}
</UiField>

<UiCheckbox checked={notifications} onCheckedChange={setNotifications} name="notifications">
  Release notifications
</UiCheckbox>
<UiPopover trigger="Details" ariaLabel="Project details"><p>Project details</p></UiPopover>
<UiDropdownMenu trigger="Actions" ariaLabel="Project actions" items={actions} onSelect={onAction} />
```

Field function children receive `UiFieldControlAttrs`: supplied control ID, `aria-describedby` for rendered descriptions/messages, and native `required`/`disabled` flags when enabled. `descriptionId` / `messageId` override SSR-stable defaults. Spread these on the control and explicitly merge any consumer description IDs. Ordinary children continue to work without automatic rewriting. Field does not validate values or reset controlled state.

Checkbox/Switch accept native `checked/defaultChecked/onChange` plus `onCheckedChange`; RadioGroup uses `value/defaultValue/onValueChange`. Controlled form resets must synchronize consumer state; uncontrolled native choice inputs preserve their browser reset behavior. `readOnly` prevents value changes while retaining focusability.

`UiInput type="number"` renders themed up/down buttons while retaining the native numeric input, keyboard arrows, and `min`/`max`/`step` constraints. `incrementLabel` and `decrementLabel` localize their accessible names (defaults: `Increase value` / `Decrease value`). Button changes trigger native input/change events and controlled `onChange` updates. With `step="any"`, buttons change the value by 1 and retain its fractional part. Disabled and readOnly inputs disable both buttons; forwarded refs still target the input.

Popover is non-modal; DropdownMenu supplies menu keyboard navigation. Both accept `open/defaultOpen/onOpenChange`, disabled state and placement, and share the Overlay Runtime with Select.

```tsx
import { UiAction } from '@neoverse-ui/react';

<UiAction href="/docs">Open docs</UiAction>
```

For framework routing components, use `asChild` so the router keeps ownership of navigation while Neoverse UI owns control geometry, material, state, and focus styling.

## Dock

`UiDock` is a reusable floating-navigation shell. Pass navigation content through `children` and optional mode/language controls through `trailing`; route data and active state remain consumer-owned. `navigationIndicator` defaults to `true`, using the same measured shared indicator as `UiControlSurface`. Use `UiNavigationItem` children to supply the active marker.

```tsx
<UiDock aria-label="Primary navigation" trailing={<LanguageControl />}>
  {navigationItems}
</UiDock>
```

## Cards

```tsx
import { UiCard } from '@neoverse-ui/react';

<UiCard as="article" surface="subtle" id="related-reading">
  Related reading
</UiCard>

<UiCard as="a" href="/docs/chapter" surface="glass-elevated">
  Open chapter
</UiCard>
```

`UiCard` adds shared card geometry and a Surface preset while forwarding native or routed root attributes. Content layout and navigation behavior remain with the consumer.
## Native buttons

```tsx
import { UiButton } from '@neoverse-ui/react';

<UiButton ref={buttonRef} variant="ghost" size="sm" surface="none" onClick={copy}>
  Copy
</UiButton>
```

`UiButton` accepts native button attributes and React 19 refs, defaults to `type="button"`, and supports `primary | secondary | ghost`, `sm | md | lg`, `stretch`, `leading`, and `trailing`. `loading` sets native disabled and `aria-busy` while retaining the label. An explicit `aria-busy` is preserved when not loading. Icon-only children require an accessible label from the consumer.

## Icon-only controls

```tsx
import { Settings } from 'lucide-react';
import { UiIconButton } from '@neoverse-ui/react';

<UiIconButton label="Open settings" variant="ghost" size="sm" onClick={openSettings}>
  <Settings aria-hidden="true" />
</UiIconButton>

<UiIconButton as="a" href="/settings" label="Settings" surface="none">
  <Settings aria-hidden="true" />
</UiIconButton>
```

`UiIconButton` requires an accessible `label`, preserves native button attributes and refs, and also supports native anchor destinations. `disabled` or `loading` disables native buttons; disabled links lose their destination, leave the tab order, and cancel activation. Its compact geometry comes from the shared component stylesheet.
## Status notices

```tsx
import { UiNotice } from '@neoverse-ui/react';

<UiNotice as="aside" variant="warning" action={<a href="/guide">Read the guide</a>}>
  Check this requirement before continuing.
</UiNotice>
```

`UiNotice` mirrors the Vue adapter with `neutral | info | success | warning | danger` variants, a `div | aside | section` root, forwarded native attributes, and an optional action region. It supplies the status surface; content semantics, icon, heading, and action behavior stay with the consumer.

## Presence

```tsx
import { UiPresence } from '@neoverse-ui/react';

<UiPresence show={open} variant="pop" origin="top">
  Panel content
</UiPresence>
```

`UiPresence` retains children during the shared exit animation and unmounts when it finishes, with a token-based timeout fallback. `useUiPresence(open)` exposes `mounted`, `leaving`, and `ref` for consumer-owned markup; bind the Motion `nv-appear` / `nv-vanish` classes and preset attributes when using the hook directly. Presence hooks and interactive consumers belong in a client boundary. The presets and reduced-motion behavior are owned by `@neoverse-ui/motion`.

Consumers without their own Tailwind build can import `@neoverse-ui/react/index.css`; it forwards to the compiled `@neoverse-ui/tailwind/index.css` consumer bundle, including Tokens, Motion, Material, component selectors, and the utilities required by the adapters. No package-source utility scanning is required. Static adapters support server rendering, while Presence hooks and event handlers belong in the consumer's client boundary.

## Navigation and segmented selection

`UiControlSurface` groups arbitrary controls with optional `trailing` content. `UiNavigationItem` supplies accessible `label`, `icon`, `active`, `compact`, `indicatorPlacement`, and disabled link/button semantics. It supports `asChild` with a routed element, like `UiAction`.

`UiSegmentedControl` uses `options` with `value`, `label`, optional `disabled` and `ariaLabel`. Bind `value/onValueChange`, or use `defaultValue` for internal state. ArrowLeft/ArrowRight wrap through enabled choices; Home/End select the endpoints. Loading and disabled states prevent changes. A controlled parent can reject updates without changing the selected value.

## Feedback and presentation

- `UiBadge`: `variant` (neutral/info/success/warning/danger), `size` (sm/md/lg), and label children.
- `UiStatusIndicator`: `status`, `size` (sm/md), `pulse`, `loading`, and label children.
- `UiTooltipSurface`: `as`, `variant` (neutral/accent), and content; caller controls tooltip visibility and associations.
- `UiSkeleton`: `variant` (text/title/avatar/circle/rect), `effect` (shimmer/pulse/none), `width`, `height`, and rectangular `radius`. Numeric dimensions use CSS pixels.
- `UiStatCard`: `label`, `value`, optional `unit`, `trend`, `footnote` and `surface`; label/value/trend/footnote accept ReactNode content.
- `UiTimeline`: `items`, `ariaLabel`, and optional `renderItem({ item, index })`.
- `UiStepFlow`: `items` with pending/current/complete state, `ariaLabel`, `renderItem`, and `renderStatus`.

## Terminal and scrollbars

[Terminal composition](../../docs/terminal-composition.md) includes a React example. `UiTerminalSurface` accepts `status` and `actions` content. `UiTerminalTranscript` follows output only while the reader is at the tail, and retains a nested accessible log. `UiTerminalLine` renders escaped text or children.

`UiTerminalPrompt` uses `value/defaultValue/onValueChange` and preserves native `onChange`, keyboard/composition events and an input ref. `suggestion` displays only a matching ghost suffix while focused at the end. `context` and `renderSegment(segment)` customize context content. Command execution and accepting suggestions belong to the application.

`UiTerminalEcho` displays escaped recorded `text` with the same `segments`, `symbol`, `error` state and `renderSegment` chrome as the live prompt, without an input or tab stop. Capture segment values when committing history so later directory changes do not rewrite old prompts.

`UiScrollbar` decorates document scrolling with `autoHideMs` (1200), `minThumbRatio` (0.1), `refreshKey`, and `hideNative` (true). Set `autoHideMs={0}` to keep it revealed while the document has overflow. It supports track seeking and pointer dragging, and restores native-scrollbar ownership on unmount. It is decorative and does not replace native document keyboard scrolling. The rail renders on the server with `data-hide-native`, so a server-rendered rail removes the native bar on the first paint instead of after hydration; `hideNative={false}` keeps the native bar.
