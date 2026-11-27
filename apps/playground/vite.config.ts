import { existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { defineConfig, normalizePath, type Plugin } from 'vite';
import { playgroundCssPath, seedPlaygroundCss } from '../../scripts/dev/playground-css';
import { resolvePlaygroundDocument } from './src/app/playground-document';

const playgroundDocuments = (): Plugin => ({
  name: 'playground-documents',
  async configureServer(server) {
    if (!existsSync(playgroundCssPath)) await seedPlaygroundCss();
    const assets = {
      stylesheet: `/@fs/${normalizePath(playgroundCssPath)}`,
      workspaceStylesheet: '/src/styles/workspace.css',
      playground: '/src/main.ts',
      'react-fixture': '/src/react-fixture.tsx',
    };

    server.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.pathname === '/__playground-health') {
        response.setHeader('cache-control', 'no-store');
        response.setHeader('content-type', 'application/json; charset=utf-8');
        response.end(JSON.stringify({ service: 'neoverse-ui-playground', status: 'ok' }));
        return;
      }
      const page = resolvePlaygroundDocument(url, assets);
      if (page === undefined) {
        next();
        return;
      }
      if ('error' in page) {
        response.statusCode = 400;
        response.setHeader('content-type', 'text/plain; charset=utf-8');
        response.end(page.error);
        return;
      }
      try {
        const html = await server.transformIndexHtml(url.pathname, page.html, request.url);
        response.setHeader('cache-control', 'no-cache');
        response.setHeader('content-type', 'text/html; charset=utf-8');
        response.end(html);
      } catch (error) {
        next(error);
      }
    });
  },
});

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/assets/' : '/',
  appType: 'custom',
  plugins: command === 'serve' ? [vue(), react(), playgroundDocuments()] : [vue()],
  server: {
    port: Number(process.env.PORT ?? 3000),
  },
  resolve: {
    // Serve workspace sources directly so component edits reach Vite's module graph.
    alias: {
      '@neoverse-ui/glass-runtime': fileURLToPath(
        new URL('../../packages/glass-runtime/src/index.ts', import.meta.url),
      ),
      '@neoverse-ui/motion': fileURLToPath(
        new URL('../../packages/motion/src/index.ts', import.meta.url),
      ),
      '@neoverse-ui/overlay-runtime': fileURLToPath(
        new URL('../../packages/overlay-runtime/src/index.ts', import.meta.url),
      ),
      '@neoverse-ui/react': fileURLToPath(
        new URL('../../packages/react/src/index.tsx', import.meta.url),
      ),
      '@neoverse-ui/tokens': fileURLToPath(
        new URL('../../packages/tokens/src/index.ts', import.meta.url),
      ),
      '@neoverse-ui/vue': fileURLToPath(
        new URL('../../packages/vue/src/index.ts', import.meta.url),
      ),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist/assets', import.meta.url)),
    rolldownOptions: {
      input: {
        playground: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
        'react-fixture': fileURLToPath(new URL('./src/react-fixture.tsx', import.meta.url)),
        workspace: fileURLToPath(new URL('./src/styles/workspace.css', import.meta.url)),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name][extname]',
        // Modules, heavy previews, and React runtime dependencies load dynamically.
        // Keep shared framework runtimes in cacheable chunks across routes.
        codeSplitting: {
          groups: [
            {
              name: 'vue-runtime',
              test: /node_modules[\\/]@vue[\\/]/,
            },
            {
              name: 'react-runtime',
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
}));
