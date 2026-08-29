import { resolve } from 'node:path';

const rootDirectory = resolve(import.meta.dir, '..');

// Live dev loop:
// 1. playground server (with browser auto-reload enabled)
// 2. vite --watch, rebuilding the client bundle on source edits
// 3. dev-watch orchestrator, rebuilding tokens/motion/tailwind CSS on edits
const commands: Array<{ args: string[]; cwd: string; env?: Record<string, string> }> = [
  {
    args: ['bun', 'run', 'src/index.ts'],
    cwd: resolve(import.meta.dir, '../apps/playground'),
    env: { LIVE_RELOAD: '1' },
  },
  {
    args: ['bun', 'run', 'dev:client'],
    cwd: resolve(import.meta.dir, '../apps/playground'),
  },
  {
    args: ['bun', 'run', 'scripts/dev-watch.ts'],
    cwd: rootDirectory,
  },
];

const main = async (): Promise<void> => {
  const build = Bun.spawn(['bun', 'run', 'build'], {
    cwd: rootDirectory,
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
  });
  const buildExitCode = await build.exited;
  if (buildExitCode !== 0) {
    process.exit(buildExitCode);
  }

  const children = commands.map(({ args, cwd, env }) =>
    Bun.spawn(args, {
      cwd,
      env: { ...process.env, ...env },
      stdin: 'inherit',
      stderr: 'inherit',
      stdout: 'inherit',
    }),
  );

  let stopping = false;

  const stopChildren = (): void => {
    if (stopping) {
      return;
    }

    stopping = true;
    for (const child of children) {
      child.kill();
    }
  };

  process.on('SIGINT', stopChildren);
  process.on('SIGTERM', stopChildren);

  const firstExitCode = await Promise.race(children.map((child) => child.exited));
  stopChildren();
  process.exit(firstExitCode);
};

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
