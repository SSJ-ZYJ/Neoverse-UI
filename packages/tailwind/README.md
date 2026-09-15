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

The package also exposes `@neoverse-ui/tailwind/index.css` as a compiled consumer bundle and `@neoverse-ui/tailwind/components.css` as the component selector facade.

For architecture and contribution guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
