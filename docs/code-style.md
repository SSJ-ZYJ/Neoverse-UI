# Code style and terminology

Status: adopted

This file is the single source of truth for the language, naming and terminology
used in source code, tests and scripts. It applies to `packages/*/src`,
`apps/*/src`, `scripts` and `tests`. Formatting is owned by Biome; this document
covers what a formatter cannot decide. Documentation follows
[AGENTS.md](AGENTS.md).

## Language

English is the only language of the repository's code artifacts: identifiers,
comments, JSDoc, test titles, file names, commit messages and branch names.

Chinese is data, not prose. It is allowed only where the value is displayed to a
Chinese reader:

- `zh` entries in locale maps such as `name: { zh: '极光玻璃', en: 'Aurora Glass' }`.
- Demo copy inside the playground fixtures when the fixture exists to exercise
  CJK input, line breaking or IME composition (for example `'你好 release'`).

A comment is never written twice in two languages. A bilingual pair is the most
common form of comment rot in this repository: the two halves drift, and the
translated half repeats the code instead of explaining it.

Documentation follows the ownership rules in [AGENTS.md](AGENTS.md). A document
that describes a public contract is written in English; an internal working
record may be written in Chinese. A document has exactly one prose language:
identifiers, code blocks, command lines and English product names inside a
Chinese document are not mixing, but a paragraph is never repeated in both
languages. `consumer-sizing.md`, `framework-parity.md` and
`component-requests.md` are Chinese working records; the contract documents
listed in [AGENTS.md](AGENTS.md) are English.

## Comments

- Explain why the code is the way it is, not what the statement does. A comment
  that restates the next line is deleted.
- Every public export carries a one-line JSDoc sentence. Multi-line JSDoc is
  reserved for contracts a consumer must know: ordering, ownership of focus,
  dismissal reasons, and anything that would otherwise be rediscovered by a bug.
- Long explanations belong in the owning document under `docs/`; the comment
  links to it. Do not paste a dated investigation into source.
- No commented-out code, no changelog comments, no author tags.
- `TODO` takes an owner and an action: `TODO(@owner): replace the fallback when
  Safari ships scroll-driven animations.`
- Imperative mood, present tense, no trailing period on single-line JSDoc.
- Markdown inside JSDoc uses backticks for identifiers and `->` for sequences.

## Naming

| Artifact | Convention | Example |
| --- | --- | --- |
| Vue component file | `Ui` + PascalCase | `UiContextMenu.vue` |
| React component | `Ui` + PascalCase export | `UiContextMenu` |
| Type / interface | PascalCase, no `I` prefix | `ContextMenuProps` |
| Function / variable | camelCase, verb first for actions | `resolveAnchoredPosition` |
| Boolean | positive adjective, no `is` prefix | `disabled`, `open`, `manual` |
| Constant | camelCase unless truly global | `overlayCleanup` |
| CSS class | `ui-` block + `__element` + `--modifier` | `ui-card__header`, `ui-card--elevated` |
| CSS custom property | `--neoverse-` + kebab-case | `--neoverse-overlay-gap` |
| Data attribute | `data-neoverse-` for runtime hooks | `data-neoverse-overlay-side` |
| Test file | `<module>.spec.ts` under `tests/e2e` | `tests/e2e/forms.spec.ts` |

A public prop name is camelCase and matches its attribute form after Vue/React
normalisation. DOM attributes that a component forwards keep the platform
spelling (`aria-label`, `autocomplete`) and are never renamed.

`props` is the accepted name for component inputs. `children` is the accepted
React slot name. No other abbreviation is allowed in a public name without an
entry in the table below.

## Abbreviations

Spell the word out. Abbreviate only when the short form is the name the platform
or the industry actually uses, and then use the casing below everywhere: in
identifiers, comments, test titles and documentation.

