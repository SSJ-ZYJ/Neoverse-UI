import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { playgroundCssPath, publishPlaygroundCss } from './playground-css';
import { requireTailwindCli } from './tailwind-cli';

const rootDirectory = resolve(import.meta.dir, '../..');
const tokensDirectory = resolve(rootDirectory, 'packages/tokens');
const motionDirectory = resolve(rootDirectory, 'packages/motion');
const glassRuntimeDirectory = resolve(rootDirectory, 'packages/glass-runtime');
const tailwindDirectory = resolve(rootDirectory, 'packages/tailwind');
const playgroundDirectory = resolve(rootDirectory, 'apps/playground');
// Bun hoists workspace dependencies to the repository root, so the CLI is not
// always inside packages/tailwind/node_modules. Resolve it once at startup:
// a missing entry is an install problem, and failing here is far clearer than
// dying after the token step has already written half of the CSS pipeline.
// The resolved file is the package's JS entry, which the current runtime
// executes directly, so POSIX and Windows share one code path.
const tailwindCli = requireTailwindCli(tailwindDirectory);

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

const buildTokensCss = (): Promise<void> => run(tokensDirectory, 'bun', ['scripts/copy-css.ts']);
const buildMotionCss = (): Promise<void> => run(motionDirectory, 'bun', ['scripts/copy-css.ts']);
const buildGlassRuntime = (): Promise<void> => run(glassRuntimeDirectory, 'bun', ['run', 'build']);
const buildTailwind = async (): Promise<void> => {
  await run(tailwindDirectory, 'bun', ['scripts/copy-theme.ts']);
  await publishPlaygroundCss(playgroundCssPath, (output) =>
    run(tailwindDirectory, process.execPath, [tailwindCli, '-i', 'src/index.css', '-o', output]),
  );
  await run(tailwindDirectory, process.execPath, [
    tailwindCli,
    '-i',
    'src/consumer.css',
    '-o',
    'dist/index.css',
  ]);
};

type BuildTarget = 'tokens' | 'motion' | 'tailwind' | 'glass runtime';
const queued = new Set<BuildTarget>();
let scheduled = false;
let building = false;

async function reportBuild(label: string, build: () => Promise<void>): Promise<void> {
  const started = Date.now();
  console.log(`[watch] ${label}: rebuilding…`);
  try {
    await build();
    console.log(`[watch] ${label}: done in ${Date.now() - started}ms`);
  } catch (error: unknown) {
    console.error(`[watch] ${label}: FAILED`, error);
  }
}

async function rebuild(): Promise<void> {
  building = true;
  while (queued.size > 0) {
    const tokens = queued.has('tokens');
    const motion = queued.has('motion');
    const tailwind = queued.has('tailwind') || tokens || motion;
    const glass = queued.has('glass runtime');
    queued.clear();

    if (tailwind) {
      await reportBuild('styles', async () => {
        if (tokens) await buildTokensCss();
        if (motion) await buildMotionCss();
        await buildTailwind();
      });
    }
    if (glass) await reportBuild('glass runtime', buildGlassRuntime);
  }
  building = false;
}

function queue(target: BuildTarget): void {
  queued.add(target);
  if (building || scheduled) return;
  scheduled = true;
  setTimeout(() => {
    scheduled = false;
    void rebuild();
  }, 150);
}

const directories: Array<{ path: string; extensions: string[]; target: BuildTarget }> = [
  { path: resolve(tokensDirectory, 'src'), extensions: ['.css'], target: 'tokens' },
  { path: resolve(motionDirectory, 'src'), extensions: ['.css'], target: 'motion' },
  {
    path: resolve(glassRuntimeDirectory, 'src'),
    extensions: ['.ts'],
    target: 'glass runtime',
  },
  { path: resolve(tailwindDirectory, 'src'), extensions: ['.css'], target: 'tailwind' },
  {
    path: resolve(playgroundDirectory, 'src'),
    extensions: ['.vue', '.ts', '.tsx'],
    target: 'tailwind',
  },
  {
    path: resolve(rootDirectory, 'packages/vue/src'),
    extensions: ['.vue', '.ts'],
    target: 'tailwind',
  },
  {
    path: resolve(rootDirectory, 'packages/react/src'),
    extensions: ['.ts', '.tsx'],
    target: 'tailwind',
  },
];

for (const { path, extensions, target } of directories) {
  watch(path, { recursive: true }, (_event, filename) => {
    if (filename === null) {
      return;
    }
    if (extensions.some((extension) => filename.toString().endsWith(extension))) {
      queue(target);
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
  for (const { path, target } of directories) {
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
      queue(target);
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

console.log('[watch] watching tokens, motion, glass runtime, tailwind and playground sources…');
