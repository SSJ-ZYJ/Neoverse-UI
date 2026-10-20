import { closeSync, mkdtempSync, openSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const rootDirectory = resolve(import.meta.dir, '..');
const checks = [
  { name: 'Biome (auto-fix)', args: ['biome', 'check', '--write', '.'] },
  { name: 'Text integrity', args: ['lint:text'] },
  { name: 'Stylelint', args: ['lint:style'] },
  { name: 'Tailwind usage', args: ['lint:tailwind'] },
  { name: 'Material standards', args: ['check:materials'] },
  { name: 'Component contracts', args: ['scripts/check-component-contracts.ts'] },
  { name: 'Framework parity', args: ['scripts/check-framework-parity.ts'] },
  { name: 'Component requests', args: ['check:requests'] },
  { name: 'Typecheck (with builds)', args: ['typecheck'] },
  { name: 'Unit and contract tests', args: ['test'] },
];

const color = (text: string, code: number): string =>
  process.stdout.isTTY && !('NO_COLOR' in process.env) ? `\x1b[${code}m${text}\x1b[0m` : text;
const seconds = (milliseconds: number): string => `${(milliseconds / 1000).toFixed(1)}s`;

async function main(): Promise<void> {
  const started = performance.now();
  const logDirectory = mkdtempSync(join(tmpdir(), 'neoverse-ui-check-'));
  const results: Array<{
    name: string;
    command: string;
    exitCode: number;
    duration: number;
    logPath: string;
  }> = [];

  console.log(`\nNeoverse-UI checks (${checks.length})`);
  console.log(`Full logs: ${logDirectory}\n`);

  for (const [index, check] of checks.entries()) {
    const step = `${String(index + 1).padStart(2, '0')}/${checks.length}`;
    const logPath = join(logDirectory, `${String(index + 1).padStart(2, '0')}.log`);
    const command = `bun run ${check.args.join(' ')}`;
    console.log(`${color('RUN ', 36)} [${step}] ${check.name}`);
    const stepStarted = performance.now();
    const log = openSync(logPath, 'w');
    let exitCode: number;
    try {
      writeSync(log, `$ ${command}\n\n`);
      const child = Bun.spawn([process.execPath, 'run', '--silent', ...check.args], {
        cwd: rootDirectory,
        stdin: 'ignore',
        stdout: log,
        stderr: log,
      });
      exitCode = await child.exited;
    } catch (error) {
      writeSync(log, `${error instanceof Error ? error.stack : String(error)}\n`);
      exitCode = 1;
    } finally {
      closeSync(log);
    }
    const duration = performance.now() - stepStarted;
    results.push({ name: check.name, command, exitCode, duration, logPath });
    const status = exitCode === 0 ? color('PASS', 32) : color('FAIL', 31);
    console.log(`${status} [${step}] ${check.name} (${seconds(duration)})`);
    if (exitCode !== 0) console.log(`     Exit ${exitCode}; log: ${logPath}`);
  }

  const failed = results.filter((result) => result.exitCode !== 0);
  if (failed.length > 0) {
    console.log('\nFailed checks — details and rerun commands:');
    for (const result of failed) {
      console.log(`  ${result.name} (exit ${result.exitCode})`);
      console.log(`    ${result.command}`);
      console.log(`    ${result.logPath}`);
    }
  }

  const nameWidth = Math.max(...results.map((result) => result.name.length));
  console.log('\nCheck summary');
  console.log(`  Status  ${'Check'.padEnd(nameWidth)}  Duration`);
  console.log(`  ${'-'.repeat(nameWidth + 25)}`);
  for (const result of results) {
    const status = result.exitCode === 0 ? color('PASS', 32) : color('FAIL', 31);
    console.log(`  ${status}    ${result.name.padEnd(nameWidth)}  ${seconds(result.duration)}`);
  }
  console.log(
    `\n${color(failed.length === 0 ? 'PASS' : 'FAIL', failed.length === 0 ? 32 : 31)}: ${results.length - failed.length} passed, ${failed.length} failed, ${results.length} total (${seconds(performance.now() - started)})`,
  );
  console.log(`Full logs: ${logDirectory}`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
