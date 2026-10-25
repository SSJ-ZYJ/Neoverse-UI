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

## Aurora Glass / 极光玻璃

Aurora Glass (极光玻璃) is the single shared glass material. Light / 轻薄,
Standard / 标准, and Immersive / 厚实 are its tiers, not independent styles.
The stable technical surface identifiers remain `glass-subtle`, `glass-elevated`,
and `glass-immersive`, respectively; `glass-*` does not name another glass style.

Use the shared metadata for consumer-facing labels:

```ts
import { glassMaterial } from '@neoverse-ui/tokens';

glassMaterial.name.zh; // 极光玻璃
glassMaterial.name.en; // Aurora Glass
glassMaterial.tiers.subtle; // { zh: '轻薄', en: 'Light' }
glassMaterial.tiers.elevated; // { zh: '标准', en: 'Standard' }
glassMaterial.tiers.immersive; // { zh: '厚实', en: 'Immersive' }
```

`tiers` exports short tier names; combine them with `name` when a full material
label is needed. CSS classes, variables, and existing TypeScript APIs retain their
technical names. See [material standards](../../docs/material-standards.md) for
optical values and usage.

For architecture, theme contracts, and contribution guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
