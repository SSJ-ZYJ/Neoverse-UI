# Terminal composition

Neoverse-UI provides a **terminal presentation**, not a shell emulator or command runtime.
The prompt is a text line rather than a form-field surface: translucent Glass stays on the
outer `UiTerminalSurface`; the editor itself has no border, fill, shadow or rounded box.

## Vue example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import {
  type TerminalPromptSegment,
  UiTerminalEcho,
  UiTerminalLine,
  UiTerminalPrompt,
  UiTerminalSurface,
  UiTerminalTranscript,
} from '@neoverse-ui/vue';

const command = ref('');
const history = ref<{ text: string; segments: readonly TerminalPromptSegment[] }[]>([]);
const segments = [
  { id: 'host', label: 'neoverse', tone: 'host' },
  { id: 'path', label: '~/workspace', tone: 'path' },
  { id: 'branch', label: 'dev', tone: 'branch' },
] as const;
function submit(event: KeyboardEvent) {
  if (event.isComposing || event.key !== 'Enter' || !command.value.trim()) return;
  event.preventDefault();
  history.value.push({ text: command.value, segments: segments.map(segment => ({ ...segment })) });
  command.value = '';
}
</script>

<template>
  <UiTerminalSurface title="Workspace terminal">
    <template #status>Connected</template>
    <UiTerminalTranscript label="Terminal history">
      <UiTerminalLine text="Welcome to the workspace." />
      <UiTerminalEcho v-for="(line, i) in history" :key="i" :text="line.text" :segments="line.segments" />
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
- `UiTerminalEcho` renders a recorded command as selectable, escaped text with no input, label or tab stop. Its `text`, `segments`, `symbol` and `error` reuse the live prompt's internal segment renderer, geometry and tokens; Vue `#segment` and React `renderSegment` customize the same chrome. Empty segments omit the context row. Preserve segment values when committing history rather than binding old entries to the current working directory. `UiTerminalPrompt readonly` remains a native input, not a transcript echo.
- Both light and dark themes expose all segment colors through `cssVariables.components.terminal`. The layered context colors derive from `--neoverse-color-accent-primary` and the theme's neutral/text roles; the command marker and caret use the brighter secondary accent in Dark, and the existing `mint-700` palette role in Light for adequate contrast against the pale canvas. Light uses pale opaque context fills and dark uses deeper opaque fills, preserving flush rounded transitions without overlapping translucent colors. Branch, runtime and time foregrounds have separate semantic roles. Changing theme colors does not change the geometry or typography. No third-party fonts are bundled.
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

## React example

```tsx
import { useState } from 'react';
import { UiTerminalSurface, UiTerminalTranscript, UiTerminalLine, UiTerminalEcho, UiTerminalPrompt, type TerminalPromptSegment } from '@neoverse-ui/react';

const segments: readonly TerminalPromptSegment[] = [
  { id: 'host', label: 'neoverse', tone: 'host' },
  { id: 'path', label: '~/workspace', tone: 'path' },
];

export function Terminal() {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<{ text: string; segments: readonly TerminalPromptSegment[] }[]>([]);
  return (
    <UiTerminalSurface title="Workspace terminal" status="Connected">
      <UiTerminalTranscript label="Terminal history">
        <UiTerminalLine text="Welcome to the workspace." />
        {history.map((line, index) => <UiTerminalEcho key={index} text={line.text} segments={line.segments} />)}
        <UiTerminalPrompt
          label="Terminal command"
          value={command}
          onValueChange={setCommand}
          suggestion="help --all"
          segments={segments}
          onKeyDown={event => {
            if (event.nativeEvent.isComposing || event.key !== 'Enter' || !command.trim()) return;
            event.preventDefault();
            setHistory(lines => [...lines, { text: command, segments: segments.map(segment => ({ ...segment })) }]);
            setCommand('');
          }}
        />
      </UiTerminalTranscript>
    </UiTerminalSurface>
  );
}
```

Put interactive React compositions in your application's client boundary. `context` and
`renderSegment(segment)` correspond to Vue's context and segment slots; `status` and `actions`
are ReactNode properties on the surface. A prompt ref targets its native input. See
[framework parity](framework-parity.md) for the new React adapters' validation scope.

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
`UiTerminalEcho` is covered by the Vue terminal and React parity browser scenarios and
the XCA `terminal-shared-ui.spec.ts` / `terminal-visual-acceptance.spec.ts` consumer scenarios:
recorded host/path snapshots, light/dark at desktop/narrow widths, text selection,
one native editor, accessible live log and transcript following. Windows and Linux screenshot
baselines include both live and recorded prompts. React has browser-fixture evidence,
not real-product consumer evidence. Existing four terminal primitives retain their
Stable status; the echo remains Consumer Validation rather than being auto-promoted.

Local CR-20261024-7E4A21C9 evidence: Vue adapter suite (75 passing), React adapter suite
(38 passing), Windows and native Linux terminal/React browser scenarios (50 passing
on each platform without snapshot updates), and XCA shared-UI/visual/completion scenarios (17 passing without snapshot
updates). The eight package archives pass public export/type verification. XCA's
five Windows baselines and the UI's platform-specific baselines cover the echo cutover.

Package versioning and npm publication remain a separate step.
