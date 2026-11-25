import { copyFile, mkdir, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const playgroundCssPath = fileURLToPath(
  new URL('../../apps/playground/.dev/playground.css', import.meta.url),
);

/** Replace the served stylesheet only with a complete, changed build. */
export async function publishPlaygroundCss(
  target: string,
  build: (output: string) => Promise<void>,
): Promise<void> {
  const directory = dirname(target);
  await mkdir(directory, { recursive: true });
  const staging = await mkdtemp(join(directory, 'tailwind-'));
  try {
    const candidate = join(staging, 'playground.css');
    await build(candidate);
    const css = await readFile(candidate);
    // The workspace grid and theme both require generated foundation tokens.
    if (!css.includes('--neoverse-color-surface-canvas:') || !css.includes('--neoverse-space-3:')) {
      throw new Error('Playground CSS is missing foundation tokens; the last build was retained.');
    }

    const current = await readFile(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
      return undefined;
    });
    if (!current?.equals(css)) await rename(candidate, target);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

/** Seed development from the initial build without serving production's mutable output. */
export async function seedPlaygroundCss(): Promise<void> {
  const initial = new URL('../../packages/tailwind/dist/playground.css', import.meta.url);
  await publishPlaygroundCss(playgroundCssPath, (output) => copyFile(initial, output));
}
