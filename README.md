# Neoverse UI

A lightweight Bun monorepo for shared design tokens, Tailwind CSS, motion primitives, and future Vue and React adapters.

## Requirements

- Bun 1.4.0
- TypeScript
- Tailwind CSS 4

Bun is the only package manager, workspace manager, and script runner for this repository.

## Workspace layout

```text
apps/playground       Bun + TypeScript integration playground
packages/tokens       CSS Variable design tokens and token-name types
packages/tailwind     Tailwind semantic theme and compiled stylesheet
packages/motion       Framework-agnostic motion primitives
packages/vue          Reserved Vue integration boundary
packages/react        Reserved React integration boundary
docs                  Architecture and development notes
```

The Vue and React packages intentionally contain no component implementation yet.

## Commands

```sh
bun install
bun run dev
bun run build
bun run lint
bun run typecheck
bun run format
bun run check
```

`bun run dev` starts the playground and Tailwind watch process together. The playground is served at `http://localhost:3000` by default.

## Tailwind Foundation

`@neoverse-ui/tokens` owns the raw CSS Variables. `@neoverse-ui/tailwind` maps them into the shared Tailwind v4 semantic theme:

```text
bg-surface-raised  text-primary  border-subtle
rounded-control    shadow-card   ring-focus
```

The compiled workspace stylesheet is available from `@neoverse-ui/tailwind` or `@neoverse-ui/tailwind/index.css`. An application that compiles its own Tailwind CSS should import the reusable theme and declare its own source paths:

```css
@import 'tailwindcss';
@import '@neoverse-ui/tailwind/theme.css';

@source "./src";
```

Vue and React integrations use this same theme entry. They do not maintain separate Tailwind foundations.

## Surface / Glass Material System

Surface materials use ordinary Tailwind composition:

```text
Surface Solid    bg-surface-canvas border-subtle
Surface Subtle   bg-surface-subtle border-subtle
Surface Elevated bg-surface-raised border-default shadow-raised
```

Complex Glass materials use the three shared utilities:

```text
material-glass-subtle
material-glass-elevated
material-glass-immersive
```

Their Background, Transparency, Blur, Saturation, Border, Edge Highlight, Shadow, and Refraction Gradient values come from `@neoverse-ui/tokens`. Border and spatial depth remain available when backdrop filtering is unsupported or reduced. Glass nested under another Glass material is downgraded to an opaque Surface.

## Motion Foundation

`@neoverse-ui/motion` provides the shared CSS entry and framework-agnostic TypeScript names. Import the CSS in Tailwind, Vue, and React consumers:

```css
@import '@neoverse-ui/motion/css';
```

Canonical Tailwind utilities are token-backed:

```text
duration-fast       duration-standard       duration-expressive
ease-standard       ease-emphasized
```

Use them with normal transition utilities. Micro, state, and spatial transition aliases are available as CSS Variables; the package does not provide a runtime animation API or business keyframes. `prefers-reduced-motion: reduce` reduces durations to `1ms`, uses `step-end`, and removes the spatial distance token.

## Theme model

The default mode follows the system color preference. Set `data-theme="light"`, `data-theme="dark"`, or `data-theme="system"` on the root element. Root `.light` and `.dark` classes remain supported when `data-theme` is absent.

Semantic variables can be overridden by a consumer on a root theme selector. Primitive color, geometric radius, and geometric shadow utilities remain Tailwind fallbacks, but business source should use the semantic contract; `bun run lint` includes the primitive utility check.

## Changesets

Create a release note with:

```sh
bun run changeset
```

The public packages use independent versions. The playground and the not-yet-implemented Vue and React boundaries are excluded from releases.
