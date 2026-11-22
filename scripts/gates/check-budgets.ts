import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Scale budgets, described in scripts/AGENTS.md and docs/AGENTS.md. Soft limits
// produce REVIEW, hard limits fail. Exceptions are dated audit records, not a
// permission to raise a limit; the file must stay within the recorded ceiling
// and the record must name a removal condition.

const root = resolve(import.meta.dir, '../..');
const configPath = resolve(import.meta.dir, 'quality-budgets.json');

export type Category = 'source' | 'css' | 'test';

export interface Exception {
  ceiling: number;
  reason: string;
}

export interface Budgets {
  limits: Record<Category, [number, number]>;
  exceptions: Record<string, Exception>;
}

export type Severity = 'EXCEEDED' | 'REVIEW' | 'NEAR' | 'AT LIMIT';

export interface Finding {
  file: string;
  lines: number;
  limit: number;
  severity: Severity;
}

const CATEGORIES: Category[] = ['source', 'css', 'test'];
const DATED_REASON = /^\d{4}-\d{2}-\d{2}:\s*\S/;

export function categoryOf(file: string): Category | null {
  if (/(?:\.test|\.spec)\.tsx?$/.test(file)) return 'test';
  if (file.endsWith('.css')) return 'css';
  if (/\.(ts|tsx|vue)$/.test(file)) return 'source';
  return null;
}

// A trailing newline terminates the last line; it does not start an empty one.
export function lineCount(source: string): number {
  if (source.length === 0) return 0;
  const lines = source.split('\n');
  return source.endsWith('\n') ? lines.length - 1 : lines.length;
}

export function severityOf(lines: number, soft: number, hard: number): Severity | null {
  if (lines <= soft) return null;
  if (lines > hard) return 'EXCEEDED';
  const remaining = hard - lines;
  const near = Math.max(hard * 0.05, 10);
  if (remaining <= 2) return 'AT LIMIT';
  if (remaining < near) return 'NEAR';
  return 'REVIEW';
}

export interface BudgetInput {
  files: string[];
  sizes: Map<string, number>;
  budgets: Budgets;
}

export function checkBudgets(input: BudgetInput): { errors: string[]; findings: Finding[] } {
  const { files, sizes, budgets } = input;
  const errors: string[] = [];
  const findings: Finding[] = [];

  for (const [file, exception] of Object.entries(budgets.exceptions)) {
    if (!DATED_REASON.test(exception.reason)) {
      errors.push(`${file}: exception reason must start with a date and a description`);
    }
    if (!Number.isInteger(exception.ceiling) || exception.ceiling < 1) {
      errors.push(`${file}: exception ceiling must be a positive integer`);
    }
    if (!files.includes(file)) errors.push(`${file}: exception names a file that does not exist`);
  }

  for (const file of files) {
    const category = categoryOf(file);
    if (!category) continue;
    if (!CATEGORIES.includes(category)) continue;
    const lines = sizes.get(file) ?? 0;
    const [soft, hard] = budgets.limits[category];
    const exception = budgets.exceptions[file];

    if (exception) {
      if (lines > exception.ceiling) {
        errors.push(
          `${file}: ${lines} lines exceeds exception ceiling ${exception.ceiling}; raise the ceiling with justification or split the file`,
        );
      }
      if (lines <= hard) {
        errors.push(`${file}: exception is within the hard limit ${hard}; remove it`);
      }
      continue;
    }

    const severity = severityOf(lines, soft, hard);
    if (!severity) continue;
    findings.push({ file, lines, limit: hard, severity });
    if (severity === 'EXCEEDED') {
      errors.push(
        `${file}:1: ${lines} lines exceeds the ${category} hard limit ${hard}; register an exception or split the file`,
      );
    }
  }
  return { errors, findings };
}

function main(): void {
  const budgets = JSON.parse(readFileSync(configPath, 'utf8')) as Budgets;
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
  const sizes = new Map(
    files
      .filter((file) => categoryOf(file))
      .map((file) => [file, lineCount(readFileSync(resolve(root, file), 'utf8'))] as const),
  );
  const { errors, findings } = checkBudgets({ files, sizes, budgets });
  const reviews = findings.filter((finding) => finding.severity === 'REVIEW').length;
  const near = findings.filter((finding) => finding.severity === 'NEAR').length;
  const atLimit = findings.filter((finding) => finding.severity === 'AT LIMIT').length;
  const exceeded = findings.filter((finding) => finding.severity === 'EXCEEDED').length;
  const reviewed = files.filter((file) => categoryOf(file)).length;
  const summary = `${reviewed} files, ${Object.keys(budgets.exceptions).length} exceptions, ${reviews} REVIEW, ${near} NEAR, ${atLimit} AT LIMIT, ${exceeded} EXCEEDED.`;
  if (errors.length > 0) {
    console.error('Scale budget check failed:');
    for (const error of errors) console.error(`- ${error}`);
    console.error(`Summary: ${summary}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Scale budgets passed for ${summary}`);
}

if (import.meta.main) main();
