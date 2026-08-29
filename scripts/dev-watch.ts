import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const rootDirectory = resolve(import.meta.dir, '..');
const tokensDirectory = resolve(rootDirectory, 'packages/tokens');
const motionDirectory = resolve(rootDirectory, 'packages/motion');
const tailwindDirectory = resolve(rootDirectory, 'packages/tailwind');
const playgroundDirectory = resolve(rootDirectory, 'apps/playground');
const tailwindCli = resolve(
  tailwindDirectory,
  'node_modules/.bin',
  process.platform === 'win32' ? 'tailwindcss.exe' : 'tailwindcss',
);

const run = (cwd: string, command: string, args: string[]): Promise<void> =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`${command} exited with code ${code}`));
      }
    });
  });

const buildTokensCss = (): Promise<void> =>
  run(tokensDirectory, 'bun', ['scripts/copy-css.ts']);
const buildMotionCss = (): Promise<void> =>
  run(motionDirectory, 'bun', ['scripts/copy-css.ts']);
const buildTailwind = async (): Promise<void> => {
  await run(tailwindDirectory, 'bun', ['scripts/copy-theme.ts']);
  await run(tailwindDirectory, tailwindCli, ['-i', 'src/index.css', '-o', 'dist/index.css']);
};

let timer: ReturnType<typeof setTimeout> | undefined;
let pending: (() => Promise<void>) | undefined;

const queue = (label: string, work: () => Promise<void>): void => {
  pending = work;
  if (timer !== undefined) {
    return;
  }
  timer = setTimeout(() => {
    timer = undefined;
    const job = pending;
    pending = undefined;
    if (job === undefined) {
      return;
    }
    const started = Date.now();
    console.log(`[watch] ${label}: rebuilding…`);
    job()
      .then(() => console.log(`[watch] ${label}: done in ${Date.now() - started}ms`))
      .catch((error: unknown) => console.error(`[watch] ${label}: failed`, error));
  }, 150);
};

const onTokensChange = (): void => {
  queue('tokens + tailwind', async () => {
    await buildTokensCss();
    await buildTailwind();
  });
};

const onMotionChange = (): void => {
  queue('motion + tailwind', async () => {
    await buildMotionCss();
    await buildTailwind();
  });
};

const onTailwindChange = (): void => {
  queue('tailwind', buildTailwind);
};

// New utility classes in playground/vue/react sources change the tailwind
// output, so any source edit triggers a rebuild of dist/index.css.
const onSourceChange = (): void => {
  queue('tailwind utilities', buildTailwind);
};

const directories: Array<{ path: string; extensions: string[]; handler: () => void }> = [
  { path: resolve(tokensDirectory, 'src'), extensions: ['.css'], handler: onTokensChange },
  { path: resolve(motionDirectory, 'src'), extensions: ['.css'], handler: onMotionChange },
  { path: resolve(tailwindDirectory, 'src'), extensions: ['.css'], handler: onTailwindChange },
  {
    path: resolve(playgroundDirectory, 'src'),
    extensions: ['.vue', '.ts'],
    handler: onSourceChange,
  },
  {
    path: resolve(rootDirectory, 'packages/vue/src'),
    extensions: ['.vue', '.ts'],
    handler: onSourceChange,
  },
  {
    path: resolve(rootDirectory, 'packages/react/src'),
    extensions: ['.ts', '.tsx'],
    handler: onSourceChange,
  },
];

for (const { path, extensions, handler } of directories) {
  watch(path, { recursive: true }, (_event, filename) => {
    if (filename === null) {
      return;
    }
    if (extensions.some((extension) => filename.toString().endsWith(extension))) {
      handler();
    }
  });
}

// fs.watch can occasionally miss events on Windows, so also poll mtimes as a
// safety net. Collects every matching source file once per second.
const collect = async (): Promise<Map<string, number>> => {
  const entries = new Map<string, number>();
  for (const { path, extensions } of directories) {
    for (const name of await readdir(path, { recursive: true })) {
      if (!extensions.some((extension) => name.endsWith(extension))) {
        continue;
      }
      try {
        const file = resolve(path, name);
        entries.set(file, (await stat(file)).mtimeMs);
      } catch {
        // file disappeared mid-scan; skip it
      }
    }
  }
  return entries;
};

const poll = async (previous: Map<string, number>): Promise<Map<string, number>> => {
  const current = await collect();
  for (const { path, handler } of directories) {
    let changed = false;
    for (const [file, mtime] of current) {
      if (file.startsWith(path) && previous.get(file) !== mtime) {
        changed = true;
        break;
      }
    }
    if (!changed) {
      let previousCount = 0;
      let currentCount = 0;
      for (const file of previous.keys()) {
        if (file.startsWith(path)) {
          previousCount++;
        }
      }
      for (const file of current.keys()) {
        if (file.startsWith(path)) {
          currentCount++;
        }
      }
      changed = previousCount !== currentCount;
    }
    if (changed) {
      handler();
    }
  }
  return current;
};

let snapshot = await collect();
setInterval(() => {
  void poll(snapshot).then((next) => {
    snapshot = next;
  });
}, 1000);

console.log('[watch] watching tokens, motion, tailwind and playground sources…');
