import { createServer as createNetServer } from 'node:net';
import { readAssetMtime, waitForAssets } from './asset-state';
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
const reactFixtureBundlePath = new URL('../dist/assets/react-fixture.js', import.meta.url);
const scopedCssPath = new URL('../dist/assets/playground.css', import.meta.url);
const assetAvailabilityAttempts = 20;
const assetAvailabilityRetryDelayMs = 50;

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

const renderReactFixtureDocument = (locale: Locale): string =>
  [
    '<!doctype html>',
    `<html lang="${locale === 'zh' ? 'zh-CN' : 'en'}" data-theme="system">`,
    '<head>',
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<title>Neoverse UI React Fixture</title>',
    '<link rel="stylesheet" href="/styles.css" />',
    '</head>',
    '<body class="min-h-screen bg-surface-canvas font-sans text-primary antialiased">',
    '<div id="react-root"></div>',
    '<script type="module" src="/assets/react-fixture.js"></script>',
    '</body>',
    '</html>',
  ].join('');

const missingAssetResponse = (asset: string, locale: Locale): Response =>
  new Response(formatLocalized(appCopy.server.assetsUnavailable, locale, { asset }), {
    status: 503,
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
const waitForServedAssets = (assets: readonly ReturnType<typeof Bun.file>[]): Promise<boolean> =>
  waitForAssets(assets, {
    attempts: assetAvailabilityAttempts,
    delay: () => Bun.sleep(assetAvailabilityRetryDelayMs),
  });

const ensureDesignLabAssets = async (locale: Locale): Promise<Response | undefined> => {
  const stylesheet = Bun.file(stylesheetPath);
  const clientBundle = Bun.file(clientBundlePath);

  if (!(await waitForServedAssets([stylesheet, clientBundle]))) {
    return missingAssetResponse(localize(appCopy.server.assetsLabel, locale), locale);
  }

  return undefined;
};

const ensureReactFixtureAssets = async (locale: Locale): Promise<Response | undefined> => {
  const stylesheet = Bun.file(stylesheetPath);
  const reactFixtureBundle = Bun.file(reactFixtureBundlePath);
  if (!(await waitForServedAssets([stylesheet, reactFixtureBundle]))) {
    return missingAssetResponse('React fixture assets', locale);
  }
  return undefined;
};

const assetContentType = (pathname: string): string => {
  if (pathname.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (pathname.endsWith('.css')) return 'text/css; charset=utf-8';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
};

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const queryLocale = url.searchParams.get('lang');
    const locale: Locale = isLocale(queryLocale) ? queryLocale : 'en';

    if (url.pathname === '/__playground-health') {
      return Response.json(
        { service: 'neoverse-ui-playground', status: 'ok' },
        { headers: { 'cache-control': 'no-store' } },
      );
    }

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

    if (url.pathname.startsWith('/assets/')) {
      const relativePath = url.pathname.slice('/assets/'.length);
      if (
        relativePath.length === 0 ||
        relativePath.includes('..') ||
        !/^[A-Za-z0-9._/-]+$/.test(relativePath)
      ) {
        return new Response(localize(appCopy.server.notFound, locale), { status: 404 });
      }
      const asset = Bun.file(new URL(`../dist/assets/${relativePath}`, import.meta.url));
      if (!(await asset.exists())) {
        return missingAssetResponse(url.pathname, locale);
      }

      return new Response(asset, {
        headers: {
          'cache-control': 'no-cache',
          'content-type': assetContentType(relativePath),
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

    if (url.pathname === '/react-fixture') {
      const assetError = await ensureReactFixtureAssets(locale);
      if (assetError !== undefined) {
        return assetError;
      }

      return new Response(renderReactFixtureDocument(locale), {
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
