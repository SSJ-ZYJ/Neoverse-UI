import { appCopy, formatLocalized, isLocale, type Locale, localize } from './playground-content';
import type { FrameTheme } from './playground-types';

type RenderOptions = {
  theme?: FrameTheme;
  locale: Locale;
};

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const liveReload = process.env.LIVE_RELOAD === '1';
const stylesheetPath = new URL('../../../packages/tailwind/dist/index.css', import.meta.url);
const clientBundlePath = new URL('../dist/assets/playground.js', import.meta.url);
const materialBackgroundPath = new URL('../dist/assets/material-background.png', import.meta.url);

const isFrameTheme = (value: string | null): value is FrameTheme =>
  value === 'light' || value === 'dark';

// Dev-only: reload the page when either served asset changes on disk.
const liveReloadScript = liveReload
  ? `<script>
  (() => {
    let version = null;
    setInterval(() => {
      fetch('/__live', { cache: 'no-store' })
        .then((response) => response.json())
        .then((next) => {
          const key = String(next.css) + ':' + String(next.js);
          if (version !== null && version !== key) {
            location.reload();
          }
          version = key;
        })
        .catch(() => {});
    }, 500);
  })();
</script>`
  : '';

const renderDocument = ({ theme, locale }: RenderOptions): string => {
  const title =
    theme === undefined
      ? localize(appCopy.pageTitle, locale)
      : formatLocalized(appCopy.framePageTitle, locale, {
          title: localize(appCopy.pageTitle, locale),
          theme: localize(appCopy.module.themeNames[theme], locale),
        });

  return `<!doctype html>
<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}" data-theme="${theme ?? 'system'}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="min-h-screen bg-surface-canvas font-sans text-primary antialiased">
    <div id="app"></div>
    <script type="module" src="/assets/playground.js"></script>
    ${liveReloadScript}
  </body>
</html>`;
};

const missingAssetResponse = (asset: string, locale: Locale): Response =>
  new Response(formatLocalized(appCopy.server.assetsUnavailable, locale, { asset }), {
    status: 503,
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
const ensureDesignLabAssets = async (locale: Locale): Promise<Response | undefined> => {
  const stylesheet = Bun.file(stylesheetPath);
  const clientBundle = Bun.file(clientBundlePath);
  const materialBackground = Bun.file(materialBackgroundPath);

  if (
    !(await stylesheet.exists()) ||
    !(await clientBundle.exists()) ||
    !(await materialBackground.exists())
  ) {
    return missingAssetResponse(localize(appCopy.server.assetsLabel, locale), locale);
  }

  return undefined;
};

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const queryLocale = url.searchParams.get('lang');
    const locale: Locale = isLocale(queryLocale) ? queryLocale : 'en';

    if (url.pathname === '/styles.css') {
      const stylesheet = Bun.file(stylesheetPath);
      if (!(await stylesheet.exists())) {
        return missingAssetResponse('/styles.css', locale);
      }

      return new Response(stylesheet, {
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'text/css; charset=utf-8',
        },
      });
    }

    if (liveReload && url.pathname === '/__live') {
      const stylesheet = Bun.file(stylesheetPath);
      const clientBundle = Bun.file(clientBundlePath);
      const [cssStat, jsStat] = await Promise.all([stylesheet.stat(), clientBundle.stat()]);
      return new Response(JSON.stringify({ css: cssStat.mtimeMs, js: jsStat.mtimeMs }), {
        headers: {
          'cache-control': 'no-store',
          'content-type': 'application/json; charset=utf-8',
        },
      });
    }

    if (url.pathname === '/assets/playground.js') {
      const clientBundle = Bun.file(clientBundlePath);
      if (!(await clientBundle.exists())) {
        return missingAssetResponse('/assets/playground.js', locale);
      }

      return new Response(clientBundle, {
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'text/javascript; charset=utf-8',
        },
      });
    }

    if (url.pathname === '/material-background.png') {
      const materialBackground = Bun.file(materialBackgroundPath);
      if (!(await materialBackground.exists())) {
        return missingAssetResponse('/material-background.png', locale);
      }

      return new Response(materialBackground, {
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'image/png',
        },
      });
    }

    if (url.pathname === '/frame') {
      const theme = url.searchParams.get('theme');
      if (!isFrameTheme(theme)) {
        return new Response(localize(appCopy.frame.invalidTheme, locale), {
          status: 400,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
          },
        });
      }

      const assetError = await ensureDesignLabAssets(locale);
      if (assetError !== undefined) {
        return assetError;
      }

      return new Response(renderDocument({ theme, locale }), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }

    if (url.pathname === '/') {
      const assetError = await ensureDesignLabAssets(locale);
      if (assetError !== undefined) {
        return assetError;
      }

      return new Response(renderDocument({ locale }), {
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }

    return new Response(localize(appCopy.server.notFound, locale), { status: 404 });
  },
});

console.log(`Playground running at ${server.url}`);
