import { resolve } from 'node:path';
import { seedPlaygroundCss } from './playground-css';

const rootDirectory = resolve(import.meta.dir, '../..');

const commands = [
  {
    args: ['bun', 'run', 'dev'],
    cwd: resolve(import.meta.dir, '../../apps/playground'),
  },
  {
    args: ['bun', 'run', 'scripts/dev/dev-watch.ts'],
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
  await seedPlaygroundCss();

  const children = commands.map(({ args, cwd }) =>
    Bun.spawn(args, {
      cwd,
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
