# @neoverse-ui/react

React adapters for Neoverse UI.

The package exposes the same token-backed Tailwind component contract used by the Vue adapter. It currently provides `UiAction`, `UiSurface`, and the `uiActionClassName` helper needed when a consumer must style an existing routing component through `asChild` composition.

```tsx
import { UiAction } from '@neoverse-ui/react';

<UiAction href="/docs">Open docs</UiAction>
```

For framework routing components, use `asChild` so the router keeps ownership of navigation while Neoverse UI owns control geometry, material, state, and focus styling.
