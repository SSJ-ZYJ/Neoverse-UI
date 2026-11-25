import { appCopy, formatLocalized, isLocale, type Locale, localize } from './playground-content';
import { renderWorkspaceStartupScript, workspaceStartupMarkup } from './playground-startup';
import { defaultThemeMode, isFrameTheme, readThemeModeFromSearch } from './theme-runtime';

const builtAssets = {
  stylesheet: '/styles.css',
  scopedStylesheet: '/scoped.css',
  workspaceStylesheet: '/assets/workspace.css',
  playground: '/assets/playground.js',
  'react-fixture': '/assets/react-fixture.js',
};

type DocumentAssets = Omit<typeof builtAssets, 'scopedStylesheet'> & { scopedStylesheet?: string };

type DocumentRoute = { entry: 'playground' | 'react-fixture'; html: string } | { error: string };

export const resolvePlaygroundDocument = (
  url: URL,
  assets: DocumentAssets = builtAssets,
): DocumentRoute | undefined => {
  const frame = url.pathname === '/frame';
  const react = url.pathname === '/react-fixture';
  if (url.pathname !== '/' && !frame && !react) return undefined;

  const queryLocale = url.searchParams.get('lang');
  const explicitLocale = isLocale(queryLocale) ? queryLocale : undefined;
  const locale: Locale = explicitLocale ?? 'en';
  const explicitTheme = readThemeModeFromSearch(url.search);
  const theme = explicitTheme ?? defaultThemeMode;
  if (frame && !isFrameTheme(theme)) {
    return { error: localize(appCopy.frame.invalidTheme, locale) };
  }
  const entry = react ? 'react-fixture' : 'playground';
  const title = react
    ? 'Neoverse UI React Fixture'
    : frame && isFrameTheme(theme)
      ? formatLocalized(appCopy.framePageTitle, locale, {
          title: localize(appCopy.pageTitle, locale),
          theme: localize(appCopy.module.themeNames[theme], locale),
        })
      : localize(appCopy.pageTitle, locale);
  const scopedStylesheet = react ? undefined : assets.scopedStylesheet;
  const root = react ? 'react-root' : 'app';
  const scrollbar = react ? '' : ' class="scrollbar-immersive"';
  const shell = !frame && !react;
  const workspace = react ? '' : ` data-playground-view="${frame ? 'frame' : 'shell'}"`;
  const startupScript = shell ? renderWorkspaceStartupScript(explicitTheme, explicitLocale) : '';
  const workspaceLink = react
    ? ''
    : `<link rel="stylesheet" href="${assets.workspaceStylesheet}" />`;

  return {
    entry,
    html: `<!doctype html>
<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}" data-theme="${theme}"${scrollbar}${workspace}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${startupScript}
    <title>${title}</title>
    ${scopedStylesheet === undefined ? '' : `<link rel="stylesheet" href="${scopedStylesheet}" />`}
    ${workspaceLink}
    <link rel="stylesheet" href="${assets.stylesheet}" />
  </head>
  <body class="min-h-screen bg-surface-canvas font-sans text-primary antialiased">
    <div id="${root}">${shell ? workspaceStartupMarkup : ''}</div>
    <script type="module" src="${assets[entry]}"></script>
  </body>
</html>`,
  };
};
