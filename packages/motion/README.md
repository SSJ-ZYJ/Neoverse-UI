# @neoverse-ui/motion

Framework-agnostic motion tokens, semantic motion roles, and reduced-motion CSS for Neoverse UI.

```sh
bun add @neoverse-ui/motion
```

Import the shared motion layer with:

```css
@import '@neoverse-ui/motion/css';
```

`@neoverse-ui/tokens` is installed as an internal runtime dependency.

The package intentionally does not ship generic entrance-animation recipes. Shared components consume the `feedback`, `state`, and `spatial` role variables directly so motion remains tied to real interaction and layout behavior.

For architecture and contribution guidance, see the [Neoverse-UI repository](https://github.com/SSJ-ZYJ/Neoverse-UI).
