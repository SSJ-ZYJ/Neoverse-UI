# @neoverse-ui/tailwind

Tailwind CSS v4 semantic theme and component styles for Neoverse UI.

```sh
bun add @neoverse-ui/tailwind
```

For a Tailwind build, import the shared theme and scan your application sources:

```css
@import 'tailwindcss';
@import '@neoverse-ui/tailwind/theme.css';

@source './src';
```

The package also exposes `@neoverse-ui/tailwind/index.css` as a compiled consumer bundle, `@neoverse-ui/tailwind/components.css` as the component selector facade, and `@neoverse-ui/tailwind/prose.css` for the shared `.neoverse-prose` reading semantics.

`.neoverse-prose` intentionally does not own line length. Pair it with semantic layout roles such as `max-w-reading` or `max-w-reading-wide` so typography and page composition remain independent.

For architecture and contribution guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
