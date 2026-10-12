# Terminal composition

Neoverse-UI provides a **terminal presentation**, not a shell emulator or command runtime.
The prompt is a text line rather than a form-field surface: translucent Glass stays on the
outer `UiTerminalSurface`; the editor itself has no border, fill, shadow or rounded box.

## Vue example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  UiTerminalLine,
  UiTerminalPrompt,
  UiTerminalSurface,
  UiTerminalTranscript,
} from '@neoverse-ui/vue';

const command = ref('');
const history = ref(['Welcome to the workspace.']);
const segments = [
  { id: 'host', label: 'neoverse', tone: 'host' },
  { id: 'path', label: '~/workspace', tone: 'path' },
  { id: 'branch', label: 'dev', tone: 'branch' },
] as const;
function submit(event: KeyboardEvent) {
  if (event.isComposing || event.key !== 'Enter' || !command.value.trim()) return;
  event.preventDefault();
  history.value.push(`❯ ${command.value}`);
  command.value = '';
}
</script>

<template>
  <UiTerminalSurface title="Workspace terminal">
    <template #status>Connected</template>
    <UiTerminalTranscript label="Terminal history">
      <UiTerminalLine v-for="(line, i) in history" :key="i" :text="line" />
    </UiTerminalTranscript>
    <UiTerminalPrompt
      v-model="command"
      label="Terminal command"
      :segments="segments"
      placeholder="type a command…"
      @keydown="submit"
    />
  </UiTerminalSurface>
</template>
```

- `UiTerminalSurface` composes an existing Glass Surface with accessible title and action slots.
- `UiTerminalLine` renders strings as text, preserving copy/selection; `preformatted` handles ASCII banners separately.
- `UiTerminalTranscript` has a native scroll region and nested live log; it auto-follows only while at bottom, reusing `scrollbar-immersive`.
- `UiTerminalPrompt` owns a transparent **native** `<input>` that looks indistinguishable from inline terminal text. Do not use `UiInput` here. The prompt has a composable `segments` array (host, path, branch, runtime, time) or `#context` slot; `#segment="{ segment }"` customizes each segment's content while preserving the shared shape and colors. A text/password/search type, disabled, readonly, error, and native attrs remain available. Focus is exposed to consumers via `ref.focus()`. Enter handling and IME composition are consumer responsibilities.
- Both light and dark themes expose all segment colors through `cssVariables.components.terminal`. The layered context colors derive from `--neoverse-color-accent-primary` and the theme's neutral/text roles; the command marker and caret use the secondary accent. Light uses pale opaque context fills and dark uses deeper opaque fills, preserving flush rounded transitions without overlapping translucent colors. Branch, runtime and time foregrounds have separate semantic roles. Changing theme colors does not change the geometry or typography. No third-party fonts are bundled.
- Three full-height shade bands lead into flush, overlapping round caps. The context and next-line editor share the same monospace text size; the last cap stays inside the horizontally scrollable context on narrow screens. All shapes use CSS geometry, not Nerd Font private glyphs. Optional host, branch or runtime segments can be omitted without changing the join geometry.
- All terminal primitives use `--neoverse-font-family-code-maple`, which prefers the installed **Maple Mono NF CN** for both Chinese and Latin text. The regular Maple Mono Latin webfont is a fallback, not a replacement for the NF CN font. Consumers without an installed NF CN font can supply an `@font-face` for that family; otherwise the stack explicitly includes the shared Chinese sans fonts. The default code-font role outside the terminal remains independently configurable.
- The previous `UiInput appearance="terminal"` approach was removed. Regular form inputs retain the regular form appearance.

The optional `suggestion` prop is a full proposed value. The shared prompt displays only its
matching suffix in muted italic text, without changing the input value. It appears only while
focused at the end without a selection or IME composition, and is hidden for password,
readonly and disabled inputs. The overlay follows native horizontal scrolling and is excluded
from accessibility and text selection. Consumers own candidate selection, dismissal and
acceptance keys. XCA uses session completions/history and ArrowRight to accept.

Terminal text enables the font's `liga` and `calt` features. The native editor and
ghost prefix inherit the same settings. Ghost suffixes allow italic synthesis when a
consumer provides only a regular font face and disables synthesis globally.

## Visual inspiration and license boundary

The design is **inspired by** the [Starship Tokyo Night preset](https://starship.rs/zh-CN/presets/tokyo-night), especially its compact layered Powerline-like context and separate next-line command marker.

- [Starship](https://github.com/starship/starship) is ISC licensed, copyright © 2019–present Starship Contributors.
- The [Tokyo Night VS Code theme](https://github.com/tokyo-night/tokyo-night-vscode-theme), which Starship credits as inspiration, is MIT licensed.
- This UI contains independently authored CSS shapes, markup and semantic color mappings. No preset TOML, image, licensed font file, logo, screenshots or third-party source code are copied or redistributed. The names above are attribution, **not affiliation or endorsement**.
- If a future change vendors a Starship configuration, Tokyo Night theme source, Nerd Font or official assets, it must record their **exact** upstream license and copyright notices separately. This implementation avoids that dependency.

## Scope and validation

The terminal primitives handle presentation only. Shell parsing, authentication, command history, completion and XCA Boot → Dock animation remain in consumer projects. A standalone simulated cursor is intentionally not provided: native caret is used so IME, editing, password masking and reduced motion remain intact.

XCA validates `UiTerminalPrompt` through its real command input, including ghost suggestions,
native selection/IME and existing Tab cycling (`tests/e2e/terminal-completion.spec.ts`).
Release screenshot approval and npm publication remain pending. The terminal primitives remain
at Consumer Validation maturity.
