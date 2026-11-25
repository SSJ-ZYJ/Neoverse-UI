import { createServer as createNetServer } from 'node:net';
import { waitForAssets } from './asset-state';
import { appCopy, formatLocalized, isLocale, type Locale, localize } from './playground-content';
import { resolvePlaygroundDocument } from './playground-document';

const requestedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
const stylesheetPath = new URL('../../../packages/tailwind/dist/playground.css', import.meta.url);
const clientBundlePath = new URL('../dist/assets/playground.js', import.meta.url);
const workspaceCssPath = new URL('../dist/assets/workspace.css', import.meta.url);
const reactFixtureBundlePath = new URL('../dist/assets/react-fixture.js', import.meta.url);
const scopedCssPath = new URL('../dist/assets/playground.css', import.meta.url);
const assetAvailabilityAttempts = 20;
const assetAvailabilityRetryDelayMs = 50;

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

const cacheControl = 'no-cache';

const missingAssetResponse = (asset: string, locale: Locale): Response =>
  new Response(formatLocalized(appCopy.server.assetsUnavailable, locale, { asset }), {
    status: 503,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
const waitForServedAssets = (assets: readonly ReturnType<typeof Bun.file>[]): Promise<boolean> =>
  waitForAssets(assets, {
    attempts: assetAvailabilityAttempts,
    delay: () => Bun.sleep(assetAvailabilityRetryDelayMs),
  });

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
          'cache-control': cacheControl,
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
            'cache-control': cacheControl,
            'content-type': 'text/css; charset=utf-8',
          },
        });
      }

      return new Response(scopedCss, {
        headers: {
          'cache-control': cacheControl,
          'content-type': 'text/css; charset=utf-8',
        },
      });
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
      if (!(await asset.exists()) && !(await waitForServedAssets([asset]))) {
        return missingAssetResponse(url.pathname, locale);
      }

      return new Response(asset, {
        headers: {
          'cache-control': cacheControl,
          'content-type': assetContentType(relativePath),
        },
      });
    }

    const page = resolvePlaygroundDocument(url);
    if (page !== undefined) {
      if ('error' in page) {
        return new Response(page.error, {
          status: 400,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }

      const react = page.entry === 'react-fixture';
      const bundle = Bun.file(react ? reactFixtureBundlePath : clientBundlePath);
      const assets = [Bun.file(stylesheetPath), bundle];
      if (!react) assets.push(Bun.file(workspaceCssPath));
      if (!(await waitForServedAssets(assets))) {
        return missingAssetResponse(
          react ? 'React fixture assets' : localize(appCopy.server.assetsLabel, locale),
          locale,
        );
      }

      return new Response(page.html, {
        headers: {
          'cache-control': cacheControl,
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }

    return new Response(localize(appCopy.server.notFound, locale), { status: 404 });
  },
});

console.log(`Playground running at ${server.url}`);
