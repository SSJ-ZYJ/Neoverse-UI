import { appCopy, formatLocalized, isLocale, type Locale, localize } from './playground-content';
import type { FrameTheme } from './playground-types';

type RenderOptions = {
  theme?: FrameTheme;
  locale: Locale;
};

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const stylesheet = Bun.file(new URL('../../../packages/tailwind/dist/index.css', import.meta.url));
const clientBundle = Bun.file(new URL('../dist/assets/playground.js', import.meta.url));

const isFrameTheme = (value: string | null): value is FrameTheme =>
  value === 'light' || value === 'dark';

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
  if (!(await stylesheet.exists()) || !(await clientBundle.exists())) {
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

    if (url.pathname === '/assets/playground.js') {
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
