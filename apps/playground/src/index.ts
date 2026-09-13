import { createServer as createNetServer } from 'node:net';
import { readAssetMtime } from './asset-state';
import { appCopy, formatLocalized, isLocale, type Locale, localize } from './playground-content';
import type { FrameTheme } from './playground-types';

type RenderOptions = {
  theme?: FrameTheme;
  locale: Locale;
};

const requestedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
const liveReload = process.env.LIVE_RELOAD === '1';
const stylesheetPath = new URL('../../../packages/tailwind/dist/playground.css', import.meta.url);
const clientBundlePath = new URL('../dist/assets/playground.js', import.meta.url);
const scopedCssPath = new URL('../dist/assets/main.css', import.meta.url);
const materialBackgroundLightPath = new URL(
  '../dist/assets/material-background-light.png',
  import.meta.url,
);
const materialBackgroundDarkPath = new URL(
  '../dist/assets/material-background-dark.png',
  import.meta.url,
);

const isFrameTheme = (value: string | null): value is FrameTheme =>
  value === 'light' || value === 'dark';

const isPortUnavailableError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error.code === 'EADDRINUSE' || error.code === 'EACCES');

const canListenOnPort = (candidatePort: number): Promise<boolean> =>
  new Promise((resolvePromise, rejectPromise) => {
    const probe = createNetServer();
    probe.once('error', (error: unknown) => {
      if (isPortUnavailableError(error)) {
        resolvePromise(false);
        return;
      }

      rejectPromise(error);
    });
    probe.listen({ host: '0.0.0.0', port: candidatePort }, () => {
      probe.close((error) => {
        if (error !== undefined) {
          rejectPromise(error);
          return;
        }

        resolvePromise(true);
      });
    });
  });

const findAvailablePort = async (startPort: number): Promise<number> => {
  if (!Number.isInteger(startPort) || startPort < 0 || startPort > 65_535) {
    throw new Error('[dev] PORT must be an integer between 0 and 65535.');
  }

  if (startPort === 0) {
    return 0;
  }

  for (let candidatePort = startPort; candidatePort <= 65_535; candidatePort += 1) {
    if (await canListenOnPort(candidatePort)) {
      if (candidatePort !== startPort) {
        console.warn(
          `[dev] Port ${startPort} is unavailable; using port ${candidatePort} instead.`,
        );
      }
      return candidatePort;
    }
  }

  throw new Error(`[dev] No available port found from ${startPort} to 65535.`);
};

const port = await findAvailablePort(requestedPort);

// Dev-only: reload the page when any served asset changes on disk.
const liveReloadScript = liveReload
  ? `<script>
  (() => {
    let version = null;
    setInterval(() => {
      fetch('/__live', { cache: 'no-store' })
        .then((response) => response.json())
        .then((next) => {
          const key = [next.css, next.scopedCss, next.js].map(String).join(':');
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
<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}" data-theme="${theme ?? 'system'}" class="scrollbar-immersive">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="/scoped.css" />
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
  const materialBackgroundLight = Bun.file(materialBackgroundLightPath);
  const materialBackgroundDark = Bun.file(materialBackgroundDarkPath);

  if (
    !(await stylesheet.exists()) ||
    !(await clientBundle.exists()) ||
    !(await materialBackgroundLight.exists()) ||
    !(await materialBackgroundDark.exists())
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

    /* Vite compiles per-component <style> blocks into this separate asset;
       it only exists when the client bundle carries scoped component css. */
    if (url.pathname === '/scoped.css') {
      const scopedCss = Bun.file(scopedCssPath);
      if (!(await scopedCss.exists())) {
        return new Response('', {
          headers: {
            'cache-control': 'no-cache',
            'content-type': 'text/css; charset=utf-8',
          },
        });
      }

      return new Response(scopedCss, {
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'text/css; charset=utf-8',
        },
      });
    }

    if (liveReload && url.pathname === '/__live') {
      const stylesheet = Bun.file(stylesheetPath);
      const clientBundle = Bun.file(clientBundlePath);
      const scopedCss = Bun.file(scopedCssPath);
      const [cssMtime, jsMtime, scopedCssMtime] = await Promise.all([
        readAssetMtime(stylesheet),
        readAssetMtime(clientBundle),
        readAssetMtime(scopedCss),
      ]);

      // Vite watch can briefly have no complete JS/CSS bundle while a new
      // generation is being written. Skip this poll instead of turning that
      // expected transition into a server error or a reload to a 503 page.
      if (cssMtime === null || jsMtime === null) {
        return new Response(null, {
          status: 204,
          headers: {
            'cache-control': 'no-store',
          },
        });
      }

      return new Response(
        JSON.stringify({
          css: cssMtime,
          js: jsMtime,
          scopedCss: scopedCssMtime ?? 0,
        }),
        {
          headers: {
            'cache-control': 'no-store',
            'content-type': 'application/json; charset=utf-8',
          },
        },
      );
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

    if (
      url.pathname === '/material-background-light.png' ||
      url.pathname === '/material-background-dark.png'
    ) {
      const materialBackground = Bun.file(
        url.pathname === '/material-background-dark.png'
          ? materialBackgroundDarkPath
          : materialBackgroundLightPath,
      );
      if (!(await materialBackground.exists())) {
        return missingAssetResponse(url.pathname, locale);
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