| Abbreviation | Expansion | Scope |
| --- | --- | --- |
| API | application programming interface | all |
| ARIA | Accessible Rich Internet Applications | all |
| a11y | accessibility | file names, test titles, prose only |
| CLI | command-line interface | scripts, docs |
| CSS | Cascading Style Sheets | all |
| CI | continuous integration | scripts, docs |
| DOM | Document Object Model | all |
| DPR | device pixel ratio | glass runtime only |
| e2e | end-to-end | test names and titles; `e2e` is lower case in prose |
| FPS | frames per second | playground only |
| GLSL | OpenGL Shading Language | glass runtime only |
| HTML | HyperText Markup Language | all |
| ID | identifier | all; never `Id`, `id` in prose |
| IME | input method editor | form tests, docs |
| JS / TS | JavaScript / TypeScript | prose and file suffixes only |
| JSON | JavaScript Object Notation | all |
| LTR / RTL | left-to-right / right-to-left | all |
| SVG | Scalable Vector Graphics | all |
| UI | user interface | all |
| URL | Uniform Resource Locator | all |
| UX | user experience | docs |
| WCAG | Web Content Accessibility Guidelines | docs |
| WebGL | Web Graphics Library | glass runtime |

Never introduce `btn`, `dlg`, `mgr`, `ctx`, `idx`, `elem`, `tmp`, `util`, `obj`
or `val` in new code. `util` becomes `support`, `helper` or a named module.
Single-letter identifiers are limited to coordinates (`x`, `y`), matrix indices
and loop counters.

`AX` and `Ax` are not abbreviations in this repository; write `a11y` or
`accessibility`.

## Terminology

One concept, one word. The right-hand column lists forms that must not appear in
new code, comments or documentation.

| Canonical | Meaning | Do not write |
| --- | --- | --- |
| Aurora Glass | the material system and its optical contract; `Glass` is the accepted short form after the first mention, and `glass-*` identifiers stay stable | "glass material" as a proper noun, `极光玻璃` in English prose |
| surface | the shared `UiSurface` plate and its material | panel, plate, box (when the primitive is meant) |
| overlay | anything the runtime positions in the top layer | popover (when the runtime is meant) |
| popover | the native HTML popover API or `UiPopover` | overlay (when the component is meant) |
| panel | the positioned plate inside an overlay | popover, dialog |
| tier | glass density level (`subtle`, `elevated`, `immersive`) | level, grade |
| preset | a named surface recipe (`glass-elevated`) | variant |
| variant | semantic intent (`primary`, `danger`) | preset, style |
| control | the native form element inside a field | input (for checkbox/radio/switch) |
| size | the canonical prop for a component's dimensions | scale (see the legacy exception below) |
| field | the `UiField` wrapper: label, description, validation | form group |
| consumer | the downstream project that installs a package | user, client, app |
| adapter | the Vue or React implementation of a shared contract | wrapper, binding |
| specimen | a playground preview of one component state | sample, demo |
| dock | the navigation dock component | toolbar, nav bar |
| shell | the playground application chrome | layout, frame |
| light-dismiss | close on outside pointer input | click-outside, auto close |
| top layer | the browser top layer; `top-layer` only as an adjective | overlay layer |

Legacy exception: `UiAction` and `UiControlSurface` expose `scale` (`md` / `lg`)
for the same concept that `UiButton` and the other controls call `size`. The
public prop cannot be renamed without a breaking release; new components use
`size`, and a future major may align the older two. Do not add `scale` to a new
component.

## Spelling

United States English: `color`, `behavior`, `centered`, `canceled`,
`organization`, `normalize`. This matches the CSS, SVG and DOM APIs the code
calls, so one spelling covers both prose and identifiers.

Exceptions, because the platform defines the spelling: CSS properties and
keywords (`color`, `color-scheme`, `text-align`), DOM APIs
(`getComputedStyle`), and third-party package names. Never rewrite a quoted
platform string to match this rule.

British forms (`colour`, `behaviour`, `centred`, `cancelled`, `organisation`)
are rejected in new code and are migrated when a file is touched.

## Tests

- A test title is one English sentence describing an observable user outcome:
  `<actor> <action> <expected result>`.
- Do not encode the file name, the implementation or a CSS class in the title.
- Test helpers use the same naming rules as production code; a helper that only
  one module needs lives in that module's file.
- Comments in tests follow the same rules as production comments: explain the
  non-obvious reason, never narrate the steps.

## Enforcement

`bun run lint:language` scans every tracked source file under `apps/`,
`packages/`, `scripts/` and `tests/` for:

- CJK characters in comments; localized values inside string literals are ignored,
  so a `zh` label or a CJK fixture value passes,
- the British spellings listed above, in comments and identifiers,
- the banned abbreviations `AX` and `Ax`.

It runs as part of `bun run lint` and `bun run release:check`. A violation fails
the build with the file, line and the replacement to use. Historical records in
`.agents/notes/archives/` keep their original wording and are out of scope.
