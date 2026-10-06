# @neoverse-ui/react

React adapters for Neoverse UI.

The package exposes token-backed React adapters for `UiButton`, `UiIconButton`, `UiAction`, `UiBreadcrumb`, `UiDock`, `UiCard`, `UiInput`, `UiTextarea`, `UiSelect`, `UiTable`, `UiDisclosure`, `UiNotice`, `UiSurface`, and `UiPresence`, plus `useUiPresence` and the `uiActionClassName` helper for consumers that need to style an existing routing component through `asChild` composition.

```tsx
import { UiAction } from '@neoverse-ui/react';

<UiAction href="/docs">Open docs</UiAction>
```

For framework routing components, use `asChild` so the router keeps ownership of navigation while Neoverse UI owns control geometry, material, state, and focus styling.

## Dock

`UiDock` is a reusable floating-navigation shell. Pass navigation content through `children` and optional mode/language controls through `trailing`; route data and active state remain consumer-owned.

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
