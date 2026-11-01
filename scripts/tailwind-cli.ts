import { existsSync, readFileSync } from 'node:fs';
import { posix, resolve, win32 } from 'node:path';

export type TailwindCliLookupOptions = {
  platform?: NodeJS.Platform;
  exists?: (path: string) => boolean;
  readFile?: (path: string) => string;
  /** Normalises the start path; tests inject a platform-specific variant. */
  normalize?: (path: string) => string;
};

type PackageManifest = {
  bin?: string | Record<string, string>;
};

/**
 * Reads the `bin` entry that `@tailwindcss/cli` exposes as `tailwindcss`.
 * Exported for tests; returns undefined when the manifest shape is unexpected.
 */
export const readTailwindBinEntry = (manifest: PackageManifest): string | undefined => {
  const { bin } = manifest;
  if (typeof bin === 'string') {
    return bin;
  }

  return bin?.tailwindcss;
};

/**
 * Resolves the Tailwind CLI to the JavaScript entry that the local runtime can
 * execute, instead of to an installer-specific `node_modules/.bin` shim.
 *
 * Shims are not portable: on Windows they are `.exe` wrappers, and on POSIX
 * they are symlinks to a `#!/usr/bin/env node` script, so spawning them
 * directly requires `node` on PATH plus an executable bit. Resolving the
 * package's own entry works identically on every platform and under bun's
 * hoisted workspace install, which is why the previous package-local
 * `node_modules/.bin` lookup failed while the one-shot build kept working.
 */
export const findTailwindCli = (
  startDirectory: string,
  {
    platform = process.platform,
    exists = existsSync,
    readFile = (path: string) => readFileSync(path, 'utf8'),
    normalize = resolve,
  }: TailwindCliLookupOptions = {},
): string | undefined => {
  const paths = platform === 'win32' ? win32 : posix;
  let directory = normalize(startDirectory);

  for (;;) {
    const manifestPath = paths.join(
      directory,
      'node_modules',
      '@tailwindcss',
      'cli',
      'package.json',
    );
    if (exists(manifestPath)) {
      try {
        const entry = readTailwindBinEntry(JSON.parse(readFile(manifestPath)) as PackageManifest);
        if (entry !== undefined) {
          return paths.resolve(paths.dirname(manifestPath), entry);
        }
      } catch {
        // A partially written manifest is an install problem; keep walking.
      }
    }

    const parent = paths.dirname(directory);
    if (parent === directory) {
      return undefined;
    }

    directory = parent;
  }
};

export const requireTailwindCli = (
  startDirectory: string,
  options: TailwindCliLookupOptions = {},
): string => {
  const cli = findTailwindCli(startDirectory, options);
  if (cli === undefined) {
    const searched = options.normalize?.(startDirectory) ?? resolve(startDirectory);
    throw new Error(
      `Tailwind CLI is missing from every node_modules/@tailwindcss/cli above ${searched}. Run bun install, then restart the dev loop.`,
    );
  }

  return cli;
};
