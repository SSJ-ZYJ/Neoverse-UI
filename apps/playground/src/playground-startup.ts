import { layoutBreakpoints, type MaterialMode } from '@neoverse-ui/tokens';
import {
  isLocale,
  type Locale,
  type LocalizedText,
  resolveWorkspaceLocale,
} from './content/locale';
import { defaultMaterialMode, materialModes, selectInitialMaterialMode } from './material-runtime';
import { appCopy } from './playground-content';
import { playgroundPreferencesKey, readPreferences } from './playground-preferences';
import type { ThemeMode } from './playground-types';
import { defaultStageBackground, stageBackgrounds } from './stage-background';
import {
  defaultThemeMode,
  isReloadNavigation,
  selectInitialThemeMode,
  themeModes,
} from './theme-runtime';

const desktopQuery = `(min-width: ${layoutBreakpoints.xl}px)`;

/** Put the mounted workspace's appearance rules on the document before CSS paints. */
export function renderWorkspaceStartupScript(
  theme: ThemeMode | undefined,
  locale: Locale | undefined,
  material: MaterialMode | undefined,
): string {
  // Serialize only self-contained helpers. Pass every argument that has a module-local default.
  return `<script>
  (() => {
    const preferences = (${readPreferences.toString()})(${JSON.stringify(playgroundPreferencesKey)});
    const root = document.documentElement;
    const theme = (${selectInitialThemeMode.toString()})(
      ${JSON.stringify(theme) ?? 'undefined'}, preferences.theme, (${isReloadNavigation.toString()})(),
      ${JSON.stringify(themeModes)}, ${JSON.stringify(defaultThemeMode)}
    );
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.dataset.theme = theme;
    const material = (${selectInitialMaterialMode.toString()})(
      ${JSON.stringify(material) ?? 'undefined'}, preferences.material, (${isReloadNavigation.toString()})(),
      ${JSON.stringify(materialModes)}, ${JSON.stringify(defaultMaterialMode)}
    );
    root.dataset.neoverseMaterial = material;
    const locale = (${resolveWorkspaceLocale.toString()})(
      ${JSON.stringify(locale) ?? 'undefined'}, preferences.locale, navigator.language, (${isLocale.toString()})
    );
    root.lang = locale === 'zh' ? 'zh-CN' : 'en';
    root.toggleAttribute('data-startup-persistent', matchMedia(${JSON.stringify(desktopQuery)}).matches);
    const backgrounds = ${JSON.stringify(stageBackgrounds)};
    root.dataset.startupBackground = backgrounds.includes(preferences.stageBackground)
      ? preferences.stageBackground
      : ${JSON.stringify(defaultStageBackground)};
  })();
</script>`;
}

/** Frame and fixture routes resolve the same material selection before first paint. */
export function renderMaterialStartupScript(material: MaterialMode | undefined): string {
  return `<script>
  (() => {
    const preferences = (${readPreferences.toString()})(${JSON.stringify(playgroundPreferencesKey)});
    const material = (${selectInitialMaterialMode.toString()})(
      ${JSON.stringify(material) ?? 'undefined'}, preferences.material, (${isReloadNavigation.toString()})(),
      ${JSON.stringify(materialModes)}, ${JSON.stringify(defaultMaterialMode)}
    );
    document.documentElement.dataset.neoverseMaterial = material;
  })();
</script>`;
}

const label = (text: LocalizedText) =>
  `<span data-startup-language="en">${text.en}</span><span data-startup-language="zh">${text.zh}</span>`;

const placeholder = '<span class="playground-startup__placeholder"></span>';

const panelHeading = (text: LocalizedText, search = false) =>
  `<header class="playground-shell__panel-header">
    <div class="playground-shell__panel-title">
      <h2 class="text-title-sm font-title text-primary">${label(text)}</h2>
    </div>
    ${search ? `<div class="playground-startup__search" aria-hidden="true">${placeholder}</div>` : ''}
  </header>`;

/** Noninteractive first-paint shell using the same regions as the live workspace. */
export const workspaceStartupMarkup = `<div class="playground-shell" data-playground-startup>
  <header class="playground-shell__toolbar ui-surface material-auto material-solid-control material-glass-subtle" data-surface="auto" data-neoverse-surface-hover="static">
    <div class="playground-shell__identity">
      <span class="playground-startup__menu" aria-hidden="true">${placeholder}</span>
      <span class="playground-shell__brand-wordmark text-primary" role="img" aria-label="${appCopy.brand.en}"></span>
      <h1 class="playground-shell__name text-label-lg font-label text-secondary">${label(appCopy.designLab)}</h1>
    </div>
    <div class="playground-shell__toolbar-actions" aria-hidden="true">
      <span class="flex playground-startup__compact sm:hidden">${placeholder.repeat(3)}</span>
      <span class="playground-startup__options hidden sm:flex">${placeholder.repeat(themeModes.length)}</span>
      <span class="playground-startup__options hidden sm:flex">${placeholder.repeat(materialModes.length)}</span>
      <span class="playground-startup__options hidden sm:flex">${placeholder.repeat(2)}</span>
      <span class="playground-startup__menu">${placeholder}</span>
    </div>
  </header>
  <aside class="playground-shell__panel playground-shell__explorer material-auto material-solid-overlay material-glass-subtle" data-surface="auto" data-neoverse-glass-edge-stroke data-neoverse-surface-hover="static">
    ${panelHeading(appCopy.navigation.label, true)}
    <div class="playground-shell__panel-body playground-startup__panel-lines" aria-hidden="true">${placeholder.repeat(6)}</div>
  </aside>
  <main class="playground-shell__workspace scrollbar-immersive">
    <div class="playground-stage">
      <div class="playground-stage__chrome">
        <div class="playground-stage__identity">
          <p class="playground-stage__label text-label-sm font-label text-secondary"><span aria-hidden="true"></span>${label(appCopy.previewStage)}</p>
        </div>
        <span class="playground-startup__options playground-startup__stage-options" aria-hidden="true">${placeholder.repeat(stageBackgrounds.length)}</span>
      </div>
      <div class="playground-stage__module">
        <p role="status" class="text-body text-secondary">${label(appCopy.loadingPreview)}</p>
      </div>
    </div>
  </main>
  <aside class="playground-shell__panel playground-shell__inspector material-auto material-solid-overlay material-glass-subtle" data-surface="auto" data-neoverse-glass-edge-stroke data-neoverse-surface-hover="static">
    ${panelHeading(appCopy.inspector.label)}
    <div class="playground-shell__panel-body playground-inspector" aria-hidden="true">
      <section class="playground-startup__panel-lines">${placeholder.repeat(3)}</section>
    </div>
  </aside>
</div>`;
