import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  resolve: {
    // Compile the workspace source so the Vite watcher does not depend on a
    // previously generated packages/vue/dist entrypoint.
    alias: {
      '@neoverse-ui/react': fileURLToPath(
        new URL('../../packages/react/src/index.tsx', import.meta.url),
      ),
      '@neoverse-ui/vue': fileURLToPath(
        new URL('../../packages/vue/src/index.ts', import.meta.url),
      ),
    },
  },
  build: {
    outDir: fileURLToPath(new URL('./dist/assets', import.meta.url)),
    // In watch mode keep the last complete bundle available while Rollup writes
    // the next build. Production builds still start from a clean asset directory.
    emptyOutDir: mode !== 'development',
    rollupOptions: {
      input: {
        playground: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
        'react-fixture': fileURLToPath(new URL('./src/react-fixture.tsx', import.meta.url)),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
}));
