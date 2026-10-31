# @neoverse-ui/tokens

Design tokens, CSS variables, and token-name maps for Neoverse UI.

```sh
bun add @neoverse-ui/tokens
```

Use the generated CSS variables with:

```css
@import '@neoverse-ui/tokens/css';
```

TypeScript consumers can import the public token-name maps from `@neoverse-ui/tokens`.

## Aurora Glass

Aurora Glass is the single shared glass material. Light, Standard, and
Immersive are its tiers, not independent styles.
The stable technical surface identifiers remain `glass-subtle`, `glass-elevated`,
and `glass-immersive`, respectively; `glass-*` does not name another glass style.

Use the shared metadata for consumer-facing labels:

```ts
import { glassMaterial } from '@neoverse-ui/tokens';

glassMaterial.name.en; // Aurora Glass
glassMaterial.name.zh; // Chinese display name
glassMaterial.tiers.subtle; // { en: 'Light', zh: Chinese tier name }
glassMaterial.tiers.elevated; // { en: 'Standard', zh: Chinese tier name }
glassMaterial.tiers.immersive; // { en: 'Immersive', zh: Chinese tier name }
```

`tiers` exports short tier names; combine them with `name` when a full material
label is needed. The `zh` entries hold the localized Chinese names for
consumers that display them in Chinese. CSS classes, variables, and existing
TypeScript APIs retain their technical names. See [material standards](../../docs/material-standards.md)
for optical values and usage.

For architecture, theme contracts, and contribution guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
